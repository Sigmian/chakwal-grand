"use server";

import prisma from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";


interface CreateOfferInput {
  name:          string;
  code?:         string;
  discountType:  string;
  discountValue: number;
  minNights?:    number;
  maxUses?:      number;
  expiresAt:     Date;
  branchId?:     string;
}

export async function createOffer(input: CreateOfferInput) {
  const user = await requirePermission("settings:company");

  // Validate that branchId (if provided) belongs to this company
  if (input.branchId) {
    const branch = await prisma.branch.findUnique({ where: { id: input.branchId }, select: { companyId: true } });
    if (!branch || branch.companyId !== user.companyId) return { success: false, offer: null };
  }

  const code = input.code || Math.random().toString(36).slice(2, 10).toUpperCase();

  const offer = await prisma.offer.create({
    data: {
      name:          input.name,
      code,
      discountType:  input.discountType,
      discountValue: input.discountValue,
      minNights:     input.minNights ?? null,
      maxUses:       input.maxUses ?? null,
      startsAt:      new Date(),
      expiresAt:     input.expiresAt,
      isActive:      true,
      ...(input.branchId ? { branchId: input.branchId } : {}),
    },
  });

  revalidatePath("/offers");
  return { success: true, offer };
}

export async function toggleOffer(id: string) {
  const user = await requirePermission("settings:company");

  const offer = await prisma.offer.findUnique({ where: { id }, include: { branch: { select: { companyId: true } } } });
  if (!offer) return { success: false };
  if (offer.branch && offer.branch.companyId !== user.companyId) return { success: false };

  await prisma.offer.update({
    where: { id },
    data:  { isActive: !offer.isActive },
  });

  revalidatePath("/offers");
  return { success: true };
}

export async function deleteOffer(id: string) {
  const user = await requirePermission("settings:company");

  // Don't delete auto-discount anchors
  const offer = await prisma.offer.findUnique({ where: { id }, include: { branch: { select: { companyId: true } } } });
  if (offer?.branch && offer.branch.companyId !== user.companyId) return { success: false, error: "Access denied." };
  if (offer?.code && ["WEEKLY14", "MONTHLY40"].includes(offer.code)) {
    return { success: false, error: "Cannot delete system auto-discounts. Toggle them off instead." };
  }

  await prisma.offer.delete({ where: { id } });
  revalidatePath("/offers");
  return { success: true };
}
