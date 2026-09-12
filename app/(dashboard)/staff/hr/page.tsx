// ============================================================
// app/(dashboard)/staff/hr/page.tsx
// Admin HR configuration — rules, shifts, shift assignment.
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared";
import { getHrSettings, listShifts, getShiftAssignments } from "@/server/actions/hr-admin";
import { HrAdminView } from "@/features/hr/components/HrAdminView";

export const dynamic = "force-dynamic";
export const metadata = { title: "HR Settings" };

export default async function HrSettingsPage() {
  await requirePermission("hr:manage");

  const [settings, shifts, assignments] = await Promise.all([
    getHrSettings(),
    listShifts(),
    getShiftAssignments(),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="HR Settings"
        subtitle="Attendance rules, shifts and shift assignment — every payroll rule is configured here"
      />
      <HrAdminView
        settings={{
          payrollDivisor:         settings.payrollDivisor,
          paidLeavesPerMonth:     settings.paidLeavesPerMonth,
          weeklyOffDays:          settings.weeklyOffDays,
          graceMinutes:           settings.graceMinutes,
          autoAbsentAfterMinutes: settings.autoAbsentAfterMinutes,
          minHalfDayMinutes:      settings.minHalfDayMinutes,
          earlyCheckoutMinutes:   settings.earlyCheckoutMinutes,
          lateWarnAfterCount:     settings.lateWarnAfterCount,
          lateToHalfDayCount:     settings.lateToHalfDayCount,
          lateToDayCount:         settings.lateToDayCount,
          halfDayDeductsHalf:     settings.halfDayDeductsHalf,
          earlyCheckoutPenalty:   settings.earlyCheckoutPenalty === "HALF_DAY" ? "HALF_DAY" : "NONE",
          requireSelfie:          settings.requireSelfie,
          requireGeo:             settings.requireGeo,
          geoLat:                 settings.geoLat,
          geoLng:                 settings.geoLng,
          geoRadiusMeters:        settings.geoRadiusMeters,
        }}
        shifts={shifts.map((s) => ({
          id: s.id, name: s.name, startTime: s.startTime, endTime: s.endTime,
          crossesMidnight: s.crossesMidnight, graceMinutes: s.graceMinutes, isActive: s.isActive,
        }))}
        assignments={assignments.map((a) => ({
          id: a.id, name: a.user.name, branch: a.branch.name,
          assignedShiftId: a.assignedShiftId, assignedShiftName: a.assignedShift?.name ?? null,
        }))}
      />
    </div>
  );
}
