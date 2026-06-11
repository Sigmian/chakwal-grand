// ============================================================
// app/(dashboard)/inventory/products/page.tsx
// Inventory management — stock levels, low stock alerts
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getInventory, getLowStockAlerts } from "@/server/actions/inventory";
import { getScopedBranchId } from "@/lib/auth/session";
import { PageHeader, SectionHeader, EmptyState, Badge } from "@/components/shared";
import { StockTable } from "@/features/inventory/components/StockTable";
import { Package, AlertTriangle, TrendingDown } from "lucide-react";
import { cn, formatPKR } from "@/utils";

export const metadata = { title: "Inventory" };

export default async function InventoryProductsPage() {
  const user     = await requirePermission("inventory:read");
  const branchId = getScopedBranchId(user);
  const canEdit  = hasPermission(user.role, "inventory:update");

  const [inventory, alerts] = await Promise.all([
    getInventory(branchId),
    getLowStockAlerts(branchId),
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
      <PageHeader
        title="Inventory"
        subtitle={`${inventory.length} products tracked · Total value: ${formatPKR(totalValue)}`}
      />

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
          body="Add products to start tracking your stock levels."
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
