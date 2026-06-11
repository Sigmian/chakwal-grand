"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";

export async function createExpenseAction(data: {
  branchId: string;
  category: string;
  title: string;
  amount: number;
  description?: string;
  paidAt: string;
}) {
  await requirePermission("finance:expenses:create");

  if (!data.branchId || !data.category || !data.title || !data.amount || !data.paidAt) {
    return { success: false, error: "All required fields must be filled." };
  }
  if (data.amount <= 0) {
    return { success: false, error: "Amount must be greater than zero." };
  }

  try {
    const date = new Date(data.paidAt);
    await prisma.expense.create({
      data: {
        branchId:    data.branchId,
        category:    data.category as never,
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
