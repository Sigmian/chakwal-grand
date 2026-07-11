"use client";

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart,
} from "recharts";
import { cn, formatPKR } from "@/utils";
import {
  AlertTriangle, CheckCircle2, Lightbulb, Zap, TrendingUp,
  BedDouble, DollarSign, Users, Flame, BarChart2, Star,
} from "lucide-react";

// ─── Design tokens ─────────────────────────────────────────────
const GOLD    = "#d4a843";
const GOLD2   = "#f0c96a";
const EMERALD = "#10b981";
const BLUE    = "#3b82f6";
const VIOLET  = "#8b5cf6";
const AMBER   = "#f59e0b";
const RED     = "#ef4444";
const SLATE   = "#64748b";

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(15,15,20,0.95)",
  border: "1px solid rgba(212,168,67,0.2)",
  borderRadius: "14px",
  color: "#f8f8f8",
  fontSize: "12px",
  padding: "10px 14px",
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};
const AXIS_TICK = { fill: "rgba(148,163,184,0.7)", fontSize: 11 };
const GRID      = "rgba(255,255,255,0.04)";

// ─── Shared ChartCard wrapper ──────────────────────────────────
interface ChartCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
}
function ChartCard({ title, subtitle, icon: Icon, iconColor = GOLD, children, className, badge }: ChartCardProps) {
  return (
    <div className={cn("card-luxury p-5 relative overflow-hidden", className)}>
      {/* Decorative top-right glow */}
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.03] blur-2xl pointer-events-none"
           style={{ background: iconColor }} />
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}30` }}>
              <Icon className="w-4 h-4" style={{ color: iconColor }} />
            </div>
          )}
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{subtitle}</p>}
          </div>
        </div>
        {badge && <div className="flex-shrink-0 ml-2">{badge}</div>}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ label = "No data yet for this period" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/50">
      <BarChart2 className="w-8 h-8 mb-2" />
      <p className="text-xs">{label}</p>
    </div>
  );
}

function StatBadge({ value, label, color = GOLD }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="text-center px-3 py-1.5 rounded-lg" style={{ background: `${color}10`, border: `1px solid ${color}25` }}>
      <p className="text-base font-bold" style={{ color }}>{value}</p>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">{label}</p>
    </div>
  );
}

// ─── 1. Daily Revenue Pulse ────────────────────────────────────
interface DailyPulseData { day: number; thisMonth: number; lastMonth: number }
export function DailyRevenuePulseChart({ data }: { data: DailyPulseData[] }) {
  const fmt = (v: number) => `${Math.round(v / 1000)}k`;
  const thisTotal  = data.reduce((s, d) => s + d.thisMonth,  0);
  const lastTotal  = data.reduce((s, d) => s + d.lastMonth,  0);
  const growth     = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : null;
  const isPositive = growth === null || growth >= 0;

  if (!data.length) return <ChartCard title="Daily Revenue Pulse" icon={TrendingUp}><EmptyState /></ChartCard>;

  return (
    <ChartCard
      title="Daily Revenue Pulse"
      subtitle="Day-by-day revenue this month vs last"
      icon={TrendingUp}
      badge={
        growth !== null ? (
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", isPositive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
            {isPositive ? "+" : ""}{growth}% MoM
          </span>
        ) : null
      }
    >
      <div className="flex gap-3 mb-4">
        <StatBadge value={`PKR ${Math.round(thisTotal / 1000)}k`} label="This Month" color={GOLD} />
        <StatBadge value={`PKR ${Math.round(lastTotal / 1000)}k`} label="Last Month" color={SLATE} />
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="pulseGold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={GOLD}  stopOpacity={0.25} />
              <stop offset="95%" stopColor={GOLD}  stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="pulseSlate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={SLATE} stopOpacity={0.12} />
              <stop offset="95%" stopColor={SLATE} stopOpacity={0}    />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fmt} width={40} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [formatPKR(v), name === "thisMonth" ? "This Month" : "Last Month"]} labelFormatter={(l) => `Day ${l}`} />
          <Area type="monotone" dataKey="lastMonth" name="lastMonth" stroke={SLATE} strokeWidth={1.5} strokeDasharray="4 4" fill="url(#pulseSlate)" dot={false} />
          <Area type="monotone" dataKey="thisMonth" name="thisMonth" stroke={GOLD}  strokeWidth={2.5} fill="url(#pulseGold)"  dot={false} activeDot={{ r: 5, fill: GOLD, strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 2. Occupancy Heatmap Calendar ────────────────────────────
interface HeatmapDay { date: string; label: string; rate: number; occupied: number; total: number }
const HEAT_LEVELS = [
  { min: 0,   max: 0,   bg: "rgba(255,255,255,0.04)", label: "0%" },
  { min: 1,   max: 25,  bg: "rgba(16,185,129,0.2)",   label: "1–25%" },
  { min: 26,  max: 50,  bg: "rgba(16,185,129,0.45)",  label: "26–50%" },
  { min: 51,  max: 75,  bg: "rgba(212,168,67,0.55)",  label: "51–75%" },
  { min: 76,  max: 100, bg: "rgba(212,168,67,0.9)",   label: "76–100%" },
];
function heatBg(rate: number) {
  const l = HEAT_LEVELS.find((x) => rate >= x.min && rate <= x.max);
  return l?.bg ?? HEAT_LEVELS[0].bg;
}

export function OccupancyHeatmapCalendar({ data }: { data: HeatmapDay[] }) {
  if (!data.length) return <ChartCard title="Occupancy Heatmap" icon={BedDouble}><EmptyState /></ChartCard>;

  // Pad first row so it aligns to Monday (weekday 0=Mon…6=Sun in our column headers)
  const firstDate = new Date(data[0].date);
  // getDay(): 0=Sun,1=Mon,…,6=Sat → convert to Mon=0
  const firstWeekday = (firstDate.getDay() + 6) % 7;
  const paddedNulls: (HeatmapDay | null)[] = Array(firstWeekday).fill(null);
  const allCells: (HeatmapDay | null)[] = [...paddedNulls, ...data];
  // Split into rows of 7
  const weeks: (HeatmapDay | null)[][] = [];
  for (let i = 0; i < allCells.length; i += 7) weeks.push(allCells.slice(i, i + 7));

  const avgRate = Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length);

  return (
    <ChartCard
      title="Occupancy Heatmap"
      subtitle="Last 90 days — hover a cell to inspect"
      icon={BedDouble}
      badge={<StatBadge value={`${avgRate}%`} label="Avg Occ." color={GOLD} />}
    >
      <div className="space-y-1">
        <div className="flex gap-1 mb-1">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
            <div key={d} className="flex-1 text-center text-[9px] text-muted-foreground/60 font-semibold tracking-wide">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1">
            {week.map((day, di) =>
              day === null ? (
                <div key={`pad-${di}`} className="flex-1 aspect-square" />
              ) : (
                <div
                  key={day.date}
                  className="flex-1 aspect-square rounded-[3px] cursor-default group relative transition-transform hover:scale-110 hover:z-10"
                  style={{ backgroundColor: heatBg(day.rate) }}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-xl text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-20 shadow-xl transition-opacity"
                       style={{ background: "rgba(10,10,15,0.95)", border: "1px solid rgba(212,168,67,0.2)" }}>
                    <p className="font-bold text-white">{day.label}</p>
                    <p className="text-amber-300 mt-0.5">{day.rate}% — {day.occupied}/{day.total} rooms</p>
                  </div>
                </div>
              )
            )}
            {/* Pad last week */}
            {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, ei) => (
              <div key={`end-${ei}`} className="flex-1 aspect-square" />
            ))}
          </div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-border/30">
        <span className="text-[9px] text-muted-foreground/60 font-semibold">Low</span>
        {HEAT_LEVELS.map((l) => (
          <div key={l.label} className="flex-1 h-2 rounded-sm transition-all" style={{ backgroundColor: l.bg }} title={l.label} />
        ))}
        <span className="text-[9px] text-muted-foreground/60 font-semibold">Full</span>
      </div>
    </ChartCard>
  );
}

// ─── 3. RevPAR by Room ────────────────────────────────────────
interface RevPARRoom { roomNumber: string; roomName: string; roomType: string; revPAR: number; occupancyPct: number; revenue: number }
export function RevPARByRoomChart({ data }: { data: RevPARRoom[] }) {
  if (!data.length) return <ChartCard title="RevPAR by Room" icon={DollarSign}><EmptyState /></ChartCard>;

  const display = data.slice(0, 10);
  const maxRevPAR = Math.max(...display.map((r) => r.revPAR), 1);

  return (
    <ChartCard title="RevPAR by Room" subtitle="Revenue per available night — this month" icon={DollarSign}>
      <div className="space-y-2.5">
        {display.map((r, i) => {
          const pct = Math.round((r.revPAR / maxRevPAR) * 100);
          return (
            <div key={r.roomNumber} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground/50 w-4">{i + 1}</span>
                  <span className="text-xs font-semibold text-foreground">Rm {r.roomNumber}</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">{r.roomName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">{r.occupancyPct}% occ.</span>
                  <span className="text-xs font-bold" style={{ color: GOLD }}>{formatPKR(r.revPAR)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-accent/40 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${GOLD}cc, ${GOLD2})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// ─── 4. Room Performance Matrix ────────────────────────────────
interface RoomPerf { roomNumber: string; roomName: string; roomType: string; totalRevenue: number; bookingCount: number; avgRate: number; revPAR6M: number; maintenanceCost: number; maintenanceCount: number }
export function RoomPerformanceMatrix({ data }: { data: RoomPerf[] }) {
  if (!data.length) return <ChartCard title="Room Performance Matrix" icon={BedDouble}><EmptyState /></ChartCard>;

  const maxRevenue = Math.max(...data.map((r) => r.totalRevenue), 1);

  return (
    <ChartCard title="Room Performance Matrix" subtitle="Last 6 months — ranked by total revenue" icon={BedDouble}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left pb-2.5 font-semibold text-muted-foreground/70">#</th>
              <th className="text-left pb-2.5 font-semibold text-muted-foreground/70">Room</th>
              <th className="text-right pb-2.5 font-semibold text-muted-foreground/70">Revenue</th>
              <th className="text-right pb-2.5 font-semibold text-muted-foreground/70 hidden sm:table-cell">Stays</th>
              <th className="text-right pb-2.5 font-semibold text-muted-foreground/70 hidden sm:table-cell">Avg/Night</th>
              <th className="text-right pb-2.5 font-semibold text-muted-foreground/70 hidden md:table-cell">Maint.</th>
              <th className="pb-2.5 w-24 hidden lg:table-cell"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {data.map((r, i) => {
              const pct = Math.round((r.totalRevenue / maxRevenue) * 100);
              const isTop = i === 0;
              return (
                <tr key={r.roomNumber} className="hover:bg-accent/10 transition-colors">
                  <td className="py-3 pr-2">
                    <span className={cn("text-xs font-bold", isTop ? "text-gold-400" : "text-muted-foreground/40")}>
                      {isTop ? "★" : i + 1}
                    </span>
                  </td>
                  <td className="py-3">
                    <p className="font-semibold text-foreground">Rm {r.roomNumber}</p>
                    <p className="text-muted-foreground text-[10px]">{r.roomName}</p>
                  </td>
                  <td className="text-right py-3 font-bold" style={{ color: GOLD }}>{formatPKR(r.totalRevenue)}</td>
                  <td className="text-right py-3 text-foreground hidden sm:table-cell">{r.bookingCount}</td>
                  <td className="text-right py-3 text-muted-foreground hidden sm:table-cell">{formatPKR(r.avgRate)}</td>
                  <td className="text-right py-3 hidden md:table-cell">
                    <span className={cn("font-semibold", r.maintenanceCount > 2 ? "text-red-400" : "text-muted-foreground/50")}>
                      {r.maintenanceCount}×
                    </span>
                  </td>
                  <td className="py-3 hidden lg:table-cell pl-4">
                    <div className="h-1.5 bg-accent/40 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD}99, ${GOLD2})` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

