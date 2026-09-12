// ============================================================
// server/actions/inventory.ts
// Inventory management + Point of Sale operations.
//
// All stock mutations go through createStockMovement() so
// there is a complete audit trail of every item in/out.
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId, canAccessBranch } from "@/lib/auth/session";
import { sendPushToBranch } from "@/lib/push/send";
import { logActivity } from "@/lib/activity/log";
import {
  addInventoryItemSchema,
  restockSchema,
  createSaleSchema,
  createProductSchema,
  createProductWithStockSchema,
  stockMovementSchema,
  STOCK_IN_TYPES,
} from "@/lib/validation/schemas";
import type {
  AddInventoryItemInput,
  RestockInput,
  CreateSaleInput,
  CreateProductInput,
  CreateProductWithStockInput,
  StockMovementInput,
} from "@/lib/validation/schemas";

// ─── Helper: record a stock movement ─────────────────────────
async function createStockMovement(params: {
  inventoryItemId: string;
  type:            string;
  quantity:        number;  // Positive = stock added, negative = stock removed
  previousStock:   number;
  newStock:        number;
  reference?:      string;
  notes?:          string;
  createdById?:    string;
}) {
  await prisma.stockMovement.create({ data: params });
}

// ─── GET INVENTORY ────────────────────────────────────────────
export async function getInventory(branchId?: string) {
  const user         = await requirePermission("inventory:read");
  const scopedBranch = getScopedBranchId(user, branchId);

  const items = await prisma.inventoryItem.findMany({
    where: {
      isActive: true,
      ...(scopedBranch ? { branchId: scopedBranch } : { branch: { companyId: user.companyId } }),
    },
    include: {
      product: {
        include: { category: true },
      },
    },
    orderBy: [
      { product: { category: { name: "asc" } } },
      { product: { name: "asc" } },
    ],
  });

  // Attach computed fields
  return items.map((item) => ({
    ...item,
    purchasePrice:  Number(item.purchasePrice),
    sellingPrice:   Number(item.sellingPrice),
    profitPerUnit:  Number(item.sellingPrice) - Number(item.purchasePrice),
    profitMargin:
      Number(item.sellingPrice) > 0
        ? Math.round(
            ((Number(item.sellingPrice) - Number(item.purchasePrice)) /
              Number(item.sellingPrice)) *
              100
          )
        : 0,
    isLowStock:  item.currentStock <= item.minStockLevel,
    isExpired:   item.expiresAt ? item.expiresAt < new Date() : false,
  }));
}

// ─── GET LOW STOCK ALERTS ─────────────────────────────────────
export async function getLowStockAlerts(branchId?: string) {
  const user         = await requirePermission("inventory:read");
  const scopedBranch = getScopedBranchId(user, branchId);

  // Fetch all then filter by per-item minStockLevel (Prisma can't compare columns in WHERE)
  const items = await prisma.inventoryItem.findMany({
    where: {
      isActive: true,
      ...(scopedBranch ? { branchId: scopedBranch } : { branch: { companyId: user.companyId } }),
    },
    include: {
      product: { select: { name: true, unit: true } },
      branch:  { select: { name: true } },
    },
    orderBy: { currentStock: "asc" },
  });
  return items.filter(item => item.currentStock <= item.minStockLevel);
}

// ─── ADD PRODUCT ─────────────────────────────────────────────
export async function createProduct(rawInput: CreateProductInput) {
  await requirePermission("inventory:create");

  const result = createProductSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  try {
    const product = await prisma.product.create({ data: result.data });
    revalidatePath("/inventory/products");
    return { success: true, data: product };
  } catch (error) {
    console.error("[createProduct]", error);
    return { success: false, error: "Failed to create product" };
  }
}

