// ============================================================
// app/(dashboard)/dashboard/page.tsx
// Main dashboard — KPI cards, charts, today's schedule,
// activity feed, top rooms. Server Component with parallel fetches.
// ============================================================

import Link from "next/link";
import {
  BedDouble, DollarSign, CalendarCheck, TrendingUp,
  AlertTriangle, ArrowRight, Clock, UserCheck, UserMinus,
  Building2, Package, Lightbulb, CheckCircle2, Info, Tag,
} from "lucide-react";
import { requireAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import {
  getDashboardOverview,
  getRevenueChartData,
  getBranchPerformance,
  getTopRooms,
  getRecentActivity,
  getTodaySchedule,
} from "@/server/actions/analytics";
import {
  StatCard, SectionHeader, Badge, ProgressBar,
} from "@/components/shared";
import { RevenueAreaChart, RoomStatusPie, BranchComparisonChart } from "@/components/charts/RevenueChart";
import {
  cn, formatPKR, formatPKRShort, formatTime,
  BOOKING_STATUS_CONFIG, ROOM_STATUS_CONFIG,
} from "@/utils";
import { UserRole, RoomStatus } from "@/types";

export const metadata = { title: "Dashboard" };

// Greeting based on time of day
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const user   = await requireAuth();
  const isSA   = user.role === UserRole.SUPER_ADMIN;
  const canViewAnalytics = hasPermission(user.role, "analytics:branch");
  const canViewBookings  = hasPermission(user.role, "bookings:read");
  const canViewRooms     = hasPermission(user.role, "rooms:read");

  // Fetch data based on what the role can see
  const [overview, chartData, topRooms, activity, schedule] = await Promise.all([
    canViewAnalytics ? getDashboardOverview(user.branchId)    : Promise.resolve(null),
    canViewAnalytics ? getRevenueChartData(user.branchId)     : Promise.resolve([]),
    canViewRooms     ? getTopRooms(user.branchId, 5)          : Promise.resolve([]),
    canViewAnalytics ? getRecentActivity(10)                  : Promise.resolve([]),
    canViewBookings  ? getTodaySchedule(user.branchId)        : Promise.resolve({ checkIns: [], checkOuts: [] }),
  ]);

  // Branch comparison only for super admin
  const branchPerf = isSA ? await getBranchPerformance() : [];

  const roomStatusData = overview ? [
    { name: "Available",   value: overview.availableRooms,    color: "#4CAF8C" },
    { name: "Occupied",    value: overview.occupiedRooms,     color: "#E05252" },
    { name: "Cleaning",    value: overview.cleaningRooms,     color: "#818CF8" },
    { name: "Maintenance", value: overview.maintenanceRooms,  color: "#F59E0B" },
  ].filter((d) => d.value > 0) : [];

  // ── Smart insights: turn the raw numbers into a few actionable highlights ──
  type Insight = { tone: "positive" | "warning" | "info"; text: string; href?: string };
  const insights: Insight[] = [];
  if (overview) {
    if (overview.revenueTrend !== null && overview.revenueTrend > 0)
      insights.push({ tone: "positive", text: `Revenue is up ${overview.revenueTrend}% vs last month — momentum is building.`, href: "/finance/revenue" });
    if (overview.revenueTrend !== null && overview.revenueTrend < 0)
      insights.push({ tone: "warning", text: `Revenue is down ${Math.abs(overview.revenueTrend)}% vs last month — consider a weekend or weekly-stay promotion.`, href: "/offers" });
    if (overview.profitThisMonth < 0)
      insights.push({ tone: "warning", text: `Expenses are exceeding revenue this month — review costs in Finance.`, href: "/finance" });
    if (overview.pendingBookings > 0)
      insights.push({ tone: "warning", text: `${overview.pendingBookings} booking${overview.pendingBookings > 1 ? "s are" : " is"} awaiting confirmation.`, href: "/bookings" });
    if (overview.occupancyRate >= 80)
      insights.push({ tone: "positive", text: `Strong ${overview.occupancyRate}% occupancy — only ${overview.availableRooms} room${overview.availableRooms !== 1 ? "s" : ""} left tonight.` });
    else if (overview.occupancyRate < 40 && overview.totalRooms > 0)
      insights.push({ tone: "info", text: `Occupancy is ${overview.occupancyRate}% — ${overview.availableRooms} rooms free. A short-stay offer could lift bookings.`, href: "/offers" });
    if (overview.lowStockAlerts > 0)
      insights.push({ tone: "warning", text: `${overview.lowStockAlerts} inventory item${overview.lowStockAlerts > 1 ? "s are" : " is"} running low on stock.`, href: "/inventory/products" });
  }
  const topInsights = insights.slice(0, 4);

  const INSIGHT_STYLE = {
    positive: { Icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    warning:  { Icon: AlertTriangle, color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
    info:     { Icon: Info,          color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
  } as const;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Greeting ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">
            {getGreeting()},{" "}
            <span className="text-gold-gradient">{user.name.split(" ")[0]}</span> 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Low stock alert */}
        {overview && overview.lowStockAlerts > 0 && (
          <Link
            href="/inventory/products"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-sm text-amber-400 hover:bg-amber-500/20 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            {overview.lowStockAlerts} low stock alert{overview.lowStockAlerts !== 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* ── KPI Cards (analytics roles only) ── */}
      {canViewAnalytics && overview && (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Collected This Month"
          value={formatPKRShort(overview.revenueThisMonth)}
          subtitle={`Profit: ${formatPKRShort(overview.profitThisMonth)}`}
          icon={<DollarSign className="w-5 h-5 text-gold-400" />}
          iconBg="bg-gold-500/15"
          trend={overview.revenueTrend !== null ? { value: overview.revenueTrend, label: "vs last month" } : undefined}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${overview.occupancyRate}%`}
          subtitle={`${overview.occupiedRooms}/${overview.totalRooms} rooms`}
          icon={<BedDouble className="w-5 h-5 text-blue-400" />}
          iconBg="bg-blue-500/15"
        />
        <StatCard
          title="Today's Activity"
          value={`${overview.bookingsToday}`}
          subtitle={`${overview.checkInsToday} in · ${overview.checkOutsToday} out`}
          icon={<CalendarCheck className="w-5 h-5 text-green-400" />}
          iconBg="bg-green-500/15"
        />
        <StatCard
          title="Discounts Given"
          value={formatPKRShort(overview.totalDiscountThisMonth)}
          subtitle={overview.pendingBookings > 0 ? `${overview.pendingBookings} pending confirmation` : "This month"}
          icon={<Tag className="w-5 h-5 text-purple-400" />}
          iconBg="bg-purple-500/15"
        />
      </div>
      )}

      {/* ── Smart Insights (analytics roles only) ── */}
      {canViewAnalytics && topInsights.length > 0 && (
      <div className="card-luxury p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gold-500/15 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-gold-400" />
          </div>
          <h2 className="font-bold text-foreground">Insights &amp; Recommendations</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topInsights.map((ins, i) => {
            const { Icon, color, bg } = INSIGHT_STYLE[ins.tone];
            const body = (
              <div className={cn("flex items-start gap-3 p-3.5 rounded-xl border h-full transition-colors", bg, ins.href && "hover:brightness-125")}>
                <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", color)} />
                <p className="text-sm text-foreground leading-relaxed">{ins.text}</p>
                {ins.href && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-0.5 ml-auto" />}
              </div>
            );
            return ins.href
              ? <Link key={i} href={ins.href}>{body}</Link>
              : <div key={i}>{body}</div>;
          })}
        </div>
      </div>
      )}

      {/* ── Charts row (analytics roles only) ── */}
      {canViewAnalytics && overview && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue area chart */}
        <div className="lg:col-span-2 card-luxury p-6">
          <SectionHeader
            title="Revenue — Last 6 Months"
            actions={
              <Link href="/finance/revenue" className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                Details <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <RevenueAreaChart data={chartData as any[]} />
        </div>

        {/* Room status donut */}
        <div className="card-luxury p-6">
          <SectionHeader title="Room Status" />
          {roomStatusData.length > 0 ? (
            <RoomStatusPie data={roomStatusData} />
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              No room data
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-2">
            {[
              { label: "Available",  value: overview.availableRooms,   color: "text-emerald-400" },
              { label: "Occupied",   value: overview.occupiedRooms,    color: "text-red-400"     },
              { label: "Cleaning",   value: overview.cleaningRooms,    color: "text-violet-400"  },
              { label: "Maintenance",value: overview.maintenanceRooms, color: "text-amber-400"   },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-2 bg-surface-highlight rounded-lg">
                <p className={cn("text-lg font-bold font-serif", color)}>{value}</p>
                <p className="text-2xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* ── Today's Schedule + Top Rooms ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's schedule */}
        <div className="card-luxury p-6">
          <SectionHeader
            title="Today's Schedule"
            subtitle={`${schedule.checkIns.length} arrivals · ${schedule.checkOuts.length} departures`}
            actions={
              <Link href="/bookings" className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />

          {schedule.checkIns.length === 0 && schedule.checkOuts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No arrivals or departures today</p>
          ) : (
            <div className="space-y-2.5">
              {schedule.checkIns.slice(0, 4).map((booking: any) => (
                <div key={booking.id} className="flex items-center gap-3 p-3 bg-green-500/5 border border-green-500/15 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{booking.customer.name}</p>
                    <p className="text-xs text-muted-foreground">Room {booking.room.number} · Check-in</p>
                  </div>
                  <Badge variant="green">Arriving</Badge>
                </div>
              ))}
              {schedule.checkOuts.slice(0, 4).map((booking: any) => (
                <div key={booking.id} className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <UserMinus className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{booking.customer.name}</p>
                    <p className="text-xs text-muted-foreground">Room {booking.room.number} · Check-out</p>
                  </div>
                  <Badge variant="red">Departing</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top performing rooms */}
        <div className="card-luxury p-6">
          <SectionHeader
            title="Top Rooms This Month"
            actions={
              <Link href="/dashboard/rooms" className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                All rooms <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          {topRooms.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No booking data this month</p>
          ) : (
            <div className="space-y-3">
              {topRooms.map((room, idx) => {
                const maxRev = topRooms[0]?.totalRevenue ?? 1;
                return (
                  <div key={room.roomId} className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                      idx === 0 ? "bg-gold-gradient text-background" : "bg-accent text-muted-foreground"
                    )}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {room.roomNumber} — {room.roomName}
                        </span>
                        <span className="text-sm font-bold text-gold-400 flex-shrink-0 ml-2">
                          {formatPKRShort(room.totalRevenue)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold-gradient rounded-full"
                          style={{ width: `${(room.totalRevenue / maxRev) * 100}%` }}
                        />
                      </div>
                      <p className="text-2xs text-muted-foreground mt-1">{room.bookingsCount} bookings</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Branch comparison (Super Admin only) ── */}
      {isSA && branchPerf.length > 0 && (
        <div className="card-luxury p-6">
          <SectionHeader
            title="Branch Performance"
            subtitle="This month comparison"
            actions={
              <Link href="/branches" className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                Manage branches <ArrowRight className="w-3 h-3" />
              </Link>
            }
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <BranchComparisonChart data={branchPerf} />
            <div className="space-y-3">
              {branchPerf.map((branch) => (
                <div key={branch.branchId} className="flex items-center gap-4 p-3 bg-surface-highlight rounded-xl">
                  <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center text-background text-xs font-bold flex-shrink-0">
                    {branch.branchName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{branch.branchName}</p>
                    <p className="text-xs text-muted-foreground">{branch.occupancyRate}% occupied · {branch.bookingsCount} bookings</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gold-400">{formatPKRShort(branch.revenue)}</p>
                    <p className={cn("text-xs font-semibold", branch.profit >= 0 ? "text-green-400" : "text-red-400")}>
                      {branch.profit >= 0 ? "+" : ""}{formatPKRShort(branch.profit)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Recent Activity (analytics roles only) ── */}
      {canViewAnalytics && (
      <div className="card-luxury p-6">
        <SectionHeader title="Recent Activity" />
        {(activity as any[]).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {(activity as any[]).map((log) => (
              <div key={log.id} className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-0">
                <div className="w-7 h-7 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-gold-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{log.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {log.user?.name ?? "System"} · {formatTime(log.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
