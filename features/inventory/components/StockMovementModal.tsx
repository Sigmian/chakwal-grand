"use client";

// ============================================================
// features/inventory/components/StockMovementModal.tsx
// Manual stock in / stock out with a reason. Every movement is
// recorded server-side in the stock ledger.
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownToLine, ArrowUpFromLine, X, Loader2 } from "lucide-react";
import { recordStockMovement } from "@/server/actions/inventory";
import { cn } from "@/utils";

const IN_REASONS = [
  { value: "RESTOCK",       label: "Restock" },
  { value: "PURCHASE",      label: "Purchase" },
  { value: "RETURN",        label: "Returned stock" },
  { value: "ADJUSTMENT_IN", label: "Manual adjustment (add)" },
] as const;

const OUT_REASONS = [
  { value: "ISSUE_ROOM",     label: "Room stock" },
  { value: "ISSUE_STAFF",    label: "Staff issue" },
  { value: "ISSUE_CANTEEN",  label: "Canteen use" },
  { value: "DAMAGED",        label: "Damaged item" },
  { value: "EXPIRED",        label: "Expired item" },
  { value: "ADJUSTMENT_OUT", label: "Manual adjustment (remove)" },
] as const;

interface Props {
  item: { id: string; name: string; unit: string; currentStock: number };
  onClose: () => void;
}

export function StockMovementModal({ item, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dir, setDir]       = useState<"IN" | "OUT">("OUT");
  const [type, setType]     = useState<string>(OUT_REASONS[0].value);
  const [qty, setQty]       = useState("");
  const [notes, setNotes]   = useState("");

  const reasons = dir === "IN" ? IN_REASONS : OUT_REASONS;

  const switchDir = (d: "IN" | "OUT") => {
    setDir(d);
    setType((d === "IN" ? IN_REASONS : OUT_REASONS)[0].value);
  };

  const submit = () => {
    if (isPending) return;
    const q = parseInt(qty, 10);
    if (!Number.isFinite(q) || q < 1) { toast.error("Enter a valid quantity (at least 1)."); return; }
    if (dir === "OUT" && q > item.currentStock) {
      toast.error(`Only ${item.currentStock} ${item.unit} in stock — can't remove ${q}.`);
      return;
    }
    startTransition(async () => {
      const res = await recordStockMovement({ inventoryItemId: item.id, type: type as never, quantity: q, notes: notes.trim() || undefined });
      if (!res.success || !res.data) { toast.error(res.error ?? "Failed to record movement"); return; }
      const d = res.data;
      toast.success(
        d.direction === "out"
          ? `${d.quantity} × ${d.productName} issued. Remaining stock: ${d.newStock} ${d.unit}.`
          : `${d.quantity} × ${d.productName} added. New stock: ${d.newStock} ${d.unit}.`,
      );
      onClose();
      router.refresh();
    });
  };

  const inputCls = "w-full bg-surface-base border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-gold-500/50 transition-colors";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-elevated border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">Stock movement</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{item.name} · {item.currentStock} {item.unit} in stock</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* direction */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => switchDir("IN")}
              className={cn("flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all",
                dir === "IN" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-border text-muted-foreground hover:text-foreground")}>
              <ArrowDownToLine className="w-4 h-4" /> Stock In
            </button>
            <button type="button" onClick={() => switchDir("OUT")}
              className={cn("flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition-all",
                dir === "OUT" ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-border text-muted-foreground hover:text-foreground")}>
              <ArrowUpFromLine className="w-4 h-4" /> Stock Out
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Reason</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                {reasons.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Quantity ({item.unit})</label>
              <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="0"
                className={inputCls} autoFocus onKeyDown={(e) => { if (e.key === "Enter") submit(); }} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Note (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Room 201 minibar" className={inputCls} />
          </div>

          {dir === "OUT" && (
            <p className="text-xs text-muted-foreground">
              New stock will be <span className="font-semibold text-foreground">{Math.max(0, item.currentStock - (parseInt(qty, 10) || 0))} {item.unit}</span>.
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={submit} disabled={isPending}
              className={cn("flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl disabled:opacity-60 transition-all",
                dir === "IN" ? "bg-emerald-500 text-white" : "bg-gold-gradient text-background")}>
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : dir === "IN" ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
              {isPending ? "Saving…" : dir === "IN" ? "Add Stock" : "Remove Stock"}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 border border-border text-muted-foreground text-sm rounded-xl hover:text-foreground transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
