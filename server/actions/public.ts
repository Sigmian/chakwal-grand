"use server";

import { headers } from "next/headers";
import prisma from "@/lib/db/prisma";
import { sendPushToBranch } from "@/lib/push/send";
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

// Returns booked date ranges for a room â€” used by the availability calendar
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

// Returns booked date ranges for a specific month â€” used by the two-month availability calendar
export async function getRoomAvailability(roomId: string, year: number, month: number) {
  // Build boundaries in UTC to match how checkInDate/checkOutDate are stored,
  // so the visible-month window doesn't shift on a non-UTC server.
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end   = new Date(Date.UTC(year, month, 0, 23, 59, 59)); // last moment of the month

  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
      AND: [
        { checkInDate:  { lte: end   } },
        { checkOutDate: { gt:  start } },
      ],
    },
    select: { checkInDate: true, checkOutDate: true },
  });

  return bookings.map((b) => ({
    checkIn:  b.checkInDate.toISOString().slice(0, 10),
    checkOut: b.checkOutDate.toISOString().slice(0, 10),
  }));
}

export async function getBookingByRef(ref: string, shareToken: string) {
  // Throttle per IP â€” this returns guest PII (name/phone/email) keyed only by a
  // booking ref, so an unthrottled caller could enumerate refs and harvest it.
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`booking-ref:${ip}`, 20, 60_000)) {
    return null;
  }
  if (!shareToken) return null;
  return prisma.booking.findFirst({
    where: { bookingRef: ref, shareToken },
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

export async function validatePromoCode(
  code: string,
  nights: number,
  baseAmount: number,
  guestPhone?: string,
): Promise<
  | { valid: true;  discountAmount: number; discountLabel: string; offerName: string; firstTimeOnly: boolean }
  | { valid: false; error: string }
> {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`promo-validate:${ip}`, 10, 60_000)) {
    return { valid: false, error: "Too many attempts. Please wait a minute." };
  }

  const upper = code.trim().toUpperCase().slice(0, 30);
  if (!upper) return { valid: false, error: "Please enter a promo code." };
  // Block internal auto-apply codes from being entered manually
  if (upper.startsWith("AUTO_")) return { valid: false, error: "Invalid or expired promo code." };

  const offer = await prisma.offer.findFirst({
    where: {
      code:      upper,
      isActive:  true,
      startsAt:  { lte: new Date() },
      expiresAt: { gte: new Date() },
    },
  });

  if (!offer) return { valid: false, error: "Invalid or expired promo code." };

  if (offer.minNights && nights < offer.minNights)
    return { valid: false, error: `This code requires a minimum stay of ${offer.minNights} nights.` };

  if (offer.maxUses && offer.usedCount >= offer.maxUses)
    return { valid: false, error: "This promo code has reached its usage limit." };

  // First-time-only: guest must have no prior bookings
  if (offer.firstTimeOnly && guestPhone) {
    const normalised = guestPhone.replace(/\D/g, "").slice(-10);
    const customers  = await prisma.customer.findMany({
      where: { phone: { contains: normalised } },
      take:  5,
    });
    const customer = customers.find(c => c.phone.replace(/\D/g, "").slice(-10) === normalised);
    if (customer) {
      const prior = await prisma.booking.findFirst({
        where: {
          customerId: customer.id,
          status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        },
        select: { id: true },
      });
      if (prior)
        return { valid: false, error: "This code is only for first-time guests." };
    }
  }

  const discountAmount =
    offer.discountType === "PERCENTAGE"
      ? Math.round((baseAmount * Number(offer.discountValue)) / 100)
      : Math.min(Number(offer.discountValue), baseAmount);

  const discountLabel =
    offer.discountType === "PERCENTAGE"
      ? `${Number(offer.discountValue)}% off`
      : `PKR ${Number(offer.discountValue).toLocaleString()} off`;

  return {
    valid: true,
    discountAmount,
    discountLabel,
    offerName:     offer.name,
    firstTimeOnly: offer.firstTimeOnly,
  };
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

// Returns the active Grand Opening offer for a branch (if any)
export async function getGrandOpeningOffer(branchId: string) {
  return prisma.offer.findFirst({
    where: {
      branchId,
      code:      "AUTO_GRANDOPEN50",
      isActive:  true,
      startsAt:  { lte: new Date() },
      expiresAt: { gte: new Date() },
    },
    select: {
      id: true, name: true, discountValue: true, discountType: true, expiresAt: true,
    },
  });
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

  const rooms = await prisma.room.findMany({
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

  // If no rooms found, search the other branch as fallback
  if (rooms.length === 0) {
    const allBranches = await prisma.branch.findMany({
      where: { isActive: true, id: { not: branchId } },
      select: { id: true, name: true, address: true, city: true },
    });

    for (const fallbackBranch of allBranches) {
      const fallbackConflicting = await prisma.booking.findMany({
        where: {
          branchId: fallbackBranch.id,
          status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
          AND: [{ checkInDate: { lt: co } }, { checkOutDate: { gt: ci } }],
        },
        select: { roomId: true },
      });
      const fallbackTakenIds = fallbackConflicting.map(b => b.roomId);

      const fallbackRooms = await prisma.room.findMany({
        where: {
          branchId: fallbackBranch.id,
          status: { notIn: ["BLOCKED", "MAINTENANCE"] },
          isActive: true,
          maxAdults: { gte: adults },
          id: { notIn: fallbackTakenIds },
        },
        include: {
          images: { where: { isCover: true }, take: 1, orderBy: { sortOrder: "asc" } },
        },
        orderBy: { pricePerNight: "asc" },
      });

      if (fallbackRooms.length > 0) {
        return { rooms: [], fallbackRooms, fallbackBranch };
      }
    }
  }

  return { rooms, fallbackRooms: [], fallbackBranch: null };
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

// Sanitise a string field: trim, strip control chars, enforce max length
function sanitise(val: string | undefined, max: number): string {
  if (!val) return "";
  return val.replace(/[ -]/g, "").trim().slice(0, max);
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
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`public-booking:${ip}`, 5, 60_000)) {
    return { success: false, error: "Too many booking attempts. Please wait a minute." };
  }

  // Sanitise and validate all text inputs before touching the DB
  const cleanName  = sanitise(input.name,  100);
  const cleanPhone = sanitise(input.phone,  20).replace(/\s/g, "");
  const cleanCnic  = sanitise(input.cnic,   20).replace(/[^0-9-]/g, "");
  const cleanEmail = sanitise(input.email, 120);
  const cleanNotes = sanitise(input.notes, 500);

  if (!cleanName)  return { success: false, error: "Guest name is required." };
  if (!cleanPhone || cleanPhone.replace(/\D/g, "").length < 10)
    return { success: false, error: "A valid phone number is required." };
  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail))
    return { success: false, error: "Please enter a valid email address." };

  // Clamp guests
  const adults   = Math.min(Math.max(1, Number(input.adults)   || 1), 20);
  const children = Math.min(Math.max(0, Number(input.children) || 0), 20);

  const ci = new Date(input.checkIn);
  const co = new Date(input.checkOut);

  if (isNaN(ci.getTime()) || isNaN(co.getTime()))
    return { success: false, error: "Invalid dates provided." };
  if (ci >= co) return { success: false, error: "Check-out must be after check-in." };
  if (ci < new Date(new Date().setHours(0, 0, 0, 0)))
    return { success: false, error: "Check-in date cannot be in the past." };
  const maxNights = 90;
  const nights = Math.ceil((co.getTime() - ci.getTime()) / 86_400_000);
  if (nights > maxNights) return { success: false, error: `Maximum booking length is ${maxNights} nights.` };

  const available = await checkRoomAvailability(input.roomId, input.checkIn, input.checkOut);
  if (!available)
    return { success: false, error: "This room is no longer available for the selected dates." };

  const room = await prisma.room.findUnique({
    where: { id: input.roomId },
    include: {
      branch: {
        select: {
          id: true,
          companyId: true,
          name: true,
          city: true,
          isActive: true,
          deletedAt: true,
        },
      },
    },
  });
  if (
    !room ||
    !room.isActive ||
    room.status === "BLOCKED" ||
    room.status === "MAINTENANCE" ||
    !room.branch.isActive ||
    room.branch.deletedAt
  ) {
    return { success: false, error: "Room is not available for booking." };
  }

  // The selected room, not client input, determines branch and company ownership.
  const branchId = room.branchId;
  const companyId = room.branch.companyId;

  const baseAmount = Number(room.pricePerNight) * nights;

  // Determine discount: Grand Opening auto-apply â†’ manual code â†’ auto weekly/monthly
  let discountAmount = 0;
  let appliedOfferId: string | null = null;
  let offerMaxUses: number | null = null;

  // Auto-apply Grand Opening 50% for Madina Town (no code needed)
  const grandOpeningOffer = await prisma.offer.findFirst({
    where: {
      branchId,
      code:      "AUTO_GRANDOPEN50",
      isActive:  true,
      startsAt:  { lte: new Date() },
      expiresAt: { gte: new Date() },
    },
  });
  if (grandOpeningOffer && (!grandOpeningOffer.maxUses || grandOpeningOffer.usedCount < grandOpeningOffer.maxUses)) {
    discountAmount = Math.round((baseAmount * Number(grandOpeningOffer.discountValue)) / 100);
    appliedOfferId = grandOpeningOffer.id;
    offerMaxUses = grandOpeningOffer.maxUses;
  }

  const autoCode = !appliedOfferId ? (nights >= 30 ? "MONTHLY40" : nights >= 7 ? "WEEKLY14" : null) : null;
  const codeToTry = !appliedOfferId ? (input.promoCode || autoCode) : null;

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
      const eligible    = !offer.minNights || nights >= offer.minNights;
      const hasCapacity = !offer.maxUses    || offer.usedCount < offer.maxUses;

      // First-time-only check at booking creation (second gate after validate_coupon)
      let firstTimeEligible = true;
      if (offer.firstTimeOnly) {
        const normalised = cleanPhone.replace(/\D/g, "").slice(-10);
        const existing   = await prisma.customer.findMany({
          where: { phone: { contains: normalised } },
          take:  5,
        });
        const existingCustomer = existing.find(c => c.phone.replace(/\D/g, "").slice(-10) === normalised);
        if (existingCustomer) {
          const prior = await prisma.booking.findFirst({
            where: {
              customerId: existingCustomer.id,
              status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
            },
            select: { id: true },
          });
          if (prior) firstTimeEligible = false;
        }
      }

      if (eligible && hasCapacity && firstTimeEligible) {
        discountAmount = offer.discountType === "PERCENTAGE"
          ? Math.round((baseAmount * Number(offer.discountValue)) / 100)
          : Number(offer.discountValue);
        appliedOfferId = offer.id;
        offerMaxUses = offer.maxUses;
      }
    }
  }

  // Never let a discount exceed the room subtotal (a large FIXED_AMOUNT offer
  // must not produce a free room or a negative stored discount/total).
  discountAmount = Math.min(discountAmount, baseAmount);

  let customer = await prisma.customer.findUnique({ where: { phone: cleanPhone } });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        companyId,
        name:      cleanName,
        phone:     cleanPhone,
        cnic:      cleanCnic  || null,
        email:     cleanEmail || null,
      },
    });
  }

  // Generate unique booking ref and share token
  let ref = generateRef();
  while (await prisma.booking.findUnique({ where: { bookingRef: ref } })) {
    ref = generateRef();
  }
  const shareToken = crypto.randomUUID();

  // Create the booking inside a Serializable transaction that re-checks room
  // availability, so two concurrent requests can't both pass the earlier check
  // and oversell the same room+dates.
  let booking;
  try {
    const transactionResult = await prisma.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          roomId: input.roomId,
          status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
          AND: [{ checkInDate: { lt: co } }, { checkOutDate: { gt: ci } }],
        },
        select: { id: true },
      });
      if (conflict) throw new Error("ROOM_CONFLICT");

      // Claim the promotional slot in the same transaction as the booking. If
      // booking creation fails, PostgreSQL rolls the counter back automatically.
      let committedDiscount = discountAmount;
      let committedOfferId = appliedOfferId;
      if (committedOfferId) {
        const claim = offerMaxUses == null
          ? await tx.offer.updateMany({
              where: { id: committedOfferId, isActive: true },
              data: { usedCount: { increment: 1 } },
            })
          : await tx.offer.updateMany({
              where: { id: committedOfferId, isActive: true, usedCount: { lt: offerMaxUses } },
              data: { usedCount: { increment: 1 } },
            });
        if (claim.count === 0) {
          committedDiscount = 0;
          committedOfferId = null;
        }
      }
      const committedTotal = Math.max(0, baseAmount - committedDiscount);

      const createdBooking = await tx.booking.create({
        data: {
          bookingRef:         ref,
          branchId,
          roomId:             input.roomId,
          customerId:         customer.id,
          checkInDate:        ci,
          checkOutDate:       co,
          nights,
          adultCount:         adults,
          childCount:         children,
          guestCount:         adults + children,
          status:             "PENDING",
          paymentStatus:      "UNPAID",
          baseAmount,
          discountAmount: committedDiscount,
          taxAmount:          0,
          extraCharges:       0,
          totalAmount:        committedTotal,
          offerId:            committedOfferId,
          source:             "website",
          specialRequests:    cleanNotes || null,
          estimatedArrival:   input.estimatedArrival?.slice(0, 20) || null,
          structuredRequests: input.structuredRequests ?? undefined,
          shareToken,
        },
      });
      return { booking: createdBooking, discountAmount: committedDiscount };
    }, { isolationLevel: "Serializable" });
    booking = transactionResult.booking;
    discountAmount = transactionResult.discountAmount;
  } catch (err) {
    // Either our explicit conflict guard, or a Postgres serialization failure
    // (P2034) when two transactions raced â€” both mean the room was just taken.
    const code = (err as { code?: string })?.code;
    if ((err as Error)?.message === "ROOM_CONFLICT" || code === "P2034") {
      return { success: false, error: "This room was just booked by someone else. Please choose another room or dates." };
    }
    throw err;
  }

  // Update customer visit timestamp so win-back cron can target them correctly
  await prisma.customer.update({
    where: { id: customer.id },
    data:  { lastVisitAt: new Date() },
  });

  // Fire push notification to all staff in this branch (non-blocking)
  sendPushToBranch(branchId, {
    title: "ðŸ”” New Booking Received",
    body:  `${cleanName} booked Room ${room.number} Â· ${nights} night${nights !== 1 ? "s" : ""} Â· Ref: ${ref}`,
    tag:   "new-booking",
    data:  { url: "/dashboard/bookings" },
  }).catch(() => {/* ignore push errors */});

  // Note: WhatsApp confirmation is NOT sent here. Public bookings start as PENDING
  // and the confirmation template only fires when the admin approves the booking
  // (see `confirmBooking` in server/actions/bookings.ts).

  return { success: true, bookingId: booking.id, ref, shareToken, discountAmount };
}

