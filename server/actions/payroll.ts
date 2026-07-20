"use server";

import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { AdvanceStatus } from "@prisma/client";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaySalaryInput {
  staffMemberId: string;
  month: number;
  year: number;
  grossAmount: number;
  advanceIds: string[];   // advances to deduct in this payment
  notes?: string;
  signature?: string;     // base64 PNG
}

export interface RecordAdvanceInput {
  staffMemberId: string;
  amount: number;
  reason?: string;
  notes?: string;
  signature?: string;     // base64 PNG
}

// ─── Pay Salary ──────────────────────────────────────────────────────────────

export async function paySalary(input: PaySalaryInput) {
  const user = await requirePermission("staff:view_salaries");

  const staffMember = await prisma.staffMember.findUnique({
    where: { id: input.staffMemberId },
    include: { user: { select: { name: true } }, branch: true },
  });
  if (!staffMember) throw new Error("Staff member not found");

  // Scope check: branch managers can only pay their own branch
  const scopedBranch = getScopedBranchId(user);
  if (scopedBranch && staffMember.branchId !== scopedBranch) {
    throw new Error("Unauthorized");
  }

  // Prevent duplicate payment for same month/year
  const existing = await prisma.staffSalaryPayment.findFirst({
    where: { staffMemberId: input.staffMemberId, month: input.month, year: input.year },
  });
  if (existing) throw new Error(`Salary for ${input.month}/${input.year} already recorded`);

  // Sum selected advances to deduct
  const advances = input.advanceIds.length > 0
    ? await prisma.staffAdvance.findMany({
        where: { id: { in: input.advanceIds }, staffMemberId: input.staffMemberId, status: AdvanceStatus.PENDING },
      })
    : [];

  const advanceDeducted = advances.reduce((s, a) => s + Number(a.amount), 0);
  const netAmount = Math.max(0, input.grossAmount - advanceDeducted);

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create expense record
    const expense = await tx.expense.create({
      data: {
        branchId:    staffMember.branchId,
        category:    "STAFF_SALARY",
        expenseType: "GUESTHOUSE",
        title:       `Salary — ${staffMember.user.name} (${monthNames[input.month - 1]} ${input.year})`,
        amount:      netAmount,
        description: input.notes ?? null,
        paidById:    user.id,
        paidAt:      new Date(),
        month:       input.month,
        year:        input.year,
      },
    });

    // 2. Create salary payment record
    const payment = await tx.staffSalaryPayment.create({
      data: {
        staffMemberId:   input.staffMemberId,
        branchId:        staffMember.branchId,
        month:           input.month,
        year:            input.year,
        grossAmount:     input.grossAmount,
        advanceDeducted: advanceDeducted,
        netAmount:       netAmount,
        notes:           input.notes ?? null,
        signature:       input.signature ?? null,
        paidById:        user.id,
        expenseId:       expense.id,
      },
    });

    // 3. Mark advances as deducted
    if (advances.length > 0) {
      await tx.staffAdvance.updateMany({
        where: { id: { in: input.advanceIds } },
        data:  { status: AdvanceStatus.DEDUCTED, deductedFromId: payment.id, deductedAt: new Date() },
      });
    }

    return payment;
  });

  revalidatePath("/staff/payroll");
  revalidatePath(`/staff/payroll/${input.staffMemberId}`);
  revalidatePath("/finance/expenses");
  return { ok: true, paymentId: result.id };
}

// ─── Record Advance ──────────────────────────────────────────────────────────

export async function recordAdvance(input: RecordAdvanceInput) {
  const user = await requirePermission("staff:view_salaries");

  const staffMember = await prisma.staffMember.findUnique({
    where: { id: input.staffMemberId },
    include: { user: { select: { name: true } } },
  });
  if (!staffMember) throw new Error("Staff member not found");

  const scopedBranch = getScopedBranchId(user);
  if (scopedBranch && staffMember.branchId !== scopedBranch) {
    throw new Error("Unauthorized");
  }

  await prisma.$transaction(async (tx) => {
    const advance = await tx.staffAdvance.create({
      data: {
        staffMemberId: input.staffMemberId,
        branchId:      staffMember.branchId,
        amount:        input.amount,
        reason:        input.reason ?? null,
        notes:         input.notes ?? null,
        signature:     input.signature ?? null,
        givenById:     user.id,
        status:        AdvanceStatus.PENDING,
      },
    });

    // Also record as expense immediately
    await tx.expense.create({
      data: {
        branchId:    staffMember.branchId,
        category:    "STAFF_SALARY",
        expenseType: "GUESTHOUSE",
        title:       `Advance — ${staffMember.user.name}`,
        amount:      input.amount,
        description: input.reason ?? null,
        paidById:    user.id,
        paidAt:      new Date(),
        month:       new Date().getMonth() + 1,
        year:        new Date().getFullYear(),
      },
    });

    return advance;
  });

  revalidatePath("/staff/payroll");
  revalidatePath(`/staff/payroll/${input.staffMemberId}`);
  revalidatePath("/finance/expenses");
  return { ok: true };
}

