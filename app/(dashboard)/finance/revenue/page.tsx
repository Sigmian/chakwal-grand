// ============================================================
// app/(dashboard)/finance/revenue/page.tsx
// Revenue breakdown: bookings + POS sales, filterable by month
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { getScopedBranchId } from "@/lib/auth/session";
import { PageHeader, SectionHeader } from "@/components/shared";
import { getRevenueChartData } from "@/server/actions/analytics";
import { RevenueAreaChart } from "@/components/charts/RevenueChart";
import { cn, formatPKR, formatDate } from "@/utils";
import { BookingStatus } from "@/types";
import prisma from "@/lib/db/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { TrendingUp, BedDouble, ShoppingBag } from "lucide-react";

export const metadata = { title: "Revenue" };

export default async function RevenuePage() {
  const user     = await requirePermission("finance:read");
  const branchId = getScopedBranchId(user);

  const now        = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);
  const branchFilter = branchId ? { branchId } : {};

  const [chartData, bookings, sales] = await Promise.all([
    getRevenueChartData(branchId),
    prisma.booking.findMany({
      where: {
        ...branchFilter,
        status: { in: [BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN, BookingStatus.CONFIRMED] },
        checkInDate: { gte: monthStart, lte: monthEnd },
      },
      include: {
        customer: { select: { name: true } },
        room:     { select: { number: true, name: true } },
        branch:   { select: { name: true } },
      },
      orderBy: { checkInDate: "desc" },
    }),
    prisma.sale.findMany({
      where: {
        ...branchFilter,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
      include: {
        lineItems: {
          include: { inventoryItem: { include: { product: { select: { name: true } } } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const bookingRevenue = bookings.reduce((s, b) => s + Number(b.totalAmount), 0);
  const salesRevenue   = sales.reduce((s, sl) => s + Number(sl.totalAmount), 0);
  const totalRevenue   = bookingRevenue + salesRevenue;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Revenue"
        subtitle={`This month — ${formatPKR(totalRevenue)} total`}
      />

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue",   value: formatPKR(totalRevenue),   icon: TrendingUp,   color: "text-gold-400",  bg: "bg-gold-500/15"  },
          { label: "Room Revenue",    value: formatPKR(bookingRevenue), icon: BedDouble,    color: "text-blue-400",  bg: "bg-blue-500/15"  },
          { label: "Product Revenue", value: formatPKR(salesRevenue),   icon: ShoppingBag,  color: "text-green-400", bg: "bg-green-500/15" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card-luxury p-5 flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className={cn("text-xl font-bold font-serif mt-0.5", color)}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 6-month chart */}
      <div className="card-luxury p-6">
        <SectionHeader title="6-Month Revenue Trend" />
        <RevenueAreaChart data={chartData} />
      </div>

      {/* Booking revenue table */}
      <div className="card-luxury overflow-hidden">
        <div className="p-5 border-b border-border">
          <SectionHeader title={`Bookings This Month (${bookings.length})`} />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Guest</th>
                <th>Room</th>
                {!branchId && <th>Branch</th>}
                <th>Check-in</th>
                <th>Nights</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td><span className="font-mono text-xs text-gold-400">{b.bookingRef}</span></td>
                  <td><span className="text-sm text-foreground">{b.customer.name}</span></td>
                  <td><span className="text-sm text-muted-foreground">{b.room.number} — {b.room.name}</span></td>
                  {!branchId && <td><span className="text-sm text-muted-foreground">{b.branch.name}</span></td>}
                  <td><span className="text-sm text-muted-foreground">{formatDate(b.checkInDate)}</span></td>
                  <td><span className="text-sm text-foreground">{b.nights}</span></td>
                  <td className="text-right"><span className="text-sm font-bold text-foreground">{formatPKR(Number(b.totalAmount))}</span></td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted-foreground py-8">No bookings this month</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
