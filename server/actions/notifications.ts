"use server";

// ============================================================
// server/actions/notifications.ts
// Real header-bell notifications derived from live data —
// branch-scoped, permission-aware, newest first.
// ============================================================

import prisma from "@/lib/db/prisma";
import { requireAuth, getScopedBranchId } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { BookingStatus } from "@/types";
import { startOfDay, endOfDay } from "date-fns";

export interface HeaderNotification {
  id:    string;                        // stable — used for client-side read tracking
  type:  "warning" | "info" | "success";
  title: string;
  body:  string;
  href:  string;
  at:    string;                        // ISO timestamp for sorting + relative display
}

export async function getHeaderNotifications(): Promise<HeaderNotification[]> {
  const user     = await requireAuth();
  const branchId = getScopedBranchId(user);
  const bf       = branchId ? { branchId } : {};

  const canBookings   = hasPermission(user.role, "bookings:read");
  const canInventory  = hasPermission(user.role, "inventory:read");
  const canComplaints = hasPermission(user.role, "complaints:read");
  const canRooms      = hasPermission(user.role, "rooms:read");

  const now        = new Date();
  const todayStart = startOfDay(now);
  const todayEnd   = endOfDay(now);

  const [pendingBookings, todayArrivals, inventory, complaints, maintenance] = await Promise.all([
    canBookings ? prisma.booking.findMany({
      where:   { ...bf, status: BookingStatus.PENDING },
      orderBy: { createdAt: "desc" },
      take:    5,
      select:  {
        id: true, bookingRef: true, createdAt: true,
        customer: { select: { name: true } },
        room:     { select: { number: true } },
      },
    }) : Promise.resolve([]),
    canBookings ? prisma.booking.findMany({
      where:   { ...bf, status: BookingStatus.CONFIRMED, checkInDate: { gte: todayStart, lte: todayEnd } },
      orderBy: { checkInDate: "asc" },
      take:    5,
      select:  {
        id: true, bookingRef: true, checkInDate: true,
        customer: { select: { name: true } },
        room:     { select: { number: true } },
      },
    }) : Promise.resolve([]),
    canInventory ? prisma.inventoryItem.findMany({
      where:  bf,
      select: {
        id: true, currentStock: true, minStockLevel: true, updatedAt: true,
        product: { select: { name: true } },
      },
    }) : Promise.resolve([]),
    canComplaints ? prisma.complaint.findMany({
      where:   { status: { not: "RESOLVED" }, ...(branchId ? { branchId } : { branch: { companyId: user.companyId } }) },
      orderBy: { createdAt: "desc" },
      take:    3,
      select:  { id: true, guestName: true, severity: true, text: true, createdAt: true },
    }) : Promise.resolve([]),
    canRooms ? prisma.maintenanceLog.findMany({
      where:   { resolvedAt: null, ...(branchId ? { room: { branchId } } : {}) },
      orderBy: { createdAt: "desc" },
      take:    3,
      select:  { id: true, title: true, createdAt: true, room: { select: { number: true } } },
    }) : Promise.resolve([]),
  ]);

  const items: HeaderNotification[] = [];

  for (const b of pendingBookings) {
    items.push({
      id:    `pending-${b.id}`,
      type:  "warning",
      title: "Booking awaiting confirmation",
      body:  `${b.bookingRef} — ${b.customer?.name ?? "Guest"} · Room ${b.room?.number ?? "?"}`,
      href:  `/bookings/${b.id}`,
      at:    b.createdAt.toISOString(),
    });
  }

  for (const b of todayArrivals) {
    items.push({
      id:    `arrival-${b.id}`,
      type:  "info",
      title: "Arriving today",
      body:  `${b.customer?.name ?? "Guest"} · Room ${b.room?.number ?? "?"} (${b.bookingRef})`,
      href:  `/bookings/${b.id}`,
      at:    b.checkInDate.toISOString(),
    });
  }

  const lowStock = inventory.filter((i) => i.currentStock <= i.minStockLevel);
  for (const i of lowStock.slice(0, 4)) {
    items.push({
      id:    `stock-${i.id}`,
      type:  "warning",
      title: "Low stock",
      body:  `${i.product?.name ?? "Item"} — ${i.currentStock} left (min ${i.minStockLevel})`,
      href:  "/inventory/products",
      at:    i.updatedAt.toISOString(),
    });
  }

  for (const c of complaints) {
    items.push({
      id:    `complaint-${c.id}`,
      type:  "warning",
      title: c.severity === "HIGH" ? "Open complaint (high severity)" : "Open complaint",
      body:  `${c.guestName ?? "Guest"}: ${c.text.slice(0, 70)}${c.text.length > 70 ? "…" : ""}`,
      href:  "/complaints",
      at:    c.createdAt.toISOString(),
    });
  }

  for (const m of maintenance) {
    items.push({
      id:    `maint-${m.id}`,
      type:  "info",
      title: "Maintenance open",
      body:  `Room ${m.room?.number ?? "?"} — ${m.title}`,
      href:  "/housekeeping",
      at:    m.createdAt.toISOString(),
    });
  }

  return items
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 10);
}
