"use server";

import { headers } from "next/headers";
import prisma from "@/lib/db/prisma";
import { sendPushToBranch } from "@/lib/push/send";
import { sendBookingWhatsApp } from "@/lib/whatsapp/send";
import { siteConfig } from "@/config/site";
import { rateLimit } from "@/lib/rate-limit";

export async function getPublicRooms() {
  return prisma.room.findMany({
    where: { status: { not: "BLOCKED" }, isActive: true },
    include: {
      branch: { select: { id: true, name: true, city: true } },
      images: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: [{ type: "asc" }, { pricePerNight: "asc" }],
  });
}

export async function getPublicRoomTypes() {
  return prisma.room.findMany({
    where: { status: { not: "BLOCKED" }, isActive: true },
    select: { type: true, pricePerNight: true },
    orderBy: { pricePerNight: "asc" },
  });
}

export async function getPublicRoom(id: string) {
  return prisma.room.findUnique({
    where:   { id, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      branch: { select: { id: true, name: true, city: true } },
    },
  });
}

// Returns booked date ranges for a room — used by the availability calendar
export async function getRoomBookedDates(roomId: string): Promise<{ checkIn: string; checkOut: string }[]> {
  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      status:      { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
      checkOutDate: { gte: new Date() },
    },
    select: { checkInDate: true, checkOutDate: true },
  });
  return bookings.map((b) => ({
    checkIn:  b.checkInDate.toISOString().split("T")[0],
    checkOut: b.checkOutDate.toISOString().split("T")[0],
  }));
}

export async function getBookingByRef(ref: string) {
  return prisma.booking.findUnique({
    where: { bookingRef: ref },
    include: {
      room: {
        include: {
          images: { orderBy: { sortOrder: "asc" } },
        },
      },
      branch: { select: { id: true, name: true, city: true, address: true } },
      customer: { select: { name: true, phone: true, email: true } },
    },
  });
}

export async function getPublicBranches() {
  return prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true, address: true, phone: true },
    orderBy: { name: "asc" },
  });
}

export async function getPublicReviews() {
  return prisma.review.findMany({
    where: { isApproved: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take: 6,
    select: {
      id: true, rating: true, body: true, createdAt: true, isFeatured: true,
      customer: { select: { name: true, city: true } },
    },
  });
}

export async function getActiveAnnouncement() {
  return prisma.announcement.findFirst({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, body: true },
  });
}

export async function checkRoomAvailability(
  roomId: string,
  checkIn: string,
  checkOut: string,
): Promise<boolean> {
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  const conflict = await prisma.booking.findFirst({
    where: {
      roomId,
      status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
      AND: [{ checkInDate: { lt: co } }, { checkOutDate: { gt: ci } }],
    },
  });
  return !conflict;
}

