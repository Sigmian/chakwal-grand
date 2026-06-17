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

// ── Announcements ──────────────────────────────────────────────

export async function getAnnouncements() {
  await requirePermission("settings:branch");
  return prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createAnnouncement(data: {
  title: string;
  body: string;
  isActive: boolean;
  expiresAt?: string | null;
}) {
  await requirePermission("settings:company");
  if (!data.title.trim() || !data.body.trim()) {
    return { success: false, error: "Title and message are required." };
  }
  try {
    await prisma.announcement.create({
      data: {
        title:     data.title.trim(),
        body:      data.body.trim(),
        isActive:  data.isActive,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    revalidatePath("/announcements");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("[createAnnouncement]", err);
    return { success: false, error: "Failed to create announcement." };
  }
}

export async function toggleAnnouncement(id: string, isActive: boolean) {
  await requirePermission("settings:company");
  try {
    await prisma.announcement.update({ where: { id }, data: { isActive: !isActive } });
    revalidatePath("/announcements");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("[toggleAnnouncement]", err);
    return { success: false, error: "Failed to update announcement." };
  }
}

export async function updateAnnouncement(
  id: string,
  data: { title: string; body: string; isActive: boolean; expiresAt: string | null },
) {
  await requirePermission("settings:company");
  try {
    await prisma.announcement.update({
      where: { id },
      data: {
        title:     data.title,
        body:      data.body,
        isActive:  data.isActive,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });
    revalidatePath("/announcements");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("[updateAnnouncement]", err);
    return { success: false, error: "Failed to update announcement." };
  }
}

export async function deleteAnnouncement(id: string) {
  await requirePermission("settings:company");
  try {
    await prisma.announcement.delete({ where: { id } });
    revalidatePath("/announcements");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    console.error("[deleteAnnouncement]", err);
    return { success: false, error: "Failed to delete announcement." };
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
