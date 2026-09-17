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
import { computeReceipt, allocateStockRevenue, formatReceiptNo, MAX_ITEMS, type ComputedReceipt } from "@/lib/pos/receipt-math";
import { sendPushToBranch } from "@/lib/push/send";
import type { Prisma, GuestReceiptStatus } from "@prisma/client";
import { UserRole, BookingStatus, type SessionUser } from "@/types";

const COUNTER_KEY = "guest_receipt";
// Prisma's default interactive-transaction limit is 5s. A receipt with several
// stock lines makes a handful of round-trips; on a slow link that exceeded 5s
// and the whole bill was rolled back. Give it headroom (it stays atomic).
const TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 };
const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

// ─── Types returned to the client (plain JSON only) ───────────
export interface ReceiptLine { name: string; qty: number; rate: number; amount: number; inventoryItemId?: string | null }

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
  /** Profit breakdown — managers/super admin only (pos:receipts:profit). */
  accounting: { customerCharged: number; vendorCost: number | null; stockCost: number; profit: number } | null;
  /** Values the editor needs to round-trip (anyone allowed to edit this receipt). */
  editValues: { customerCharged: number | null; vendorCost: number | null } | null;
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
    inventoryItemId: z.string().max(60).nullable().optional(),
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

// ─── Guest-house stock lines ──────────────────────────────────
// A line linked to an InventoryItem is the guest house's OWN stock. Unlike
// outside-vendor lines it is real product revenue, so it is recorded as an
// inventory Sale (counted by Finance exactly like the inventory POS) and its
// stock is deducted in the same transaction as the receipt.

type Tx = Prisma.TransactionClient;
type RawItems = GuestReceiptInput["items"];

/**
 * Price and validate stock lines from the DATABASE: the rate is always the
 * item's current selling price and the unit cost its purchase price — nothing
 * the browser sends for a stock line is trusted except the item id and qty.
 */
async function priceStockLines(branchId: string, items: RawItems): Promise<{ items: RawItems & { unitCost?: number }[]; error?: string }> {
  const ids = [...new Set(items.map((i) => i.inventoryItemId).filter((x): x is string => !!x))];
  if (ids.length === 0) return { items };
  const stock = await prisma.inventoryItem.findMany({
    where: { id: { in: ids } },
    select: { id: true, branchId: true, isActive: true, sellingPrice: true, purchasePrice: true, product: { select: { name: true } } },
  });
  const byId = new Map(stock.map((s) => [s.id, s]));
  for (const id of ids) {
    const s = byId.get(id);
    if (!s || s.branchId !== branchId) return { items, error: "A stock item doesn't belong to this branch. Remove it and pick it again." };
    if (!s.isActive) return { items, error: `${s.product.name} is no longer stocked.` };
  }
  return {
    items: items.map((i) => {
      const s = i.inventoryItemId ? byId.get(i.inventoryItemId) : undefined;
      return s ? { ...i, rate: Number(s.sellingPrice), unitCost: Number(s.purchasePrice) } : { ...i, inventoryItemId: null };
    }),
  };
}

