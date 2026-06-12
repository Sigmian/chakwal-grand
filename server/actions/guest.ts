"use server";

import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { sendPushToBranch } from "@/lib/push/send";
import { formatPKR } from "@/utils";

const COOKIE_NAME = "guest_token";
const SESSION_DAYS = 7;

// ─── Token helpers ────────────────────────────────────────────

function setGuestCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   60 * 60 * 24 * SESSION_DAYS,
    path:     "/",
  });
}

export function clearGuestCookie() {
  cookies().set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}

function getTokenFromCookie(): string | null {
  return cookies().get(COOKIE_NAME)?.value ?? null;
}

// Validate token and return the session + booking + customer
async function resolveSession(token?: string) {
  const t = token ?? getTokenFromCookie();
  if (!t) return null;

  const session = await prisma.guestSession.findUnique({
    where: { token: t, isActive: true },
    include: {
      booking: {
        include: {
          room:     { select: { id: true, number: true, name: true, floor: true } },
          branch:   { select: { id: true, name: true, city: true, address: true, phone: true } },
          customer: { select: { id: true, name: true, phone: true, email: true } },
          inRoomOrders: {
            orderBy: { createdAt: "desc" },
            include: { items: true },
          },
        },
      },
    },
  });

  if (!session) return null;
  if (new Date() > session.expiresAt) return null;

  // Touch last access
  await prisma.guestSession.update({
    where: { id: session.id },
    data:  { lastAccessAt: new Date() },
  }).catch(() => {});

  return session;
}

// ─── GUEST LOGIN ──────────────────────────────────────────────

export async function guestLogin(bookingRef: string, phone: string) {
  const ref = bookingRef.trim().toUpperCase();
  const ph  = phone.trim();

  if (!ref || !ph) return { success: false, error: "Please enter your booking reference and phone number." };

  const booking = await prisma.booking.findUnique({
    where:   { bookingRef: ref },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      room:     { select: { number: true, name: true } },
    },
  });

  if (!booking) return { success: false, error: "No booking found with that reference. Please check and try again." };

  // Status check — allow CONFIRMED and CHECKED_IN only (not PENDING/CANCELLED etc)
  if (!["CONFIRMED", "CHECKED_IN"].includes(booking.status)) {
    return { success: false, error: `This booking is ${booking.status.toLowerCase()}. Contact reception for help.` };
  }

  // Phone verification — normalise and compare
  const normalize = (n: string) => n.replace(/[\s\-\+]/g, "").replace(/^92/, "0");
  if (normalize(booking.customer.phone) !== normalize(ph)) {
    return { success: false, error: "Phone number does not match the booking. Please use the number you booked with." };
  }

  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  // Upsert session — one session per booking
  const session = await prisma.guestSession.upsert({
    where:  { bookingId: booking.id },
    update: { token: require("crypto").randomUUID(), isActive: true, expiresAt, lastAccessAt: new Date() },
    create: {
      bookingId: booking.id,
      phone:     ph,
      token:     require("crypto").randomUUID(),
      isActive:  true,
      expiresAt,
    },
  });

  setGuestCookie(session.token);

  return {
    success:    true,
    guestName:  booking.customer.name,
    roomNumber: booking.room.number,
  };
}

// ─── GET GUEST SESSION (for middleware/pages) ─────────────────

export async function getGuestSession() {
  return resolveSession();
}

// ─── GET GUEST DASHBOARD ──────────────────────────────────────

export async function getGuestDashboard() {
  const session = await resolveSession();
  if (!session) return { authenticated: false as const };

  const booking = session.booking;
  const orders  = booking.inRoomOrders ?? [];

  const roomCharges   = Number(booking.baseAmount) - Number(booking.discountAmount);
  const canteenTotal  = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((s, o) => s + Number(o.totalAmount), 0);
  const extraCharges  = Number(booking.extraCharges) - canteenTotal; // Other extras (POS, etc.)
  const totalPayable  = Number(booking.totalAmount) + canteenTotal;

  return {
    authenticated: true as const,
    guest: {
      name:  booking.customer.name,
      phone: booking.customer.phone,
      email: booking.customer.email,
    },
    booking: {
      id:         booking.id,
      ref:        booking.bookingRef,
      status:     booking.status,
      checkIn:    booking.checkInDate.toISOString(),
      checkOut:   booking.checkOutDate.toISOString(),
      nights:     booking.nights,
      adults:     booking.adultCount,
      children:   booking.childCount,
    },
    room: {
      number: booking.room.number,
      name:   booking.room.name,
      floor:  booking.room.floor,
    },
    branch: {
      name:    booking.branch.name,
      city:    booking.branch.city,
      address: booking.branch.address,
      phone:   booking.branch.phone,
    },
    billing: {
      roomCharges,
      canteenTotal,
      extraCharges,
      discount:    Number(booking.discountAmount),
      totalPayable,
      paidAmount:  Number(booking.paidAmount),
      balanceDue:  totalPayable - Number(booking.paidAmount),
    },
    orders: orders.map((o) => ({
      id:          o.id,
      status:      o.status,
      totalAmount: Number(o.totalAmount),
      createdAt:   o.createdAt.toISOString(),
      itemCount:   o.items.reduce((s, i) => s + i.quantity, 0),
    })),
  };
}

