"use client";

import {
  DailyRevenuePulseChart,
  OccupancyHeatmapCalendar,
  RevPARByRoomChart,
  RoomPerformanceMatrix,
  WeekdayOccupancyChart,
  LeadTimeDistributionChart,
  AvgStayLengthChart,
  ExpenseCategoryTrendChart,
  PLWaterfallChart,
  GuestRetentionFunnelChart,
  LoyaltyStatsPanel,
  BranchScorecardPanel,
  RevenuePipelineChart,
  AISuggestionsPanel,
  RevenueSourceDonut,
} from "@/components/charts/AnalyticsCharts";
import { formatPKR } from "@/utils";

// ─── Type aliases matching server action return types ──────────────────────
type PulseData      = { day: number; thisMonth: number; lastMonth: number }[];
type HeatmapData    = { date: string; label: string; rate: number; occupied: number; total: number }[];
type RevPARData     = { roomNumber: string; roomName: string; roomType: string; revPAR: number; occupancyPct: number; revenue: number }[];
type RoomMatrix     = { roomNumber: string; roomName: string; roomType: string; totalRevenue: number; bookingCount: number; avgRate: number; revPAR6M: number; maintenanceCost: number; maintenanceCount: number }[];
type WeekdayData    = { day: string; bookings: number; revenue: number }[];
type LeadData       = { label: string; count: number }[];
type StayData       = { label: string; avgNights: number; bookings: number }[];
type ExpenseData    = Record<string, number | string>[];
type PLData         = { bars: { name: string; value: number; base: number; type: "income" | "expense" | "profit" }[]; totalRevenue: number; totalExpenses: number; netProfit: number };
type RetentionData  = { stage: string; count: number; pct: number }[];
type LoyaltyData    = { tiers: Record<string, number>; totalCreditsIssued: number; nearMilestone: number };
type ScorecardData  = { branchId: string; branchName: string; revenue: number; lastRevenue: number; revGrowth: number | null; expenses: number; profit: number; margin: number; occupancyRate: number; totalRooms: number; bookings: number; avgStay: number; openComplaints: number }[];
type PipelineData   = { date: string; confirmed: number; pending: number; bookings: number; total: number }[];
type SuggestionData = { type: "warning" | "opportunity" | "info" | "action"; icon: string; title: string; body: string; priority: number }[];
type RevenueData    = { label: string; roomRevenue: number; productRevenue: number; expenses: number; profit: number }[];

interface Props {
  pulse:        PulseData;
  heatmap:      HeatmapData;
  revPAR:       RevPARData;
  roomMatrix:   RoomMatrix;
  weekday:      WeekdayData;
  leadTime:     LeadData;
  avgStay:      StayData;
  expenseTrend: ExpenseData;
  plWaterfall:  PLData;
  retention:    RetentionData;
  loyalty:      LoyaltyData;
  scorecard:    ScorecardData | null;
  pipeline:     PipelineData;
  suggestions:  SuggestionData;
  revenueChart: RevenueData;
  isAdmin:      boolean;
}

export function AnalyticsDashboard({
  pulse, heatmap, revPAR, roomMatrix, weekday, leadTime, avgStay,
  expenseTrend, plWaterfall, retention, loyalty, scorecard, pipeline,
  suggestions, revenueChart, isAdmin,
}: Props) {
  // Build revenue source data from most recent month
  const lastMonth = revenueChart[revenueChart.length - 1];
  const revenueSourceData = lastMonth ? [
    { name: "Room Revenue",   value: lastMonth.roomRevenue,    color: "#d4a843" },
    { name: "Product Sales",  value: lastMonth.productRevenue, color: "#3b82f6" },
  ] : [];

  return (
    <div className="space-y-8 stagger-children">
      {/* ── AI Suggestions (top priority) ── */}
      <AISuggestionsPanel suggestions={suggestions} />

      {/* ── Revenue Overview ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Revenue</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <DailyRevenuePulseChart data={pulse} />
          <RevenueSourceDonut data={revenueSourceData} />
        </div>
        <div className="mt-4">
          <PLWaterfallChart data={plWaterfall} />
        </div>
      </section>

      {/* ── 30-Day Pipeline ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Upcoming Revenue Pipeline</h2>
        <RevenuePipelineChart data={pipeline} />
      </section>

      {/* ── Occupancy ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Occupancy</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <OccupancyHeatmapCalendar data={heatmap} />
          <WeekdayOccupancyChart data={weekday} />
        </div>
      </section>

      {/* ── Room Performance ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Room Performance</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <RevPARByRoomChart data={revPAR} />
          <AvgStayLengthChart data={avgStay} />
        </div>
        <div className="mt-4">
          <RoomPerformanceMatrix data={roomMatrix} />
        </div>
      </section>

      {/* ── Guest Intelligence ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Guest Intelligence</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <GuestRetentionFunnelChart data={retention} />
          <LeadTimeDistributionChart data={leadTime} />
        </div>
        <div className="mt-4">
          <LoyaltyStatsPanel data={loyalty} />
        </div>
      </section>

      {/* ── Expenses ── */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Expenses</h2>
        <ExpenseCategoryTrendChart data={expenseTrend} />
      </section>

      {/* ── Branch Scorecard (Super Admin only) ── */}
      {isAdmin && scorecard && scorecard.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Branch Comparison</h2>
          <BranchScorecardPanel data={scorecard} />
        </section>
      )}
    </div>
  );
}