/** Record the stock part of a receipt as an inventory Sale and deduct stock atomically. */
async function postStockSale(tx: Tx, userId: string, branchId: string, receipt: { id: string; receiptNo: string }, c: ComputedReceipt) {
  const lines = c.items.filter((i) => i.inventoryItemId);
  if (lines.length === 0) return;

  const sale = await tx.sale.create({
    data: {
      branchId,
      type: "WALK_IN",
      soldById: userId,
      totalAmount: allocateStockRevenue(c),
      notes: `Guest Orders POS ${receipt.receiptNo}`,
      guestReceiptId: receipt.id,
      lineItems: {
        createMany: { data: lines.map((l) => ({ inventoryItemId: l.inventoryItemId!, quantity: l.qty, unitPrice: l.rate, totalPrice: l.amount })) },
      },
    },
    select: { id: true },
  });

  const movements: Prisma.StockMovementCreateManyInput[] = [];
  for (const l of lines) {
    // Conditional decrement in ONE round-trip: only succeeds when enough stock
    // remains, so two receptionists can never sell the last bottle twice.
    const rows = await tx.$queryRaw<{ currentStock: number }[]>`
      UPDATE "InventoryItem"
         SET "currentStock" = "currentStock" - ${l.qty}, "updatedAt" = NOW()
       WHERE "id" = ${l.inventoryItemId} AND "currentStock" >= ${l.qty}
      RETURNING "currentStock"`;
    if (rows.length === 0) {
      const have = await tx.inventoryItem.findUnique({ where: { id: l.inventoryItemId! }, select: { currentStock: true } });
      throw new Error(`STOCK:${l.name}:${have?.currentStock ?? 0}`);
    }
    const newStock = rows[0].currentStock;
    movements.push({
      inventoryItemId: l.inventoryItemId!,
      type: "SALE",
      quantity: -l.qty,
      previousStock: newStock + l.qty,
      newStock,
      reference: sale.id,
      notes: `Guest Orders POS ${receipt.receiptNo}`,
      createdById: userId,
    });
  }
  await tx.stockMovement.createMany({ data: movements });
}

/**
 * Undo a receipt's stock effect without deleting anything: return the units to
 * stock and post a reversing (negative) Sale dated now, so Finance's cash view
 * nets to zero and the stock ledger shows the return.
 */
async function reverseStockSale(tx: Tx, userId: string, receipt: { id: string; receiptNo: string; branchId: string }, why: string) {
  const [lines, sales] = await Promise.all([
    tx.guestReceiptItem.findMany({ where: { receiptId: receipt.id, inventoryItemId: { not: null } } }),
    tx.sale.aggregate({ where: { guestReceiptId: receipt.id }, _sum: { totalAmount: true } }),
  ]);
  const net = num(sales._sum.totalAmount);
  if (lines.length === 0 && net === 0) return;

  const reversal = await tx.sale.create({
    data: {
      branchId: receipt.branchId,
      type: "WALK_IN",
      soldById: userId,
      totalAmount: -net,
      notes: `Reversal of Guest Orders POS ${receipt.receiptNo} (${why})`,
      guestReceiptId: receipt.id,
      lineItems: lines.length
        ? { createMany: { data: lines.map((l) => ({ inventoryItemId: l.inventoryItemId!, quantity: -num(l.qty), unitPrice: num(l.rate), totalPrice: -num(l.amount) })) } }
        : undefined,
    },
    select: { id: true },
  });

  const movements: Prisma.StockMovementCreateManyInput[] = [];
  for (const l of lines) {
    const qty = num(l.qty);
    const after = await tx.inventoryItem.update({
      where: { id: l.inventoryItemId! },
      data: { currentStock: { increment: qty } },
      select: { currentStock: true },
    });
    movements.push({
      inventoryItemId: l.inventoryItemId!,
      type: "RETURN",
      quantity: qty,
      previousStock: after.currentStock - qty,
      newStock: after.currentStock,
      reference: reversal.id,
      notes: `Guest Orders POS ${receipt.receiptNo} — ${why}`,
      createdById: userId,
    });
  }
  await tx.stockMovement.createMany({ data: movements });
}

function stockError(e: unknown): string | null {
  const m = (e as Error)?.message ?? "";
  if (!m.startsWith("STOCK:")) return null;
  const [, name, have] = m.split(":");
  return `Not enough stock for ${name} — only ${have} left. Lower the quantity or restock first.`;
}

/** Fire low-stock alerts for items this receipt touched (after commit, best-effort). */
function alertLowStock(branchId: string, items: { inventoryItemId: string | null }[]) {
  const ids = [...new Set(items.map((i) => i.inventoryItemId).filter((x): x is string => !!x))];
  if (!ids.length) return;
  void prisma.inventoryItem
    .findMany({ where: { id: { in: ids } }, select: { id: true, currentStock: true, minStockLevel: true, product: { select: { name: true, unit: true } } } })
    .then((rows) => {
      for (const r of rows) {
        if (r.minStockLevel > 0 && r.currentStock <= r.minStockLevel) {
          sendPushToBranch(branchId, {
            title: "⚠️ Low Stock Alert",
            body: `${r.product.name}: only ${r.currentStock} ${r.product.unit ?? "units"} remaining`,
            tag: `low-stock-${r.id}`,
          }).catch(() => {});
        }
      }
    })
    .catch(() => {});
}

