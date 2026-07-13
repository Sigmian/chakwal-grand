// ============================================================
// features/inventory/components/StockTable.tsx
// Stock level table with inline restock action
// ============================================================

"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { Plus, AlertTriangle, CheckCircle, Pencil, X, ShoppingBag, Trash2, Search } from "lucide-react";
import { restockItem, updateInventoryItem, deleteInventoryItem } from "@/server/actions/inventory";
import { cn, formatPKR } from "@/utils";
import { Badge } from "@/components/shared";
import { ProductImagePicker } from "@/features/inventory/components/ProductImagePicker";

interface InventoryItem {
  id:            string;
  currentStock:  number;
  minStockLevel: number;
  sellingPrice:  number;
  purchasePrice: number;
  isLowStock?:   boolean;
  isExpired?:    boolean;
  product?: {
    id:               string;
    name:             string;
    brand?:           string | null;
    unit:             string;
    image?:           string | null;
    isCanteenVisible?: boolean;
    category?: { name: string } | null;
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
  const [showEdit, setShowEdit] = useState(false);
  const [editName,     setEditName]     = useState(item.product?.name ?? "");
  const [editCost,     setEditCost]     = useState(String(item.purchasePrice));
  const [editSelling,  setEditSelling]  = useState(String(item.sellingPrice));
  const [editMinStock, setEditMinStock] = useState(String(item.minStockLevel));

  const handleDelete = () => {
    if (!confirm(`Delete "${item.product?.name}" from inventory? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteInventoryItem(item.id);
      if (!res.success) toast.error(res.error ?? "Delete failed");
      else toast.success("Item removed from inventory");
    });
  };

  const toggleCanteen = () => {
    startTransition(async () => {
      await updateInventoryItem({
        inventoryItemId:  item.id,
        isCanteenVisible: !(item.product?.isCanteenVisible ?? false),
      });
    });
  };

  const handleEdit = () => {
    startTransition(async () => {
      const res = await updateInventoryItem({
        inventoryItemId: item.id,
        productName:     editName.trim() || undefined,
        purchasePrice:   Number(editCost),
        sellingPrice:    Number(editSelling),
        minStockLevel:   Number(editMinStock),
      });
      if (res.success) {
        toast.success("Item updated");
        setShowEdit(false);
      } else {
        toast.error(res.error ?? "Update failed");
      }
    });
  };

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

  const inputCls = "bg-surface-base border border-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-gold-500/50 w-full";

  return (
    <>
    <tr className={cn("group", isPending && "opacity-60")}>
      <td>
        <div className="flex items-center gap-3">
          {canEdit && item.product?.id ? (
            <ProductImagePicker
              productId={item.product.id}
              productName={item.product.name}
              currentImage={item.product.image ?? null}
            />
          ) : item.product?.image ? (
            <img src={item.product.image} alt={item.product.name} className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
          ) : null}
          <div>
            <p className="text-sm font-semibold text-foreground">{item.product?.name ?? "—"}</p>
            {item.product?.brand && (
              <p className="text-xs text-muted-foreground">{item.product.brand}</p>
            )}
          </div>
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
          <div className="flex items-center gap-1.5">
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
                <button onClick={handleRestock} disabled={isPending} className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors">
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowRestock(false)} className="text-xs text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setShowRestock(true); setShowEdit(false); }}
                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-gold-400 hover:bg-gold-500/10 border border-gold-500/20 transition-all"
              >
                <Plus className="w-3 h-3" /> Restock
              </button>
            )}
            <button
              onClick={() => { setShowEdit(e => !e); setShowRestock(false); }}
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-blue-400 hover:bg-blue-500/10 border border-blue-500/20 transition-all"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
            <button
              onClick={toggleCanteen}
              disabled={isPending}
              title={item.product?.isCanteenVisible ? "Remove from canteen menu" : "Add to canteen menu"}
              className={cn(
                "opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-all",
                item.product?.isCanteenVisible
                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                  : "text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 border-border"
              )}
            >
              <ShoppingBag className="w-3 h-3" />
              {item.product?.isCanteenVisible ? "On Menu" : "Add to Menu"}
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              title="Delete from inventory"
              className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </td>
      )}
    </tr>

    {/* Inline edit form */}
    {showEdit && canEdit && (
      <tr className="bg-accent/30">
        <td colSpan={8} className="px-4 py-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1 min-w-[140px]">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Product Name</label>
              <input value={editName} onChange={e => setEditName(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1 w-28">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cost Price (₨)</label>
              <input type="number" value={editCost} onChange={e => setEditCost(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1 w-28">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Selling Price (₨)</label>
              <input type="number" value={editSelling} onChange={e => setEditSelling(e.target.value)} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1 w-24">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Min Stock</label>
              <input type="number" value={editMinStock} onChange={e => setEditMinStock(e.target.value)} className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                disabled={isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-gradient text-background text-xs font-bold rounded-lg"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {isPending ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setShowEdit(false)} className="px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </td>
      </tr>
    )}
    </>
  );
}

export function StockTable({ items, canEdit }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (i) =>
        i.product?.name?.toLowerCase().includes(q) ||
        i.product?.brand?.toLowerCase().includes(q) ||
        i.product?.category?.name?.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter products…"
          className="pl-9 pr-3 py-2 text-sm bg-surface-elevated border border-border rounded-xl focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 text-foreground placeholder:text-muted-foreground w-full sm:w-72 transition-colors"
        />
      </div>
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
          {filtered.map((item) => (
            <StockRow key={item.id} item={item} canEdit={canEdit} />
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}
