"use client";

// ============================================================
// features/pos/components/CancelReceiptDialog.tsx
// Managers cancel (never delete) a receipt, with a mandatory reason.
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Loader2, X } from "lucide-react";
import { cancelGuestReceipt } from "@/server/actions/guest-receipts";

export function CancelReceiptDialog({
  receiptId, receiptNo, total, onClose,
}: { receiptId: string; receiptNo: string; total: string; onClose: () => void }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const submit = () => start(async () => {
    setErr(null);
    const res = await cancelGuestReceipt(receiptId, reason);
    if (!res.success) { setErr(res.error ?? "Could not cancel."); return; }
    toast.success(`Receipt ${receiptNo} cancelled`);
    onClose();
    router.refresh();
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !pending && onClose()} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface-elevated p-5 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 id="cancel-title" className="text-lg font-bold font-serif text-foreground">Cancel receipt {receiptNo}?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {total}. The receipt stays in history marked <b>CANCELLED</b>, with your name and the time. This cannot be undone.
            </p>
          </div>
          <button onClick={onClose} disabled={pending} className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <label htmlFor="cancel-reason" className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Reason</label>
        <textarea
          id="cancel-reason" rows={3} autoFocus maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Guest cancelled the order / wrong room billed"
          className="w-full resize-none rounded-xl border border-border bg-surface-base px-3 py-2 text-sm text-foreground focus:border-gold-500/60 focus:outline-none"
        />
        {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} disabled={pending} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            Keep receipt
          </button>
          <button
            onClick={submit} disabled={pending || reason.trim().length < 3}
            className="flex items-center gap-2 rounded-xl bg-red-500/90 px-4 py-2 text-sm font-bold text-white hover:bg-red-500 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} Cancel receipt
          </button>
        </div>
      </div>
    </div>
  );
}
