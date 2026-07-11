"use server";

import prisma from "@/lib/db/prisma";
import { assertBranchAccess, getScopedBranchId, requirePermission } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export async function getComplaints() {
  const user = await requirePermission("complaints:read");
  const branchId = getScopedBranchId(user);
  const bookingRefs = branchId
    ? (await prisma.booking.findMany({ where: { branchId }, select: { bookingRef: true } })).map((b) => b.bookingRef)
    : undefined;
  return prisma.complaint.findMany({
    where: bookingRefs ? { bookingRef: { in: bookingRefs } } : undefined,
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
    const complaint = await prisma.complaint.findUnique({ where: { id }, select: { bookingRef: true } });
    if (!complaint) return { success: false, error: "Complaint not found." };
    if (user.branchId && complaint.bookingRef) {
      const booking = await prisma.booking.findUnique({ where: { bookingRef: complaint.bookingRef }, select: { branchId: true } });
      if (!booking) return { success: false, error: "Complaint is not linked to an accessible booking." };
      assertBranchAccess(user, booking.branchId);
    } else if (user.branchId) {
      return { success: false, error: "Only a super administrator can manage unlinked complaints." };
    }
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
  const user = await requirePermission("complaints:update");
  try {
    const complaint = await prisma.complaint.findUnique({ where: { id }, select: { bookingRef: true } });
    if (!complaint) return { success: false, error: "Complaint not found." };
    if (user.branchId && complaint.bookingRef) {
      const booking = await prisma.booking.findUnique({ where: { bookingRef: complaint.bookingRef }, select: { branchId: true } });
      if (!booking) return { success: false, error: "Complaint is not linked to an accessible booking." };
      assertBranchAccess(user, booking.branchId);
    } else if (user.branchId) {
      return { success: false, error: "Only a super administrator can delete unlinked complaints." };
    }
    await prisma.complaint.delete({ where: { id } });
    revalidatePath("/complaints");
    return { success: true };
  } catch (err) {
    console.error("[deleteComplaint]", err);
    return { success: false, error: "Failed to delete complaint." };
  }
}
