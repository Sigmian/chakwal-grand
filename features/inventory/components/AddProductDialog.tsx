"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createProduct, addInventoryItem } from "@/server/actions/inventory";

interface Category { id: string; name: string; icon: string | null }
interface Branch   { id: string; name: string }

interface Props {
  categories: Category[];
  branches:   Branch[];
  defaultBranchId?: string;
}

const UNITS = ["piece", "bottle", "sachet", "box", "pack", "kg", "liter"] as const;

export function AddProductDialog({ categories, branches, defaultBranchId }: Props) {
  const router = useRouter();
  const [open, setOpen]           = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name,          setName]          = useState("");
  const [brand,         setBrand]         = useState("");
  const [categoryId,    setCategoryId]    = useState(categories[0]?.id ?? "");
  const [unit,          setUnit]          = useState<typeof UNITS[number]>("piece");
  const [branchId,      setBranchId]      = useState(defaultBranchId ?? branches[0]?.id ?? "");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice,  setSellingPrice]  = useState("");
  const [currentStock,  setCurrentStock]  = useState("0");
  const [minStockLevel, setMinStockLevel] = useState("10");

  const reset = () => {
    setName(""); setBrand(""); setUnit("piece");
    setPurchasePrice(""); setSellingPrice("");
    setCurrentStock("0"); setMinStockLevel("10");
    setCategoryId(categories[0]?.id ?? "");
    setBranchId(defaultBranchId ?? branches[0]?.id ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !categoryId || !branchId || !purchasePrice || !sellingPrice) {
      toast.error("Please fill in all required fields");
      return;
    }

    startTransition(async () => {
      // Step 1: create the product
      const productRes = await createProduct({
        name: name.trim(),
        brand: brand.trim() || undefined,
        categoryId,
        unit,
      });

      if (!productRes.success || !productRes.data) {
        toast.error(productRes.error ?? "Failed to create product");
        return;
      }

      // Step 2: add to inventory
      const invRes = await addInventoryItem({
        productId:     productRes.data.id,
        branchId,
        purchasePrice: Number(purchasePrice),
        sellingPrice:  Number(sellingPrice),
        currentStock:  Number(currentStock),
        minStockLevel: Number(minStockLevel),
      });

      if (!invRes.success) {
        toast.error(invRes.error ?? "Product created but failed to add to inventory");
        return;
      }

      toast.success(`"${name}" added to inventory`);
      reset();
      setOpen(false);
      router.refresh();
    });
  };

  const inputCls = "w-full bg-surface-base border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50 transition-colors";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all"
      >
        <Plus className="w-4 h-4" />
        Add Product
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-surface-elevated border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground">Add New Product</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className={labelCls}>Product Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mineral Water" className={inputCls} required />
              </div>

              {/* Brand */}
              <div>
                <label className={labelCls}>Brand</label>
                <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="e.g. Nestle" className={inputCls} />
              </div>

              {/* Category + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Category *</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputCls} required>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Unit *</label>
                  <select value={unit} onChange={e => setUnit(e.target.value as typeof UNITS[number])} className={inputCls}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Branch */}
              {branches.length > 1 && (
                <div>
                  <label className={labelCls}>Branch *</label>
                  <select value={branchId} onChange={e => setBranchId(e.target.value)} className={inputCls} required>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              )}

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Cost Price (₨) *</label>
                  <input type="number" min="0" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} placeholder="0" className={inputCls} required />
                </div>
                <div>
                  <label className={labelCls}>Selling Price (₨) *</label>
                  <input type="number" min="0" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} placeholder="0" className={inputCls} required />
                </div>
              </div>

              {/* Stock levels */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Opening Stock</label>
                  <input type="number" min="0" value={currentStock} onChange={e => setCurrentStock(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Min Stock Level</label>
                  <input type="number" min="0" value={minStockLevel} onChange={e => setMinStockLevel(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-gradient text-background text-sm font-bold rounded-xl disabled:opacity-60 transition-all"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {isPending ? "Adding…" : "Add Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2.5 border border-border text-muted-foreground text-sm rounded-xl hover:text-foreground hover:border-foreground/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
