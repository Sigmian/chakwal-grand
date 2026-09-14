"use server";

// ============================================================
// server/actions/hr.ts
// Callable backbone for the HR system: turns stored attendance,
// approved leaves and manual adjustments into a payroll result
// via the pure engine. Every read is permission- and scope-checked.
// ============================================================

import prisma from "@/lib/db/prisma";
import { requireAuth, requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { getHrConfig } from "@/lib/hr/config";
import {
  computeMonthlyPayroll,
  type AttendanceInput, type LeaveInput, type ManualEntry, type PayrollResult,
} from "@/lib/hr/payroll";
import { pktDateStr } from "@/lib/hr/time";
import type { AttendanceStatus } from "@/lib/hr/attendance";

const pad = (n: number) => String(n).padStart(2, "0");
const isoDate = (d: Date) => new Date(d).toISOString().slice(0, 10);

/** Manual PayrollEntry.type → engine ManualKind (skips auto attendance lines). */
const MANUAL_KIND: Record<string, ManualEntry["kind"] | undefined> = {
  BONUS: "BONUS", COMMISSION: "COMMISSION", OVERTIME: "OVERTIME",
  FINE: "FINE", ADVANCE: "ADVANCE", ADJUSTMENT: "ADJUSTMENT",
};

/**
 * Compute a staff member's payroll for a month. Read-only — it never writes,
 * so it is safe to call for a live dashboard estimate or an admin review.
 */
export async function getStaffPayroll(
  staffMemberId: string,
  month: number,
  year: number,
): Promise<PayrollResult> {
  const viewer = await requireAuth();

  const staff = await prisma.staffMember.findUnique({
    where: { id: staffMemberId },
    include: { branch: { select: { companyId: true } } },
  });
  if (!staff) throw new Error("Staff member not found");

  // Access control: a staff member may see only their own; managers are
  // limited to their branch; super admins see all in their company.
  const isSelf = staff.userId === viewer.id;
  if (!isSelf) {
    await requirePermission("hr:manage");
    const scoped = getScopedBranchId(viewer);
    if (scoped && staff.branchId !== scoped) throw new Error("Access denied");
    if (staff.branch.companyId !== viewer.companyId) throw new Error("Access denied");
  }

  const from = new Date(`${year}-${pad(month)}-01T00:00:00Z`);
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const [attendance, leaves, entries, config] = await Promise.all([
    prisma.attendance.findMany({
      where: { staffMemberId, workDate: { gte: from, lte: to } },
      select: { workDate: true, status: true, lateMinutes: true, earlyMinutes: true },
    }),
    prisma.leaveRequest.findMany({
      where: {
        staffMemberId, status: "APPROVED",
        fromDate: { lte: to }, toDate: { gte: from },
      },
      select: { fromDate: true, toDate: true, paid: true },
    }),
    prisma.payrollEntry.findMany({
      where: { staffMemberId, date: { gte: from, lte: to } },
      select: { type: true, amount: true, description: true },
    }),
    getHrConfig(staff.branch.companyId),
  ]);

  const attInputs: AttendanceInput[] = attendance.map((a) => ({
    workDate: isoDate(a.workDate),
    status: a.status as AttendanceStatus,
    lateMinutes: a.lateMinutes,
    earlyMinutes: a.earlyMinutes,
  }));

  const leaveInputs: LeaveInput[] = leaves.map((l) => ({
    fromDate: isoDate(l.fromDate),
    toDate: isoDate(l.toDate),
    paid: l.paid,
  }));

  const manual: ManualEntry[] = [];
  for (const e of entries) {
    const kind = MANUAL_KIND[e.type];
    if (kind) manual.push({ kind, amount: Number(e.amount), description: e.description });
  }

  return computeMonthlyPayroll({
    monthlySalary: Number(staff.salary ?? 0),
    month, year, config,
    attendance: attInputs,
    leaves: leaveInputs,
    manual,
    holidays: config.holidays,   // company holidays are paid, never deducted
    todayStr: pktDateStr(new Date()),
  });
}

/** Paid-leave usage for a staff member in a month (for allowance display). */
export async function getPaidLeaveUsage(staffMemberId: string, month: number, year: number) {
  const viewer = await requireAuth();
  const staff = await prisma.staffMember.findUnique({
    where: { id: staffMemberId },
    include: { branch: { select: { companyId: true } } },
  });
  if (!staff) throw new Error("Staff member not found");
  if (staff.userId !== viewer.id) await requirePermission("hr:manage");

  const from = new Date(`${year}-${pad(month)}-01T00:00:00Z`);
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  const config = await getHrConfig(staff.branch.companyId);

  const usedPaid = await prisma.leaveRequest.count({
    where: {
      staffMemberId, status: "APPROVED", paid: true,
      fromDate: { lte: to }, toDate: { gte: from },
    },
  });

  return { used: usedPaid, allowance: config.paidLeavesPerMonth, remaining: Math.max(0, config.paidLeavesPerMonth - usedPaid) };
}
