"use server";

// ============================================================
// server/actions/guest-receipts.ts
// Guest Orders POS — free-text receipts for food/drinks/items staff arrange
// for guests from outside restaurants and shops.
//
// • Totals are ALWAYS recomputed here from the raw lines (never trusted
//   from the browser) using the same pure math the UI previews with.
// • Receipt numbers come from an atomic Postgres counter inside the same
//   transaction as the insert, so two receptionists can never collide.
// • Financial records are never deleted: cancelling keeps the row, with who
//   cancelled it, when and why. Every create/edit/cancel is audit-logged.
// ============================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getPKTDayPeriod } from "@/lib/finance/reporting";
import { computeReceipt, formatReceiptNo, MAX_ITEMS } from "@/lib/pos/receipt-math";
import type { Prisma, GuestReceiptStatus } from "@prisma/client";
import { UserRole, BookingStatus, type SessionUser } from "@/types";

const COUNTER_KEY = "guest_receipt";
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

// ─── Types returned to the client (plain JSON only) ───────────
export interface ReceiptLine { name: string; qty: number; rate: number; amount: number }

export interface GuestReceiptDetail {
  id: string;
  receiptNo: string;
  status: "ACTIVE" | "CANCELLED";
  branchId: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string | null;
  bookingId: string | null;
  roomNo: string | null;
  guestName: string | null;
  notes: string | null;
  items: ReceiptLine[];
  subtotal: number;
  deliveryCharges: number;
  otherCharges: number;
  discount: number;
  total: number;
  /** Internal accounting — null when the viewer may not see it. */
  accounting: { customerCharged: number; vendorCost: number | null; profit: number } | null;
  createdByName: string;
  createdAt: string;
  updatedByName: string | null;
  updatedAt: string;
  cancelledByName: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  canEdit: boolean;
  canCancel: boolean;
}

export interface ActionResult { success: boolean; error?: string; id?: string; receiptNo?: string; createdAt?: string }

// ─── Helpers ──────────────────────────────────────────────────
const money = z.union([z.number(), z.string().max(20)]).nullable().optional();

const receiptSchema = z.object({
  branchId: z.string().max(60).optional(),
  bookingId: z.string().max(60).nullable().optional(),
  roomNo: z.string().trim().max(20).nullable().optional(),
  guestName: z.string().trim().max(80).nullable().optional(),
  notes: z.string().trim().max(300).nullable().optional(),
  items: z.array(z.object({
    name: z.string().max(200),
    qty: z.union([z.number(), z.string().max(20)]),
    rate: z.union([z.number(), z.string().max(20)]),
  })).max(MAX_ITEMS + 20), // spare blank rows are allowed and dropped
  deliveryCharges: money,
  otherCharges: money,
  discount: money,
  customerCharged: money,
  vendorCost: money,
});
export type GuestReceiptInput = z.input<typeof receiptSchema>;

const emptyToNull = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);
const num = (d: unknown) => Number(d ?? 0);

function pktDateKey(d: Date) {
  return new Date(d.getTime() + PKT_OFFSET_MS).toISOString().slice(0, 10);
}

function canManage(user: SessionUser) { return hasPermission(user.role, "pos:receipts:manage"); }
function canSeeProfit(user: SessionUser) { return hasPermission(user.role, "pos:receipts:profit"); }

/** Editable while ACTIVE: managers any time; the creator only on the same PKT day. */
function canEditReceipt(user: SessionUser, r: { status: string; createdById: string; createdAt: Date }) {
  if (r.status !== "ACTIVE") return false;
  if (canManage(user)) return true;
  return r.createdById === user.id && pktDateKey(r.createdAt) === pktDateKey(new Date());
}

/** Resolve the branch a receipt belongs to, enforcing the user's scope. */
async function resolveBranch(user: SessionUser, requested?: string | null) {
  const branchId = user.role === UserRole.SUPER_ADMIN ? requested : user.branchId;
  if (!branchId) {
    return { error: user.role === UserRole.SUPER_ADMIN ? "Select a branch." : "Your account is not linked to a branch." };
  }
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, companyId: user.companyId, isActive: true },
    select: { id: true },
  });
  return branch ? { branchId: branch.id } : { error: "Branch not found." };
}

