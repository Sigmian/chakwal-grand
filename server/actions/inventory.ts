// ============================================================
// server/actions/inventory.ts
// Inventory management + Point of Sale operations.
//
// All stock mutations go through createStockMovement() so
// there is a complete audit trail of every item in/out.
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import {
  addInventoryItemSchema,
  restockSchema,
  createSaleSchema,
  createProductSchema,
} from "@/lib/validation/schemas";
import type {
  AddInventoryItemInput,
  RestockInput,
  CreateSaleInput,
  CreateProductInput,
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
    where: scopedBranch ? { branchId: scopedBranch } : {},
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
    where: scopedBranch ? { branchId: scopedBranch } : {},
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

    if (input.currentStock > 0) {
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

    const previousStock = item.currentStock;
    const newStock      = previousStock + input.quantity;

    await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: input.inventoryItemId },
        data: {
          currentStock:    newStock,
          lastRestockedAt: new Date(),
          ...(input.purchasePrice ? { purchasePrice: input.purchasePrice } : {}),
        },
      }),
    ]);

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
    // Delete stock movements first (FK constraint)
    await prisma.stockMovement.deleteMany({ where: { inventoryItemId } });
    await prisma.inventoryItem.delete({ where: { id: inventoryItemId } });

    revalidatePath("/inventory/products");
    revalidatePath("/inventory");
    return { success: true };
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

      // Deduct stock for each item
      for (const lineItem of lineItems) {
        const item = inventoryItems.find(
          (i) => i?.id === lineItem.inventoryItemId
        )!;
        const newStock = item.currentStock - lineItem.quantity;

        await tx.inventoryItem.update({
          where: { id: lineItem.inventoryItemId },
          data:  { currentStock: newStock },
        });

        await tx.stockMovement.create({
          data: {
            inventoryItemId: lineItem.inventoryItemId,
            type:            "SALE",
            quantity:        -lineItem.quantity,
            previousStock:   item.currentStock,
            newStock,
            reference:       newSale.id,
            createdById:     user.id,
          },
        });
      }

      // If room-attached: update booking extra charges
      if (input.bookingId) {
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

    return { success: true, data: sale };
  } catch (error) {
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

        // Deduct from source
        await tx.inventoryItem.update({
          where: { id: fromItem.id },
          data:  { currentStock: { decrement: item.quantity } },
        });
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