// ─── Waive Advance ───────────────────────────────────────────────────────────

export async function waiveAdvance(advanceId: string) {
  const user = await requirePermission("staff:view_salaries");

  const advance = await prisma.staffAdvance.findUnique({ where: { id: advanceId } });
  if (!advance || advance.status !== AdvanceStatus.PENDING) throw new Error("Advance not found or already processed");

  const scopedBranch = getScopedBranchId(user);
  if (scopedBranch && advance.branchId !== scopedBranch) throw new Error("Unauthorized");

  await prisma.staffAdvance.update({
    where: { id: advanceId },
    data:  { status: AdvanceStatus.WAIVED },
  });

  revalidatePath("/staff/payroll");
  return { ok: true };
}

// ─── Get Payroll Overview (all staff) ────────────────────────────────────────

export async function getPayrollOverview() {
  const user = await requirePermission("staff:view_salaries");
  const scopedBranch = getScopedBranchId(user);

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear  = now.getFullYear();

  const staff = await prisma.staffMember.findMany({
    where: {
      ...(scopedBranch ? { branchId: scopedBranch } : { branch: { companyId: user.companyId } }),
      user: { isActive: true },
    },
    include: {
      user:   { select: { name: true, email: true, role: true } },
      branch: { select: { name: true } },
      salaryPayments: {
        where:   { month: thisMonth, year: thisYear },
        take:    1,
        orderBy: { paidAt: "desc" },
      },
      advances: {
        where:   { status: AdvanceStatus.PENDING },
        select:  { id: true, amount: true, givenAt: true, reason: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return staff.map((s) => ({
    staffMemberId:    s.id,
    name:             s.user.name,
    email:            s.user.email,
    role:             s.user.role,
    branch:           s.branch.name,
    salary:           Number(s.salary ?? 0),
    paidThisMonth:    s.salaryPayments.length > 0,
    lastPayment:      s.salaryPayments[0] ?? null,
    pendingAdvances:  s.advances,
    totalPendingAdv:  s.advances.reduce((sum, a) => sum + Number(a.amount), 0),
  }));
}

// ─── Get Staff Payroll Ledger (single staff) ─────────────────────────────────

export async function getStaffPayrollLedger(staffMemberId: string) {
  const user = await requirePermission("staff:view_salaries");

  const staffMember = await prisma.staffMember.findUnique({
    where: { id: staffMemberId },
    include: {
      user:   { select: { name: true, email: true, role: true, image: true } },
      branch: { select: { name: true, city: true } },
      salaryPayments: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        take:    24,
      },
      advances: {
        orderBy: { givenAt: "desc" },
        take:    50,
      },
    },
  });

  if (!staffMember) throw new Error("Staff member not found");

  const scopedBranch = getScopedBranchId(user);
  if (scopedBranch && staffMember.branchId !== scopedBranch) throw new Error("Unauthorized");

  // Pending advances (not yet deducted)
  const pendingAdvances = staffMember.advances.filter((a) => a.status === AdvanceStatus.PENDING);
  const totalPending    = pendingAdvances.reduce((s, a) => s + Number(a.amount), 0);

  return {
    staffMember: {
      id:          staffMember.id,
      name:        staffMember.user.name,
      email:       staffMember.user.email,
      role:        staffMember.user.role,
      image:       staffMember.user.image,
      branch:      staffMember.branch.name,
      city:        staffMember.branch.city,
      salary:      Number(staffMember.salary ?? 0),
      designation: staffMember.designation,
    },
    payments:        staffMember.salaryPayments,
    advances:        staffMember.advances,
    pendingAdvances,
    totalPending,
  };
}
