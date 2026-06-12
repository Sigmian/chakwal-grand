"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";

export async function getInRoomOrders(branchId?: string) {
  const user         = await requirePermission("bookings:read");
  const scopedBranch = getScopedBranchId(user, branchId);

  return prisma.inRoomOrder.findMany({
    where: scopedBranch
      ? { booking: { branchId: scopedBranch } }
      : {},
    include: {
      items: true,
      booking: {
        select: {
          bookingRef: true,
          room:       { select: { number: true, name: true } },
          customer:   { select: { name: true, phone: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function updateOrderStatus(orderId: string, status: "PENDING" | "PREPARING" | "DELIVERED" | "CANCELLED") {
  await requirePermission("bookings:update");

  await prisma.inRoomOrder.update({
    where: { id: orderId },
    data: {
      status,
      ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    },
  });

  revalidatePath("/dashboard/orders");
  return { success: true };
}