// ─── ADD PRODUCT + STOCK IT (atomic, deduped) ────────────────
// Replaces the old two-step client flow (createProduct → addInventoryItem),
// which could create duplicate products and orphaned rows. This runs in one
// transaction: reuse the catalog product if it already exists, refuse a
// duplicate at the same branch, and log the opening-stock movement.
export async function createProductWithStock(rawInput: CreateProductWithStockInput) {
  const user = await requirePermission("inventory:create");

  const parsed = createProductWithStockSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };
  const input = parsed.data;

  const branchId = getScopedBranchId(user, input.branchId);
  if (!branchId) return { success: false, error: "You don't have access to that branch." };

  const name = input.name.trim();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Reuse an existing catalog product (same category + case-insensitive name)
      // so the same item is never duplicated.
      let product = await tx.product.findFirst({
        where: { categoryId: input.categoryId, name: { equals: name, mode: "insensitive" } },
        select: { id: true, name: true },
      });
      if (!product) {
        product = await tx.product.create({
          data: {
            name,
            brand:       input.brand?.trim() || null,
            categoryId:  input.categoryId,
            unit:        input.unit,
            description: input.description?.trim() || null,
            createdById: user.id,
          },
          select: { id: true, name: true },
        });
      }

      // One inventory row per (product, branch). An active row means this is a
      // duplicate add — refuse and point the user at Restock. An archived row
      // is brought back to life instead of creating a second one.
      const existing = await tx.inventoryItem.findUnique({
        where:  { productId_branchId: { productId: product.id, branchId } },
        select: { id: true, isActive: true, currentStock: true },
      });
      if (existing?.isActive) throw new Error("DUPLICATE_AT_BRANCH");

      if (existing && !existing.isActive) {
        const revived = await tx.inventoryItem.update({
          where: { id: existing.id },
          data: {
            isActive:        true,
            purchasePrice:   input.purchasePrice,
            sellingPrice:    input.sellingPrice,
            currentStock:    input.currentStock,
            minStockLevel:   input.minStockLevel,
            lastRestockedAt: input.currentStock > 0 ? new Date() : null,
          },
          select: { id: true, currentStock: true },
        });
        if (input.currentStock !== existing.currentStock) {
          await tx.stockMovement.create({
            data: {
              inventoryItemId: revived.id,
              type:            "ADJUSTMENT_IN",
              quantity:        input.currentStock - existing.currentStock,
              previousStock:   existing.currentStock,
              newStock:        input.currentStock,
              notes:           "Reactivated product",
              createdById:     user.id,
            },
          });
        }
        return { productName: product.name, stock: revived.currentStock, unit: input.unit };
      }

      const item = await tx.inventoryItem.create({
        data: {
          productId:       product.id,
          branchId,
          purchasePrice:   input.purchasePrice,
          sellingPrice:    input.sellingPrice,
          currentStock:    input.currentStock,
          minStockLevel:   input.minStockLevel,
          lastRestockedAt: input.currentStock > 0 ? new Date() : null,
        },
        select: { id: true, currentStock: true },
      });

      if (input.currentStock > 0) {
        await tx.stockMovement.create({
          data: {
            inventoryItemId: item.id,
            type:            "RESTOCK",
            quantity:        input.currentStock,
            previousStock:   0,
            newStock:        input.currentStock,
            notes:           "Opening stock",
            createdById:     user.id,
          },
        });
      }

      return { productName: product.name, stock: item.currentStock, unit: input.unit };
    });

    revalidatePath("/inventory/products");
    revalidatePath("/inventory");
    await logActivity({
      userId:      user.id,
      action:      "PRODUCT_ADDED",
      entity:      "Inventory",
      branchId,
      description: `Added product ${result.productName}${result.stock > 0 ? ` with ${result.stock} ${result.unit} opening stock` : ""}`,
    });
    return { success: true, data: result };
  } catch (error) {
    if ((error as Error).message === "DUPLICATE_AT_BRANCH") {
      return { success: false, error: "This product is already stocked at this branch — use “Restock” to add more." };
    }
    console.error("[createProductWithStock]", error);
    return { success: false, error: "Failed to add product" };
  }
}

