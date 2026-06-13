// ============================================================
// server/actions/bookings.ts
// Server Actions for all booking operations.
//
// These run on the server — called directly from Server
// Components and Client Components via "use server".
// Each action validates inputs, checks permissions,
// performs the DB operation, and logs the activity.
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requireAuth, requirePermission, getScopedBranchId } from "@/lib/auth/session";
import {
  createBookingSchema,
  updateBookingSchema,
  cancelBookingSchema,
  addPaymentSchema,
} from "@/lib/validation/schemas";
import {
  generateBookingRef,
  getNights,
  calculateBookingTotal,
} from "@/utils";
import { BookingStatus, PaymentStatus, RoomStatus } from "@/types";
import type {
  CreateBookingInput,
  UpdateBookingInput,
  CancelBookingInput,
  AddPaymentInput,
} from "@/lib/validation/schemas";

// ─── Helper: log activity ─────────────────────────────────────
async function logActivity(
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  description: string,
  metadata?: Record<string, unknown>
) {
  await prisma.activityLog.create({
    data: { userId, action, entity, entityId, description, metadata: metadata as never },
  });
}

// ─── CREATE BOOKING ───────────────────────────────────────────
export async function createBooking(rawInput: CreateBookingInput) {
  const user = await requirePermission("bookings:create");

  // 1. Validate input
  const result = createBookingSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }
  const input = result.data;

  // 2. Scope branch access
  const branchId = getScopedBranchId(user, input.branchId);
  if (!branchId) {
    return { success: false, error: "Branch access denied" };
  }

  try {
    // 3. Verify room exists and belongs to this branch
    const room = await prisma.room.findFirst({
      where: { id: input.roomId, branchId, isActive: true },
    });
    if (!room) {
      return { success: false, error: "Room not found or not available" };
    }

    // 4. Check room availability for requested dates
    const checkIn  = new Date(input.checkInDate);
    const checkOut = new Date(input.checkOutDate);

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        roomId: input.roomId,
        status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
        AND: [
          { checkInDate:  { lt: checkOut } },
          { checkOutDate: { gt: checkIn  } },
        ],
      },
    });
    if (conflictingBooking) {
      return {
        success: false,
        error: `Room is not available for these dates. Conflicting booking: ${conflictingBooking.bookingRef}`,
      };
    }

    // 5. Resolve or create customer
    let customerId = input.customerId;
    if (!customerId) {
      // Find by phone or create new customer
      const existing = await prisma.customer.findUnique({
        where: { phone: input.guestPhone! },
      });
      if (existing) {
        customerId = existing.id;
      } else {
        const newCustomer = await prisma.customer.create({
          data: {
            companyId: user.companyId,
            name:  input.guestName!,
            phone: input.guestPhone!,
            email: input.guestEmail || undefined,
            cnic:  (input as any).guestCnic || undefined,
          },
        });
        customerId = newCustomer.id;
      }
    }

    // 6. Apply offer discount (manual code OR auto weekly/monthly)
    let discountAmount = 0;
    let appliedOfferId: string | null = input.offerId || null;

    const nights = getNights(checkIn, checkOut);
    const baseAmt = Number(room.pricePerNight) * nights;

    // Auto-discount: monthly (30+ nights) takes priority over weekly (7+)
    const autoCode = nights >= 30 ? "MONTHLY40" : nights >= 7 ? "WEEKLY14" : null;

    const offerLookup = appliedOfferId
      ? { id: appliedOfferId }
      : autoCode
      ? { code: autoCode }
      : null;

    if (offerLookup) {
      const offer = await prisma.offer.findFirst({
        where: {
          ...offerLookup,
          isActive:  true,
          startsAt:  { lte: new Date() },
          expiresAt: { gte: new Date() },
        },
      });
      if (offer) {
        const eligible = !offer.minNights || nights >= offer.minNights;
        const hasCapacity = !offer.maxUses || offer.usedCount < offer.maxUses;
        if (eligible && hasCapacity) {
          discountAmount = offer.discountType === "PERCENTAGE"
            ? (baseAmt * Number(offer.discountValue)) / 100
            : Number(offer.discountValue);
          appliedOfferId = offer.id;

          await prisma.offer.update({
            where: { id: offer.id },
            data:  { usedCount: { increment: 1 } },
          });
        }
      }
    }

    // 7. Calculate totals
    const baseAmount = baseAmt;
    const taxAmount  = 0; // Configurable in future
    const totalAmount = calculateBookingTotal({
      baseAmount, discountAmount, taxAmount, extraCharges: 0,
    });

    // 8. Create the booking
    const booking = await prisma.booking.create({
      data: {
        bookingRef:   generateBookingRef(),
        branchId,
        roomId:       input.roomId,
        customerId:   customerId!,
        checkInDate:  checkIn,
        checkOutDate: checkOut,
        nights,
        adultCount:   input.adultCount,
        childCount:   input.childCount ?? 0,
        guestCount:   input.adultCount + (input.childCount ?? 0),
        baseAmount,
        discountAmount,
        taxAmount,
        extraCharges: 0,
        totalAmount,
        paidAmount:   0,
        status:       BookingStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        source:       input.source ?? "website",
        offerId:      appliedOfferId || null,
        specialRequests: input.specialRequests || null,
        internalNotes:   input.internalNotes || null,
      },
      include: {
        room:     { select: { number: true, name: true, type: true } },
        customer: { select: { name: true, phone: true } },
        branch:   { select: { name: true } },
      },
    });

    // 9. Update customer visit stats
    await prisma.customer.update({
      where: { id: customerId! },
      data:  { lastVisitAt: new Date() },
    });

    // 10. Log activity
    await logActivity(
      user.id,
      "BOOKING_CREATED",
      "Booking",
      booking.id,
      `New booking ${booking.bookingRef} created for ${booking.customer.name}`
    );

    revalidatePath("/bookings");
    revalidatePath("/dashboard");

    return { success: true, data: booking };
  } catch (error) {
    console.error("[createBooking]", error);
    return { success: false, error: "Failed to create booking. Please try again." };
  }
}

