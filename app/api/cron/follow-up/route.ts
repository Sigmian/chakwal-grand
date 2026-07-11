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
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed when secret is unset
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-PK", {
    day: "numeric", month: "long", year: "numeric",
    timeZone: "Asia/Karachi",
  });
}

// PKT = UTC+5. Calculate day boundaries in UTC that correspond to PKT midnight.
// e.g. PKT midnight = 19:00 UTC previous day
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

function startOfDayPKT(offsetDays: number): Date {
  const nowUtc = Date.now();
  const pktMs  = nowUtc + PKT_OFFSET_MS;
  const pktMidnight = pktMs - (pktMs % 86_400_000) + offsetDays * 86_400_000;
  return new Date(pktMidnight - PKT_OFFSET_MS); // back to UTC
}

function endOfDayPKT(offsetDays: number): Date {
  return new Date(startOfDayPKT(offsetDays + 1).getTime() - 1);
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
      status:       { in: ["CHECKED_OUT"] },
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

  // ── 4. Win-back — only when ?winback=1 (Sunday cron in vercel.json) ────
  const runWinback = new URL(req.url).searchParams.get("winback") === "1";
  if (runWinback) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find customers inactive 30+ days with no upcoming booking.
    // OR clause catches existing customers whose lastVisitAt was never set (null).
    const inactiveCustomers = await prisma.customer.findMany({
      where: {
        AND: [
          {
            OR: [
              { lastVisitAt: { lte: thirtyDaysAgo } },
              {
                lastVisitAt: null,
                bookings: {
                  some: {
                    checkOutDate: { lte: thirtyDaysAgo },
                    status:       "CHECKED_OUT",
                  },
                },
              },
            ],
          },
          {
            bookings: {
              none: {
                checkInDate: { gte: new Date() },
                status:      { in: ["PENDING", "CONFIRMED"] },
              },
            },
          },
        ],
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

  // Alert via console if any sends failed — visible in Vercel logs
  const totalFailed =
    results.checkinReminders.failed +
    results.checkoutReminders.failed +
    results.reviewRequests.failed +
    results.winbacks.failed;
  if (totalFailed > 0) {
    console.error(`[Cron] ⚠️ ${totalFailed} template send(s) failed — check errors above`);
  }

  return NextResponse.json({ ok: true, results });
}