export async function getAvailableRooms(
  branchId: string,
  checkIn: string,
  checkOut: string,
  adults: number,
) {
  const ci = new Date(checkIn);
  const co = new Date(checkOut);

  const conflicting = await prisma.booking.findMany({
    where: {
      branchId,
      status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
      AND: [{ checkInDate: { lt: co } }, { checkOutDate: { gt: ci } }],
    },
    select: { roomId: true },
  });
  const takenIds = conflicting.map(b => b.roomId);

  return prisma.room.findMany({
    where: {
      branchId,
      status: { notIn: ["BLOCKED", "MAINTENANCE"] },
      isActive: true,
      maxAdults: { gte: adults },
      id: { notIn: takenIds },
    },
    include: {
      images: { where: { isCover: true }, take: 1, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { pricePerNight: "asc" },
  });
}

// Returns ALL active rooms for a branch, each tagged with isAvailable for the given dates.
// Used by the visual room picker.
export async function getRoomsForPicker(
  branchId: string,
  checkIn:  string,
  checkOut: string,
) {
  const ci = new Date(checkIn);
  const co = new Date(checkOut);

  const [rooms, conflicts] = await Promise.all([
    prisma.room.findMany({
      where:   { branchId, isActive: true, status: { not: "BLOCKED" } },
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: [{ floor: "asc" }, { number: "asc" }],
    }),
    prisma.booking.findMany({
      where: {
        branchId,
        status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
        AND: [{ checkInDate: { lt: co } }, { checkOutDate: { gt: ci } }],
      },
      select: { roomId: true },
    }),
  ]);

  const takenIds = new Set(conflicts.map((b) => b.roomId));

  return rooms.map((r) => ({
    ...r,
    isAvailable: !takenIds.has(r.id),
  }));
}

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return `BK-${new Date().getFullYear()}-${ref}`;
}

export async function createPublicBooking(input: {
  roomId:              string;
  branchId:            string;
  checkIn:             string;
  checkOut:            string;
  adults:              number;
  children:            number;
  name:                string;
  phone:               string;
  cnic?:               string;
  email?:              string;
  notes?:              string;
  promoCode?:          string;
  estimatedArrival?:   string;
  structuredRequests?: Record<string, boolean | string>;
}) {
  const ip = headers().get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`public-booking:${ip}`, 5, 60_000)) {
    return { success: false, error: "Too many booking attempts. Please wait a minute." };
  }

  const ci = new Date(input.checkIn);
  const co = new Date(input.checkOut);

  if (ci >= co) return { success: false, error: "Check-out must be after check-in." };
  if (ci < new Date(new Date().setHours(0, 0, 0, 0)))
    return { success: false, error: "Check-in date cannot be in the past." };

  const available = await checkRoomAvailability(input.roomId, input.checkIn, input.checkOut);
  if (!available)
    return { success: false, error: "This room is no longer available for the selected dates." };

  const room = await prisma.room.findUnique({
    where: { id: input.roomId },
    include: { branch: { select: { name: true, city: true } } },
  });
  if (!room) return { success: false, error: "Room not found." };

  const nights     = Math.ceil((co.getTime() - ci.getTime()) / 86_400_000);
  const baseAmount = Number(room.pricePerNight) * nights;

  // Determine discount: manual promo code OR auto weekly/monthly
  let discountAmount = 0;
  let appliedOfferId: string | null = null;

  const autoCode = nights >= 30 ? "MONTHLY40" : nights >= 7 ? "WEEKLY14" : null;
  const codeToTry = input.promoCode || autoCode;

  if (codeToTry) {
    const offer = await prisma.offer.findFirst({
      where: {
        code:      codeToTry,
        isActive:  true,
        startsAt:  { lte: new Date() },
        expiresAt: { gte: new Date() },
      },
    });
    if (offer) {
      const eligible   = !offer.minNights || nights >= offer.minNights;
      const hasCapacity = !offer.maxUses || offer.usedCount < offer.maxUses;
      if (eligible && hasCapacity) {
        discountAmount = offer.discountType === "PERCENTAGE"
          ? (baseAmount * Number(offer.discountValue)) / 100
          : Number(offer.discountValue);
        appliedOfferId = offer.id;
        await prisma.offer.update({ where: { id: offer.id }, data: { usedCount: { increment: 1 } } });
      }
    }
  }

  const totalAmount = Math.max(0, baseAmount - discountAmount);

  let customer = await prisma.customer.findUnique({ where: { phone: input.phone } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        companyId: "company-001",
        name:      input.name,
        phone:     input.phone,
        cnic:      input.cnic  || null,
        email:     input.email || null,
      },
    });
  }

  // Generate unique booking ref and share token
  let ref = generateRef();
  while (await prisma.booking.findUnique({ where: { bookingRef: ref } })) {
    ref = generateRef();
  }
  const shareToken = crypto.randomUUID();

  const booking = await prisma.booking.create({
    data: {
      bookingRef:         ref,
      branchId:           input.branchId,
      roomId:             input.roomId,
      customerId:         customer.id,
      checkInDate:        ci,
      checkOutDate:       co,
      nights,
      adultCount:         input.adults,
      childCount:         input.children,
      guestCount:         input.adults + input.children,
      status:             "PENDING",
      paymentStatus:      "UNPAID",
      baseAmount,
      discountAmount,
      taxAmount:          0,
      extraCharges:       0,
      totalAmount,
      offerId:            appliedOfferId,
      source:             "website",
      specialRequests:    input.notes || null,
      estimatedArrival:   input.estimatedArrival || null,
      structuredRequests: input.structuredRequests ?? undefined,
      shareToken,
    },
  });

  // Fire push notification to all staff in this branch (non-blocking)
  sendPushToBranch(input.branchId, {
    title: "🔔 New Booking Received",
    body:  `${input.name} booked Room ${room.number} · ${nights} night${nights !== 1 ? "s" : ""} · Ref: ${ref}`,
    tag:   "new-booking",
    data:  { url: "/dashboard/bookings" },
  }).catch(() => {/* ignore push errors */});

  // Send WhatsApp confirmation to guest (non-blocking — never fails the booking)
  const branchCity = room.branch?.city ?? "";
  const branchAddress =
    siteConfig.branches.find((b) =>
      b.city.toLowerCase() === branchCity.toLowerCase()
    )?.address ?? siteConfig.branches[0].address;

  sendBookingWhatsApp({
    phone:           input.phone,
    guestName:       input.name,
    bookingRef:      ref,
    roomName:        room.name,
    branchName:      room.branch?.name ?? "Chakwal",
    checkInDate:     ci,
    checkOutDate:    co,
    nights,
    totalAmount,
    branchAddress,
    confirmationUrl: `https://www.chakwalgrand.pk/booking-confirmation/${ref}`,
  }).catch((err) => console.error("[WhatsApp]", err));

  return { success: true, bookingId: booking.id, ref, shareToken, discountAmount };
}