export async function lookupGuestByPhone(phone: string) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  // Per-IP throttle (tightened) plus a global cap, so IP rotation can't be used
  // to harvest guest PII (name/email) by iterating the phone-number space.
  if (!rateLimit(`guest-lookup:${ip}`, 5, 60_000)) {
    return { found: false as const };
  }
  if (!rateLimit("guest-lookup:global", 60, 60_000)) {
    return { found: false as const };
  }

  const normalised = phone.trim().replace(/\D/g, "").slice(-10);
  if (normalised.length < 10) return { found: false as const };

  // Per-phone throttle â€” repeated lookups of the same number are pointless for a
  // legitimate returning guest and are the signature of enumeration.
  if (!rateLimit(`guest-lookup-phone:${normalised}`, 3, 10 * 60 * 1000)) {
    return { found: false as const };
  }

  const customer = await prisma.customer.findFirst({
    where: { phone: { endsWith: normalised } },
    select: { name: true, phone: true, email: true },
  });
  if (!customer) return { found: false as const };
  // Do NOT return CNIC in auto-fill â€” guests enter it manually for security
  return { found: true as const, name: customer.name, phone: customer.phone, email: customer.email ?? "", cnic: "" };
}

export async function saveAbandonedLead(data: {
  phone:     string;
  name?:     string;
  branchId?: string;
  roomId?:   string;
  checkIn?:  string; // "YYYY-MM-DD"
  checkOut?: string; // "YYYY-MM-DD"
}): Promise<void> {
  const phone = data.phone?.trim();
  if (!phone) return;

  // Per-IP throttle: prevents a script from flooding the AbandonedLead table
  // and, via the hourly cron, spamming WhatsApp messages to arbitrary phones.
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`abandoned-lead:${ip}`, 20, 60 * 60 * 1000)) return;

  // Dedup: if we already recorded a lead for this phone in the last 4 hours,
  // update it in place instead of creating a duplicate row.
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
  const recent = await prisma.abandonedLead.findFirst({
    where: { phone, followedUp: false, createdAt: { gte: fourHoursAgo } },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const payload = {
    phone,
    name:     data.name?.trim()     || null,
    branchId: data.branchId?.trim() || null,
    roomId:   data.roomId?.trim()   || null,
    checkIn:  data.checkIn          || null,
    checkOut: data.checkOut         || null,
  };

  if (recent) {
    await prisma.abandonedLead.update({ where: { id: recent.id }, data: payload });
  } else {
    await prisma.abandonedLead.create({ data: payload });
  }
}

export async function markLeadFollowedUp(phone: string): Promise<void> {
  // Trim to match how saveAbandonedLead stores the phone, otherwise a lead
  // saved from a phone with surrounding whitespace never gets flagged and the
  // recovery cron would message a guest who already booked.
  const trimmed = phone?.trim();
  if (!trimmed) return;
  await prisma.abandonedLead.updateMany({
    where: { phone: trimmed, followedUp: false },
    data:  { followedUp: true, followedUpAt: new Date() },
  });
}

export async function lookupBooking(ref: string, phone: string) {
  if (!ref?.trim()) return { success: false, error: "Please enter a booking reference." };
  const normalizedPhone = phone.replace(/\D/g, "").slice(-10);
  if (normalizedPhone.length !== 10) return { success: false, error: "Please enter the phone number used for this booking." };

  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`booking-lookup:${ip}`, 10, 60_000)) {
    return { success: false, error: "Too many lookup attempts. Please wait a minute." };
  }

  const booking = await prisma.booking.findUnique({
    where:   { bookingRef: ref.trim().toUpperCase() },
    include: {
      room:     { select: { name: true, number: true, type: true, pricePerNight: true } },
      branch:   { select: { name: true, phone: true, address: true } },
      customer: { select: { name: true, phone: true } },
    },
  });

  if (!booking) return { success: false, error: "No booking found with that reference. Please check and try again." };
  if (booking.customer.phone.replace(/\D/g, "").slice(-10) !== normalizedPhone) {
    return { success: false, error: "The booking reference and phone number do not match." };
  }

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