// ─── MANUAL STOCK MOVEMENT (stock in / stock out with a reason) ─
export async function recordStockMovement(rawInput: StockMovementInput) {
  const parsed = stockMovementSchema.safeParse(rawInput);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message };
  const input = parsed.data;

  const isIn = (STOCK_IN_TYPES as readonly string[]).includes(input.type);
  // Stock-in is a restock; stock-out (issue / write-off / adjustment) is a
  // management action. Both are enforced server-side, not by hiding buttons.
  const user = await requirePermission(isIn ? "inventory:restock" : "inventory:update");

  try {
    const item = await prisma.inventoryItem.findUnique({
      where:   { id: input.inventoryItemId },
      include: { product: { select: { name: true, unit: true } } },
    });
    if (!item) return { success: false, error: "Item not found" };
    if (!canAccessBranch(user, item.branchId)) return { success: false, error: "Branch access denied" };

    const newStock = await prisma.$transaction(async (tx) => {
      if (isIn) {
        const updated = await tx.inventoryItem.update({
          where: { id: item.id },
          data:  { currentStock: { increment: input.quantity }, lastRestockedAt: new Date() },
          select: { currentStock: true },
        });
        await tx.stockMovement.create({
          data: {
            inventoryItemId: item.id, type: input.type, quantity: input.quantity,
            previousStock: updated.currentStock - input.quantity, newStock: updated.currentStock,
            notes: input.notes, createdById: user.id,
          },
        });
        return updated.currentStock;
      }
      // Stock out — conditional decrement blocks negative stock under concurrency.
      const dec = await tx.inventoryItem.updateMany({
        where: { id: item.id, currentStock: { gte: input.quantity } },
        data:  { currentStock: { decrement: input.quantity } },
      });
      if (dec.count === 0) throw new Error("INSUFFICIENT_STOCK");
      const updated = await tx.inventoryItem.findUnique({ where: { id: item.id }, select: { currentStock: true } });
      const ns = updated!.currentStock;
      await tx.stockMovement.create({
        data: {
          inventoryItemId: item.id, type: input.type, quantity: -input.quantity,
          previousStock: ns + input.quantity, newStock: ns,
          notes: input.notes, createdById: user.id,
        },
      });
      return ns;
    });

    revalidatePath("/inventory");
    revalidatePath("/inventory/products");
    revalidatePath("/inventory/ledger");

    await logActivity({
      userId:      user.id,
      action:      isIn ? "STOCK_IN" : "STOCK_OUT",
      entity:      "Inventory",
      entityId:    item.id,
      branchId:    item.branchId,
      description: `${isIn ? "Added" : "Issued"} ${input.quantity} × ${item.product.name} (${input.type.replace(/_/g, " ").toLowerCase()})`,
      metadata:    { type: input.type, quantity: input.quantity, newStock },
    });

    return {
      success: true,
      data: { productName: item.product.name, unit: item.product.unit, quantity: input.quantity, newStock, direction: isIn ? "in" : "out" },
    };
  } catch (error) {
    if ((error as Error).message === "INSUFFICIENT_STOCK") {
      return { success: false, error: `Not enough stock to remove ${input.quantity}. Please refresh and check the current level.` };
    }
    console.error("[recordStockMovement]", error);
    return { success: false, error: "Failed to record stock movement" };
  }
}

// ─── STOCK LEDGER (inventory history) ────────────────────────
export interface LedgerRow {
  id: string; productName: string; unit: string; branch: string;
  type: string; quantity: number; previousStock: number; newStock: number;
  notes: string | null; staff: string; createdAt: string;
}

