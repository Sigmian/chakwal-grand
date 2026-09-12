"use server";

// ============================================================
// server/actions/hr-approvals.ts
// Admin/manager side: approve leave (enforcing the paid-leave
// allowance + override), approve attendance corrections (with an
// audit trail), the "staff today" overview, and payroll
// finalisation / payment.
// ============================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { requireAuth, requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { getHrConfig } from "@/lib/hr/config";
import { deriveAttendance } from "@/lib/hr/attendance";
import { resolveWorkDate, pktDateStr, type ShiftLike } from "@/lib/hr/time";
import { getStaffPayroll } from "@/server/actions/hr";

const dbDate = (dateStr: string) => new Date(`${dateStr}T00:00:00.000Z`);
const iso = (d: Date) => new Date(d).toISOString();
const isoDate = (d: Date) => new Date(d).toISOString().slice(0, 10);

async function assertScope(branchId: string, companyId: string) {
  const user = await requireAuth();
  if (companyId !== user.companyId) throw new Error("Access denied");
  const scoped = getScopedBranchId(user);
  if (scoped && branchId !== scoped) throw new Error("Access denied");
  return user;
}

// ─── Pending queues ───────────────────────────────────────────
export async function getPendingApprovals() {
  const user = await requirePermission("hr:manage");
  const scoped = getScopedBranchId(user);

  // LeaveRequest has a branch relation; AttendanceCorrectionRequest has only a
  // branchId scalar, so it is filtered by an explicit branch-id list.
  const leaveWhere = scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } };
  let branchIds: string[];
  if (scoped) {
    branchIds = [scoped];
  } else {
    const branches = await prisma.branch.findMany({ where: { companyId: user.companyId }, select: { id: true } });
    branchIds = branches.map((b) => b.id);
  }

  const [leaves, corrections] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { status: "PENDING", ...leaveWhere },
      include: { staffMember: { include: { user: { select: { name: true } } } }, branch: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.attendanceCorrectionRequest.findMany({
      where: { status: "PENDING", branchId: { in: branchIds } },
      include: { staffMember: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Paid-leave usage per staff, this month, so the UI can warn before approving.
  const config = await getHrConfig(user.companyId);
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
  const usageRows = await prisma.leaveRequest.groupBy({
    by: ["staffMemberId"],
    where: { status: "APPROVED", paid: true, fromDate: { lte: to }, toDate: { gte: from } },
    _count: { _all: true },
  });
  const usedByStaff = new Map(usageRows.map((r) => [r.staffMemberId, r._count._all]));

  return {
    allowance: config.paidLeavesPerMonth,
    leaves: leaves.map((l) => ({
      id: l.id, staffId: l.staffMemberId, name: l.staffMember.user.name, branch: l.branch.name,
      from: isoDate(l.fromDate), to: isoDate(l.toDate), reason: l.reason, notes: l.notes,
      paidUsed: usedByStaff.get(l.staffMemberId) ?? 0,
    })),
    corrections: corrections.map((c) => ({
      id: c.id, staffId: c.staffMemberId, name: c.staffMember.user.name,
      workDate: isoDate(c.workDate),
      requestedCheckIn: c.requestedCheckIn ? iso(c.requestedCheckIn) : null,
      requestedCheckOut: c.requestedCheckOut ? iso(c.requestedCheckOut) : null,
      reason: c.reason,
    })),
  };
}

// ─── Leave decision ───────────────────────────────────────────
const leaveDecisionSchema = z.object({
  id: z.string(),
  decision: z.enum(["APPROVE", "REJECT"]),
  paidOverride: z.boolean().optional(),
  overrideReason: z.string().max(300).optional(),
});

export async function decideLeave(raw: z.input<typeof leaveDecisionSchema>) {
  const user = await requirePermission("hr:approve_leave");
  const input = leaveDecisionSchema.parse(raw);

  const leave = await prisma.leaveRequest.findUnique({
    where: { id: input.id },
    include: { branch: { select: { companyId: true } } },
  });
  if (!leave || leave.status !== "PENDING") throw new Error("Leave request not found or already decided");
  await assertScope(leave.branchId, leave.branch.companyId);

  if (input.decision === "REJECT") {
    await prisma.leaveRequest.update({
      where: { id: leave.id },
      data: { status: "REJECTED", reviewedById: user.id, reviewedAt: new Date() },
    });
    revalidatePath("/staff/attendance");
    return { success: true, paid: false };
  }

  // Approve — decide paid vs unpaid against the month's allowance.
  const config = await getHrConfig(leave.branch.companyId);
  const from = new Date(Date.UTC(leave.fromDate.getUTCFullYear(), leave.fromDate.getUTCMonth(), 1));
  const to = new Date(Date.UTC(leave.fromDate.getUTCFullYear(), leave.fromDate.getUTCMonth() + 1, 0, 23, 59, 59));
  const usedPaid = await prisma.leaveRequest.count({
    where: { staffMemberId: leave.staffMemberId, status: "APPROVED", paid: true, fromDate: { lte: to }, toDate: { gte: from } },
  });
  const withinAllowance = usedPaid < config.paidLeavesPerMonth;

  let paid = withinAllowance;
  let overrideReason: string | null = null;
  if (!withinAllowance && input.paidOverride) {
    if (!input.overrideReason || input.overrideReason.trim().length < 3) {
      throw new Error("An override reason is required to pay a leave beyond the monthly allowance.");
    }
    paid = true;
    overrideReason = input.overrideReason.trim();
  }

  await prisma.leaveRequest.update({
    where: { id: leave.id },
    data: { status: "APPROVED", paid, overrideReason, reviewedById: user.id, reviewedAt: new Date() },
  });
  revalidatePath("/staff/attendance");
  return { success: true, paid };
}

// ─── Correction decision (applies to attendance + audit trail) ─
const correctionDecisionSchema = z.object({
  id: z.string(),
  decision: z.enum(["APPROVE", "REJECT"]),
  reviewNote: z.string().max(300).optional(),
});

export async function decideCorrection(raw: z.input<typeof correctionDecisionSchema>) {
  const user = await requirePermission("hr:manage");
  const input = correctionDecisionSchema.parse(raw);

  const req = await prisma.attendanceCorrectionRequest.findUnique({ where: { id: input.id } });
  if (!req || req.status !== "PENDING") throw new Error("Request not found or already decided");

  const staff = await prisma.staffMember.findUnique({
    where: { id: req.staffMemberId },
    include: { assignedShift: true, branch: { select: { companyId: true } } },
  });
  if (!staff) throw new Error("Staff member not found");
  await assertScope(req.branchId, staff.branch.companyId);

  if (input.decision === "REJECT") {
    await prisma.attendanceCorrectionRequest.update({
      where: { id: req.id },
      data: { status: "REJECTED", reviewedById: user.id, reviewedAt: new Date(), reviewNote: input.reviewNote ?? null },
    });
    revalidatePath("/staff/attendance");
    return { success: true };
  }

  // Apply the correction to the attendance record, re-derive, and audit.
  const cfg = await getHrConfig(staff.branch.companyId);
  const shift = (staff.assignedShift ?? { startTime: "08:00", endTime: "20:00", crossesMidnight: false }) as ShiftLike;
  const workDateStr = isoDate(req.workDate);

  const existing = await prisma.attendance.findUnique({
    where: { staffMemberId_workDate: { staffMemberId: req.staffMemberId, workDate: req.workDate } },
  });
  if (existing?.isLocked) throw new Error("That day's payroll is locked; unlock the month first.");

  const checkIn = req.requestedCheckIn ?? existing?.checkInAt ?? null;
  const checkOut = req.requestedCheckOut ?? existing?.checkOutAt ?? null;
  const d = deriveAttendance(workDateStr, shift, cfg, checkIn, checkOut, staff.assignedShift?.graceMinutes);

  await prisma.$transaction(async (tx) => {
    let attendanceId: string;
    if (existing) {
      attendanceId = existing.id;
      await tx.attendance.update({
        where: { id: existing.id },
        data: {
          checkInAt: checkIn, checkOutAt: checkOut, status: d.status as never,
          workedMinutes: d.workedMinutes, lateMinutes: d.lateMinutes, earlyMinutes: d.earlyMinutes,
          source: "CORRECTION" as never,
        },
      });
    } else {
      const created = await tx.attendance.create({
        data: {
          staffMemberId: req.staffMemberId, branchId: req.branchId,
          shiftId: staff.assignedShift?.id ?? null,
          workDate: req.workDate, checkInAt: checkIn, checkOutAt: checkOut,
          status: d.status as never, workedMinutes: d.workedMinutes,
          lateMinutes: d.lateMinutes, earlyMinutes: d.earlyMinutes, source: "CORRECTION" as never,
        },
      });
      attendanceId = created.id;
    }

    // Audit every changed field.
    const changes: [string, string | null, string | null][] = [
      ["checkInAt", existing?.checkInAt ? iso(existing.checkInAt) : null, checkIn ? iso(checkIn) : null],
      ["checkOutAt", existing?.checkOutAt ? iso(existing.checkOutAt) : null, checkOut ? iso(checkOut) : null],
      ["status", existing?.status ?? null, d.status],
    ];
    for (const [field, oldV, newV] of changes) {
      if (oldV !== newV) {
        await tx.attendanceAudit.create({
          data: { attendanceId, field, oldValue: oldV, newValue: newV, changedById: user.id, reason: `Correction approved: ${req.reason}` },
        });
      }
    }

    await tx.attendanceCorrectionRequest.update({
      where: { id: req.id },
      data: { status: "APPROVED", reviewedById: user.id, reviewedAt: new Date(), reviewNote: input.reviewNote ?? null },
    });
  });

  revalidatePath("/staff/attendance");
  return { success: true };
}

// ─── Today overview ───────────────────────────────────────────
export async function getTodayOverview() {
  const user = await requirePermission("hr:manage");
  const scoped = getScopedBranchId(user);
  const now = new Date();
  const todayStr = pktDateStr(now);

  const staff = await prisma.staffMember.findMany({
    where: { isActive: true, ...(scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } }) },
    include: {
      user: { select: { name: true } },
      branch: { select: { name: true } },
      assignedShift: { select: { name: true, startTime: true, endTime: true, crossesMidnight: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  // Today's attendance for each — using each staffer's own work-date.
  const rows = await Promise.all(staff.map(async (s) => {
    const shift = s.assignedShift as ShiftLike | null;
    const workDate = shift ? resolveWorkDate(now, shift) : todayStr;
    const att = await prisma.attendance.findUnique({
      where: { staffMemberId_workDate: { staffMemberId: s.id, workDate: dbDate(workDate) } },
      select: { status: true, checkInAt: true, checkOutAt: true },
    });
    return {
      id: s.id, name: s.user.name, branch: s.branch.name,
      shift: s.assignedShift?.name ?? null,
      night: s.assignedShift?.crossesMidnight ?? false,
      status: att?.status ?? "MISSING",
      checkedIn: !!att?.checkInAt,
      onDuty: !!att?.checkInAt && !att?.checkOutAt,
    };
  }));

  const present = rows.filter((r) => ["PRESENT", "LATE", "HALF_DAY", "EARLY_CHECKOUT"].includes(r.status)).length;
  const onDuty = rows.filter((r) => r.onDuty).length;
  const nightTonight = rows.filter((r) => r.night).length;
  const notCheckedIn = rows.filter((r) => !r.checkedIn);

  return {
    total: rows.length,
    present,
    onDuty,
    nightTonight,
    notCheckedInCount: notCheckedIn.length,
    alerts: notCheckedIn.map((r) => `${r.name} has not checked in`),
    rows,
  };
}

// ─── Payroll finalise / pay ───────────────────────────────────
export async function getPayrollView(staffMemberId: string, month: number, year: number) {
  await requirePermission("hr:manage");
  const result = await getStaffPayroll(staffMemberId, month, year); // scoped + permission inside
  const record = await prisma.monthlyPayroll.findUnique({
    where: { staffMemberId_month_year: { staffMemberId, month, year } },
    select: { status: true, finalizedAt: true, paidAt: true, paymentMethod: true, paymentRef: true },
  });
  return { result, record };
}

export async function finalizePayroll(staffMemberId: string, month: number, year: number) {
  const user = await requirePermission("hr:finalize_payroll");
  const staff = await prisma.staffMember.findUnique({
    where: { id: staffMemberId },
    include: { branch: { select: { companyId: true } } },
  });
  if (!staff) throw new Error("Staff member not found");
  await assertScope(staff.branchId, staff.branch.companyId);

  const r = await getStaffPayroll(staffMemberId, month, year);

  const from = dbDate(`${year}-${String(month).padStart(2, "0")}-01`);
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  await prisma.$transaction(async (tx) => {
    await tx.monthlyPayroll.upsert({
      where: { staffMemberId_month_year: { staffMemberId, month, year } },
      update: {
        status: "FINALIZED", finalizedById: user.id, finalizedAt: new Date(),
        monthlySalary: r.monthlySalary, dailySalary: r.dailySalary,
        presentDays: r.presentDays, paidLeaveDays: r.paidLeaveDays, unpaidLeaveDays: r.unpaidLeaveDays,
        absentDays: r.absentDays, halfDays: r.halfDays, lateCount: r.lateCount, earlyCount: r.earlyCount,
        weeklyOffDays: r.weeklyOffDays, holidayDays: r.holidayDays,
        grossSalary: r.grossSalary, additions: r.additions, deductions: r.totalDeductions,
        advanceDeducted: r.advance, netPayable: r.netPayable,
      },
      create: {
        staffMemberId, branchId: staff.branchId, month, year,
        status: "FINALIZED", finalizedById: user.id, finalizedAt: new Date(),
        monthlySalary: r.monthlySalary, dailySalary: r.dailySalary,
        presentDays: r.presentDays, paidLeaveDays: r.paidLeaveDays, unpaidLeaveDays: r.unpaidLeaveDays,
        absentDays: r.absentDays, halfDays: r.halfDays, lateCount: r.lateCount, earlyCount: r.earlyCount,
        weeklyOffDays: r.weeklyOffDays, holidayDays: r.holidayDays,
        grossSalary: r.grossSalary, additions: r.additions, deductions: r.totalDeductions,
        advanceDeducted: r.advance, netPayable: r.netPayable,
      },
    });
    // Lock the month's attendance so a later edit can't silently change a closed month.
    await tx.attendance.updateMany({
      where: { staffMemberId, workDate: { gte: from, lte: to } },
      data: { isLocked: true },
    });
  });

  revalidatePath("/staff/attendance");
  return { success: true, netPayable: r.netPayable };
}

const markPaidSchema = z.object({
  staffMemberId: z.string(), month: z.number().int(), year: z.number().int(),
  method: z.enum(["CASH", "BANK_TRANSFER", "EASYPAISA", "JAZZCASH", "ONLINE_CARD"]),
  reference: z.string().max(120).optional(),
});

export async function markPayrollPaid(raw: z.input<typeof markPaidSchema>) {
  const user = await requirePermission("hr:finalize_payroll");
  const input = markPaidSchema.parse(raw);
  const record = await prisma.monthlyPayroll.findUnique({
    where: { staffMemberId_month_year: { staffMemberId: input.staffMemberId, month: input.month, year: input.year } },
    include: { branch: { select: { companyId: true } } },
  });
  if (!record) throw new Error("Finalize the payroll before marking it paid.");
  await assertScope(record.branchId, record.branch.companyId);

  await prisma.monthlyPayroll.update({
    where: { id: record.id },
    data: { status: "PAID", paidAt: new Date(), paymentMethod: input.method, paymentRef: input.reference ?? null },
  });
  revalidatePath("/staff/attendance");
  return { success: true };
}

/** Unlock a finalized month for corrections (super admin only). */
export async function reopenPayroll(staffMemberId: string, month: number, year: number) {
  const user = await requirePermission("hr:finalize_payroll");
  const record = await prisma.monthlyPayroll.findUnique({
    where: { staffMemberId_month_year: { staffMemberId, month, year } },
    include: { branch: { select: { companyId: true } } },
  });
  if (!record) throw new Error("No payroll to reopen");
  await assertScope(record.branchId, record.branch.companyId);
  if (record.status === "PAID") throw new Error("Paid payroll cannot be reopened.");

  const from = dbDate(`${year}-${String(month).padStart(2, "0")}-01`);
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59));
  await prisma.$transaction(async (tx) => {
    await tx.monthlyPayroll.update({ where: { id: record.id }, data: { status: "DRAFT", finalizedAt: null } });
    await tx.attendance.updateMany({ where: { staffMemberId, workDate: { gte: from, lte: to } }, data: { isLocked: false } });
  });
  revalidatePath("/staff/attendance");
  return { success: true };
}
