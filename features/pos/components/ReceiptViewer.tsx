"use client";

// ============================================================
// features/pos/components/ReceiptViewer.tsx
// A saved receipt: print again, save PDF, edit, duplicate, cancel,
// plus the audit trail and (for permitted users) internal accounting.
// ============================================================

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Copy, Ban, Plus, History, ShieldCheck } from "lucide-react";
import { cn, formatPKR } from "@/utils";
import { formatPKRBill } from "@/lib/pos/receipt-math";
import type { GuestReceiptDetail } from "@/server/actions/guest-receipts";
import { ReceiptPaper, receiptDate, receiptTime, type ReceiptView } from "./ReceiptPaper";
import { PrintControls, ReceiptPrintPortal, printReceipt, usePrintSize } from "./receipt-print";
import { CancelReceiptDialog } from "./CancelReceiptDialog";
import { downloadReceiptPdf } from "../lib/receipt-pdf";

const when = (iso: string) => `${receiptDate(iso)}, ${receiptTime(iso)}`;

export function ReceiptViewer({ receipt: r, autoPrint }: { receipt: GuestReceiptDetail; autoPrint?: boolean }) {
  const [size, setSize] = usePrintSize();
  const [busy, setBusy] = useState<"print" | "pdf" | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const autoPrinted = useRef(false);

  const view: ReceiptView = {
    receiptNo: r.receiptNo,
    createdAt: r.createdAt,
    status: r.status,
    branchName: r.branchName,
    branchAddress: r.branchAddress,
    branchPhone: r.branchPhone,
    roomNo: r.roomNo,
    guestName: r.guestName,
    cashier: r.createdByName,
    notes: r.notes,
    items: r.items,
    subtotal: r.subtotal,
    deliveryCharges: r.deliveryCharges,
    otherCharges: r.otherCharges,
    discount: r.discount,
    total: r.total,
  };

  const onPrint = async () => {
    setBusy("print");
    try { await printReceipt(size); } finally { setBusy(null); }
  };
  const onSavePdf = async () => {
    setBusy("pdf");
    try { await downloadReceiptPdf(view, size); } catch { toast.error("Could not create the PDF."); } finally { setBusy(null); }
  };

  // "Print Again" from history opens this page with ?print=1.
  useEffect(() => {
    if (!autoPrint || autoPrinted.current) return;
    autoPrinted.current = true;
    const t = setTimeout(() => { void onPrint(); }, 400);
    return () => clearTimeout(t);
  }, [autoPrint]); // eslint-disable-line react-hooks/exhaustive-deps

  const action = "flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-sm font-semibold text-muted-foreground hover:border-gold-500/40 hover:text-foreground";

  return (
    <div className="space-y-4">
      <ReceiptPrintPortal receipt={view} size={size} />

      <div className="card-luxury flex flex-wrap items-center gap-2 p-3">
        <Link href="/pos/history" className={action}><ArrowLeft className="h-4 w-4" /> History</Link>
        <PrintControls
          size={size} onSizeChange={setSize}
          onPrint={() => void onPrint()} onSavePdf={() => void onSavePdf()}
          busy={busy} printLabel={r.status === "CANCELLED" ? "Print (void copy)" : "Print Again"}
        />
        {r.canEdit && <Link href={`/pos/${r.id}/edit`} className={action}><Pencil className="h-4 w-4" /> Edit</Link>}
        <Link href={`/pos/new?from=${r.id}`} className={action}><Copy className="h-4 w-4" /> Duplicate</Link>
        {r.canCancel && (
          <button onClick={() => setCancelOpen(true)} className={cn(action, "hover:border-red-500/40 hover:text-red-400")}>
            <Ban className="h-4 w-4" /> Cancel
          </button>
        )}
        <Link href="/pos/new" className="ml-auto flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-sm font-bold text-background">
          <Plus className="h-4 w-4" /> New Receipt
        </Link>
      </div>

      {r.status === "CANCELLED" && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <b>Cancelled</b> by {r.cancelledByName} on {r.cancelledAt ? when(r.cancelledAt) : "—"}
          {r.cancelReason ? <> — “{r.cancelReason}”</> : null}. Kept for the record; it no longer counts in POS totals.
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="overflow-x-auto rounded-2xl border border-border bg-[#e9e7e1] p-3 shadow-inner">
          <div className="mx-auto w-fit shadow-xl"><ReceiptPaper receipt={view} size={size} /></div>
        </div>

        <div className="space-y-4 min-w-0">
          <div className="card-luxury p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <History className="h-4 w-4 text-gold-400" /> Audit trail
            </h3>
            <ol className="space-y-2.5 text-sm">
              <li><span className="text-muted-foreground">Created by</span> <b className="text-foreground">{r.createdByName}</b> <span className="text-muted-foreground">· {when(r.createdAt)}</span></li>
              {r.updatedByName && (
                <li><span className="text-muted-foreground">Last edited by</span> <b className="text-foreground">{r.updatedByName}</b> <span className="text-muted-foreground">· {when(r.updatedAt)}</span></li>
              )}
              {r.status === "CANCELLED" && (
                <li className="text-red-300">
                  <span>Cancelled by</span> <b>{r.cancelledByName}</b> · {r.cancelledAt ? when(r.cancelledAt) : "—"}
                  {r.cancelReason && <p className="mt-0.5 text-xs text-red-300/80">Reason: {r.cancelReason}</p>}
                </li>
              )}
            </ol>
            <p className="mt-3 text-[11px] text-muted-foreground">Branch: {r.branchName}{r.bookingId ? " · linked to an in-house booking" : ""}</p>
          </div>

          {r.accounting && (
            <div className="card-luxury p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-gold-400" /> Internal accounting <span className="normal-case font-normal">(not on receipt)</span>
              </h3>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div><dt className="text-[11px] text-muted-foreground">Customer charged</dt><dd className="font-bold text-foreground">{formatPKR(r.accounting.customerCharged)}</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">Stock cost</dt><dd className="font-bold text-foreground">{formatPKR(r.accounting.stockCost)}</dd></div>
                <div><dt className="text-[11px] text-muted-foreground">Vendor cost</dt><dd className="font-bold text-foreground">{r.accounting.vendorCost === null ? <span className="text-amber-400">Not entered</span> : formatPKR(r.accounting.vendorCost)}</dd></div>
                <div>
                  <dt className="text-[11px] text-muted-foreground">CGH profit</dt>
                  <dd className={cn("font-bold", r.accounting.profit >= 0 ? "text-green-400" : "text-red-400")}>{formatPKRBill(r.accounting.profit)}</dd>
                </div>
              </dl>
              {r.accounting.vendorCost === null && r.items.some((i) => !i.inventoryItemId) && (
                <p className="mt-2 text-[11px] text-amber-400/90">Without a vendor cost, the outside items are counted as pure profit. {r.canEdit ? "Edit the receipt to add it." : ""}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {cancelOpen && (
        <CancelReceiptDialog receiptId={r.id} receiptNo={r.receiptNo} total={formatPKRBill(r.total)} onClose={() => setCancelOpen(false)} />
      )}
    </div>
  );
}
