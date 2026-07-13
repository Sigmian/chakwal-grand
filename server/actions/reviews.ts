"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { assertBranchAccess, requirePermission } from "@/lib/auth/session";

async function requireReviewAccess(id: string, permission: "reviews:approve" | "reviews:delete") {
  const user = await requirePermission(permission);
  const review = await prisma.review.findUnique({ where: { id }, select: { branchId: true } });
  if (!review) throw new Error("Review not found");
  assertBranchAccess(user, review.branchId);
}

export async function approveReview(id: string) {
  await requireReviewAccess(id, "reviews:approve");
  try {
    await prisma.review.update({ where: { id }, data: { isApproved: true, approvedAt: new Date() } });
    revalidatePath("/reviews");
    return { success: true };
  } catch (err) {
    console.error("[approveReview]", err);
    return { success: false, error: "Failed to approve review." };
  }
}

export async function toggleFeatured(id: string, current: boolean) {
  await requireReviewAccess(id, "reviews:approve");
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
  await requireReviewAccess(id, "reviews:delete");
  try {
    await prisma.review.delete({ where: { id } });
    revalidatePath("/reviews");
    return { success: true };
  } catch (err) {
    console.error("[deleteReview]", err);
    return { success: false, error: "Failed to delete review." };
  }
}

