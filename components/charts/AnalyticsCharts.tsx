"use client";

import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart,
  ReferenceLine,
} from "recharts";
import { cn, formatPKR } from "@/utils";
import { TrendingUp, TrendingDown, Users, Crown, Star, AlertTriangle, CheckCircle2, Lightbulb, Zap, Package } from "lucide-react";

// ─── Shared theme tokens ───────────────────────────────────────
const GOLD    = "#d4a843";
const GOLD2   = "#f0c96a";
const EMERALD = "#10b981";
const BLUE    = "#3b82f6";
const VIOLET  = "#8b5cf6";
const AMBER   = "#f59e0b";
const RED     = "#ef4444";
const SLATE   = "#64748b";
const CYAN    = "#06b6d4";

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--surface-elevated))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "12px",
  color: "hsl(var(--foreground))",
  fontSize: "12px",
};

const AXIS_TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };

function ChartCard({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card-luxury p-5", className)}>
      <div className="mb-4">
        <p className="text-sm font-bold text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ─── 1. Daily Revenue Pulse ────────────────────────────────────
interface DailyPulseData { day: number; thisMonth: number; lastMonth: number }
export function DailyRevenuePulseChart({ data }: { data: DailyPulseData[] }) {
  const fmt = (v: number) => `PKR ${Math.round(v / 1000)}k`;
  return (
    <ChartCard title="Daily Revenue Pulse" subtitle="This month vs last month — realized checkouts + POS">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fmt} width={52} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatPKR(v), ""]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="lastMonth" name="Last Month" stroke={SLATE} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="thisMonth" name="This Month" stroke={GOLD} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: GOLD }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 2. Occupancy Heatmap Calendar ────────────────────────────
interface HeatmapDay { date: string; label: string; rate: number; occupied: number; total: number }
export function OccupancyHeatmapCalendar({ data }: { data: HeatmapDay[] }) {
  const getColor = (rate: number) => {
    if (rate === 0)   return "bg-accent/40";
    if (rate <= 25)   return "bg-emerald-900/40";
    if (rate <= 50)   return "bg-emerald-700/50";
    if (rate <= 75)   return "bg-emerald-500/70";
    if (rate < 100)   return "bg-gold-500/70";
    return "bg-gold-500";
  };

  // Split into weeks of 7
  const weeks: HeatmapDay[][] = [];
  for (let i = 0; i < data.length; i += 7) weeks.push(data.slice(i, i + 7));

  return (
    <ChartCard title="Occupancy Heatmap" subtitle="Last 90 days — color intensity = % rooms occupied">
      <div className="space-y-1.5">
        {/* Day labels */}
        <div className="flex gap-1">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
            <div key={d} className="flex-1 text-center text-[9px] text-muted-foreground font-semibold">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                className={cn("flex-1 aspect-square rounded-sm transition-all cursor-default group relative", getColor(day.rate))}
                title={`${day.label}: ${day.rate}% (${day.occupied}/${day.total})`}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-popover border border-border rounded-lg text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 shadow-lg">
                  <span className="font-semibold text-foreground">{day.label}</span>
                  <span className="text-muted-foreground ml-1">{day.rate}% occ.</span>
                </div>
              </div>
            ))}
            {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, ei) => (
              <div key={`empty-${ei}`} className="flex-1 aspect-square" />
            ))}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-[10px] text-muted-foreground">0%</span>
          {[0, 25, 50, 75, 100].map((r) => (
            <div key={r} className={cn("w-4 h-3 rounded-sm", getColor(r === 0 ? 0 : r))} />
          ))}
          <span className="text-[10px] text-muted-foreground">100%</span>
        </div>
      </div>
    </ChartCard>
  );
}

