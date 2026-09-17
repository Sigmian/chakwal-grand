// ============================================================
// Daily morning report cron — runs at 8am PKT (3am UTC) every day
// Vercel calls this via vercel.json cron config.
//
// Gathers key stats from the DB and sends a WhatsApp summary
// to the owner via the Meta Graph API.
// ============================================================

import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { BookingStatus, RoomStatus } from "@/types";

import { isCronAuthorized } from "@/lib/cron-auth";
import { raiseOwnerAlert, flushOwnerAlerts } from "@/lib/alerts/owner-alert";

// ── PKT date helpers (mirrors follow-up/route.ts) ─────────────
// PKT = UTC+5. Calculate day boundaries in UTC that correspond to PKT midnight.
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

function startOfDayPKT(offsetDays: number): Date {
  const nowUtc      = Date.now();
  const pktMs       = nowUtc + PKT_OFFSET_MS;
  const pktMidnight = pktMs - (pktMs % 86_400_000) + offsetDays * 86_400_000;
  return new Date(pktMidnight - PKT_OFFSET_MS); // back to UTC
}

function endOfDayPKT(offsetDays: number): Date {
  return new Date(startOfDayPKT(offsetDays + 1).getTime() - 1);
}

// ── Readable date label for the report header (PKT timezone) ─────
function todayLabel(): string {
  return new Date().toLocaleDateString("en-PK", {
    day:      "numeric",
    month:    "long",
    year:     "numeric",
    timeZone: "Asia/Karachi",
  });
}