// ─── CONFIRM BOOKING ──────────────────────────────────────────
export async function confirmBooking(bookingId: string) {
  const user = await requirePermission("bookings:update");

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) return { success: false, error: "Booking not found" };

    // Branch scope check
    const branchId = getScopedBranchId(user, booking.branchId);
    if (branchId !== booking.branchId) {
      return { success: false, error: "Access denied" };
    }

    if (booking.status !== BookingStatus.PENDING) {
      return { success: false, error: `Cannot confirm a booking with status: ${booking.status}` };
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data:  { status: BookingStatus.CONFIRMED },
    });

    await logActivity(user.id, "BOOKING_CONFIRMED", "Booking", bookingId,
      `Booking ${booking.bookingRef} confirmed`);

    revalidatePath("/bookings");
    return { success: true, data: updated };
  } catch (error) {
    console.error("[confirmBooking]", error);
    return { success: false, error: "Failed to confirm booking" };
  }
}

// ─── CHECK IN ─────────────────────────────────────────────────
export async function checkInBooking(bookingId: string) {
  const user = await requirePermission("bookings:checkin");

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });
    if (!booking) return { success: false, error: "Booking not found" };

    if (booking.status !== BookingStatus.CONFIRMED) {
      return {
        success: false,
        error:   "Only confirmed bookings can be checked in",
      };
    }

    // Run in transaction: update booking + room status
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status:        BookingStatus.CHECKED_IN,
          actualCheckIn: new Date(),
        },
      }),
      prisma.room.update({
        where: { id: booking.roomId },
        data:  { status: RoomStatus.OCCUPIED },
      }),
    ]);

    await logActivity(user.id, "BOOKING_CHECKIN", "Booking", bookingId,
      `Guest checked into ${booking.room.number}`);

    revalidatePath("/bookings");
    revalidatePath("/dashboard/rooms");
    revalidatePath("/housekeeping");

    return { success: true };
  } catch (error) {
    console.error("[checkInBooking]", error);
    return { success: false, error: "Failed to check in guest" };
  }
}

