// ============================================================
// app/(dashboard)/finance/revenue/page.tsx
// Revenue breakdown: bookings + POS sales, filterable by date range
// ============================================================

import { Suspense } from "react";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { PageHeader, SectionHeader, TableSkeleton } from "@/components/shared";
import { getRevenueChartData } from "@/server/actions/analytics";
import { RevenueAreaChart } from "@/components/charts/RevenueChart";
import { cn, formatPKR, formatDate } from "@/utils";
import prisma from "@/lib/db/prisma";
import { TrendingUp, BedDouble, ShoppingBag } from "lucide-react";
import { parseDateRange } from "@/lib/finance/reporting";
import { getCashRevenueForPeriod } from "@/lib/finance/reporting";
import { DateRangeFilter } from "@/features/finance/components/DateRangeFilter";

export const metadata = { title: "Revenue" };

interface PageProps {
  searchParams: { from?: string; to?: string };
}

export default async function RevenuePage({ searchParams }: PageProps) {
  const user     = await requirePermission("finance:read");
  const branchId = getScopedBranchId(user);

  const { start, end, label } = parseDateRange(searchParams.from, searchParams.to);
  const branchFilter = branchId ? { branchId } : { branch: { companyId: user.companyId } };

  const [periodRevenue, bookings] = await Promise.all([
    getCashRevenueForPeriod(start, end, branchId ?? undefined, user.companyId),
    prisma.booking.findMany({
      where: {
        ...branchFilter,
        paymentStatus: { not: "REFUNDED" },
        payments: { some: { createdAt: { gte: start, lte: end } } },
      },
      include: {
        customer: { select: { name: true } },
        room:     { select: { number: true, name: true } },
        branch:   { select: { name: true } },
        payments: {
          where:  { createdAt: { gte: start, lte: end } },
          select: { amount: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const bookingRevenue = periodRevenue.roomRevenue;
  const salesRevenue   = periodRevenue.productRevenue;
  const totalRevenue   = periodRevenue.totalRevenue;

  // Only show the monthly chart when viewing this month (no custom range)
  const isThisMonth = !searchParams.from && !searchParams.to;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Revenue"
        subtitle={`${label} — ${formatPKR(totalRevenue)} total`}
      />

      {/* Date range filter */}
      <Suspense fallback={<div className="card-luxury p-4 h-10 animate-pulse" />}>
        <div className="card-luxury p-4">
          <DateRangeFilter />
        </div>
      </Suspense>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Revenue",   value: formatPKR(totalRevenue),   icon: TrendingUp,  color: "text-gold-400",  bg: "bg-gold-500/15"  },
          { label: "Room Revenue",    value: formatPKR(bookingRevenue), icon: BedDouble,   color: "text-blue-400",  bg: "bg-blue-500/15"  },
          { label: "Product Revenue", value: formatPKR(salesRevenue),   icon: ShoppingBag, color: "text-green-400", bg: "bg-green-500/15" },
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

      {/* Monthly trend chart — only shown on This Month view */}
      {isThisMonth && (
        <div className="card-luxury p-6">
          <SectionHeader title="Current Month Collections" />
          <RevenueAreaChart data={await getRevenueChartData(branchId, 1)} />
        </div>
      )}

      {/* Payment rows for the period */}
      <div className="card-luxury overflow-hidden">
        <div className="p-5 border-b border-border">
          <SectionHeader title={`Bookings With Payments — ${label} (${bookings.length})`} />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th className="hidden sm:table-cell">Ref</th>
                <th className="hidden md:table-cell">Room</th>
                {!branchId && <th className="hidden lg:table-cell">Branch</th>}
                <th className="hidden sm:table-cell">Check-in</th>
                <th className="hidden md:table-cell">Nights</th>
                <th className="text-right">Paid</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const paid = b.payments.reduce((s, p) => s + Number(p.amount), 0);
                return (
                  <tr key={b.id}>
                    <td>
                      <p className="text-sm text-foreground">{b.customer.name}</p>
                      <p className="text-xs text-gold-400 font-mono sm:hidden">{b.bookingRef}</p>
                    </td>
                    <td className="hidden sm:table-cell"><span className="font-mono text-xs text-gold-400">{b.bookingRef}</span></td>
                    <td className="hidden md:table-cell"><span className="text-sm text-muted-foreground">{b.room.number} — {b.room.name}</span></td>
                    {!branchId && <td className="hidden lg:table-cell"><span className="text-sm text-muted-foreground">{b.branch.name}</span></td>}
                    <td className="hidden sm:table-cell"><span className="text-sm text-muted-foreground">{formatDate(b.checkInDate)}</span></td>
                    <td className="hidden md:table-cell"><span className="text-sm text-foreground">{b.nights}</span></td>
                    <td className="text-right"><span className="text-sm font-bold text-foreground whitespace-nowrap">{formatPKR(paid)}</span></td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted-foreground py-8">No payments received in this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
