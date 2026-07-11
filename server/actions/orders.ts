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
  const user = await requirePermission("bookings:update");

  // Branch scope check — prevent acting on another branch's in-room order
  // (cancelling reverses charges and restocks inventory).
  const scopeCheck = await prisma.inRoomOrder.findUnique({
    where:   { id: orderId },
    select:  { booking: { select: { branchId: true } } },
  });
  if (!scopeCheck) return { success: false, error: "Order not found." };
  if (getScopedBranchId(user, scopeCheck.booking.branchId) !== scopeCheck.booking.branchId) {
    return { success: false, error: "Access denied" };
  }

  if (status === "CANCELLED") {
    // Fetch order with items so we can reverse charges and restore stock
    const order = await prisma.inRoomOrder.findUnique({
      where:   { id: orderId },
      include: { items: true },
    });

    if (!order) return { success: false, error: "Order not found." };
    if (order.status === "CANCELLED") return { success: true }; // already cancelled
    if (order.status === "DELIVERED") return { success: false, error: "Delivered orders cannot be cancelled." };

    const orderTotal = Number(order.totalAmount);

    let cancelled = false;
    await prisma.$transaction(async (tx) => {
      // Atomically claim the cancellation so a staff cancel racing a guest cancel
      // (or a double-click) can't restore stock / reverse charges twice.
      const claim = await tx.inRoomOrder.updateMany({
        where: { id: orderId, status: { in: ["PENDING", "PREPARING"] } },
        data:  { status: "CANCELLED" },
      });
      if (claim.count === 0) return; // already cancelled by a concurrent request
      cancelled = true;

      // Reverse the charge from the booking
      await tx.booking.update({
        where: { id: order.bookingId },
        data:  {
          extraCharges: { decrement: orderTotal },
          totalAmount:  { decrement: orderTotal },
        },
      });

      // Restore stock for each item (atomic increment)
      for (const item of order.items) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data:  { currentStock: { increment: item.quantity } },
        });
        const updated = await tx.inventoryItem.findUnique({
          where:  { id: item.inventoryItemId },
          select: { currentStock: true },
        });
        if (!updated) continue;
        const newStock = updated.currentStock;
        await tx.stockMovement.create({
          data: {
            inventoryItemId: item.inventoryItemId,
            type:            "ADJUSTMENT",
            quantity:        item.quantity,
            previousStock:   newStock - item.quantity,
            newStock,
            reference:       orderId,
            notes:           `Cancelled room order (staff) — order #${orderId.slice(-6)}`,
          },
        });
      }
    });

    if (!cancelled) return { success: false, error: "Order is no longer pending." };
  } else {
    await prisma.inRoomOrder.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
      },
    });
  }

  revalidatePath("/dashboard/orders");
  return { success: true };
}