// ─── CHECK OUT ────────────────────────────────────────────────
export async function checkOutBooking(bookingId: string) {
  const user = await requirePermission("bookings:checkout");

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        room:     true,
        salesAttached: {
          include: { lineItems: true },
        },
      },
    });
    if (!booking) return { success: false, error: "Booking not found" };

    if (booking.status !== BookingStatus.CHECKED_IN) {
      return { success: false, error: "Guest must be checked in first" };
    }

    // Calculate total extra charges from attached POS sales
    const extraCharges = booking.salesAttached.reduce(
      (sum, sale) => sum + Number(sale.totalAmount), 0
    );

    const newTotal = calculateBookingTotal({
      baseAmount:    Number(booking.baseAmount),
      discountAmount: Number(booking.discountAmount),
      taxAmount:     Number(booking.taxAmount),
      extraCharges,
    });

    await prisma.$transaction([
      // Update booking
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status:         BookingStatus.CHECKED_OUT,
          actualCheckOut: new Date(),
          extraCharges,
          totalAmount:    newTotal,
          paymentStatus:
            Number(booking.paidAmount) >= newTotal
              ? PaymentStatus.PAID
              : Number(booking.paidAmount) > 0
              ? PaymentStatus.PARTIAL
              : PaymentStatus.UNPAID,
        },
      }),
      // Room back to cleaning
      prisma.room.update({
        where: { id: booking.roomId },
        data:  { status: RoomStatus.CLEANING },
      }),
      // Update customer stats
      prisma.customer.update({
        where: { id: booking.customerId },
        data: {
          totalVisits:   { increment: 1 },
          totalSpending: { increment: newTotal },
          lastVisitAt:   new Date(),
        },
      }),
    ]);

    await logActivity(user.id, "BOOKING_CHECKOUT", "Booking", bookingId,
      `Guest checked out from ${booking.room.number}. Total: ₨${newTotal}`);

    revalidatePath("/bookings");
    revalidatePath("/dashboard/rooms");
    revalidatePath("/housekeeping");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error) {
    console.error("[checkOutBooking]", error);
    return { success: false, error: "Failed to check out guest" };
  }
}

// ─── CANCEL BOOKING ───────────────────────────────────────────
export async function cancelBooking(bookingId: string, rawInput: CancelBookingInput) {
  const user = await requirePermission("bookings:cancel");

  const result = cancelBookingSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) return { success: false, error: "Booking not found" };

    if (
      booking.status === BookingStatus.CHECKED_OUT ||
      booking.status === BookingStatus.CANCELLED
    ) {
      return {
        success: false,
        error:   "Cannot cancel a completed or already cancelled booking",
      };
    }

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status:             BookingStatus.CANCELLED,
          cancelledAt:        new Date(),
          cancellationReason: result.data.reason,
        },
      }),
      // If room was occupied, free it
      ...(booking.status === BookingStatus.CHECKED_IN
        ? [
            prisma.room.update({
              where: { id: booking.roomId },
              data:  { status: RoomStatus.AVAILABLE },
            }),
          ]
        : []),
    ]);

    await logActivity(user.id, "BOOKING_CANCELLED", "Booking", bookingId,
      `Booking ${booking.bookingRef} cancelled: ${result.data.reason}`);

    revalidatePath("/bookings");
    revalidatePath("/dashboard/rooms");

    return { success: true };
  } catch (error) {
    console.error("[cancelBooking]", error);
    return { success: false, error: "Failed to cancel booking" };
  }
}

// ─── ADD PAYMENT ──────────────────────────────────────────────
export async function addPayment(rawInput: AddPaymentInput) {
  const user = await requirePermission("bookings:update");

  const result = addPaymentSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }
  const input = result.data;

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
    });
    if (!booking) return { success: false, error: "Booking not found" };

    const newPaidAmount = Number(booking.paidAmount) + input.amount;
    const totalAmount   = Number(booking.totalAmount);

    const paymentStatus: PaymentStatus =
      newPaidAmount >= totalAmount
        ? PaymentStatus.PAID
        : newPaidAmount > 0
        ? PaymentStatus.PARTIAL
        : PaymentStatus.UNPAID;

    await prisma.$transaction([
      prisma.payment.create({
        data: {
          bookingId:   input.bookingId,
          amount:      input.amount,
          method:      input.method,
          reference:   input.reference || null,
          receivedById: user.id,
          notes:       input.notes || null,
        },
      }),
      prisma.booking.update({
        where: { id: input.bookingId },
        data: {
          paidAmount:    newPaidAmount,
          paymentStatus,
        },
      }),
    ]);

    await logActivity(user.id, "PAYMENT_RECEIVED", "Booking", input.bookingId,
      `Payment of ₨${input.amount} received via ${input.method}`);

    revalidatePath(`/bookings/${input.bookingId}`);
    revalidatePath("/finance/revenue");

    return { success: true };
  } catch (error) {
    console.error("[addPayment]", error);
    return { success: false, error: "Failed to record payment" };
  }
}

