"use server";

// ============================================================
// server/actions/hr-reports.ts
// Monthly attendance + payroll report (all staff, engine-backed)
// and management insight alerts.
// ============================================================

import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { getHrConfig } from "@/lib/hr/config";
import { getStaffPayroll } from "@/server/actions/hr";

export interface ReportRow {
  staffId: string;
  name: string;
  branch: string;
  monthlySalary: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  halfDays: number;
  lateCount: number;
  earlyCount: number;
  weeklyOffDays: number;
  totalDeductions: number;
  additions: number;
  advance: number;
  netPayable: number;
  ledger: { date: string; label: string }[];
}

export interface MonthlyReport {
  month: number;
  year: number;
  label: string;
  allowance: number;
  rows: ReportRow[];
  totals: { gross: number; deductions: number; net: number };
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export async function getMonthlyAttendanceReport(month: number, year: number): Promise<MonthlyReport> {
  const user = await requirePermission("hr:manage");
  const scoped = getScopedBranchId(user);
  const config = await getHrConfig(user.companyId);

  const staff = await prisma.staffMember.findMany({
    where: { isActive: true, ...(scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } }) },
    select: { id: true, user: { select: { name: true } }, branch: { select: { name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  const rows: ReportRow[] = await Promise.all(staff.map(async (s) => {
    const r = await getStaffPayroll(s.id, month, year);
    return {
      staffId: s.id, name: s.user.name, branch: s.branch.name,
      monthlySalary: r.monthlySalary,
      presentDays: r.presentDays, paidLeaveDays: r.paidLeaveDays, unpaidLeaveDays: r.unpaidLeaveDays,
      absentDays: r.absentDays, halfDays: r.halfDays, lateCount: r.lateCount, earlyCount: r.earlyCount,
      weeklyOffDays: r.weeklyOffDays,
      totalDeductions: r.totalDeductions, additions: r.additions, advance: r.advance, netPayable: r.netPayable,
      ledger: r.ledger.map((l) => ({ date: l.date, label: l.label })),
    };
  }));

  const totals = rows.reduce(
    (a, r) => ({ gross: a.gross + r.monthlySalary, deductions: a.deductions + r.totalDeductions, net: a.net + r.netPayable }),
    { gross: 0, deductions: 0, net: 0 },
  );

  return {
    month, year, label: `${MONTHS[month - 1]} ${year}`,
    allowance: config.paidLeavesPerMonth,
    rows,
    totals: { gross: Math.round(totals.gross), deductions: Math.round(totals.deductions), net: Math.round(totals.net) },
  };
}

// ─── Management insights ──────────────────────────────────────
export interface Insight { level: "warn" | "info"; text: string }

export async function getManagementInsights(): Promise<Insight[]> {
  const user = await requirePermission("hr:manage");
  const scoped = getScopedBranchId(user);
  const branchWhere = scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } };

  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const year = now.getUTCFullYear();

  const [pendingLeaves, unackWarnings, report] = await Promise.all([
    prisma.leaveRequest.count({ where: { status: "PENDING", ...branchWhere } }),
    prisma.staffWarning.count({
      where: {
        acknowledgedAt: null,
        branchId: scoped ? scoped : { in: (await prisma.branch.findMany({ where: { companyId: user.companyId }, select: { id: true } })).map((b) => b.id) },
      },
    }),
    getMonthlyAttendanceReport(month, year),
  ]);

  const pendingCorrections = await prisma.attendanceCorrectionRequest.count({
    where: {
      status: "PENDING",
      branchId: scoped ? scoped : { in: (await prisma.branch.findMany({ where: { companyId: user.companyId }, select: { id: true } })).map((b) => b.id) },
    },
  });

  const insights: Insight[] = [];
  if (pendingLeaves > 0) insights.push({ level: "warn", text: `${pendingLeaves} leave request${pendingLeaves !== 1 ? "s" : ""} awaiting approval` });
  if (pendingCorrections > 0) insights.push({ level: "warn", text: `${pendingCorrections} attendance correction${pendingCorrections !== 1 ? "s" : ""} to review` });
  if (unackWarnings > 0) insights.push({ level: "info", text: `${unackWarnings} warning${unackWarnings !== 1 ? "s" : ""} not yet acknowledged` });

  for (const r of report.rows) {
    if (r.absentDays >= 3) insights.push({ level: "warn", text: `${r.name} has been absent ${r.absentDays} times this month` });
    if (r.lateCount >= 5) insights.push({ level: "warn", text: `${r.name} has arrived late ${r.lateCount} times this month` });
    if (report.allowance - r.paidLeaveDays <= 0 && r.paidLeaveDays > 0)
      insights.push({ level: "info", text: `${r.name} has no paid leaves remaining this month` });
  }

  return insights;
}
