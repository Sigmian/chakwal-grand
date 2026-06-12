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
}

export async function createOffer(input: CreateOfferInput) {
  await requirePermission("settings:company");

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
    },
  });

  revalidatePath("/offers");
  return { success: true, offer };
}

export async function toggleOffer(id: string) {
  await requirePermission("settings:company");

  const offer = await prisma.offer.findUnique({ where: { id } });
  if (!offer) return { success: false };

  await prisma.offer.update({
    where: { id },
    data:  { isActive: !offer.isActive },
  });

  revalidatePath("/offers");
  return { success: true };
}

export async function deleteOffer(id: string) {
  await requirePermission("settings:company");

  // Don't delete auto-discount anchors
  const offer = await prisma.offer.findUnique({ where: { id } });
  if (offer?.code && ["WEEKLY14", "MONTHLY40"].includes(offer.code)) {
    return { success: false, error: "Cannot delete system auto-discounts. Toggle them off instead." };
  }

  await prisma.offer.delete({ where: { id } });
  revalidatePath("/offers");
  return { success: true };
}
