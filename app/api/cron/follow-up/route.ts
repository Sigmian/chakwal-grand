// ============================================================
// Daily follow-up cron — runs at 9am PKT (4am UTC) every day
// Vercel calls this via vercel.json cron config.
//
// Handles 4 jobs per run:
//   1. Check-in reminders  — bookings checking in tomorrow
//   2. Checkout reminders  — bookings checking out today
//   3. Review requests     — bookings checked out yesterday
//   4. Win-back messages   — customers inactive 30+ days (weekly, Sundays only)
// ============================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import {
  sendCheckinReminder,
  sendCheckoutReminder,
  sendReviewRequest,
  sendWinback,
} from "@/lib/whatsapp/templates";
import { siteConfig } from "@/config/site";

// Vercel cron requests carry this header — reject anything else
function isAuthorized(req: Request): boolean {
  return req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-PK", {
    day: "numeric", month: "long", year: "numeric",
    timeZone: "Asia/Karachi",
  });
}

function startOfDayPKT(offsetDays: number): Date {
  const pkNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }),
  );
  pkNow.setDate(pkNow.getDate() + offsetDays);
  pkNow.setHours(0, 0, 0, 0);
  return pkNow;
}

function endOfDayPKT(offsetDays: number): Date {
  const d = startOfDayPKT(offsetDays);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    checkinReminders:  { sent: 0, failed: 0 },
    checkoutReminders: { sent: 0, failed: 0 },
    reviewRequests:    { sent: 0, failed: 0 },
    winbacks:          { sent: 0, failed: 0, skipped: false },
  };

  // ── 1. Check-in reminders (check-in = tomorrow) ───────────
  const tomorrowStart = startOfDayPKT(1);
  const tomorrowEnd   = endOfDayPKT(1);

  const checkingInTomorrow = await prisma.booking.findMany({
    where: {
      checkInDate: { gte: tomorrowStart, lte: tomorrowEnd },
      status:      { in: ["PENDING", "CONFIRMED"] },
    },
    include: {
      customer: { select: { name: true, phone: true } },
      branch:   { select: { address: true } },
    },
  });

  for (const b of checkingInTomorrow) {
    const res = await sendCheckinReminder({
      phone:      b.customer.phone,
      guestName:  b.customer.name,
      bookingRef: b.bookingRef,
      checkIn:    formatDate(b.checkInDate),
      address:    b.branch.address,
    });
    if (res.ok) results.checkinReminders.sent++;
    else {
      results.checkinReminders.failed++;
      console.error(`[Cron] Check-in reminder failed for ${b.bookingRef}:`, res.error);
    }
  }

  // ── 2. Checkout reminders (checkout = today) ──────────────
  const todayStart = startOfDayPKT(0);
  const todayEnd   = endOfDayPKT(0);

  const checkingOutToday = await prisma.booking.findMany({
    where: {
      checkOutDate: { gte: todayStart, lte: todayEnd },
      status:       { in: ["CONFIRMED", "CHECKED_IN"] },
    },
    include: {
      customer: { select: { name: true, phone: true } },
    },
  });

  for (const b of checkingOutToday) {
    const res = await sendCheckoutReminder({
      phone:      b.customer.phone,
      guestName:  b.customer.name,
      bookingRef: b.bookingRef,
    });
    if (res.ok) results.checkoutReminders.sent++;
    else {
      results.checkoutReminders.failed++;
      console.error(`[Cron] Checkout reminder failed for ${b.bookingRef}:`, res.error);
    }
  }

  // ── 3. Review requests (checked out yesterday) ────────────
  const yesterdayStart = startOfDayPKT(-1);
  const yesterdayEnd   = endOfDayPKT(-1);

  const checkedOutYesterday = await prisma.booking.findMany({
    where: {
      checkOutDate: { gte: yesterdayStart, lte: yesterdayEnd },
      status:       { in: ["CHECKED_OUT", "CONFIRMED"] },
    },
    include: {
      customer: { select: { name: true, phone: true } },
    },
  });

  const reviewUrl = siteConfig.social.googleReviewUrl;

  for (const b of checkedOutYesterday) {
    const res = await sendReviewRequest({
      phone:     b.customer.phone,
      guestName: b.customer.name,
      reviewUrl,
    });
    if (res.ok) results.reviewRequests.sent++;
    else {
      results.reviewRequests.failed++;
      console.error(`[Cron] Review request failed for ${b.bookingRef}:`, res.error);
    }
  }

  // ── 4. Win-back (Sundays only — weekly cadence) ───────────
  const pkNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }),
  );
  const isSunday = pkNow.getDay() === 0;

  if (isSunday) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find customers whose last booking ended 30+ days ago with no upcoming booking
    const inactiveCustomers = await prisma.customer.findMany({
      where: {
        lastVisitAt: { lte: thirtyDaysAgo },
        bookings: {
          none: {
            checkInDate: { gte: new Date() },
            status:      { in: ["PENDING", "CONFIRMED"] },
          },
        },
      },
      select: { name: true, phone: true },
      take: 50, // cap per run to avoid flooding
    });

    for (const c of inactiveCustomers) {
      const res = await sendWinback({
        phone:     c.phone,
        guestName: c.name,
      });
      if (res.ok) results.winbacks.sent++;
      else {
        results.winbacks.failed++;
        console.error(`[Cron] Win-back failed for ${c.phone}:`, res.error);
      }
    }
  } else {
    results.winbacks.skipped = true;
  }

  console.log("[Cron] follow-up run complete:", JSON.stringify(results));
  return NextResponse.json({ ok: true, results });
}
