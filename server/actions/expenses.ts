"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { assertBranchAccess, getScopedBranchId, requirePermission } from "@/lib/auth/session";
import { getPKTMonthPeriods } from "@/lib/finance/reporting";
import { ExpenseCategory } from "@/types";

// INVENTORY_PURCHASE is the only category that belongs to inventory spending
const INVENTORY_CATEGORIES = ["INVENTORY_PURCHASE"];

export async function createExpenseAction(data: {
  branchId:    string;
  category:    string;
  title:       string;
  amount:      number;
  description?: string;
  paidAt:      string;
  expenseType?: "INVENTORY" | "GUESTHOUSE";
}) {
  const user = await requirePermission("finance:expenses:create");

  if (!data.branchId || !data.category || !data.title || !data.amount || !data.paidAt) {
    return { success: false, error: "All required fields must be filled." };
  }
  assertBranchAccess(user, data.branchId);
  if (!Number.isFinite(data.amount) || data.amount <= 0) {
    return { success: false, error: "Amount must be a valid number greater than zero." };
  }

  if (!Object.values(ExpenseCategory).includes(data.category as ExpenseCategory)) {
    return { success: false, error: "Invalid expense category." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.paidAt)) {
    return { success: false, error: "Invalid payment date." };
  }
  const todayPKT = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (data.paidAt > todayPKT) {
    return { success: false, error: "Expense date cannot be in the future." };
  }

  // Derive this on the server so category and P&L type cannot conflict.
  const expenseType: "INVENTORY" | "GUESTHOUSE" =
    INVENTORY_CATEGORIES.includes(data.category) ? "INVENTORY" : "GUESTHOUSE";

  try {
    const date = new Date(`${data.paidAt}T00:00:00+05:00`);
    if (Number.isNaN(date.getTime())) return { success: false, error: "Invalid payment date." };
    const [year, month] = data.paidAt.split("-").map(Number);
    await prisma.expense.create({
      data: {
        branchId:    data.branchId,
        category:    data.category as never,
        expenseType: expenseType as never,
        title:       data.title.trim(),
        amount:      data.amount,
        description: data.description?.trim() || null,
        paidAt:      date,
        month,
        year,
      },
    });
    revalidatePath("/finance/expenses");
    revalidatePath("/finance/reports");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("[createExpenseAction]", err);
    return { success: false, error: "Failed to create expense. Please try again." };
  }
}

export async function deleteExpenseAction(id: string) {
  const user = await requirePermission("finance:expenses:update");

  try {
    const expense = await prisma.expense.findUnique({ where: { id }, select: { branchId: true } });
    if (!expense) return { success: false, error: "Expense not found." };
    assertBranchAccess(user, expense.branchId);
    await prisma.expense.delete({ where: { id } });
    revalidatePath("/finance/expenses");
    revalidatePath("/finance/reports");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    console.error("[deleteExpenseAction]", err);
    return { success: false, error: "Failed to delete expense." };
  }
}

// Returns real expense breakdown split by expenseType for reports
export async function getExpenseBreakdown(branchId?: string, months = 6) {
  const user = await requirePermission("finance:read");

  const scopedBranchId = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranchId
    ? { branchId: scopedBranchId }
    : { branch: { companyId: user.companyId } };
  const periods = getPKTMonthPeriods(months);
  const since = periods[0].start;
  const through = periods[periods.length - 1].end;

  const expenses = await prisma.expense.findMany({
    where: { ...branchFilter, paidAt: { gte: since, lte: through } },
    select: { category: true, expenseType: true, amount: true },
  });

  const inventory:  Record<string, number> = {};
  const guesthouse: Record<string, number> = {};
  let inventoryTotal  = 0;
  let guesthouseTotal = 0;

  for (const e of expenses) {
    const amt = Number(e.amount);
    const cat = String(e.category);
    if (String(e.expenseType) === "INVENTORY") {
      inventory[cat]  = (inventory[cat]  ?? 0) + amt;
      inventoryTotal += amt;
    } else {
      guesthouse[cat]  = (guesthouse[cat]  ?? 0) + amt;
      guesthouseTotal += amt;
    }
  }

  return {
    inventory:  { total: inventoryTotal,  byCategory: inventory  },
    guesthouse: { total: guesthouseTotal, byCategory: guesthouse },
  };
}