// ─── GET CANTEEN MENU ─────────────────────────────────────────

export async function getCanteenMenu() {
  const session = await resolveSession();
  if (!session) return { authenticated: false as const };

  const branchId = session.booking.branch.id;

  const items = await prisma.inventoryItem.findMany({
    where: {
      branchId,
      currentStock: { gt: 0 },
      product: {
        isActive:         true,
        isCanteenVisible: true,
      },
    },
    include: {
      product: {
        include: { category: { select: { id: true, name: true, icon: true, sortOrder: true } } },
      },
    },
    orderBy: [
      { product: { category: { sortOrder: "asc" } } },
      { product: { name: "asc" } },
    ],
  });

  const categories: Record<string, {
    id: string; name: string; icon: string | null; items: typeof formattedItems;
  }> = {};

  const formattedItems = items.map((item) => ({
    inventoryItemId: item.id,
    productId:       item.productId,
    name:            item.product.name,
    brand:           item.product.brand,
    unit:            item.product.unit,
    image:           item.product.image,
    price:           Number(item.sellingPrice),
    stock:           item.currentStock,
    category:        item.product.category,
  }));

  for (const item of formattedItems) {
    const cat = item.category;
    if (!categories[cat.id]) {
      categories[cat.id] = { id: cat.id, name: cat.name, icon: cat.icon, items: [] };
    }
    categories[cat.id].items.push(item);
  }

  return {
    authenticated: true as const,
    canOrder:      session.booking.status === "CHECKED_IN",
    guestName:     session.booking.customer.name,
    roomNumber:    session.booking.room.number,
    categories:    Object.values(categories),
  };
}

// ─── PLACE ROOM ORDER ─────────────────────────────────────────

export async function placeRoomOrder(
  cartItems: { inventoryItemId: string; quantity: number }[],
  notes?: string,
) {
  const session = await resolveSession();
  if (!session) return { success: false, error: "Session expired. Please log in again." };

  const booking = session.booking;

  if (booking.status !== "CHECKED_IN") {
    return { success: false, error: "You can only order when checked in to your room." };
  }

  if (!cartItems.length) return { success: false, error: "Your cart is empty." };

  // Fetch inventory items for validation
  const itemIds = cartItems.map((c) => c.inventoryItemId);
  const invItems = await prisma.inventoryItem.findMany({
    where:   { id: { in: itemIds }, branchId: booking.branch.id },
    include: { product: { select: { name: true, isCanteenVisible: true, isActive: true } } },
  });

  if (invItems.length !== itemIds.length) {
    return { success: false, error: "Some items are no longer available." };
  }

  // Validate stock
  for (const ci of cartItems) {
    const inv = invItems.find((i) => i.id === ci.inventoryItemId);
    if (!inv || !inv.product.isActive || !inv.product.isCanteenVisible) {
      return { success: false, error: `Item "${inv?.product.name}" is not available.` };
    }
    if (inv.currentStock < ci.quantity) {
      return { success: false, error: `Only ${inv.currentStock} "${inv.product.name}" left in stock.` };
    }
  }

  // Build order items
  const orderItems = cartItems.map((ci) => {
    const inv        = invItems.find((i) => i.id === ci.inventoryItemId)!;
    const unitPrice  = Number(inv.sellingPrice);
    const totalPrice = unitPrice * ci.quantity;
    return { inventoryItemId: ci.inventoryItemId, productName: inv.product.name, quantity: ci.quantity, unitPrice, totalPrice };
  });

  const orderTotal = orderItems.reduce((s, i) => s + i.totalPrice, 0);

  // Transactional: create order + deduct stock + update booking extraCharges
  const order = await prisma.$transaction(async (tx) => {
    const newOrder = await tx.inRoomOrder.create({
      data: {
        bookingId:   booking.id,
        status:      "PENDING",
        totalAmount: orderTotal,
        notes:       notes || null,
        items: {
          create: orderItems.map((i) => ({
            inventoryItemId: i.inventoryItemId,
            productName:     i.productName,
            quantity:        i.quantity,
            unitPrice:       i.unitPrice,
            totalPrice:      i.totalPrice,
          })),
        },
      },
      include: { items: true },
    });

    // Deduct stock for each item
    for (const ci of cartItems) {
      const inv = invItems.find((i) => i.id === ci.inventoryItemId)!;
      const newStock = inv.currentStock - ci.quantity;
      await tx.inventoryItem.update({
        where: { id: ci.inventoryItemId },
        data:  { currentStock: newStock },
      });
      await tx.stockMovement.create({
        data: {
          inventoryItemId: ci.inventoryItemId,
          type:            "SALE",
          quantity:        -ci.quantity,
          previousStock:   inv.currentStock,
          newStock,
          reference:       newOrder.id,
          notes:           `Room order #${newOrder.id.slice(-6)} — Room ${booking.room.number}`,
        },
      });
    }

    // Add to booking extraCharges immediately (bill on order placed)
    await tx.booking.update({
      where: { id: booking.id },
      data:  { extraCharges: { increment: orderTotal }, totalAmount: { increment: orderTotal } },
    });

    return newOrder;
  });

  // Notify staff via push (non-blocking)
  const itemLines = orderItems
    .map((i) => `${i.quantity}× ${i.productName}`)
    .join("\n");

  sendPushToBranch(booking.branch.id, {
    title: "🛎️ New Room Order",
    body:  `Room ${booking.room.number} · ${booking.customer.name}\n${itemLines}\nTotal: ${formatPKR(orderTotal)}`,
    tag:   "room-order",
    data:  { url: "/dashboard/orders" },
  }).catch(() => {});

  return { success: true, orderId: order.id, total: orderTotal };
}