async function loadScopedReceipt(user: SessionUser, id: string) {
  const r = await prisma.guestReceipt.findUnique({
    where: { id },
    include: {
      items: { orderBy: { position: "asc" } },
      branch: { select: { name: true, address: true, phone: true, companyId: true } },
    },
  });
  if (!r || r.branch.companyId !== user.companyId) return null;
  if (user.role !== UserRole.SUPER_ADMIN && r.branchId !== user.branchId) return null;
  return r;
}

function validationError(errors: string[]): ActionResult {
  return { success: false, error: errors.slice(0, 3).join(" ") };
}

// ─── Context for the New Receipt screen ───────────────────────
export async function getPosContext() {
  const user = await requirePermission("pos:receipts:create");
  const scoped = getScopedBranchId(user);

  const [branches, stays] = await Promise.all([
    prisma.branch.findMany({
      where: { companyId: user.companyId, isActive: true, ...(scoped ? { id: scoped } : {}) },
      select: { id: true, name: true, address: true, phone: true },
      orderBy: { name: "asc" },
    }),
    // Guests currently in-house — picking a room pre-fills the guest name.
    prisma.booking.findMany({
      where: {
        status: BookingStatus.CHECKED_IN,
        ...(scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } }),
      },
      select: { id: true, branchId: true, room: { select: { number: true } }, customer: { select: { name: true } } },
      orderBy: { room: { number: "asc" } },
      take: 200,
    }),
  ]);

  return {
    cashierName: user.name,
    isSuperAdmin: user.role === UserRole.SUPER_ADMIN,
    defaultBranchId: user.branchId ?? branches[0]?.id ?? "",
    branches,
    stays: stays.map((s) => ({ bookingId: s.id, branchId: s.branchId, roomNo: s.room.number, guestName: s.customer.name })),
  };
}

// ─── Create ───────────────────────────────────────────────────
export async function createGuestReceipt(raw: GuestReceiptInput): Promise<ActionResult> {
  const user = await requirePermission("pos:receipts:create");
  const parsed = receiptSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Some receipt fields are invalid." };
  const input = parsed.data;

  const c = computeReceipt(input);
  if (c.errors.length) return validationError(c.errors);

  const scope = await resolveBranch(user, input.branchId);
  if ("error" in scope) return { success: false, error: scope.error };

  // Only keep a booking link that genuinely belongs to this branch.
  let bookingId: string | null = null;
  if (input.bookingId) {
    const b = await prisma.booking.findFirst({ where: { id: input.bookingId, branchId: scope.branchId }, select: { id: true } });
    bookingId = b?.id ?? null;
  }

  const created = await prisma.$transaction(async (tx) => {
    // Atomic increment: the row lock serialises concurrent creators, and a
    // rollback of the insert below also rolls the counter back.
    const [{ value: seq }] = await tx.$queryRaw<{ value: number }[]>`
      INSERT INTO "DocumentCounter" ("key", "value", "updatedAt")
      VALUES (${COUNTER_KEY}, 1, NOW())
      ON CONFLICT ("key") DO UPDATE
        SET "value" = "DocumentCounter"."value" + 1, "updatedAt" = NOW()
      RETURNING "value"`;

    const receipt = await tx.guestReceipt.create({
      data: {
        receiptNo: formatReceiptNo(seq),
        seq,
        branchId: scope.branchId,
        bookingId,
        roomNo: emptyToNull(input.roomNo),
        guestName: emptyToNull(input.guestName),
        notes: emptyToNull(input.notes),
        subtotal: c.subtotal,
        deliveryCharges: c.deliveryCharges,
        otherCharges: c.otherCharges,
        discount: c.discount,
        total: c.total,
        customerCharged: c.customerCharged,
        vendorCost: c.vendorCost,
        profit: c.profit,
        createdById: user.id,
        createdByName: user.name,
        items: { create: c.items.map((i) => ({ position: i.position, name: i.name, qty: i.qty, rate: i.rate, amount: i.amount })) },
      },
      select: { id: true, receiptNo: true, createdAt: true },
    });

    await tx.activityLog.create({
      data: {
        userId: user.id,
        action: "POS_RECEIPT_CREATED",
        entity: "GuestReceipt",
        entityId: receipt.id,
        branchId: scope.branchId,
        description: `Created POS receipt ${receipt.receiptNo} — PKR ${c.total}`,
        metadata: { total: c.total, items: c.items.length, roomNo: emptyToNull(input.roomNo) } as never,
      },
    });
    return receipt;
  });

  revalidatePath("/pos/history");
  revalidatePath("/dashboard");
  return { success: true, id: created.id, receiptNo: created.receiptNo, createdAt: created.createdAt.toISOString() };
}