// ─── Context for the New Receipt screen ───────────────────────
export async function getPosContext() {
  const user = await requirePermission("pos:receipts:create");
  const scoped = getScopedBranchId(user);

  const [branches, stays, stock] = await Promise.all([
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
    // Guest-house stock that can be billed on a receipt.
    prisma.inventoryItem.findMany({
      where: {
        isActive: true,
        ...(scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } }),
      },
      select: {
        id: true, branchId: true, sellingPrice: true, purchasePrice: true, currentStock: true,
        product: { select: { name: true, unit: true } },
      },
      orderBy: { product: { name: "asc" } },
      take: 500,
    }),
  ]);

  const seeProfit = canSeeProfit(user);
  return {
    cashierName: user.name,
    isSuperAdmin: user.role === UserRole.SUPER_ADMIN,
    canSeeProfit: seeProfit,
    defaultBranchId: user.branchId ?? branches[0]?.id ?? "",
    branches,
    stays: stays.map((s) => ({ bookingId: s.id, branchId: s.branchId, roomNo: s.room.number, guestName: s.customer.name })),
    stock: stock.map((s) => ({
      id: s.id,
      branchId: s.branchId,
      name: s.product.name,
      unit: s.product.unit,
      price: Number(s.sellingPrice),
      inStock: s.currentStock,
      // Purchase price is commercially sensitive — only sent to profit viewers.
      unitCost: seeProfit ? Number(s.purchasePrice) : null,
    })),
  };
}

