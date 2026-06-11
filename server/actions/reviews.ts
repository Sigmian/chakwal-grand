"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";

export async function approveReview(id: string) {
  await requirePermission("reviews:approve");
  try {
    await prisma.review.update({ where: { id }, data: { isApproved: true, approvedAt: new Date() } });
    revalidatePath("/reviews");
    return { success: true };
  } catch (err) {
    console.error("[approveReview]", err);
    return { success: false, error: "Failed to approve review." };
  }
}

export async function rejectReview(id: string) {
  await requirePermission("reviews:approve");
  try {
    await prisma.review.update({ where: { id }, data: { isApproved: false, approvedAt: null } });
    revalidatePath("/reviews");
    return { success: true };
  } catch (err) {
    console.error("[rejectReview]", err);
    return { success: false, error: "Failed to reject review." };
  }
}

export async function toggleFeatured(id: string, current: boolean) {
  await requirePermission("reviews:approve");
  try {
    await prisma.review.update({ where: { id }, data: { isFeatured: !current } });
    revalidatePath("/reviews");
    return { success: true };
  } catch (err) {
    console.error("[toggleFeatured]", err);
    return { success: false, error: "Failed to update featured status." };
  }
}

export async function deleteReview(id: string) {
  await requirePermission("reviews:delete");
  try {
    await prisma.review.delete({ where: { id } });
    revalidatePath("/reviews");
    return { success: true };
  } catch (err) {
    console.error("[deleteReview]", err);
    return { success: false, error: "Failed to delete review." };
  }
}

export async function getReviews(branchId?: string) {
  await requirePermission("reviews:read");
  return prisma.review.findMany({
    where: branchId ? { branchId } : undefined,
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
    include: {
      customer: { select: { name: true, phone: true } },
    },
    take: 100,
  });
}