// ─── Update ───────────────────────────────────────────────────
export async function updateGuestReceipt(id: string, raw: GuestReceiptInput): Promise<ActionResult> {
  const user = await requirePermission("pos:receipts:create");
  const existing = await loadScopedReceipt(user, id);
  if (!existing) return { success: false, error: "Receipt not found." };
  if (!canEditReceipt(user, existing)) {
    return {
      success: false,
      error: existing.status !== "ACTIVE"
        ? "A cancelled receipt cannot be edited."
        : "You can only edit your own receipts on the day they were made. Ask a manager.",
    };
  }

  const parsed = receiptSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Some receipt fields are invalid." };
  const input = parsed.data;
  const c = computeReceipt(input);
  if (c.errors.length) return validationError(c.errors);

  // A receipt's branch is fixed once issued (its number was issued there).
  let bookingId: string | null = null;
  if (input.bookingId) {
    const b = await prisma.booking.findFirst({ where: { id: input.bookingId, branchId: existing.branchId }, select: { id: true } });
    bookingId = b?.id ?? null;
  }

  try {
  await prisma.$transaction(async (tx) => {
    // Optimistic guard: nobody cancelled it between our read and this write.
    const res = await tx.guestReceipt.updateMany({
      where: { id, status: "ACTIVE", updatedAt: existing.updatedAt },
      data: {
        bookingId,
        roomNo: emptyToNull(input.roomNo),
        guestName: emptyToNull(input.guestName),
        notes: emptyToNull(input.notes),
        subtotal: c.subtotal,
        deliveryCharges: c.deliveryCharges,
        otherCharges: c.otherCharges,
        discount: c.discount,
        total: c.total,
        customerCharged: c.customerCharged,
        vendorCost: c.vendorCost,
        profit: c.profit,
        updatedById: user.id,
        updatedByName: user.name,
      },
    });
    if (res.count !== 1) throw new Error("STALE");

    await tx.guestReceiptItem.deleteMany({ where: { receiptId: id } });
    await tx.guestReceiptItem.createMany({
      data: c.items.map((i) => ({ receiptId: id, position: i.position, name: i.name, qty: i.qty, rate: i.rate, amount: i.amount })),
    });
    await tx.activityLog.create({
      data: {
        userId: user.id,
        action: "POS_RECEIPT_UPDATED",
        entity: "GuestReceipt",
        entityId: id,
        branchId: existing.branchId,
        description: `Edited POS receipt ${existing.receiptNo} — PKR ${num(existing.total)} → PKR ${c.total}`,
        metadata: { before: num(existing.total), after: c.total } as never,
      },
    });
  });
  } catch (e) {
    if ((e as Error).message === "STALE") {
      return { success: false, error: "This receipt was changed or cancelled by someone else. Reload and try again." };
    }
    throw e;
  }

  revalidatePath("/pos/history");
  revalidatePath(`/pos/${id}`);
  revalidatePath("/dashboard");
  return { success: true, id, receiptNo: existing.receiptNo };
}