export async function lookupGuestByPhone(phone: string) {
  const customer = await prisma.customer.findUnique({
    where: { phone: phone.trim() },
    select: { name: true, phone: true, email: true, cnic: true },
  });
  if (!customer) return { found: false as const };
  return { found: true as const, name: customer.name, phone: customer.phone, email: customer.email ?? "", cnic: customer.cnic ?? "" };
}

export async function lookupBooking(ref: string) {
  if (!ref?.trim()) return { success: false, error: "Please enter a booking reference." };

  const booking = await prisma.booking.findUnique({
    where:   { bookingRef: ref.trim().toUpperCase() },
    include: {
      room:     { select: { name: true, number: true, type: true, pricePerNight: true } },
      branch:   { select: { name: true, phone: true, address: true } },
      customer: { select: { name: true, phone: true } },
    },
  });

  if (!booking) return { success: false, error: "No booking found with that reference. Please check and try again." };

  return {
    success: true,
    booking: {
      bookingRef:     booking.bookingRef,
      status:         booking.status,
      paymentStatus:  booking.paymentStatus,
      guestName:      booking.customer.name,
      guestPhone:     booking.customer.phone,
      roomName:       booking.room.name,
      roomNumber:     booking.room.number,
      branchName:     booking.branch.name,
      branchPhone:    booking.branch.phone,
      branchAddress:  booking.branch.address,
      checkIn:        booking.checkInDate.toISOString(),
      checkOut:       booking.checkOutDate.toISOString(),
      nights:         booking.nights,
      adults:         booking.adultCount,
      children:       booking.childCount,
      totalAmount:    Number(booking.totalAmount),
      discountAmount: Number(booking.discountAmount),
      baseAmount:     Number(booking.baseAmount),
      paidAmount:     Number(booking.paidAmount),
      specialRequests: booking.specialRequests,
      createdAt:      booking.createdAt.toISOString(),
    },
  };
}
