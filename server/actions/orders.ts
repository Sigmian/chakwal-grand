"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";

export async function getInRoomOrders(branchId?: string) {
  const user         = await requirePermission("bookings:read");
  const scopedBranch = getScopedBranchId(user, branchId);

  return prisma.inRoomOrder.findMany({
    where: scopedBranch
      ? { booking: { branchId: scopedBranch } }
      : {},
    include: {
      items: true,
      booking: {
        select: {
          bookingRef: true,
          room:       { select: { number: true, name: true } },
          customer:   { select: { name: true, phone: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function updateOrderStatus(orderId: string, status: "PENDING" | "PREPARING" | "DELIVERED" | "CANCELLED") {
  const user = await requirePermission("bookings:update");

  // Branch scope check — prevent acting on another branch's in-room order
  // (cancelling reverses charges and restocks inventory).
  const scopeCheck = await prisma.inRoomOrder.findUnique({
    where:   { id: orderId },
    select:  { booking: { select: { branchId: true } } },
  });
  if (!scopeCheck) return { success: false, error: "Order not found." };
  if (getScopedBranchId(user, scopeCheck.booking.branchId) !== scopeCheck.booking.branchId) {
    return { success: false, error: "Access denied" };
  }

  if (status === "CANCELLED") {
    // Fetch order with items so we can reverse charges and restore stock
    const order = await prisma.inRoomOrder.findUnique({
      where:   { id: orderId },
      include: { items: true },
    });

    if (!order) return { success: false, error: "Order not found." };
    if (order.status === "CANCELLED") return { success: true }; // already cancelled
    if (order.status === "DELIVERED") return { success: false, error: "Delivered orders cannot be cancelled." };

    const orderTotal = Number(order.totalAmount);

    await prisma.$transaction(async (tx) => {
      // Mark order cancelled
      await tx.inRoomOrder.update({
        where: { id: orderId },
        data:  { status: "CANCELLED" },
      });

      // Reverse the charge from the booking
      await tx.booking.update({
        where: { id: order.bookingId },
        data:  {
          extraCharges: { decrement: orderTotal },
          totalAmount:  { decrement: orderTotal },
        },
      });

      // Restore stock for each item
      for (const item of order.items) {
        const inv = await tx.inventoryItem.findUnique({ where: { id: item.inventoryItemId } });
        if (!inv) continue;
        const newStock = inv.currentStock + item.quantity;
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data:  { currentStock: newStock },
        });
        await tx.stockMovement.create({
          data: {
            inventoryItemId: item.inventoryItemId,
            type:            "ADJUSTMENT",
            quantity:        item.quantity,
            previousStock:   inv.currentStock,
            newStock,
            reference:       orderId,
            notes:           `Cancelled room order (staff) — order #${orderId.slice(-6)}`,
          },
        });
      }
    });
  } else {
    await prisma.inRoomOrder.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      },
    });
  }

  revalidatePath("/dashboard/orders");
  return { success: true };
}