// ─── Cancel (managers only, never deletes) ────────────────────
export async function cancelGuestReceipt(id: string, reason: string): Promise<ActionResult> {
  const user = await requirePermission("pos:receipts:manage");
  const why = (reason ?? "").trim();
  if (why.length < 3) return { success: false, error: "Enter a reason for cancelling (at least 3 characters)." };
  if (why.length > 300) return { success: false, error: "Reason is too long." };

  const existing = await loadScopedReceipt(user, id);
  if (!existing) return { success: false, error: "Receipt not found." };
  if (existing.status === "CANCELLED") return { success: false, error: "This receipt is already cancelled." };

  try {
  await prisma.$transaction(async (tx) => {
    const res = await tx.guestReceipt.updateMany({
      where: { id, status: "ACTIVE" },
      data: {
        status: "CANCELLED",
        cancelledById: user.id,
        cancelledByName: user.name,
        cancelledAt: new Date(),
        cancelReason: why,
      },
    });
    if (res.count !== 1) throw new Error("ALREADY_CANCELLED");
    await tx.activityLog.create({
      data: {
        userId: user.id,
        action: "POS_RECEIPT_CANCELLED",
        entity: "GuestReceipt",
        entityId: id,
        branchId: existing.branchId,
        description: `Cancelled POS receipt ${existing.receiptNo} (PKR ${num(existing.total)}): ${why}`,
        metadata: { total: num(existing.total), reason: why } as never,
      },
    });
  });
  } catch (e) {
    if ((e as Error).message === "ALREADY_CANCELLED") return { success: false, error: "This receipt is already cancelled." };
    throw e;
  }

  revalidatePath("/pos/history");
  revalidatePath(`/pos/${id}`);
  revalidatePath("/dashboard");
  return { success: true, id, receiptNo: existing.receiptNo };
}

// ─── Read one ─────────────────────────────────────────────────
export async function getGuestReceipt(id: string): Promise<GuestReceiptDetail | null> {
  const user = await requirePermission("pos:receipts:read");
  const r = await loadScopedReceipt(user, id);
  if (!r) return null;

  const showAccounting = canSeeProfit(user) || r.createdById === user.id;
  return {
    id: r.id,
    receiptNo: r.receiptNo,
    status: r.status,
    branchId: r.branchId,
    branchName: r.branch.name,
    branchAddress: r.branch.address,
    branchPhone: r.branch.phone,
    bookingId: r.bookingId,
    roomNo: r.roomNo,
    guestName: r.guestName,
    notes: r.notes,
    items: r.items.map((i) => ({ name: i.name, qty: num(i.qty), rate: num(i.rate), amount: num(i.amount) })),
    subtotal: num(r.subtotal),
    deliveryCharges: num(r.deliveryCharges),
    otherCharges: num(r.otherCharges),
    discount: num(r.discount),
    total: num(r.total),
    accounting: showAccounting
      ? { customerCharged: num(r.customerCharged), vendorCost: r.vendorCost === null ? null : num(r.vendorCost), profit: num(r.profit) }
      : null,
    createdByName: r.createdByName,
    createdAt: r.createdAt.toISOString(),
    updatedByName: r.updatedByName,
    updatedAt: r.updatedAt.toISOString(),
    cancelledByName: r.cancelledByName,
    cancelledAt: r.cancelledAt?.toISOString() ?? null,
    cancelReason: r.cancelReason,
    canEdit: canEditReceipt(user, r),
    canCancel: canManage(user) && r.status === "ACTIVE",
  };
}

// ─── History ──────────────────────────────────────────────────
export interface ReceiptFilters {
  q?: string;        // receipt number
  from?: string;     // YYYY-MM-DD (PKT)
  to?: string;       // YYYY-MM-DD (PKT)
  room?: string;
  guest?: string;
  staff?: string;    // createdById
  branch?: string;   // super admin only
  status?: string;   // ACTIVE | CANCELLED | (all)
  page?: string;
}