// ─── 5. Weekday Occupancy ─────────────────────────────────────
interface WeekdayData { day: string; bookings: number; revenue: number }
export function WeekdayOccupancyChart({ data }: { data: WeekdayData[] }) {
  const fmt = (v: number) => `${Math.round(v / 1000)}k`;
  if (!data.length) return <ChartCard title="Bookings by Day of Week" icon={BarChart2}><EmptyState /></ChartCard>;
  const bestDay = data.reduce((a, b) => a.bookings > b.bookings ? a : b, data[0]);

  return (
    <ChartCard
      title="Bookings by Day of Week"
      subtitle="Last 90 days — bars = bookings, line = revenue"
      icon={BarChart2}
      badge={<span className="text-[10px] font-bold text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded-full">Peak: {bestDay.day}</span>}
    >
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="wkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={BLUE} stopOpacity={0.9} />
              <stop offset="100%" stopColor={BLUE} stopOpacity={0.4} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left"  tick={AXIS_TICK} tickLine={false} axisLine={false} width={24} />
          <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fmt} width={44} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [name === "revenue" ? formatPKR(v) : v, name === "revenue" ? "Revenue" : "Bookings"]} />
          <Bar yAxisId="left" dataKey="bookings" name="bookings" fill="url(#wkGrad)" radius={[6, 6, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="revenue" name="revenue" stroke={GOLD} strokeWidth={2.5} dot={{ r: 3, fill: GOLD, strokeWidth: 0 }} activeDot={{ r: 5, fill: GOLD, strokeWidth: 0 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 6. Booking Lead Time Distribution ────────────────────────
interface LeadData { label: string; count: number }
const LEAD_PALETTE = [GOLD, GOLD2, BLUE, VIOLET, EMERALD, AMBER, SLATE];
export function LeadTimeDistributionChart({ data }: { data: LeadData[] }) {
  if (!data.length) return <ChartCard title="Booking Lead Time" icon={BarChart2}><EmptyState /></ChartCard>;
  const total = data.reduce((s, d) => s + d.count, 0);
  const peak  = data.reduce((a, b) => a.count > b.count ? a : b, data[0]);

  return (
    <ChartCard
      title="Booking Lead Time"
      subtitle="How far in advance guests book"
      icon={BarChart2}
      badge={<span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Most: {peak.label}</span>}
    >
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 9 }} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={24} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number) => [`${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`, "Bookings"]}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={LEAD_PALETTE[i % LEAD_PALETTE.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">{total} bookings analysed</p>
    </ChartCard>
  );
}

// ─── 7. Avg Length of Stay Trend ──────────────────────────────
interface StayData { label: string; avgNights: number; bookings: number }
export function AvgStayLengthChart({ data }: { data: StayData[] }) {
  if (!data.length) return <ChartCard title="Avg. Length of Stay" icon={BedDouble}><EmptyState /></ChartCard>;
  const latest = data[data.length - 1]?.avgNights ?? 0;

  return (
    <ChartCard
      title="Avg. Length of Stay"
      subtitle="Monthly trend — longer = more revenue per turnover"
      icon={BedDouble}
      badge={<StatBadge value={`${latest}n`} label="Latest" color={GOLD} />}
    >
      <ResponsiveContainer width="100%" height={190}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="stayGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={GOLD} stopOpacity={0.2} />
              <stop offset="100%" stopColor={GOLD} stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left"  tick={AXIS_TICK} tickLine={false} axisLine={false} width={24} domain={[0, "auto"]} />
          <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK} tickLine={false} axisLine={false} width={24} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [name === "avgNights" ? `${v} nights` : v, name === "avgNights" ? "Avg Stay" : "Bookings"]} />
          <Bar yAxisId="right" dataKey="bookings" name="bookings" fill={BLUE} opacity={0.2} radius={[4, 4, 0, 0]} />
          <Area yAxisId="left" type="monotone" dataKey="avgNights" name="avgNights" stroke={GOLD} strokeWidth={2.5} fill="url(#stayGrad)" dot={{ r: 4, fill: GOLD, strokeWidth: 0 }} activeDot={{ r: 6, fill: GOLD, strokeWidth: 0 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 8. Expense Category Trend ────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  ELECTRICITY:        "#f59e0b",
  GAS:                "#ef4444",
  STAFF_SALARY:       "#8b5cf6",
  MAINTENANCE:        "#06b6d4",
  INVENTORY_PURCHASE: "#3b82f6",
  MISCELLANEOUS:      "#64748b",
};
const CAT_LABELS: Record<string, string> = {
  ELECTRICITY:        "Electricity",
  GAS:                "Gas",
  STAFF_SALARY:       "Staff",
  MAINTENANCE:        "Maintenance",
  INVENTORY_PURCHASE: "Inventory",
  MISCELLANEOUS:      "Other",
};

export function ExpenseCategoryTrendChart({ data }: { data: Record<string, number | string>[] }) {
  if (!data.length) return <ChartCard title="Expense Trend" icon={DollarSign}><EmptyState /></ChartCard>;
  const cats = Object.keys(CAT_COLORS);
  const fmt  = (v: number) => `${Math.round(v / 1000)}k`;

  return (
    <ChartCard title="Expense Category Trend" subtitle="6-month stacked view — spot what's growing" icon={DollarSign}>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {cats.map((cat) => (
              <linearGradient key={cat} id={`grad_${cat}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={CAT_COLORS[cat]} stopOpacity={0.7} />
                <stop offset="95%" stopColor={CAT_COLORS[cat]} stopOpacity={0.3} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fmt} width={44} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [formatPKR(v), CAT_LABELS[name] ?? name]} />
          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} formatter={(v) => CAT_LABELS[v] ?? v} />
          {cats.map((cat) => (
            <Area key={cat} type="monotone" dataKey={cat} stackId="1"
              stroke={CAT_COLORS[cat]} fill={`url(#grad_${cat})`} strokeWidth={1.5} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 9. P&L Waterfall ─────────────────────────────────────────
interface WaterfallBar { name: string; value: number; base: number; type: "income" | "expense" | "profit" }
const TYPE_COLOR = { income: EMERALD, expense: RED, profit: GOLD } as const;

export function PLWaterfallChart({ data }: { data: { bars: WaterfallBar[]; totalRevenue: number; totalExpenses: number; netProfit: number } }) {
  const fmt = (v: number) => `${Math.round(v / 1000)}k`;
  const isProfit = data.netProfit >= 0;

  if (!data.bars.length) return <ChartCard title="P&L Waterfall" icon={DollarSign}><EmptyState /></ChartCard>;

  const chartData = data.bars.map((b) => ({
    name:  b.name,
    base:  b.type === "profit" ? 0 : b.base,
    value: b.value,
    fill:  TYPE_COLOR[b.type],
  }));

  return (
    <ChartCard
      title="P&L Waterfall"
      subtitle="This month — from total revenue down to net profit"
      icon={DollarSign}
    >
      <div className="flex gap-3 mb-4 flex-wrap">
        <StatBadge value={`PKR ${Math.round(data.totalRevenue / 1000)}k`} label="Revenue"  color={EMERALD} />
        <StatBadge value={`PKR ${Math.round(data.totalExpenses / 1000)}k`} label="Expenses" color={RED}     />
        <StatBadge value={`PKR ${Math.round(Math.abs(data.netProfit) / 1000)}k`} label={isProfit ? "Profit" : "Loss"} color={isProfit ? GOLD : RED} />
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 44 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fmt} width={44} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number, name: string) => name === "value" ? [formatPKR(v), "Amount"] : null}
          />
          <Bar dataKey="base"  stackId="a" fill="transparent" />
          <Bar dataKey="value" stackId="a" radius={[5, 5, 0, 0]}>
            {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.9} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 10. Guest Retention Funnel ────────────────────────────────
interface FunnelStage { stage: string; count: number; pct: number }
const FUNNEL_COLORS = [BLUE, VIOLET, GOLD, EMERALD];

export function GuestRetentionFunnelChart({ data }: { data: FunnelStage[] }) {
  if (!data.length) return <ChartCard title="Guest Retention Funnel" icon={Users}><EmptyState /></ChartCard>;
  const retentionRate = data[0]?.count > 0 && data[1]?.count > 0
    ? Math.round((data[1].count / data[0].count) * 100)
    : null;

  return (
    <ChartCard
      title="Guest Retention Funnel"
      subtitle="How many first-time guests return"
      icon={Users}
      badge={retentionRate !== null ? <StatBadge value={`${retentionRate}%`} label="Return Rate" color={EMERALD} /> : undefined}
    >
      <div className="space-y-3 py-1">
        {data.map((stage, i) => (
          <div key={stage.stage}>
            <div className="flex justify-between items-center mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: FUNNEL_COLORS[i] }} />
                <span className="text-xs font-semibold text-foreground">{stage.stage}</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground">{stage.count.toLocaleString()} guests</span>
            </div>
            <div className="h-8 bg-accent/30 rounded-xl overflow-hidden relative">
              <div
                className="h-full rounded-xl flex items-center justify-end pr-3 transition-all duration-700"
                style={{
                  width:      `${Math.max(stage.pct, 3)}%`,
                  background: `linear-gradient(90deg, ${FUNNEL_COLORS[i]}99, ${FUNNEL_COLORS[i]})`,
                }}
              >
                {stage.pct >= 8 && (
                  <span className="text-[11px] font-bold text-white drop-shadow">{stage.pct}%</span>
                )}
              </div>
              {stage.pct < 8 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-muted-foreground">{stage.pct}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

// ─── 11. Loyalty Stats Panel ───────────────────────────────────
interface LoyaltyData { tiers: Record<string, number>; totalCreditsIssued: number; nearMilestone: number }
const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  BRONZE: { label: "Bronze", color: "#f97316", bg: "rgba(249,115,22,0.1)",  icon: "🥉" },
  SILVER: { label: "Silver", color: "#94a3b8", bg: "rgba(148,163,184,0.1)", icon: "🥈" },
  GOLD:   { label: "Gold",   color: GOLD,      bg: "rgba(212,168,67,0.1)",  icon: "🥇" },
  VIP:    { label: "VIP",    color: VIOLET,    bg: "rgba(139,92,246,0.1)",  icon: "👑" },
};

export function LoyaltyStatsPanel({ data }: { data: LoyaltyData }) {
  const total = Object.values(data.tiers).reduce((s, c) => s + c, 0);

  return (
    <ChartCard title="Loyalty Programme" subtitle="Credits, tiers, and guests near a free night" icon={Star} iconColor={GOLD}>
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatBadge value={total}                   label="Members"       color={BLUE}    />
        <StatBadge value={data.totalCreditsIssued} label="Free Nights"   color={GOLD}    />
        <StatBadge value={data.nearMilestone}      label="Near Reward"   color={VIOLET}  />
      </div>
      <div className="space-y-3">
        {Object.entries(TIER_CONFIG).map(([tier, cfg]) => {
          const count = data.tiers[tier] ?? 0;
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={tier} className="flex items-center gap-3">
              <span className="text-base w-5 flex-shrink-0">{cfg.icon}</span>
              <span className="text-xs font-bold w-12 flex-shrink-0" style={{ color: cfg.color }}>{cfg.label}</span>
              <div className="flex-1 h-2 bg-accent/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: cfg.color }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-6 text-right flex-shrink-0">{count}</span>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// ─── 12. Branch Scorecard ─────────────────────────────────────
interface BranchScore {
  branchId: string; branchName: string; revenue: number; lastRevenue: number;
  revGrowth: number | null; expenses: number; profit: number; margin: number;
  occupancyRate: number; totalRooms: number; bookings: number; avgStay: number; openComplaints: number;
}
const SCORE_METRICS = [
  { label: "Revenue",    key: "revenue",       fmt: (v: number) => formatPKR(v),    color: GOLD,    higherIsBetter: true  },
  { label: "Expenses",   key: "expenses",      fmt: (v: number) => formatPKR(v),    color: RED,     higherIsBetter: false },
  { label: "Net Profit", key: "profit",        fmt: (v: number) => formatPKR(v),    color: EMERALD, higherIsBetter: true  },
  { label: "Margin",     key: "margin",        fmt: (v: number) => `${v}%`,         color: BLUE,    higherIsBetter: true  },
  { label: "Occupancy",  key: "occupancyRate", fmt: (v: number) => `${v}%`,         color: VIOLET,  higherIsBetter: true  },
  { label: "Bookings",   key: "bookings",      fmt: (v: number) => String(v),       color: "#94a3b8", higherIsBetter: true },
  { label: "Avg Stay",   key: "avgStay",       fmt: (v: number) => `${v} nts`,      color: "#94a3b8", higherIsBetter: true },
  { label: "Complaints", key: "openComplaints",fmt: (v: number) => String(v),       color: AMBER,   higherIsBetter: false },
] as const;

export function BranchScorecardPanel({ data }: { data: BranchScore[] }) {
  if (!data.length) return <ChartCard title="Branch Scorecard" icon={BarChart2}><EmptyState /></ChartCard>;

  return (
    <ChartCard title="Branch Scorecard" subtitle="This month — head-to-head comparison" icon={BarChart2}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left pb-3 font-semibold text-muted-foreground/70">Metric</th>
              {data.map((b) => (
                <th key={b.branchId} className="text-right pb-3 font-bold text-foreground">{b.branchName}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/15">
            {SCORE_METRICS.map(({ label, key, fmt, color, higherIsBetter }) => {
              const vals = data.map((b) => b[key as keyof BranchScore] as number);
              const best = higherIsBetter ? Math.max(...vals) : Math.min(...vals);
              return (
                <tr key={key} className="hover:bg-accent/10 transition-colors group">
                  <td className="py-2.5 text-muted-foreground/70">{label}</td>
                  {data.map((b, bi) => {
                    const val    = b[key as keyof BranchScore] as number;
                    const isBest = val === best && data.length > 1;
                    return (
                      <td key={b.branchId} className="py-2.5 text-right font-bold" style={{ color: isBest ? color : "rgba(148,163,184,0.6)" }}>
                        {fmt(val)}
                        {isBest && <span className="ml-1 text-gold-400">★</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground/50 mt-3">★ = top performer · For expenses & complaints, lower is better</p>
    </ChartCard>
  );
}

// ─── 13. 30-Day Revenue Pipeline ──────────────────────────────
interface PipelineDay { date: string; confirmed: number; pending: number; bookings: number }
export function RevenuePipelineChart({ data }: { data: PipelineDay[] }) {
  if (!data.length) return <ChartCard title="30-Day Revenue Pipeline" icon={TrendingUp}><EmptyState /></ChartCard>;
  const fmt = (v: number) => `${Math.round(v / 1000)}k`;
  const totalConfirmed = data.reduce((s, d) => s + d.confirmed, 0);
  const totalPending   = data.reduce((s, d) => s + d.pending,   0);

  return (
    <ChartCard
      title="30-Day Revenue Pipeline"
      subtitle="Upcoming bookings by check-in date"
      icon={TrendingUp}
    >
      <div className="flex gap-3 mb-4">
        <StatBadge value={`PKR ${Math.round(totalConfirmed / 1000)}k`} label="Confirmed" color={EMERALD} />
        <StatBadge value={`PKR ${Math.round(totalPending   / 1000)}k`} label="Pending"   color={AMBER}   />
        <StatBadge value={`PKR ${Math.round((totalConfirmed + totalPending) / 1000)}k`} label="Total" color={GOLD} />
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} />
          <XAxis dataKey="date" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fmt} width={44} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [formatPKR(v), name === "confirmed" ? "Confirmed" : "Pending"]} />
          <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => v === "confirmed" ? "Confirmed" : "Pending"} />
          <Bar dataKey="confirmed" name="confirmed" stackId="a" fill={EMERALD} fillOpacity={0.85} />
          <Bar dataKey="pending"   name="pending"   stackId="a" fill={AMBER}   fillOpacity={0.7}  radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 14. AI Suggestions Panel ─────────────────────────────────
interface AISuggestion { type: "warning" | "opportunity" | "info" | "action"; icon: string; title: string; body: string; priority: number }
const SUGGESTION_CONFIG: Record<AISuggestion["type"], { border: string; bg: string; accent: string; LucideIcon: React.ElementType }> = {
  warning:     { border: "rgba(239,68,68,0.25)",    bg: "rgba(239,68,68,0.05)",    accent: RED,     LucideIcon: AlertTriangle },
  opportunity: { border: "rgba(212,168,67,0.3)",    bg: "rgba(212,168,67,0.05)",   accent: GOLD,    LucideIcon: Lightbulb     },
  info:        { border: "rgba(16,185,129,0.25)",   bg: "rgba(16,185,129,0.05)",   accent: EMERALD, LucideIcon: TrendingUp    },
  action:      { border: "rgba(59,130,246,0.25)",   bg: "rgba(59,130,246,0.05)",   accent: BLUE,    LucideIcon: Zap           },
};

export function AISuggestionsPanel({ suggestions }: { suggestions: AISuggestion[] }) {
  if (!suggestions.length) {
    return (
      <ChartCard title="AI Suggestions" subtitle="Smart insights from your live data" icon={Flame} iconColor={GOLD}>
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <CheckCircle2 className="w-9 h-9 text-emerald-400" />
          <p className="text-sm font-bold text-foreground">All systems looking good</p>
          <p className="text-xs text-muted-foreground">No action items at the moment — keep it up!</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard
      title="AI Suggestions"
      subtitle="Smart insights from your live data — act on these"
      icon={Flame}
      iconColor={GOLD}
      badge={<span className="text-[10px] font-bold text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded-full">{suggestions.length} insights</span>}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {suggestions.map((s, i) => {
          const cfg = SUGGESTION_CONFIG[s.type];
          return (
            <div
              key={i}
              className="flex gap-3 p-3.5 rounded-xl transition-all hover:scale-[1.01]"
              style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}
            >
              <span className="text-xl flex-shrink-0 leading-none mt-0.5">{s.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground leading-tight">{s.title}</p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{s.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// ─── 15. Revenue Source Donut ─────────────────────────────────
interface RevenueSource { name: string; value: number; color: string }
export function RevenueSourceDonut({ data }: { data: RevenueSource[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <ChartCard title="Revenue Sources" icon={DollarSign}><EmptyState /></ChartCard>;

  return (
    <ChartCard title="Revenue Sources" subtitle="Room stays vs POS product sales — this month" icon={DollarSign}>
      <div className="flex items-center gap-6">
        {/* Fixed-size donut — NOT wrapped in ResponsiveContainer */}
        <div className="flex-shrink-0" style={{ width: 140, height: 140 }}>
          <PieChart width={140} height={140}>
            <defs>
              {data.map((d, i) => (
                <radialGradient key={i} id={`donutGrad${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%"   stopColor={d.color} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={d.color} stopOpacity={1}   />
                </radialGradient>
              ))}
            </defs>
            <Pie
              data={data}
              cx={70} cy={70}
              innerRadius={44} outerRadius={62}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((_, i) => <Cell key={i} fill={`url(#donutGrad${i})`} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatPKR(v), ""]} />
          </PieChart>
        </div>
        <div className="flex-1 space-y-3">
          {data.map((d, i) => (
            <div key={d.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-muted-foreground">{d.name}</span>
                </div>
                <span className="text-xs font-bold text-foreground">{formatPKR(d.value)}</span>
              </div>
              <div className="h-1.5 bg-accent/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${total > 0 ? Math.round((d.value / total) * 100) : 0}%`, backgroundColor: d.color }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5 text-right">
                {total > 0 ? Math.round((d.value / total) * 100) : 0}% of total
              </p>
            </div>
          ))}
          <div className="pt-1 border-t border-border/30">
            <p className="text-[10px] text-muted-foreground/60">Total: <span className="text-foreground font-bold">{formatPKR(total)}</span></p>
          </div>
        </div>
      </div>
    </ChartCard>
  );
}
