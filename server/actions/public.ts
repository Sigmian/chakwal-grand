"use server";

import prisma from "@/lib/db/prisma";

export async function getPublicRooms() {
  return prisma.room.findMany({
    where: { status: { not: "BLOCKED" }, isActive: true },
    include: { branch: { select: { id: true, name: true, city: true } } },
    orderBy: [{ type: "asc" }, { pricePerNight: "asc" }],
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
      status: "AVAILABLE",
      isActive: true,
      maxAdults: { gte: adults },
      id: { notIn: takenIds },
    },
    orderBy: { pricePerNight: "asc" },
  });
}

function generateRef(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let ref = "";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return `BK-${new Date().getFullYear()}-${ref}`;
}

export async function createPublicBooking(input: {
  roomId:     string;
  branchId:   string;
  checkIn:    string;
  checkOut:   string;
  adults:     number;
  children:   number;
  name:       string;
  phone:      string;
  cnic?:      string;
  email?:     string;
  notes?:     string;
  promoCode?: string;
}) {
  const ci = new Date(input.checkIn);
  const co = new Date(input.checkOut);

  if (ci >= co) return { success: false, error: "Check-out must be after check-in." };
  if (ci < new Date(new Date().setHours(0, 0, 0, 0)))
    return { success: false, error: "Check-in date cannot be in the past." };

  const available = await checkRoomAvailability(input.roomId, input.checkIn, input.checkOut);
  if (!available)
    return { success: false, error: "This room is no longer available for the selected dates." };

  const room = await prisma.room.findUnique({ where: { id: input.roomId } });
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

  // Generate unique booking ref
  let ref = generateRef();
  while (await prisma.booking.findUnique({ where: { bookingRef: ref } })) {
    ref = generateRef();
  }

  const booking = await prisma.booking.create({
    data: {
      bookingRef:      ref,
      branchId:        input.branchId,
      roomId:          input.roomId,
      customerId:      customer.id,
      checkInDate:     ci,
      checkOutDate:    co,
      nights,
      adultCount:      input.adults,
      childCount:      input.children,
      guestCount:      input.adults + input.children,
      status:          "PENDING",
      paymentStatus:   "UNPAID",
      baseAmount,
      discountAmount,
      taxAmount:       0,
      extraCharges:    0,
      totalAmount,
      offerId:         appliedOfferId,
      source:          "website",
      specialRequests: input.notes || null,
    },
  });

  return { success: true, bookingId: booking.id, ref, discountAmount };
}
