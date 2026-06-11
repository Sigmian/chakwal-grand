"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";

export async function toggleUserActive(userId: string, isActive: boolean) {
  await requirePermission("settings:company");
  try {
    await prisma.user.update({ where: { id: userId }, data: { isActive: !isActive } });
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("[toggleUserActive]", err);
    return { success: false, error: "Failed to update user status." };
  }
}

export async function updateCompanyAction(id: string, data: {
  name?: string;
  tagline?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  city?: string | null;
  currency?: string;
  timezone?: string;
}) {
  await requirePermission("settings:company");
  try {
    await prisma.company.update({ where: { id }, data });
    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    console.error("[updateCompanyAction]", err);
    return { success: false, error: "Failed to update company settings." };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  await requirePermission("settings:company");
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }
  try {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { success: true };
  } catch (err) {
    console.error("[resetUserPassword]", err);
    return { success: false, error: "Failed to reset password." };
  }
}