export async function getStockLedger(opts?: {
  branchId?: string; productId?: string; type?: string; from?: string; to?: string; limit?: number;
}): Promise<LedgerRow[]> {
  const user   = await requirePermission("inventory:read");
  const scoped = getScopedBranchId(user, opts?.branchId);

  const itemFilter: Prisma.InventoryItemWhereInput = scoped
    ? { branchId: scoped }
    : { branch: { companyId: user.companyId } };
  if (opts?.productId) itemFilter.productId = opts.productId;

  const where: Prisma.StockMovementWhereInput = { inventoryItem: itemFilter };
  if (opts?.type) where.type = opts.type;
  if (opts?.from || opts?.to) {
    where.createdAt = {
      ...(opts.from ? { gte: new Date(`${opts.from}T00:00:00`) } : {}),
      ...(opts.to   ? { lte: new Date(`${opts.to}T23:59:59`) } : {}),
    };
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(opts?.limit ?? 200, 500),
    include: {
      inventoryItem: {
        select: { product: { select: { name: true, unit: true } }, branch: { select: { name: true } } },
      },
    },
  });

  const ids = [...new Set(movements.map((m) => m.createdById).filter(Boolean))] as string[];
  const users = ids.length
    ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(users.map((u) => [u.id, u.name] as const));

  return movements.map((m) => ({
    id:            m.id,
    productName:   m.inventoryItem.product.name,
    unit:          m.inventoryItem.product.unit,
    branch:        m.inventoryItem.branch.name,
    type:          m.type,
    quantity:      m.quantity,
    previousStock: m.previousStock,
    newStock:      m.newStock,
    notes:         m.notes,
    staff:         m.createdById ? (nameById.get(m.createdById) ?? "—") : "System",
    createdAt:     m.createdAt.toISOString(),
  }));
}

// ─── UPDATE PRODUCT IMAGE ─────────────────────────────────────
export async function updateProductImage(productId: string, imageUrl: string | null) {
  await requirePermission("inventory:update");
  await prisma.product.update({ where: { id: productId }, data: { image: imageUrl } });
  revalidatePath("/inventory/products");
  return { success: true };
}

// ─── ADD INVENTORY ITEM (stock a product in a branch) ────────
export async function addInventoryItem(rawInput: AddInventoryItemInput) {
  const user = await requirePermission("inventory:create");

  const result = addInventoryItemSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }
  const input = result.data;

  const branchId = getScopedBranchId(user, input.branchId);
  if (!branchId) return { success: false, error: "Branch access denied" };

  try {
    // Check existence first so we know whether to log an initial stock movement.
    // The upsert update path does NOT change currentStock, so recording a stock
    // movement on update would create a phantom "Initial stock" restock in the
    // audit trail that never actually changed the inventory count.
    const existing = await prisma.inventoryItem.findUnique({
      where: { productId_branchId: { productId: input.productId, branchId } },
      select: { id: true },
    });
    const isNew = !existing;

    const item = await prisma.inventoryItem.upsert({
      where: {
        productId_branchId: { productId: input.productId, branchId },
      },
      create: {
        productId:     input.productId,
        branchId,
        purchasePrice: input.purchasePrice,
        sellingPrice:  input.sellingPrice,
        currentStock:  input.currentStock,
        minStockLevel: input.minStockLevel,
        expiresAt:     input.expiresAt ? new Date(input.expiresAt) : null,
        supplierName:  input.supplierName,
        supplierPhone: input.supplierPhone,
        lastRestockedAt: input.currentStock > 0 ? new Date() : null,
      },
      update: {
        purchasePrice: input.purchasePrice,
        sellingPrice:  input.sellingPrice,
        minStockLevel: input.minStockLevel,
        expiresAt:     input.expiresAt ? new Date(input.expiresAt) : null,
        supplierName:  input.supplierName,
        supplierPhone: input.supplierPhone,
      },
    });

    if (isNew && input.currentStock > 0) {
      await createStockMovement({
        inventoryItemId: item.id,
        type:            "RESTOCK",
        quantity:        input.currentStock,
        previousStock:   0,
        newStock:        input.currentStock,
        notes:           "Initial stock",
        createdById:     user.id,
      });
    }

    revalidatePath("/inventory");
    return { success: true, data: item };
  } catch (error) {
    console.error("[addInventoryItem]", error);
    return { success: false, error: "Failed to add inventory item" };
  }
}

