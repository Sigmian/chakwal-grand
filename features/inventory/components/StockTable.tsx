// ============================================================
// features/inventory/components/StockTable.tsx
// Stock level table with inline restock action
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, AlertTriangle, CheckCircle } from "lucide-react";
import { restockItem } from "@/server/actions/inventory";
import { cn, formatPKR } from "@/utils";
import { Badge } from "@/components/shared";

interface InventoryItem {
  id:            string;
  currentStock:  number;
  minStockLevel: number;
  sellingPrice:  number;
  purchasePrice: number;
  isLowStock?:   boolean;
  isExpired?:    boolean;
  product?: {
    name:  string;
    brand?:string | null;
    unit:  string;
  } | null;
}

interface Props {
  items:   InventoryItem[];
  canEdit: boolean;
}

function StockRow({ item, canEdit }: { item: InventoryItem; canEdit: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [restockQty, setRestockQty]  = useState("");
  const [showRestock, setShowRestock] = useState(false);

  const handleRestock = () => {
    const qty = Number(restockQty);
    if (!qty || qty < 1) return toast.error("Enter a valid quantity");
    startTransition(async () => {
      const res = await restockItem({ inventoryItemId: item.id, quantity: qty });
      if (res.success) {
        toast.success(`Restocked: +${qty} ${item.product?.unit ?? "units"}`);
        setRestockQty("");
        setShowRestock(false);
      } else {
        toast.error(res.error ?? "Restock failed");
      }
    });
  };

  const stockPct = item.minStockLevel > 0
    ? Math.min(100, (item.currentStock / (item.minStockLevel * 3)) * 100)
    : 100;

  return (
    <tr className={cn("group", isPending && "opacity-60")}>
      <td>
        <div>
          <p className="text-sm font-semibold text-foreground">{item.product?.name ?? "—"}</p>
          {item.product?.brand && (
            <p className="text-xs text-muted-foreground">{item.product.brand}</p>
          )}
        </div>
      </td>
      <td>
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-[80px]">
            <div className="h-1.5 bg-accent rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  item.isLowStock ? "bg-red-500" : "bg-gold-gradient"
                )}
                style={{ width: `${stockPct}%` }}
              />
            </div>
          </div>
          <span className={cn(
            "text-sm font-bold",
            item.isLowStock ? "text-red-400" : "text-foreground"
          )}>
            {item.currentStock}
            <span className="text-xs font-normal text-muted-foreground ml-1">{item.product?.unit}</span>
          </span>
          {item.isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
        </div>
      </td>
      <td>
        <span className="text-xs text-muted-foreground">Min: {item.minStockLevel}</span>
      </td>
      <td>
        <span className="text-sm text-muted-foreground">{formatPKR(item.purchasePrice)}</span>
      </td>
      <td>
        <span className="text-sm font-semibold text-gold-400">{formatPKR(item.sellingPrice)}</span>
      </td>
      <td>
        <span className={cn(
          "text-sm font-semibold",
          item.sellingPrice > item.purchasePrice ? "text-green-400" : "text-red-400"
        )}>
          {formatPKR(item.sellingPrice - item.purchasePrice)}
        </span>
      </td>
      <td>
        {item.isExpired ? (
          <Badge variant="red">Expired</Badge>
        ) : item.isLowStock ? (
          <Badge variant="amber">Low Stock</Badge>
        ) : (
          <Badge variant="green">In Stock</Badge>
        )}
      </td>
      {canEdit && (
        <td>
          {showRestock ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                value={restockQty}
                onChange={(e) => setRestockQty(e.target.value)}
                placeholder="Qty"
                className="w-16 bg-surface-base border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-gold-500/50"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleRestock(); if (e.key === "Escape") setShowRestock(false); }}
              />
              <button
                onClick={handleRestock}
                disabled={isPending}
                className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowRestock(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowRestock(true)}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gold-400 hover:bg-gold-500/10 border border-gold-500/20 transition-all"
            >
              <Plus className="w-3 h-3" />
              Restock
            </button>
          )}
        </td>
      )}
    </tr>
  );
}

export function StockTable({ items, canEdit }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Stock</th>
            <th>Min Level</th>
            <th>Cost</th>
            <th>Selling</th>
            <th>Profit</th>
            <th>Status</th>
            {canEdit && <th></th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <StockRow key={item.id} item={item} canEdit={canEdit} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
