"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { requirePermission } from "@/lib/auth/session";
import { RoomType } from "@/types";

const createCustomerSchema = z.object({
  name:             z.string().min(2),
  phone:            z.string().min(7),
  email:            z.string().email().optional().or(z.literal("")),
  cnic:             z.string().optional().or(z.literal("")),
  nationality:      z.string().optional(),
  city:             z.string().optional(),
  preferredRoomType: z.nativeEnum(RoomType).optional().or(z.literal("")),
  specialRequests:  z.string().optional(),
  notes:            z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

export async function createCustomer(rawInput: CreateCustomerInput) {
  const user  = await requirePermission("customers:create");
  const input = createCustomerSchema.parse(rawInput);

  // Check phone uniqueness
  const existing = await prisma.customer.findUnique({ where: { phone: input.phone } });
  if (existing) return { success: false, error: "A customer with this phone number already exists." };

  const customer = await prisma.customer.create({
    data: {
      companyId:        "company-001",
      name:             input.name,
      phone:            input.phone,
      email:            input.email || null,
      cnic:             input.cnic  || null,
      nationality:      input.nationality || "Pakistani",
      city:             input.city || null,
      preferredRoomType: (input.preferredRoomType as RoomType) || null,
      specialRequests:  input.specialRequests || null,
      notes:            input.notes || null,
    },
  });

  revalidatePath("/customers");
  return { success: true, customerId: customer.id };
}
