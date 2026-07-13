// ============================================================
// app/(dashboard)/inventory/products/page.tsx
// Inventory management — stock levels, low stock alerts
// ============================================================

import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getInventory, getLowStockAlerts, getProductCategories } from "@/server/actions/inventory";
import { PageHeader, SectionHeader, EmptyState, Badge } from "@/components/shared";
import { StockTable } from "@/features/inventory/components/StockTable";
import { AddProductDialog } from "@/features/inventory/components/AddProductDialog";
import { Package, AlertTriangle, TrendingDown } from "lucide-react";
import { cn, formatPKR } from "@/utils";
import prisma from "@/lib/db/prisma";

export const metadata = { title: "Inventory" };

export default async function InventoryProductsPage() {
  const user     = await requirePermission("inventory:read");
  const branchId = getScopedBranchId(user);
  const canEdit  = hasPermission(user.role, "inventory:update");
  const canCreate = hasPermission(user.role, "inventory:create");

  const [inventory, alerts, categories, branches] = await Promise.all([
    getInventory(branchId),
    getLowStockAlerts(branchId),
    getProductCategories(),
    prisma.branch.findMany({ where: { companyId: user.companyId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  // Group by category
  const byCategory: Record<string, typeof inventory> = {};
  for (const item of inventory) {
    const cat = item.product?.category?.name ?? "Uncategorized";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(item);
  }

  const totalValue = inventory.reduce((s, i) => s + i.sellingPrice * i.currentStock, 0);
  const lowCount   = inventory.filter((i) => i.isLowStock).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Inventory"
          subtitle={`${inventory.length} products tracked · Total value: ${formatPKR(totalValue)}`}
        />
        {canCreate && (
          <AddProductDialog
            categories={categories}
            branches={branches}
            defaultBranchId={branchId ?? undefined}
          />
        )}
      </div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-400">
              {alerts.length} item{alerts.length !== 1 ? "s" : ""} running low
            </p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              {alerts.slice(0, 3).map((a: any) => a.product?.name).join(", ")}
              {alerts.length > 3 ? ` +${alerts.length - 3} more` : ""}
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Products", value: inventory.length, icon: Package,       color: "text-foreground" },
          { label: "Low Stock",      value: lowCount,         icon: AlertTriangle, color: "text-amber-400"  },
          { label: "Total Value",    value: formatPKR(totalValue), icon: TrendingDown, color: "text-gold-400" },
          { label: "Categories",     value: Object.keys(byCategory).length, icon: Package, color: "text-blue-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-luxury p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={cn("w-4 h-4", color)} />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
            <p className={cn("text-xl font-bold font-serif", color)}>{value}</p>
          </div>
        ))}
      </div>

      {inventory.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8" />}
          title="No inventory yet"
          body="Click 'Add Product' to start tracking your stock levels."
        />
      ) : (
        Object.entries(byCategory).map(([category, items]) => (
          <div key={category} className="card-luxury overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-gold-gradient rounded-full" />
                <h3 className="font-bold text-foreground">{category}</h3>
                <Badge variant="slate">{items.length} items</Badge>
              </div>
              <span className="text-sm text-muted-foreground">
                {formatPKR(items.reduce((s, i) => s + i.sellingPrice * i.currentStock, 0))} value
              </span>
            </div>
            <StockTable items={items} canEdit={canEdit} />
          </div>
        ))
      )}
    </div>
  );
}
