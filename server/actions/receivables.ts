"use server";

// ============================================================
// server/actions/receivables.ts
// Guests who have LEFT but still owe money. Revenue is cash-basis, so an
// unpaid balance after checkout is money the business is at real risk of
// never collecting — this list exists so it gets chased the same day.
// ============================================================

import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { BookingStatus, PaymentStatus } from "@/types";

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
const DAY_MS = 86_400_000;

export interface UnpaidCheckout {
  id: string;
  bookingRef: string;
  guestName: string;
  guestPhone: string;
  roomNumber: string;
  branchName: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  checkedOutAt: string | null;
  daysSince: number;
  /** Reason given when staff checked out with a balance, if any. */
  reason: string | null;
}

/** Latest "[Checked out owing … : reason]" note written by checkOutBooking. */
function extractReason(notes: string | null): string | null {
  if (!notes) return null;
  const matches = [...notes.matchAll(/\[Checked out owing [^\]]*?: ([^\]]+)\]/g)];
  return matches.length ? matches[matches.length - 1][1].trim() : null;
}

const pktDayIndex = (d: Date) => Math.floor((d.getTime() + PKT_OFFSET_MS) / DAY_MS);

export async function getUnpaidCheckouts(): Promise<{ rows: UnpaidCheckout[]; totalOwed: number }> {
  const user = await requirePermission("bookings:read");
  const scoped = getScopedBranchId(user);

  const bookings = await prisma.booking.findMany({
    where: {
      ...(scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } }),
      status: BookingStatus.CHECKED_OUT,
      paymentStatus: { not: PaymentStatus.REFUNDED },
      // Column-to-column comparison: paid less than the final bill.
      paidAmount: { lt: prisma.booking.fields.totalAmount },
    },
    orderBy: [{ actualCheckOut: "desc" }, { checkOutDate: "desc" }],
    take: 500,
    select: {
      id: true, bookingRef: true, totalAmount: true, paidAmount: true,
      actualCheckOut: true, checkOutDate: true, internalNotes: true,
      customer: { select: { name: true, phone: true } },
      room: { select: { number: true } },
      branch: { select: { name: true } },
    },
  });

  const today = pktDayIndex(new Date());
  const rows = bookings
    .map((b) => {
      const total = Number(b.totalAmount);
      const paid = Number(b.paidAmount);
      const left = b.actualCheckOut ?? b.checkOutDate;
      return {
        id: b.id,
        bookingRef: b.bookingRef,
        guestName: b.customer.name,
        guestPhone: b.customer.phone,
        roomNumber: b.room.number,
        branchName: b.branch.name,
        totalAmount: total,
        paidAmount: paid,
        balance: Math.round((total - paid) * 100) / 100,
        checkedOutAt: left ? left.toISOString() : null,
        daysSince: left ? Math.max(0, today - pktDayIndex(left)) : 0,
        reason: extractReason(b.internalNotes),
      };
    })
    .filter((r) => r.balance > 0.009);

  return { rows, totalOwed: Math.round(rows.reduce((s, r) => s + r.balance, 0) * 100) / 100 };
}