// ─── RESTOCK ─────────────────────────────────────────────────
export async function restockItem(rawInput: RestockInput) {
  const user = await requirePermission("inventory:restock");

  const result = restockSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }
  const input = result.data;

  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: input.inventoryItemId },
    });
    if (!item) return { success: false, error: "Item not found" };

    // Use increment inside the transaction — computing newStock = previousStock + qty
    // outside a transaction risks two concurrent restocks both reading the same
    // previousStock and writing the same absolute value, silently losing one restock.
    const updated = await prisma.inventoryItem.update({
      where: { id: input.inventoryItemId },
      data: {
        currentStock:    { increment: input.quantity },
        lastRestockedAt: new Date(),
        ...(input.purchasePrice ? { purchasePrice: input.purchasePrice } : {}),
      },
      select: { currentStock: true },
    });

    const newStock      = updated.currentStock;
    const previousStock = newStock - input.quantity;

    await createStockMovement({
      inventoryItemId: input.inventoryItemId,
      type:            "RESTOCK",
      quantity:        input.quantity,
      previousStock,
      newStock,
      notes:           input.notes,
      createdById:     user.id,
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("[restockItem]", error);
    return { success: false, error: "Failed to restock item" };
  }
}

// ─── UPDATE INVENTORY ITEM (name, prices, min stock) ─────────
export async function updateInventoryItem(input: {
  inventoryItemId:  string;
  productName?:     string;
  purchasePrice?:   number;
  sellingPrice?:    number;
  minStockLevel?:   number;
  isCanteenVisible?: boolean;
}) {
  await requirePermission("inventory:update");
  try {
    const updates: Record<string, unknown> = {};
    if (input.purchasePrice !== undefined) updates.purchasePrice = input.purchasePrice;
    if (input.sellingPrice  !== undefined) updates.sellingPrice  = input.sellingPrice;
    if (input.minStockLevel !== undefined) updates.minStockLevel = input.minStockLevel;

    if (Object.keys(updates).length) {
      await prisma.inventoryItem.update({
        where: { id: input.inventoryItemId },
        data:  updates,
      });
    }

    // Product-level fields
    if (input.productName !== undefined || input.isCanteenVisible !== undefined) {
      const item = await prisma.inventoryItem.findUnique({
        where:  { id: input.inventoryItemId },
        select: { productId: true },
      });
      if (item?.productId) {
        const productUpdates: Record<string, unknown> = {};
        if (input.productName     !== undefined) productUpdates.name             = input.productName;
        if (input.isCanteenVisible !== undefined) productUpdates.isCanteenVisible = input.isCanteenVisible;
        await prisma.product.update({ where: { id: item.productId }, data: productUpdates });
      }
    }

    revalidatePath("/inventory/products");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("[updateInventoryItem]", error);
    return { success: false, error: "Failed to update item" };
  }
}

// ─── GET PRODUCT CATEGORIES ──────────────────────────────────
export async function getProductCategories() {
  await requirePermission("inventory:read");
  return prisma.productCategory.findMany({ orderBy: { sortOrder: "asc" } });
}

// ─── DELETE INVENTORY ITEM ────────────────────────────────────
export async function deleteInventoryItem(inventoryItemId: string) {
  await requirePermission("inventory:create");

  try {
    const item = await prisma.inventoryItem.findUnique({
      where:  { id: inventoryItemId },
      select: { id: true, _count: { select: { stockMovements: true, saleLineItems: true } } },
    });
    if (!item) return { success: false, error: "Item not found" };

    // Preserve the stock ledger: if the item has any history, archive it
    // (hide from active inventory) instead of erasing its movements. Only a
    // pristine item with no history is truly removed.
    const hasHistory = item._count.stockMovements > 0 || item._count.saleLineItems > 0;

    if (hasHistory) {
      await prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data:  { isActive: false },
      });
    } else {
      await prisma.inventoryItem.delete({ where: { id: inventoryItemId } });
    }

    revalidatePath("/inventory/products");
    revalidatePath("/inventory");
    return { success: true, archived: hasHistory };
  } catch (error) {
    console.error("[deleteInventoryItem]", error);
    return { success: false, error: "Failed to delete item" };
  }
}