// ── Cron handler ─────────────────────────────────────────────
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStart     = startOfDayPKT(0);
  const todayEnd       = endOfDayPKT(0);
  const tomorrowStart  = startOfDayPKT(1);
  const tomorrowEnd    = endOfDayPKT(1);
  const yesterdayStart = startOfDayPKT(-1);
  const yesterdayEnd   = endOfDayPKT(-1);

  // ── 1. Today's check-ins ──────────────────────────────────
  const checkInsToday = await prisma.booking.findMany({
    where: {
      checkInDate: { gte: todayStart, lte: todayEnd },
      status:      { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
    },
    include: { customer: { select: { name: true } } },
  });

  // ── 2. Today's check-outs ─────────────────────────────────
  const checkOutsToday = await prisma.booking.findMany({
    where: {
      checkOutDate: { gte: todayStart, lte: todayEnd },
      status:       BookingStatus.CHECKED_IN,
    },
    include: { customer: { select: { name: true } } },
  });

  // ── 3. Tomorrow's expected arrivals ───────────────────────
  const arrivingTomorrow = await prisma.booking.count({
    where: {
      checkInDate: { gte: tomorrowStart, lte: tomorrowEnd },
      status:      { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
    },
  });

  // ── 4. Current occupancy ──────────────────────────────────
  const [occupiedRooms, totalRooms] = await Promise.all([
    prisma.room.count({ where: { status: RoomStatus.OCCUPIED, isActive: true } }),
    prisma.room.count({ where: { isActive: true } }),
  ]);

  // ── 5. Yesterday's collected payments ─────────────────────
  const yesterdayPayments = await prisma.payment.aggregate({
    where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
    _sum:  { amount: true },
  });
  const yesterdayCollection = Number(yesterdayPayments._sum.amount ?? 0);

  // ── 6. Pending bookings ───────────────────────────────────
  const pendingCount = await prisma.booking.count({
    where: { status: BookingStatus.PENDING },
  });

  // ── 7. Low stock items ────────────────────────────────────
  // Prisma can't compare two columns in a WHERE clause, so we use $queryRaw
  // (same limitation noted in server/actions/inventory.ts).
  const lowStockRows = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*)::int AS count
    FROM "InventoryItem"
    WHERE "currentStock" <= "minStockLevel"
  `;
  const lowStockCount = Number(lowStockRows[0]?.count ?? 0);

  // ── 8. Guests who checked out still owing money ───────────
  const unpaidCheckouts = await prisma.booking.findMany({
    where: {
      status:        BookingStatus.CHECKED_OUT,
      paymentStatus: { not: "REFUNDED" },
      paidAmount:    { lt: prisma.booking.fields.totalAmount },
    },
    select: { totalAmount: true, paidAmount: true, customer: { select: { name: true } } },
  });
  const owedRows  = unpaidCheckouts
    .map((b) => ({ name: b.customer.name, owed: Number(b.totalAmount) - Number(b.paidAmount) }))
    .filter((r) => r.owed > 0.009)
    .sort((a, b) => b.owed - a.owed);
  const owedTotal = owedRows.reduce((s, r) => s + r.owed, 0);

  // ── Build the WhatsApp message ────────────────────────────
  const checkInNames  = checkInsToday.map(b => b.customer.name);
  const checkOutNames = checkOutsToday.map(b => b.customer.name);
  const occupancyPct  = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const checkInLine = checkInsToday.length > 0
    ? `✅ Check-ins: ${checkInsToday.length} — ${checkInNames.join(", ")}`
    : "✅ No check-ins today";

  const checkOutLine = checkOutsToday.length > 0
    ? `🚪 Check-outs: ${checkOutsToday.length} — ${checkOutNames.join(", ")}`
    : "🚪 No check-outs today";

  const tomorrowLine = arrivingTomorrow > 0
    ? `${arrivingTomorrow} arrival${arrivingTomorrow === 1 ? "" : "s"} expected`
    : "No arrivals expected";

  const collectionLine = yesterdayCollection > 0
    ? `PKR ${yesterdayCollection.toLocaleString("en-PK")} received`
    : "No payments recorded";

  const alertLines: string[] = [];
  if (pendingCount  > 0) alertLines.push(`• ${pendingCount} booking${pendingCount   === 1 ? "" : "s"} awaiting confirmation`);
  if (owedRows.length > 0) {
    const top = owedRows.slice(0, 3).map((r) => `${r.name} (PKR ${Math.round(r.owed).toLocaleString("en-PK")})`).join(", ");
    alertLines.push(`• ${owedRows.length} checked-out guest${owedRows.length === 1 ? "" : "s"} still owe PKR ${Math.round(owedTotal).toLocaleString("en-PK")} — ${top}${owedRows.length > 3 ? " …" : ""}`);
  }
  if (lowStockCount > 0) alertLines.push(`• ${lowStockCount} item${lowStockCount === 1 ? "" : "s"} low on stock`);

  const parts: string[] = [
    `🌅 *CGH Morning Report — ${todayLabel()}*`,
    "",
    "📅 *Today*",
    checkInLine,
    checkOutLine,
    "",
    "🏨 *Occupancy*",
    `${occupiedRooms}/${totalRooms} rooms occupied (${occupancyPct}%)`,
    "",
    "💰 *Yesterday's Collection*",
    collectionLine,
    "",
    "📆 *Tomorrow*",
    tomorrowLine,
  ];

  if (alertLines.length > 0) {
    parts.push("", "⚠️ *Action Needed*", ...alertLines);
  }

  parts.push("", "_Sent by Zara — CGH Assistant_");

  const message = parts.join("\n");

  // ── Send ──────────────────────────────────────────────────
  // First retry anything still undelivered (e.g. an approved template may now
  // exist), then send today's report through the same tracked service. A
  // "200 OK" from Meta isn't delivery — the status webhook confirms it later.
  const flushed = await flushOwnerAlerts();
  const report = await raiseOwnerAlert({ kind: "DAILY_REPORT", message, href: "/dashboard" });
  const sent = report.status === "SENT";
  const sendError = sent ? null : "Not accepted by WhatsApp — see Settings → System Health";

  const stats = {
    checkIns:           checkInsToday.length,
    checkOuts:          checkOutsToday.length,
    arrivingTomorrow,
    occupiedRooms,
    totalRooms,
    occupancyPct,
    yesterdayCollection,
    pendingCount,
    lowStockCount,
  };

  // Housekeeping: prune WhatsApp message-dedup lock rows older than 2 days so
  // the SiteContent table doesn't grow unbounded (keys look like "wamid:<id>").
  const dedupCutoff = String(Date.now() - 3 * 24 * 60 * 60 * 1000);
  await Promise.all([
    prisma.siteContent.deleteMany({ where: { key: { startsWith: "wamid:" }, value: { lt: dedupCutoff } } }),
    prisma.siteContent.deleteMany({ where: { key: { startsWith: "rem:" },   value: { lt: dedupCutoff } } }),
  ]).catch((e) => console.error("[Cron] dedup cleanup failed:", e));

  console.log("[Cron] daily-report run complete:", JSON.stringify({ sent, retriedAlerts: flushed, ...stats }));

  return NextResponse.json({
    ok: true,
    sent,
    ...(sendError ? { error: sendError } : {}),
    stats,
  });
}
