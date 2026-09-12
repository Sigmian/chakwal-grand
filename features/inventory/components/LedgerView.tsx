"use client";

// ============================================================
// features/inventory/components/LedgerView.tsx
// Filterable stock-ledger table (branch / product / type / date).
// ============================================================

import { useState, useTransition } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Download, Loader2, ScrollText } from "lucide-react";
import { getStockLedger, type LedgerRow } from "@/server/actions/inventory";
import { cn } from "@/utils";

const TYPE_LABEL: Record<string, string> = {
  RESTOCK: "Restock", PURCHASE: "Purchase", RETURN: "Return", ADJUSTMENT_IN: "Adjustment +",
  SALE: "Sale", TRANSFER_IN: "Transfer in", TRANSFER_OUT: "Transfer out", ADJUSTMENT: "Adjustment",
  ISSUE_ROOM: "Room stock", ISSUE_STAFF: "Staff issue", ISSUE_CANTEEN: "Canteen use",
  DAMAGED: "Damaged", EXPIRED: "Expired", ADJUSTMENT_OUT: "Adjustment −", EXPIRY_WRITE_OFF: "Expiry write-off",
};
const label = (t: string) => TYPE_LABEL[t] ?? t;

const TYPE_OPTIONS = [
  { group: "Stock in",  items: ["RESTOCK", "PURCHASE", "RETURN", "ADJUSTMENT_IN", "TRANSFER_IN"] },
  { group: "Stock out", items: ["SALE", "ISSUE_ROOM", "ISSUE_STAFF", "ISSUE_CANTEEN", "DAMAGED", "EXPIRED", "ADJUSTMENT_OUT", "TRANSFER_OUT"] },
];

interface Props {
  initialRows: LedgerRow[];
  branches: { id: string; name: string }[];
  products: { id: string; name: string }[];
}

export function LedgerView({ initialRows, branches, products }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [loading, start] = useTransition();
  const [f, setF] = useState({ branchId: "", productId: "", type: "", from: "", to: "" });

  function reload(next = f) {
    start(async () => {
      const res = await getStockLedger({
        branchId:  next.branchId || undefined,
        productId: next.productId || undefined,
        type:      next.type || undefined,
        from:      next.from || undefined,
        to:        next.to || undefined,
        limit:     300,
      });
      setRows(res);
    });
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const next = { ...f, [k]: e.target.value };
    setF(next); reload(next);
  };

  function exportCsv() {
    const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const head = ["Date", "Time", "Product", "Branch", "Movement", "Change", "Previous", "New", "Staff", "Note"];
    const lines = rows.map((r) => {
      const d = new Date(r.createdAt);
      return [d.toLocaleDateString("en-PK"), d.toLocaleTimeString("en-PK"), r.productName, r.branch,
        label(r.type), `${r.quantity > 0 ? "+" : ""}${r.quantity} ${r.unit}`, r.previousStock, r.newStock, r.staff, r.notes ?? ""].map(esc).join(",");
    });
    const blob = new Blob(["﻿" + [head.map(esc).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `CGH-stock-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const sel = "input-luxury text-sm";

  return (
    <div className="space-y-4">
      {/* filters */}
      <div className="flex flex-wrap items-end gap-3">
        {branches.length > 0 && (
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Branch</label>
            <select className={sel} value={f.branchId} onChange={set("branchId")}>
              <option value="">All branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Product</label>
          <select className={sel} value={f.productId} onChange={set("productId")}>
            <option value="">All products</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Movement</label>
          <select className={sel} value={f.type} onChange={set("type")}>
            <option value="">All movements</option>
            {TYPE_OPTIONS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map((t) => <option key={t} value={t}>{label(t)}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">From</label>
          <input type="date" className={sel} value={f.from} onChange={set("from")} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">To</label>
          <input type="date" className={sel} value={f.to} onChange={set("to")} />
        </div>
        <div className="flex-1" />
        <button onClick={exportCsv} disabled={rows.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl disabled:opacity-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* table */}
      <div className="card-luxury overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-gold-400" /> {rows.length} movement{rows.length !== 1 ? "s" : ""}
          </h3>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No stock movements match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>When</th><th>Product</th><th>Branch</th><th>Movement</th>
                  <th className="text-center">Change</th><th className="text-center">Prev → New</th><th>Staff</th><th>Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isIn = r.quantity > 0;
                  const d = new Date(r.createdAt);
                  return (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">
                        {d.toLocaleDateString("en-PK", { day: "numeric", month: "short" })}<br />
                        {d.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" })}
                      </td>
                      <td className="font-medium text-foreground whitespace-nowrap">{r.productName}</td>
                      <td className="text-xs text-muted-foreground whitespace-nowrap">{r.branch}</td>
                      <td>
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          isIn ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300" : "border-red-500/25 bg-red-500/10 text-red-300")}>
                          {isIn ? <ArrowDownToLine className="w-3 h-3" /> : <ArrowUpFromLine className="w-3 h-3" />}
                          {label(r.type)}
                        </span>
                      </td>
                      <td className={cn("text-center font-bold", isIn ? "text-emerald-400" : "text-red-400")}>
                        {isIn ? "+" : ""}{r.quantity} <span className="text-xs font-normal text-muted-foreground">{r.unit}</span>
                      </td>
                      <td className="text-center text-sm text-muted-foreground whitespace-nowrap">{r.previousStock} → <span className="font-semibold text-foreground">{r.newStock}</span></td>
                      <td className="text-xs text-muted-foreground whitespace-nowrap">{r.staff}</td>
                      <td className="text-xs text-muted-foreground max-w-[180px] truncate">{r.notes ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
