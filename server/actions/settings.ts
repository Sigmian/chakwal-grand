"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requirePermission, requireAuth } from "@/lib/auth/session";
import { logActivity } from "@/lib/activity/log";

export async function toggleUserActive(userId: string, isActive: boolean) {
  const actor = await requirePermission("settings:company");
  try {
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
    if (!target || target.companyId !== actor.companyId) return { success: false, error: "User not found." };
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
  const actor = await requirePermission("settings:company");
  if (id !== actor.companyId) return { success: false, error: "Access denied." };
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
  const user = await requirePermission("settings:branch");
  const [rows, staffTotal] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { acks: true } } },
    }),
    prisma.staffMember.count({ where: { isActive: true, branch: { companyId: user.companyId } } }),
  ]);
  return rows.map((a) => ({
    id: a.id, title: a.title, body: a.body, isActive: a.isActive,
    expiresAt: a.expiresAt, createdAt: a.createdAt,
    ackCount: a._count.acks, staffTotal,
  }));
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

// Reset the staff read-receipts for an announcement (e.g. to re-send it
// and track who acknowledges the fresh copy).
export async function clearAnnouncementAcks(id: string) {
  await requirePermission("settings:company");
  try {
    const res = await prisma.announcementAck.deleteMany({ where: { announcementId: id } });
    revalidatePath("/announcements");
    revalidatePath("/portal");
    return { success: true, cleared: res.count };
  } catch (err) {
    console.error("[clearAnnouncementAcks]", err);
    return { success: false, error: "Failed to clear acknowledgements." };
  }
}

// Self-service password change. Verifies the current password before setting
// a new one — an admin reset (below) never needs to see the old password.
export async function changeMyPassword(input: { currentPassword: string; newPassword: string }) {
  const me = await requireAuth();
  if (!input.newPassword || input.newPassword.length < 8) {
    return { success: false, error: "New password must be at least 8 characters." };
  }
  if (input.currentPassword === input.newPassword) {
    return { success: false, error: "New password must be different from the current one." };
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: me.id }, select: { passwordHash: true, name: true, staffMember: { select: { branchId: true } } } });
    if (!user) return { success: false, error: "Account not found." };

    const bcrypt = await import("bcryptjs");
    const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!ok) return { success: false, error: "Your current password is incorrect." };

    const hash = await bcrypt.hash(input.newPassword, 12);
    await prisma.user.update({ where: { id: me.id }, data: { passwordHash: hash } });
    await logActivity({ userId: me.id, action: "PASSWORD_CHANGED", entity: "Auth", description: `${user.name} changed their password`, branchId: user.staffMember?.branchId ?? null });
    return { success: true };
  } catch (err) {
    console.error("[changeMyPassword]", err);
    return { success: false, error: "Failed to change password." };
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const actor = await requirePermission("settings:company");
  if (!newPassword || newPassword.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }
  try {
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { companyId: true } });
    if (!target || target.companyId !== actor.companyId) return { success: false, error: "User not found." };
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });
    return { success: true };
  } catch (err) {
    console.error("[resetUserPassword]", err);
    return { success: false, error: "Failed to reset password." };
  }
}