// ─── CREATE SALE (POS) ───────────────────────────────────────
export async function createSale(rawInput: CreateSaleInput) {
  const user = await requirePermission("inventory:pos_sell");

  const result = createSaleSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }
  const input = result.data;

  const branchId = getScopedBranchId(user, input.branchId);
  if (!branchId) return { success: false, error: "Branch access denied" };

  try {
    // 1. Fetch all inventory items and validate stock
    const inventoryItems = await Promise.all(
      input.items.map((i) =>
        prisma.inventoryItem.findUnique({ where: { id: i.inventoryItemId } })
      )
    );

    for (let idx = 0; idx < input.items.length; idx++) {
      const item     = inventoryItems[idx];
      const requested = input.items[idx].quantity;
      if (!item) {
        return { success: false, error: `Item not found: ${input.items[idx].inventoryItemId}` };
      }
      if (item.currentStock < requested) {
        return {
          success: false,
          error:   `Insufficient stock. Available: ${item.currentStock}, Requested: ${requested}`,
        };
      }
    }

    // 2. Calculate totals
    const lineItems = input.items.map((inputItem, idx) => {
      const item       = inventoryItems[idx]!;
      const unitPrice  = Number(item.sellingPrice);
      const totalPrice = unitPrice * inputItem.quantity;
      return {
        inventoryItemId: inputItem.inventoryItemId,
        quantity:        inputItem.quantity,
        unitPrice,
        totalPrice,
      };
    });

    const totalAmount = lineItems.reduce((sum, l) => sum + l.totalPrice, 0);

    // 3. Create sale + reduce stock (in one transaction)
    const sale = await prisma.$transaction(async (tx) => {
      // Create the sale
      const newSale = await tx.sale.create({
        data: {
          branchId,
          bookingId: input.bookingId || null,
          type:      input.type,
          soldById:  user.id,
          totalAmount,
          notes:     input.notes,
          lineItems: { createMany: { data: lineItems } },
        },
        include: { lineItems: true },
      });

      // Deduct stock atomically — the conditional updateMany only decrements when
      // enough stock remains, so concurrent sales can't oversell below zero.
      for (const lineItem of lineItems) {
        const dec = await tx.inventoryItem.updateMany({
          where: { id: lineItem.inventoryItemId, currentStock: { gte: lineItem.quantity } },
          data:  { currentStock: { decrement: lineItem.quantity } },
        });
        if (dec.count === 0) throw new Error("INSUFFICIENT_STOCK");

        const updated = await tx.inventoryItem.findUnique({
          where:  { id: lineItem.inventoryItemId },
          select: { currentStock: true },
        });
        const newStock = updated!.currentStock;

        await tx.stockMovement.create({
          data: {
            inventoryItemId: lineItem.inventoryItemId,
            type:            "SALE",
            quantity:        -lineItem.quantity,
            previousStock:   newStock + lineItem.quantity,
            newStock,
            reference:       newSale.id,
            createdById:     user.id,
          },
        });
      }

      // If room-attached: validate the booking belongs to the same branch before adding charges
      if (input.bookingId) {
        const booking = await tx.booking.findUnique({
          where:  { id: input.bookingId },
          select: { branchId: true },
        });
        if (!booking || booking.branchId !== branchId) {
          throw new Error("BOOKING_BRANCH_MISMATCH");
        }
        await tx.booking.update({
          where: { id: input.bookingId },
          data:  { extraCharges: { increment: totalAmount } },
        });
      }

      return newSale;
    });

    revalidatePath("/inventory");
    revalidatePath("/inventory/pos");
    if (input.bookingId) {
      revalidatePath(`/bookings/${input.bookingId}`);
    }

    // Fire low-stock push notifications (non-blocking)
    Promise.all(
      input.items.map(async (saleItem) => {
        const inv = await prisma.inventoryItem.findUnique({
          where: { id: saleItem.inventoryItemId },
          include: { product: { select: { name: true, unit: true } } },
        });
        if (inv && inv.currentStock <= inv.minStockLevel && inv.minStockLevel > 0) {
          sendPushToBranch(branchId!, {
            title: "⚠️ Low Stock Alert",
            body:  `${inv.product.name}: only ${inv.currentStock} ${inv.product.unit ?? "units"} remaining`,
            tag:   `low-stock-${inv.id}`,
          }).catch(() => {/* ignore push errors */});
        }
      })
    ).catch(() => {/* ignore */});

    return { success: true, data: sale };
  } catch (error) {
    const msg = (error as Error)?.message;
    if (msg === "INSUFFICIENT_STOCK") {
      return { success: false, error: "Insufficient stock — another sale may have just used the last units. Please refresh and retry." };
    }
    if (msg === "BOOKING_BRANCH_MISMATCH") {
      return { success: false, error: "Booking does not belong to this branch." };
    }
    console.error("[createSale]", error);
    return { success: false, error: "Failed to process sale" };
  }
}

