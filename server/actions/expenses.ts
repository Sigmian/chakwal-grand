"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";

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
  await requirePermission("finance:expenses:create");

  if (!data.branchId || !data.category || !data.title || !data.amount || !data.paidAt) {
    return { success: false, error: "All required fields must be filled." };
  }
  if (data.amount <= 0) {
    return { success: false, error: "Amount must be greater than zero." };
  }

  // Auto-classify if not explicitly provided
  const expenseType: "INVENTORY" | "GUESTHOUSE" =
    data.expenseType ??
    (INVENTORY_CATEGORIES.includes(data.category) ? "INVENTORY" : "GUESTHOUSE");

  try {
    const date = new Date(data.paidAt);
    await prisma.expense.create({
      data: {
        branchId:    data.branchId,
        category:    data.category as never,
        expenseType: expenseType as never,
        title:       data.title.trim(),
        amount:      data.amount,
        description: data.description?.trim() || null,
        paidAt:      date,
        month:       date.getMonth() + 1,
        year:        date.getFullYear(),
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
  await requirePermission("finance:expenses:update");

  try {
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
  await requirePermission("finance:read");

  const branchFilter = branchId ? { branchId } : {};
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const expenses = await prisma.expense.findMany({
    where: { ...branchFilter, paidAt: { gte: since } },
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