// ─── GET GUEST ORDERS ─────────────────────────────────────────

export async function getGuestOrders() {
  const session = await resolveSession();
  if (!session) return { authenticated: false as const };

  const orders = await prisma.inRoomOrder.findMany({
    where:   { bookingId: session.booking.id },
    include: {
      items: {
        include: {
          inventoryItem: { include: { product: { select: { image: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    authenticated: true as const,
    roomNumber:    session.booking.room.number,
    orders: orders.map((o) => ({
      id:          o.id,
      status:      o.status,
      totalAmount: Number(o.totalAmount),
      notes:       o.notes,
      createdAt:   o.createdAt.toISOString(),
      deliveredAt: o.deliveredAt?.toISOString() ?? null,
      items: o.items.map((i) => ({
        productName: i.productName,
        quantity:    i.quantity,
        unitPrice:   Number(i.unitPrice),
        totalPrice:  Number(i.totalPrice),
        image:       i.inventoryItem.product.image ?? null,
      })),
    })),
  };
}

// ─── CANCEL GUEST ORDER ───────────────────────────────────────

export async function cancelGuestOrder(orderId: string) {
  const session = await resolveSession();
  if (!session) return { success: false, error: "Session expired." };

  const order = await prisma.inRoomOrder.findUnique({
    where:   { id: orderId },
    include: { items: true },
  });

  if (!order || order.bookingId !== session.booking.id) {
    return { success: false, error: "Order not found." };
  }

  if (order.status !== "PENDING") {
    return { success: false, error: "Only pending orders can be cancelled." };
  }

  const orderTotal = Number(order.totalAmount);

  await prisma.$transaction(async (tx) => {
    await tx.inRoomOrder.update({
      where: { id: orderId },
      data:  { status: "CANCELLED" },
    });

    // Restore stock
    for (const item of order.items) {
      const inv = await tx.inventoryItem.findUnique({ where: { id: item.inventoryItemId } });
      if (!inv) continue;
      const newStock = inv.currentStock + item.quantity;
      await tx.inventoryItem.update({ where: { id: item.inventoryItemId }, data: { currentStock: newStock } });
      await tx.stockMovement.create({
        data: {
          inventoryItemId: item.inventoryItemId,
          type:            "ADJUSTMENT",
          quantity:        item.quantity,
          previousStock:   inv.currentStock,
          newStock,
          reference:       orderId,
          notes:           `Cancelled room order — Room ${session.booking.room.number}`,
        },
      });
    }

    // Remove from booking extraCharges
    await tx.booking.update({
      where: { id: session.booking.id },
      data:  { extraCharges: { decrement: orderTotal }, totalAmount: { decrement: orderTotal } },
    });
  });

  return { success: true };
}