const PAGE_SIZE = 50;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function listGuestReceipts(filters: ReceiptFilters) {
  const user = await requirePermission("pos:receipts:read");
  const scoped = getScopedBranchId(user, filters.branch || null);
  const showProfit = canSeeProfit(user);

  const createdAt: { gte?: Date; lte?: Date } = {};
  if (filters.from && DATE_RE.test(filters.from)) createdAt.gte = new Date(`${filters.from}T00:00:00+05:00`);
  if (filters.to && DATE_RE.test(filters.to)) createdAt.lte = new Date(`${filters.to}T23:59:59.999+05:00`);

  const status: GuestReceiptStatus | undefined =
    filters.status === "ACTIVE" || filters.status === "CANCELLED" ? filters.status : undefined;

  const where: Prisma.GuestReceiptWhereInput = {
    ...(scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } }),
    ...(filters.q?.trim() ? { receiptNo: { contains: filters.q.trim(), mode: "insensitive" as const } } : {}),
    ...(filters.room?.trim() ? { roomNo: { contains: filters.room.trim(), mode: "insensitive" as const } } : {}),
    ...(filters.guest?.trim() ? { guestName: { contains: filters.guest.trim(), mode: "insensitive" as const } } : {}),
    ...(filters.staff ? { createdById: filters.staff } : {}),
    ...(status ? { status } : {}),
    ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
  };

  const page = Math.max(1, Math.trunc(Number(filters.page)) || 1);

  const [rows, count, activeAgg, staffRows, branches] = await Promise.all([
    prisma.guestReceipt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { branch: { select: { name: true } } },
    }),
    prisma.guestReceipt.count({ where }),
    prisma.guestReceipt.aggregate({
      where: { ...where, status: "ACTIVE" },
      _sum: { total: true, vendorCost: true, profit: true },
      _count: { _all: true },
    }),
    prisma.guestReceipt.findMany({
      where: scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } },
      distinct: ["createdById"],
      select: { createdById: true, createdByName: true },
      orderBy: { createdByName: "asc" },
    }),
    user.role === UserRole.SUPER_ADMIN
      ? prisma.branch.findMany({ where: { companyId: user.companyId }, select: { id: true, name: true }, orderBy: { name: "asc" } })
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);

  return {
    rows: rows.map((r) => ({
      id: r.id,
      receiptNo: r.receiptNo,
      createdAt: r.createdAt.toISOString(),
      guestName: r.guestName,
      roomNo: r.roomNo,
      staff: r.createdByName,
      branch: r.branch.name,
      total: num(r.total),
      profit: showProfit ? num(r.profit) : null,
      vendorCostMissing: r.vendorCost === null,
      status: r.status,
      canEdit: canEditReceipt(user, r),
      canCancel: canManage(user) && r.status === "ACTIVE",
    })),
    count,
    page,
    pageCount: Math.max(1, Math.ceil(count / PAGE_SIZE)),
    totals: {
      activeCount: activeAgg._count._all,
      sales: num(activeAgg._sum.total),
      vendorCost: showProfit ? num(activeAgg._sum.vendorCost) : null,
      profit: showProfit ? num(activeAgg._sum.profit) : null,
    },
    staff: staffRows.map((s) => ({ id: s.createdById, name: s.createdByName })),
    branches,
    isSuperAdmin: user.role === UserRole.SUPER_ADMIN,
    showProfit,
  };
}

// ─── Dashboard: today's POS summary (management) ──────────────
export async function getPosTodaySummary(branchId?: string) {
  const user = await requirePermission("pos:receipts:profit");
  const scoped = getScopedBranchId(user, branchId);
  const { start, end } = getPKTDayPeriod();

  const agg = await prisma.guestReceipt.aggregate({
    where: {
      status: "ACTIVE",
      createdAt: { gte: start, lte: end },
      ...(scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } }),
    },
    _sum: { total: true, vendorCost: true, profit: true },
    _count: { _all: true },
  });
  const missingVendorCost = await prisma.guestReceipt.count({
    where: {
      status: "ACTIVE",
      vendorCost: null,
      createdAt: { gte: start, lte: end },
      ...(scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } }),
    },
  });

  return {
    sales: num(agg._sum.total),
    vendorCost: num(agg._sum.vendorCost),
    profit: num(agg._sum.profit),
    receipts: agg._count._all,
    missingVendorCost,
  };
}