// ─── 3. RevPAR by Room ────────────────────────────────────────
interface RevPARRoom { roomNumber: string; roomName: string; roomType: string; revPAR: number; occupancyPct: number; revenue: number }
export function RevPARByRoomChart({ data }: { data: RevPARRoom[] }) {
  const display = data.slice(0, 10);
  const fmt = (v: number) => `PKR ${Math.round(v / 1000)}k`;
  return (
    <ChartCard title="Revenue per Available Night (RevPAR)" subtitle="This month — higher = room earning its potential">
      <ResponsiveContainer width="100%" height={Math.max(200, display.length * 36)}>
        <BarChart data={display} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
          <XAxis type="number" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fmt} />
          <YAxis type="category" dataKey="roomNumber" tick={AXIS_TICK} tickLine={false} axisLine={false} width={36} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [name === "revPAR" ? formatPKR(v) : `${v}%`, name === "revPAR" ? "RevPAR" : "Occupancy"]} />
          <Bar dataKey="revPAR" name="RevPAR" fill={GOLD} radius={[0, 6, 6, 0]} />
          <Bar dataKey="occupancyPct" name="Occ %" fill={BLUE} radius={[0, 6, 6, 0]} opacity={0.6} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 4. Room Performance Matrix ────────────────────────────────
interface RoomPerf { roomNumber: string; roomName: string; roomType: string; totalRevenue: number; bookingCount: number; avgRate: number; revPAR6M: number; maintenanceCost: number; maintenanceCount: number }
export function RoomPerformanceMatrix({ data }: { data: RoomPerf[] }) {
  const maxRevenue = Math.max(...data.map((r) => r.totalRevenue), 1);
  return (
    <ChartCard title="Room Performance Matrix" subtitle="Last 6 months — all rooms ranked by total revenue">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border/50">
              <th className="text-left py-2 font-semibold">Room</th>
              <th className="text-right py-2 font-semibold">Revenue</th>
              <th className="text-right py-2 font-semibold hidden sm:table-cell">Bookings</th>
              <th className="text-right py-2 font-semibold hidden sm:table-cell">Avg Rate</th>
              <th className="text-right py-2 font-semibold hidden md:table-cell">RevPAR</th>
              <th className="text-right py-2 font-semibold hidden md:table-cell">Maint.</th>
              <th className="py-2 w-28 hidden lg:table-cell"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {data.map((r) => (
              <tr key={r.roomNumber} className="hover:bg-accent/20 transition-colors">
                <td className="py-2.5">
                  <p className="font-semibold text-foreground">Rm {r.roomNumber}</p>
                  <p className="text-muted-foreground text-[10px]">{r.roomName}</p>
                </td>
                <td className="text-right py-2.5 font-bold text-gold-400">{formatPKR(r.totalRevenue)}</td>
                <td className="text-right py-2.5 text-foreground hidden sm:table-cell">{r.bookingCount}</td>
                <td className="text-right py-2.5 text-muted-foreground hidden sm:table-cell">{formatPKR(r.avgRate)}</td>
                <td className="text-right py-2.5 text-muted-foreground hidden md:table-cell">{formatPKR(r.revPAR6M)}</td>
                <td className="text-right py-2.5 hidden md:table-cell">
                  <span className={r.maintenanceCount > 2 ? "text-red-400" : "text-muted-foreground"}>
                    {r.maintenanceCount}x
                  </span>
                </td>
                <td className="py-2.5 hidden lg:table-cell">
                  <div className="h-1.5 bg-accent rounded-full overflow-hidden w-full">
                    <div className="h-full bg-gold-gradient rounded-full" style={{ width: `${Math.round((r.totalRevenue / maxRevenue) * 100)}%` }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

// ─── 5. Weekday Occupancy ─────────────────────────────────────
interface WeekdayData { day: string; bookings: number; revenue: number }
export function WeekdayOccupancyChart({ data }: { data: WeekdayData[] }) {
  const fmt = (v: number) => `PKR ${Math.round(v / 1000)}k`;
  return (
    <ChartCard title="Bookings by Day of Week" subtitle="Last 90 days — which days drive the most check-ins">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left"  tick={AXIS_TICK} tickLine={false} axisLine={false} width={28} />
          <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fmt} width={52} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [name === "revenue" ? formatPKR(v) : v, name === "revenue" ? "Revenue" : "Bookings"]} />
          <Bar yAxisId="left" dataKey="bookings" name="bookings" fill={BLUE} radius={[6, 6, 0, 0]} opacity={0.8} />
          <Line yAxisId="right" type="monotone" dataKey="revenue" name="revenue" stroke={GOLD} strokeWidth={2} dot={{ r: 3, fill: GOLD }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 6. Booking Lead Time Distribution ────────────────────────
interface LeadData { label: string; count: number }
export function LeadTimeDistributionChart({ data }: { data: LeadData[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <ChartCard title="Booking Lead Time" subtitle="How far in advance guests book (last 90 days)">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} width={28} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v: number) => [`${v} bookings (${total > 0 ? Math.round((v / total) * 100) : 0}%)`, ""]}
          />
          <Bar dataKey="count" name="Bookings" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={i === 0 ? GOLD : i === 1 ? GOLD2 : BLUE} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-muted-foreground mt-2 text-center">{total} bookings analysed</p>
    </ChartCard>
  );
}

// ─── 7. Avg Length of Stay Trend ──────────────────────────────
interface StayData { label: string; avgNights: number; bookings: number }
export function AvgStayLengthChart({ data }: { data: StayData[] }) {
  return (
    <ChartCard title="Avg. Length of Stay" subtitle="Monthly trend — longer stays = more revenue per turnover">
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left"  tick={AXIS_TICK} tickLine={false} axisLine={false} width={28} domain={[0, "auto"]} />
          <YAxis yAxisId="right" orientation="right" tick={AXIS_TICK} tickLine={false} axisLine={false} width={28} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [name === "avgNights" ? `${v} nights` : v, name === "avgNights" ? "Avg Stay" : "Bookings"]} />
          <Bar yAxisId="right" dataKey="bookings" name="bookings" fill={BLUE} opacity={0.3} radius={[4, 4, 0, 0]} />
          <Line yAxisId="left" type="monotone" dataKey="avgNights" name="avgNights" stroke={GOLD} strokeWidth={2.5} dot={{ r: 4, fill: GOLD }} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 8. Expense Category Trend ────────────────────────────────
const CAT_COLORS: Record<string, string> = {
  ELECTRICITY: "#f59e0b", GAS: "#ef4444", STAFF_SALARY: "#8b5cf6",
  MAINTENANCE: "#06b6d4", INVENTORY_PURCHASE: "#3b82f6", MISCELLANEOUS: "#64748b",
};
const CAT_LABELS: Record<string, string> = {
  ELECTRICITY: "Electricity", GAS: "Gas", STAFF_SALARY: "Staff",
  MAINTENANCE: "Maintenance", INVENTORY_PURCHASE: "Inventory", MISCELLANEOUS: "Other",
};
export function ExpenseCategoryTrendChart({ data }: { data: Record<string, number | string>[] }) {
  const cats = Object.keys(CAT_COLORS);
  const fmt  = (v: number) => `PKR ${Math.round(v / 1000)}k`;
  return (
    <ChartCard title="Expense Category Trend" subtitle="6-month stacked breakdown — spot what's growing">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fmt} width={52} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [formatPKR(v), CAT_LABELS[name] ?? name]} />
          <Legend wrapperStyle={{ fontSize: 10 }} formatter={(v) => CAT_LABELS[v] ?? v} />
          {cats.map((cat) => (
            <Area key={cat} type="monotone" dataKey={cat} stackId="1" stroke={CAT_COLORS[cat]} fill={CAT_COLORS[cat]} fillOpacity={0.6} strokeWidth={1.5} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 9. P&L Waterfall ─────────────────────────────────────────
interface WaterfallBar { name: string; value: number; base: number; type: "income" | "expense" | "profit" }
export function PLWaterfallChart({ data }: { data: { bars: WaterfallBar[]; totalRevenue: number; netProfit: number } }) {
  const COLOR_MAP = { income: EMERALD, expense: RED, profit: GOLD };
  const fmt = (v: number) => `PKR ${Math.round(v / 1000)}k`;

  // Build recharts-compatible data: each bar = base (transparent) + visible value
  const chartData = data.bars.map((b) => ({
    name:    b.name,
    base:    b.type === "profit" ? 0 : b.base,
    value:   b.value,
    type:    b.type,
    fill:    COLOR_MAP[b.type],
  }));

  return (
    <ChartCard title="P&L Waterfall" subtitle="This month — revenue minus each expense category to net profit">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} angle={-35} textAnchor="end" interval={0} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fmt} width={52} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => name === "value" ? [formatPKR(v), ""] : [null, null]} />
          {/* Transparent base */}
          <Bar dataKey="base" stackId="a" fill="transparent" />
          {/* Visible bar with per-entry color */}
          <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-between text-xs mt-1">
        <span className="text-muted-foreground">Revenue: <span className="text-emerald-400 font-bold">{formatPKR(data.totalRevenue)}</span></span>
        <span className="text-muted-foreground">Net Profit: <span className={cn("font-bold", data.netProfit >= 0 ? "text-gold-400" : "text-red-400")}>{formatPKR(data.netProfit)}</span></span>
      </div>
    </ChartCard>
  );
}

// ─── 10. Guest Retention Funnel ────────────────────────────────
interface FunnelStage { stage: string; count: number; pct: number }
export function GuestRetentionFunnelChart({ data }: { data: FunnelStage[] }) {
  const COLORS = [BLUE, VIOLET, GOLD, EMERALD];
  return (
    <ChartCard title="Guest Retention Funnel" subtitle="How many first-time guests come back for more">
      <div className="space-y-3 py-2">
        {data.map((stage, i) => (
          <div key={stage.stage}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-foreground">{stage.stage}</span>
              <span className="text-muted-foreground">{stage.count.toLocaleString()} guests</span>
            </div>
            <div className="h-7 bg-accent/40 rounded-lg overflow-hidden relative">
              <div
                className="h-full rounded-lg flex items-center justify-end pr-3 transition-all"
                style={{ width: `${Math.max(stage.pct, 2)}%`, backgroundColor: COLORS[i] }}
              >
                <span className="text-[11px] font-bold text-white">{stage.pct}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        Retention rate: {data[0]?.count > 0 && data[1]?.count > 0 ? `${Math.round((data[1].count / data[0].count) * 100)}% of 1st-time guests return` : "—"}
      </p>
    </ChartCard>
  );
}

// ─── 11. Loyalty Stats Panel ───────────────────────────────────
interface LoyaltyData { tiers: Record<string, number>; totalCreditsIssued: number; nearMilestone: number }
const TIER_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  BRONZE: { label: "Bronze", color: "text-orange-400", icon: "🥉" },
  SILVER: { label: "Silver", color: "text-slate-300",  icon: "🥈" },
  GOLD:   { label: "Gold",   color: "text-gold-400",   icon: "🥇" },
  VIP:    { label: "VIP",    color: "text-purple-400",  icon: "👑" },
};
export function LoyaltyStatsPanel({ data }: { data: LoyaltyData }) {
  const total = Object.values(data.tiers).reduce((s, c) => s + c, 0);
  return (
    <ChartCard title="Loyalty Programme" subtitle="Credits, tiers, and guests near their free night">
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-gold-400 font-serif">{data.totalCreditsIssued}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Free Nights Earned</p>
        </div>
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-violet-400 font-serif">{data.nearMilestone}</p>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">Near Milestone</p>
        </div>
      </div>
      <div className="space-y-2">
        {Object.entries(TIER_CONFIG).map(([tier, cfg]) => {
          const count = data.tiers[tier] ?? 0;
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={tier} className="flex items-center gap-2">
              <span className="text-sm w-5">{cfg.icon}</span>
              <span className={cn("text-xs font-semibold w-12", cfg.color)}>{cfg.label}</span>
              <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
                <div className="h-full bg-current rounded-full" style={{ width: `${pct}%`, color: cfg.color.replace("text-", "bg-") }} />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
}

// ─── 12. Branch Scorecard ─────────────────────────────────────
interface BranchScore { branchId: string; branchName: string; revenue: number; lastRevenue: number; revGrowth: number | null; expenses: number; profit: number; margin: number; occupancyRate: number; totalRooms: number; bookings: number; avgStay: number; openComplaints: number }
export function BranchScorecardPanel({ data }: { data: BranchScore[] }) {
  const METRICS = [
    { label: "Revenue",     key: "revenue",       fmt: (v: number) => formatPKR(v),       color: "text-gold-400"    },
    { label: "Expenses",    key: "expenses",      fmt: (v: number) => formatPKR(v),       color: "text-red-400"     },
    { label: "Net Profit",  key: "profit",        fmt: (v: number) => formatPKR(v),       color: "text-emerald-400" },
    { label: "Margin",      key: "margin",        fmt: (v: number) => `${v}%`,            color: "text-blue-400"    },
    { label: "Occupancy",   key: "occupancyRate", fmt: (v: number) => `${v}%`,            color: "text-violet-400"  },
    { label: "Bookings",    key: "bookings",      fmt: (v: number) => v.toString(),       color: "text-foreground"  },
    { label: "Avg Stay",    key: "avgStay",       fmt: (v: number) => `${v} nights`,      color: "text-muted-foreground" },
    { label: "Complaints",  key: "openComplaints",fmt: (v: number) => v.toString(),       color: "text-amber-400"   },
  ] as const;

  return (
    <ChartCard title="Branch Scorecard" subtitle="This month — side-by-side performance comparison">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left py-2 text-xs font-semibold text-muted-foreground">Metric</th>
              {data.map((b) => (
                <th key={b.branchId} className="text-right py-2 text-xs font-semibold text-foreground">{b.branchName}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {METRICS.map(({ label, key, fmt, color }) => (
              <tr key={key} className="hover:bg-accent/10">
                <td className="py-2.5 text-xs text-muted-foreground">{label}</td>
                {data.map((b) => {
                  const val = b[key as keyof BranchScore] as number;
                  const best = Math.max(...data.map((d) => d[key as keyof BranchScore] as number));
                  return (
                    <td key={b.branchId} className={cn("py-2.5 text-right text-xs font-semibold", color, val === best && data.length > 1 ? "opacity-100" : "opacity-70")}>
                      {fmt(val)}
                      {val === best && data.length > 1 && <span className="ml-1 text-gold-400">★</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">★ = top performer this month</p>
    </ChartCard>
  );
}

// ─── 13. 30-Day Revenue Pipeline ──────────────────────────────
interface PipelineDay { date: string; confirmed: number; pending: number; bookings: number }
export function RevenuePipelineChart({ data }: { data: PipelineDay[] }) {
  const fmt = (v: number) => `PKR ${Math.round(v / 1000)}k`;
  return (
    <ChartCard title="30-Day Revenue Pipeline" subtitle="Upcoming confirmed + pending bookings by check-in date">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="date" tick={{ ...AXIS_TICK, fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
          <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={fmt} width={52} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [formatPKR(v), name === "confirmed" ? "Confirmed" : "Pending"]} />
          <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => v === "confirmed" ? "Confirmed" : "Pending"} />
          <Bar dataKey="confirmed" name="confirmed" stackId="a" fill={EMERALD} radius={[0, 0, 0, 0]} />
          <Bar dataKey="pending"   name="pending"   stackId="a" fill={AMBER}   radius={[4, 4, 0, 0]} opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ─── 14. AI Suggestions Panel ─────────────────────────────────
interface AISuggestion { type: "warning" | "opportunity" | "info" | "action"; icon: string; title: string; body: string; priority: number }
const SUGGESTION_STYLE: Record<string, { border: string; bg: string; icon: React.ElementType }> = {
  warning:     { border: "border-red-500/30",    bg: "bg-red-500/5",    icon: AlertTriangle  },
  opportunity: { border: "border-gold-500/30",   bg: "bg-gold-500/5",   icon: Lightbulb      },
  info:        { border: "border-emerald-500/30",bg: "bg-emerald-500/5",icon: TrendingUp      },
  action:      { border: "border-blue-500/30",   bg: "bg-blue-500/5",   icon: Zap            },
};
export function AISuggestionsPanel({ suggestions }: { suggestions: AISuggestion[] }) {
  if (suggestions.length === 0) {
    return (
      <ChartCard title="AI Suggestions" subtitle="Smart insights based on your data">
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
          <p className="text-sm font-semibold text-foreground">All systems looking good</p>
          <p className="text-xs mt-1">No action items at the moment.</p>
        </div>
      </ChartCard>
    );
  }
  return (
    <ChartCard title="AI Suggestions" subtitle="Smart insights based on your live data — act on these">
      <div className="space-y-3">
        {suggestions.map((s, i) => {
          const style = SUGGESTION_STYLE[s.type];
          const Icon  = style.icon;
          return (
            <div key={i} className={cn("flex gap-3 p-3 rounded-xl border", style.border, style.bg)}>
              <span className="text-lg flex-shrink-0 mt-0.5">{s.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.body}</p>
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
  return (
    <ChartCard title="Revenue Sources" subtitle="Room stays vs POS product sales">
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={140} height={140}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value" strokeWidth={0}>
              {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatPKR(v), ""]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-muted-foreground">{d.name}</span>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-foreground">{formatPKR(d.value)}</p>
                <p className="text-[10px] text-muted-foreground">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ChartCard>
  );
}