// ─── STOCK TRANSFER ──────────────────────────────────────────
export async function createStockTransfer(params: {
  fromBranchId: string;
  toBranchId:   string;
  items:        Array<{ productId: string; quantity: number }>;
  notes?:       string;
}) {
  const user = await requirePermission("inventory:transfer");

  try {
    const transfer = await prisma.$transaction(async (tx) => {
      // Create the transfer record
      const newTransfer = await tx.stockTransfer.create({
        data: {
          fromBranchId:  params.fromBranchId,
          toBranchId:    params.toBranchId,
          status:        "PENDING",
          requestedById: user.id,
          notes:         params.notes,
          items: {
            createMany: {
              data: params.items.map((i) => ({
                productId: i.productId,
                quantity:  i.quantity,
              })),
            },
          },
        },
        include: { items: true },
      });

      return newTransfer;
    });

    revalidatePath("/inventory");
    return { success: true, data: transfer };
  } catch (error) {
    console.error("[createStockTransfer]", error);
    return { success: false, error: "Failed to create stock transfer" };
  }
}

// ─── APPROVE STOCK TRANSFER ───────────────────────────────────
export async function approveStockTransfer(transferId: string) {
  const user = await requirePermission("inventory:transfer");

  try {
    const transfer = await prisma.stockTransfer.findUnique({
      where:   { id: transferId },
      include: { items: true },
    });
    if (!transfer) return { success: false, error: "Transfer not found" };
    if (!canAccessBranch(user, transfer.fromBranchId)) {
      return { success: false, error: "Access denied" };
    }
    if (transfer.status !== "PENDING") {
      return { success: false, error: "Transfer is not in pending status" };
    }

    await prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        // Find inventory items in both branches
        const fromItem = await tx.inventoryItem.findFirst({
          where: { productId: item.productId, branchId: transfer.fromBranchId },
        });
        const toItem = await tx.inventoryItem.findFirst({
          where: { productId: item.productId, branchId: transfer.toBranchId },
        });

        if (!fromItem || fromItem.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        // Conditional deduct: the where-clause re-checks the stock level inside
        // the transaction, preventing two concurrent transfers from both passing
        // the check above and driving stock negative.
        const deducted = await tx.inventoryItem.updateMany({
          where: { id: fromItem.id, currentStock: { gte: item.quantity } },
          data:  { currentStock: { decrement: item.quantity } },
        });
        if (deducted.count === 0) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }

        await tx.stockMovement.create({
          data: {
            inventoryItemId: fromItem.id,
            type:            "TRANSFER_OUT",
            quantity:        -item.quantity,
            previousStock:   fromItem.currentStock,
            newStock:        fromItem.currentStock - item.quantity,
            reference:       transferId,
            createdById:     user.id,
          },
        });

        // Add to destination
        if (toItem) {
          await tx.inventoryItem.update({
            where: { id: toItem.id },
            data:  { currentStock: { increment: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              inventoryItemId: toItem.id,
              type:            "TRANSFER_IN",
              quantity:        item.quantity,
              previousStock:   toItem.currentStock,
              newStock:        toItem.currentStock + item.quantity,
              reference:       transferId,
              createdById:     user.id,
            },
          });
        }
      }

      // Mark transfer complete
      await tx.stockTransfer.update({
        where: { id: transferId },
        data: {
          status:      "COMPLETED",
          approvedById: user.id,
          transferredAt: new Date(),
        },
      });
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transfer failed";
    return { success: false, error: message };
  }
}
