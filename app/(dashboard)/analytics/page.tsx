import { Suspense } from "react";
import { SectionHeader } from "@/components/shared";
import {
  getDailyRevenuePulse,
  getOccupancyHeatmapData,
  getRevPARByRoom,
  getRoomPerformanceMatrix,
  getWeekdayOccupancy,
  getBookingLeadTimeDistribution,
  getAvgLengthOfStayTrend,
  getExpenseCategoryTrend,
  getPLWaterfall,
  getGuestRetentionFunnel,
  getLoyaltyStats,
  getBranchScorecard,
  getRevenuePipeline30Day,
  getAISuggestions,
  getRevenueChartData,
} from "@/server/actions/analytics";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user     = await requirePermission("analytics:branch");
  const branchId = getScopedBranchId(user) ?? undefined;
  const isAdmin  = user.role === "SUPER_ADMIN";

  const [
    pulse,
    heatmap,
    revPAR,
    roomMatrix,
    weekday,
    leadTime,
    avgStay,
    expenseTrend,
    plWaterfall,
    retention,
    loyalty,
    scorecard,
    pipeline,
    suggestions,
    revenueChart,
  ] = await Promise.all([
    getDailyRevenuePulse(branchId),
    getOccupancyHeatmapData(branchId),
    getRevPARByRoom(branchId),
    getRoomPerformanceMatrix(branchId),
    getWeekdayOccupancy(branchId),
    getBookingLeadTimeDistribution(branchId),
    getAvgLengthOfStayTrend(branchId),
    getExpenseCategoryTrend(branchId),
    getPLWaterfall(branchId),
    getGuestRetentionFunnel(branchId),
    getLoyaltyStats(branchId),
    isAdmin ? getBranchScorecard() : Promise.resolve(null),
    getRevenuePipeline30Day(branchId),
    getAISuggestions(branchId),
    getRevenueChartData(branchId),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Analytics"
        subtitle="Deep insights across revenue, occupancy, guests, and operations"
      />
      <AnalyticsDashboard
        pulse={pulse}
        heatmap={heatmap}
        revPAR={revPAR}
        roomMatrix={roomMatrix}
        weekday={weekday}
        leadTime={leadTime}
        avgStay={avgStay}
        expenseTrend={expenseTrend}
        plWaterfall={plWaterfall}
        retention={retention}
        loyalty={loyalty}
        scorecard={scorecard}
        pipeline={pipeline}
        suggestions={suggestions}
        revenueChart={revenueChart}
        isAdmin={isAdmin}
      />
    </div>
  );
}
