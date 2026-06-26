"use server";

import prisma from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function getComplaints() {
  await requirePermission("complaints:read");
  return prisma.complaint.findMany({
    orderBy: [
      // OPEN first, then severity HIGH > MEDIUM > LOW, then newest
      { status: "asc" },
      { createdAt: "desc" },
    ],
    take: 200,
  });
}

export async function updateComplaintStatus(
  id: string,
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED",
) {
  const user = await requirePermission("complaints:update");
  try {
    await prisma.complaint.update({
      where: { id },
      data: {
        status,
        ...(status === "RESOLVED"
          ? { resolvedAt: new Date(), resolvedBy: user.name ?? user.email }
          : {}),
      },
    });
    revalidatePath("/complaints");
    return { success: true };
  } catch (err) {
    console.error("[updateComplaintStatus]", err);
    return { success: false, error: "Failed to update complaint." };
  }
}

export async function deleteComplaint(id: string) {
  await requirePermission("complaints:update");
  try {
    await prisma.complaint.delete({ where: { id } });
    revalidatePath("/complaints");
    return { success: true };
  } catch (err) {
    console.error("[deleteComplaint]", err);
    return { success: false, error: "Failed to delete complaint." };
  }
}
