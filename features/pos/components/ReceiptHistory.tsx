"use client";

// ============================================================
// features/pos/components/ReceiptHistory.tsx
// POS → Receipt History: search/filter, totals, row actions.
// Filters live in the URL (plain GET form), so results are shareable
// and the back button works.
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { Search, Eye, Printer, Pencil, Copy, Ban, X, AlertTriangle } from "lucide-react";
import { cn, formatPKR } from "@/utils";
import { formatPKRBill } from "@/lib/pos/receipt-math";
import type { listGuestReceipts, ReceiptFilters } from "@/server/actions/guest-receipts";
import { receiptDate, receiptTime } from "./ReceiptPaper";
import { CancelReceiptDialog } from "./CancelReceiptDialog";

type Data = Awaited<ReturnType<typeof listGuestReceipts>>;

const input = "w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold-500/60";
const lbl = "block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1";

export function ReceiptHistory({ data, filters }: { data: Data; filters: ReceiptFilters }) {
  const [cancel, setCancel] = useState<{ id: string; receiptNo: string; total: number } | null>(null);
  const active = Object.entries(filters).some(([k, v]) => k !== "page" && v);

  const pageHref = (p: number) => {
    const qs = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v && k !== "page") qs.set(k, v); });
    qs.set("page", String(p));
    return `/pos/history?${qs.toString()}`;
  };

  const iconBtn = "rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <form method="get" action="/pos/history" className="card-luxury p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          <div className="col-span-2 md:col-span-1 xl:col-span-2">
            <label className={lbl} htmlFor="f-q">Receipt No.</label>
            <input id="f-q" name="q" defaultValue={filters.q} placeholder="CGH-000124" className={input} />
          </div>
          <div>
            <label className={lbl} htmlFor="f-from">From</label>
            <input id="f-from" type="date" name="from" defaultValue={filters.from} className={input} />
          </div>
          <div>
            <label className={lbl} htmlFor="f-to">To</label>
            <input id="f-to" type="date" name="to" defaultValue={filters.to} className={input} />
          </div>
          <div>
            <label className={lbl} htmlFor="f-room">Room</label>
            <input id="f-room" name="room" defaultValue={filters.room} placeholder="102" className={input} />
          </div>
          <div>
            <label className={lbl} htmlFor="f-guest">Guest</label>
            <input id="f-guest" name="guest" defaultValue={filters.guest} placeholder="Name" className={input} />
          </div>
          <div>
            <label className={lbl} htmlFor="f-staff">Staff</label>
            <select id="f-staff" name="staff" defaultValue={filters.staff ?? ""} className={input}>
              <option value="">All staff</option>
              {data.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl} htmlFor="f-status">Status</label>
            <select id="f-status" name="status" defaultValue={filters.status ?? ""} className={input}>
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          {data.isSuperAdmin && (
            <div className="col-span-2 md:col-span-1 xl:col-span-2">
              <label className={lbl} htmlFor="f-branch">Branch</label>
              <select id="f-branch" name="branch" defaultValue={filters.branch ?? ""} className={input}>
                <option value="">All branches</option>
                {data.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button type="submit" className="flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-sm font-bold text-background">
            <Search className="h-4 w-4" /> Search
          </button>
          {active && (
            <Link href="/pos/history" className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" /> Clear filters
            </Link>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{data.count} receipt{data.count === 1 ? "" : "s"} found</span>
        </div>
      </form>

      {/* Totals for the filtered set (active receipts only) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Active receipts" value={String(data.totals.activeCount)} />
        <Tile label="POS sales" value={formatPKR(data.totals.sales)} tone="text-gold-400" />
        {data.showProfit && data.totals.vendorCost !== null && <Tile label="Vendor + stock cost" value={formatPKR(data.totals.vendorCost)} tone="text-red-400" />}
        {data.showProfit && data.totals.profit !== null && <Tile label="CGH profit" value={formatPKR(data.totals.profit)} tone="text-green-400" />}
      </div>

      {/* Table */}
      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Receipt No.</th>
                <th className="px-3 py-3 font-semibold">Date / Time</th>
                <th className="px-3 py-3 font-semibold">Guest</th>
                <th className="px-3 py-3 font-semibold">Room</th>
                <th className="px-3 py-3 font-semibold">Staff</th>
                <th className="px-3 py-3 font-semibold">Branch</th>
                <th className="px-3 py-3 text-right font-semibold">Total</th>
                {data.showProfit && <th className="px-3 py-3 text-right font-semibold">Profit</th>}
                <th className="px-3 py-3 font-semibold">Status</th>
                <th className="px-3 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                    {active ? "No receipts match these filters." : <>No receipts yet. <Link href="/pos/new" className="text-gold-400 hover:underline">Create the first one</Link>.</>}
                  </td>
                </tr>
              )}
              {data.rows.map((r) => {
                const cancelled = r.status === "CANCELLED";
                return (
                  <tr key={r.id} className={cn("border-b border-border/50 last:border-0 hover:bg-accent/30", cancelled && "opacity-60")}>
                    <td className="px-4 py-2.5 font-semibold text-foreground">
                      <Link href={`/pos/${r.id}`} className="hover:text-gold-400">{r.receiptNo}</Link>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{receiptDate(r.createdAt)} · {receiptTime(r.createdAt)}</td>
                    <td className="px-3 py-2.5 text-foreground">{r.guestName ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2.5 text-foreground">{r.roomNo ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{r.staff}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{r.branch}</td>
                    <td className={cn("px-3 py-2.5 text-right font-bold tabular-nums", cancelled ? "line-through text-muted-foreground" : "text-foreground")}>
                      {formatPKR(r.total)}
                    </td>
                    {data.showProfit && (
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {r.profit === null ? "—" : (
                          <span className={cn("inline-flex items-center gap-1", r.profit >= 0 ? "text-green-400" : "text-red-400")}>
                            {r.vendorCostMissing && !cancelled && (
                              <span title="Vendor cost not entered — whole bill counted as profit"><AlertTriangle className="h-3.5 w-3.5 text-amber-400" /></span>
                            )}
                            {formatPKR(r.profit)}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-3 py-2.5">
                      <span className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                        cancelled ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-green-500/30 bg-green-500/10 text-green-400",
                      )}>
                        {cancelled ? "Cancelled" : "Active"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <div className="flex justify-end">
                        <Link href={`/pos/${r.id}`} className={iconBtn} title="View" aria-label={`View ${r.receiptNo}`}><Eye className="h-4 w-4" /></Link>
                        <Link href={`/pos/${r.id}?print=1`} className={iconBtn} title="Print again" aria-label={`Print ${r.receiptNo} again`}><Printer className="h-4 w-4" /></Link>
                        {r.canEdit && <Link href={`/pos/${r.id}/edit`} className={iconBtn} title="Edit" aria-label={`Edit ${r.receiptNo}`}><Pencil className="h-4 w-4" /></Link>}
                        <Link href={`/pos/new?from=${r.id}`} className={iconBtn} title="Duplicate" aria-label={`Duplicate ${r.receiptNo}`}><Copy className="h-4 w-4" /></Link>
                        {r.canCancel && (
                          <button onClick={() => setCancel({ id: r.id, receiptNo: r.receiptNo, total: r.total })}
                            className={cn(iconBtn, "hover:bg-red-500/10 hover:text-red-400")} title="Cancel" aria-label={`Cancel ${r.receiptNo}`}>
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {data.pageCount > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
            <span className="text-muted-foreground">Page {data.page} of {data.pageCount}</span>
            <div className="flex gap-2">
              {data.page > 1 && <Link href={pageHref(data.page - 1)} className="rounded-lg border border-border px-3 py-1.5 hover:border-gold-500/40">Previous</Link>}
              {data.page < data.pageCount && <Link href={pageHref(data.page + 1)} className="rounded-lg border border-border px-3 py-1.5 hover:border-gold-500/40">Next</Link>}
            </div>
          </div>
        )}
      </div>

      {cancel && (
        <CancelReceiptDialog receiptId={cancel.id} receiptNo={cancel.receiptNo} total={formatPKRBill(cancel.total)} onClose={() => setCancel(null)} />
      )}
    </div>
  );
}

function Tile({ label, value, tone = "text-foreground" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card-luxury p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 text-xl font-bold font-serif tabular-nums", tone)}>{value}</p>
    </div>
  );
}