// ─── Create ───────────────────────────────────────────────────
export async function createGuestReceipt(raw: GuestReceiptInput): Promise<ActionResult> {
  const user = await requirePermission("pos:receipts:create");
  const parsed = receiptSchema.safeParse(raw);
  if (!parsed.success) return { success: false, error: "Some receipt fields are invalid." };
  const input = parsed.data;

  const scope = await resolveBranch(user, input.branchId);
  if ("error" in scope) return { success: false, error: scope.error };

  const priced = await priceStockLines(scope.branchId, input.items);
  if (priced.error) return { success: false, error: priced.error };
  const c = computeReceipt({ ...input, items: priced.items });
  if (c.errors.length) return validationError(c.errors);

  // Only keep a booking link that genuinely belongs to this branch.
  let bookingId: string | null = null;
  if (input.bookingId) {
    const b = await prisma.booking.findFirst({ where: { id: input.bookingId, branchId: scope.branchId }, select: { id: true } });
    bookingId = b?.id ?? null;
  }

  let created: { id: string; receiptNo: string; createdAt: Date };
  try {
  created = await prisma.$transaction(async (tx) => {
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
        stockCost: c.stockCost,
        profit: c.profit,
        createdById: user.id,
        createdByName: user.name,
        items: {
          create: c.items.map((i) => ({
            position: i.position, name: i.name, qty: i.qty, rate: i.rate, amount: i.amount,
            inventoryItemId: i.inventoryItemId, unitCost: i.unitCost,
          })),
        },
      },
      select: { id: true, receiptNo: true, createdAt: true },
    });

    await postStockSale(tx, user.id, scope.branchId, receipt, c);

    await tx.activityLog.create({
      data: {
        userId: user.id,
        action: "POS_RECEIPT_CREATED",
        entity: "GuestReceipt",
        entityId: receipt.id,
        branchId: scope.branchId,
        description: `Created POS receipt ${receipt.receiptNo} — PKR ${c.total}`,
        metadata: { total: c.total, items: c.items.length, stockLines: c.items.filter((i) => i.inventoryItemId).length, roomNo: emptyToNull(input.roomNo) } as never,
      },
    });
    return receipt;
  }, TX_OPTIONS);
  } catch (e) {
    const msg = stockError(e);
    if (msg) return { success: false, error: msg };
    throw e;
  }

  alertLowStock(scope.branchId, c.items);
  revalidatePath("/pos/history");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
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
  const priced = await priceStockLines(existing.branchId, input.items);
  if (priced.error) return { success: false, error: priced.error };
  const c = computeReceipt({ ...input, items: priced.items });
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
        stockCost: c.stockCost,
        profit: c.profit,
        updatedById: user.id,
        updatedByName: user.name,
      },
    });
    if (res.count !== 1) throw new Error("STALE");

    // Stock: return what the old version took, then take what the new one needs
    // (in that order, so the edit can reuse the units it is giving back).
    await reverseStockSale(tx, user.id, existing, "edited");
    await tx.guestReceiptItem.deleteMany({ where: { receiptId: id } });
    await tx.guestReceiptItem.createMany({
      data: c.items.map((i) => ({
        receiptId: id, position: i.position, name: i.name, qty: i.qty, rate: i.rate, amount: i.amount,
        inventoryItemId: i.inventoryItemId, unitCost: i.unitCost,
      })),
    });
    await postStockSale(tx, user.id, existing.branchId, existing, c);
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
  }, TX_OPTIONS);
  } catch (e) {
    if ((e as Error).message === "STALE") {
      return { success: false, error: "This receipt was changed or cancelled by someone else. Reload and try again." };
    }
    const msg = stockError(e);
    if (msg) return { success: false, error: msg };
    throw e;
  }

  alertLowStock(existing.branchId, c.items);
  revalidatePath("/inventory");
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
    // Put any guest-house stock back and reverse its revenue.
    await reverseStockSale(tx, user.id, existing, "cancelled");
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
  }, TX_OPTIONS);
  } catch (e) {
    if ((e as Error).message === "ALREADY_CANCELLED") return { success: false, error: "This receipt is already cancelled." };
    throw e;
  }

  revalidatePath("/inventory");
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

  const showAccounting = canSeeProfit(user);
  const editable = canEditReceipt(user, r);
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
    items: r.items.map((i) => ({ name: i.name, qty: num(i.qty), rate: num(i.rate), amount: num(i.amount), inventoryItemId: i.inventoryItemId })),
    subtotal: num(r.subtotal),
    deliveryCharges: num(r.deliveryCharges),
    otherCharges: num(r.otherCharges),
    discount: num(r.discount),
    total: num(r.total),
    accounting: showAccounting
      ? { customerCharged: num(r.customerCharged), vendorCost: r.vendorCost === null ? null : num(r.vendorCost), stockCost: num(r.stockCost), profit: num(r.profit) }
      : null,
    editValues: editable
      ? {
          customerCharged: num(r.customerCharged) !== num(r.total) ? num(r.customerCharged) : null,
          vendorCost: r.vendorCost === null ? null : num(r.vendorCost),
        }
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
      include: { branch: { select: { name: true } }, items: { select: { inventoryItemId: true } } },
    }),
    prisma.guestReceipt.count({ where }),
    prisma.guestReceipt.aggregate({
      where: { ...where, status: "ACTIVE" },
      _sum: { total: true, vendorCost: true, stockCost: true, profit: true },
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
      vendorCostMissing: r.vendorCost === null && r.items.some((i) => !i.inventoryItemId),
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
      vendorCost: showProfit ? num(activeAgg._sum.vendorCost) + num(activeAgg._sum.stockCost) : null,
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
    _sum: { total: true, vendorCost: true, stockCost: true, profit: true },
    _count: { _all: true },
  });
  const missingVendorCost = await prisma.guestReceipt.count({
    where: {
      status: "ACTIVE",
      vendorCost: null,
      // Only bills with outside-vendor lines need a vendor cost; all-stock bills don't.
      items: { some: { inventoryItemId: null } },
      createdAt: { gte: start, lte: end },
      ...(scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } }),
    },
  });

  return {
    sales: num(agg._sum.total),
    vendorCost: num(agg._sum.vendorCost),
    stockCost: num(agg._sum.stockCost),
    profit: num(agg._sum.profit),
    receipts: agg._count._all,
    missingVendorCost,
  };
}