// ─── GET BOOKINGS (server-side data fetch) ────────────────────
export async function getBookings(params?: {
  branchId?: string;
  status?:   BookingStatus;
  date?:     "today" | "this_week" | "this_month";
  page?:     number;
  pageSize?: number;
}) {
  const user  = await requirePermission("bookings:read");
  const page  = params?.page ?? 1;
  const limit = params?.pageSize ?? 20;
  const skip  = (page - 1) * limit;

  const branchId = getScopedBranchId(user, params?.branchId);

  // Build date filter
  let dateFilter = {};
  if (params?.date) {
    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (params.date === "today") {
      dateFilter = { checkInDate: { gte: today, lt: new Date(today.getTime() + 86400000) } };
    } else if (params.date === "this_week") {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      dateFilter = { checkInDate: { gte: weekStart } };
    } else if (params.date === "this_month") {
      dateFilter = {
        checkInDate: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lt:  new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
      };
    }
  }

  const where = {
    ...(branchId ? { branchId }         : {}),
    ...(params?.status ? { status: params.status } : {}),
    ...dateFilter,
  };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { createdAt: "desc" },
      include: {
        room:     { select: { number: true, name: true, type: true } },
        customer: { select: { id: true, name: true, phone: true, loyaltyTier: true } },
        branch:   { select: { name: true, slug: true } },
        payments: { select: { amount: true, method: true, createdAt: true } },
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: bookings,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
}

// ─── BOOKING STATUS COUNTS ────────────────────────────────────
export async function getBookingStatusCounts(branchId?: string) {
  const user = await requirePermission("bookings:read");
  const scopedBranch = getScopedBranchId(user, branchId);

  const grouped = await prisma.booking.groupBy({
    by: ["status"],
    where: scopedBranch ? { branchId: scopedBranch } : {},
    _count: { status: true },
  });

  const counts: Record<string, number> = {};
  let total = 0;
  for (const row of grouped) {
    counts[row.status.toLowerCase()] = row._count.status;
    total += row._count.status;
  }
  return {
    all:         total,
    pending:     counts["pending"]     ?? 0,
    confirmed:   counts["confirmed"]   ?? 0,
    checked_in:  counts["checked_in"]  ?? 0,
    checked_out: counts["checked_out"] ?? 0,
    cancelled:   counts["cancelled"]   ?? 0,
  };
}

// ─── APPLY BOOKING ADJUSTMENT (discount or extra charge) ─────

export async function applyBookingAdjustment(input: {
  bookingId:       string;
  adjustmentType:  "DISCOUNT" | "EXTRA_CHARGE";
  amount:          number;
  description:     string;
}) {
  await requirePermission("bookings:update");

  if (!input.bookingId) return { success: false, error: "Booking ID required" };
  if (input.amount <= 0)  return { success: false, error: "Amount must be greater than zero" };
  if (!input.description.trim()) return { success: false, error: "Please provide a reason" };

  const booking = await prisma.booking.findUnique({ where: { id: input.bookingId } });
  if (!booking) return { success: false, error: "Booking not found" };

  const baseAmount     = Number(booking.baseAmount);
  const taxAmount      = Number(booking.taxAmount);
  const extraCharges   = Number(booking.extraCharges);
  const discountAmount = Number(booking.discountAmount);

  let newDiscount = discountAmount;
  let newExtra    = extraCharges;

  if (input.adjustmentType === "DISCOUNT") {
    newDiscount = discountAmount + input.amount;
    // Discount cannot exceed base amount
    if (newDiscount > baseAmount) {
      return { success: false, error: `Discount cannot exceed room rate of Rs ${baseAmount.toLocaleString()}` };
    }
  } else {
    newExtra = extraCharges + input.amount;
  }

  const newTotal = baseAmount - newDiscount + newExtra + taxAmount;

  await prisma.booking.update({
    where: { id: input.bookingId },
    data: {
      discountAmount: newDiscount,
      extraCharges:   newExtra,
      totalAmount:    Math.max(0, newTotal),
    },
  });

  revalidatePath(`/bookings/${input.bookingId}`);
  revalidatePath("/bookings");
  return { success: true, newTotal: Math.max(0, newTotal) };
}
