// ============================================================
// app/(dashboard)/staff/reports/page.tsx
// Monthly attendance & payroll reports + management insights.
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared";
import { getMonthlyAttendanceReport, getManagementInsights } from "@/server/actions/hr-reports";
import { ReportsView } from "@/features/hr/components/ReportsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Attendance Reports" };

export default async function ReportsPage() {
  await requirePermission("hr:manage");
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const [report, insights] = await Promise.all([
    getMonthlyAttendanceReport(month, year),
    getManagementInsights(),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Attendance Reports" subtitle="Monthly attendance, payroll and staff insights — export to share" />
      <ReportsView initialReport={report} insights={insights} month={month} year={year} />
    </div>
  );
}
