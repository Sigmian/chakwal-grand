"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { assertBranchAccess, getScopedBranchId, requirePermission } from "@/lib/auth/session";

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

export async function rejectReview(id: string) {
  await requireReviewAccess(id, "reviews:approve");
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

export async function getReviews(branchId?: string) {
  const user = await requirePermission("reviews:read");
  const scopedBranchId = getScopedBranchId(user, branchId);
  let where: { branchId: string } | { branchId: { in: string[] } } | undefined;
  if (scopedBranchId) {
    where = { branchId: scopedBranchId };
  } else {
    const companyBranches = await prisma.branch.findMany({
      where:  { companyId: user.companyId },
      select: { id: true },
    });
    where = { branchId: { in: companyBranches.map((b) => b.id) } };
  }
  return prisma.review.findMany({
    where,
    orderBy: [{ isApproved: "asc" }, { createdAt: "desc" }],
    include: {
      customer: { select: { name: true, phone: true } },
    },
    take: 100,
  });
}
