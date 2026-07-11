import prisma from "@/lib/db/prisma";

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface FinancePeriod {
  label: string;
  start: Date;
  end: Date;
}

/** Calendar-month boundaries for Asia/Karachi, returned as UTC instants. */
export function getPKTMonthPeriod(monthOffset = 0, from = new Date()): FinancePeriod {
  const pktNow = new Date(from.getTime() + PKT_OFFSET_MS);
  const monthAnchor = new Date(Date.UTC(pktNow.getUTCFullYear(), pktNow.getUTCMonth() + monthOffset, 1));
  const year = monthAnchor.getUTCFullYear();
  const month = monthAnchor.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1) - PKT_OFFSET_MS);
  const end = new Date(Date.UTC(year, month + 1, 1) - PKT_OFFSET_MS - 1);
  return { label: MONTH_LABELS[month], start, end };
}

export function getPKTMonthPeriods(months: number): FinancePeriod[] {
  const safeMonths = Math.min(12, Math.max(1, Math.trunc(months)));
  return Array.from({ length: safeMonths }, (_, index) =>
    getPKTMonthPeriod(index - safeMonths + 1)
  );
}

/**
 * Cash-basis revenue for a period.
 *
 * Booking payments are split proportionally between accommodation and attached
 * product sales. Walk-in POS sales are added directly to product revenue. This
 * preserves total cash collected without counting room-attached sales twice.
 */
export async function getCashRevenueForPeriod(
  start: Date,
  end: Date,
  branchId?: string,
) {
  const branchFilter = branchId ? { branchId } : {};

  const [payments, walkInSales] = await Promise.all([
    prisma.payment.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        booking: {
          ...branchFilter,
          paymentStatus: { not: "REFUNDED" },
        },
      },
      select: {
        amount: true,
        booking: {
          select: {
            totalAmount: true,
            // Future room charges must not rewrite an already closed period's
            // room/product allocation.
            salesAttached: {
              where: { createdAt: { lte: end } },
              select: { totalAmount: true },
            },
          },
        },
      },
    }),
    prisma.sale.aggregate({
      where: {
        ...branchFilter,
        type: "WALK_IN",
        createdAt: { gte: start, lte: end },
      },
      _sum: { totalAmount: true },
    }),
  ]);

  let roomRevenue = 0;
  let attachedProductRevenue = 0;

  for (const payment of payments) {
    const amount = Number(payment.amount);
    const bookingTotal = Number(payment.booking.totalAmount);
    const attachedTotal = payment.booking.salesAttached.reduce(
      (sum, sale) => sum + Number(sale.totalAmount),
      0,
    );
    const productShare = bookingTotal > 0
      ? Math.min(1, Math.max(0, attachedTotal / bookingTotal))
      : 0;
    attachedProductRevenue += amount * productShare;
    roomRevenue += amount * (1 - productShare);
  }

  const walkInProductRevenue = Number(walkInSales._sum.totalAmount ?? 0);
  const productRevenue = attachedProductRevenue + walkInProductRevenue;

  return {
    roomRevenue,
    productRevenue,
    attachedProductRevenue,
    walkInProductRevenue,
    totalRevenue: roomRevenue + productRevenue,
  };
}
