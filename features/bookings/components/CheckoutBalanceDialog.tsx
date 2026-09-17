"use client";

// ============================================================
// features/bookings/components/CheckoutBalanceDialog.tsx
// Shown when checkout is refused because the guest still owes money.
// Staff either go take the payment, or check out anyway with a written
// reason (recorded on the booking + audit log with their name).
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, Banknote, Loader2, LogOut, X } from "lucide-react";
import { checkOutBooking } from "@/server/actions/bookings";
import { formatPKR } from "@/utils";

export interface BalanceDue { bookingId: string; bookingRef?: string; outstanding: number }

export function CheckoutBalanceDialog({
  due, onClose, onTakePayment,
}: {
  due: BalanceDue;
  onClose: () => void;
  /** Where "Take payment" goes; defaults to the booking page's payment panel. */
  onTakePayment?: () => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const ok = reason.trim().length >= 5;

  const takePayment = () => {
    onClose();
    if (onTakePayment) return onTakePayment();
    router.push(`/bookings/${due.bookingId}#payment`);
  };

  const checkoutAnyway = () => start(async () => {
    const res = await checkOutBooking(due.bookingId, { balanceReason: reason });
    if (res.success) {
      toast.success(`Checked out — ${formatPKR(due.outstanding)} recorded as still owed`);
      onClose();
      router.refresh();
    } else {
      toast.error(res.error ?? "Checkout failed");
    }
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="balance-title">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !pending && onClose()} />
      <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-surface-elevated p-5 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-500/15">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 id="balance-title" className="text-base font-bold text-foreground">Guest still owes money</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {due.bookingRef ? `${due.bookingRef} · ` : ""}Outstanding balance
            </p>
            <p className="mt-1 text-2xl font-bold font-serif text-amber-400 tabular-nums">{formatPKR(due.outstanding)}</p>
          </div>
          <button onClick={onClose} disabled={pending} aria-label="Close" className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={takePayment} disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-2.5 text-sm font-bold text-background disabled:opacity-60"
        >
          <Banknote className="h-4 w-4" /> Take payment first
        </button>

        <div className="space-y-2 border-t border-border pt-3">
          <label htmlFor="balance-reason" className="block text-xs font-semibold text-muted-foreground">
            Or check out with the balance still owed — reason required
          </label>
          <textarea
            id="balance-reason" rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Company will pay by bank transfer on Monday"
            className="w-full resize-none rounded-xl border border-border bg-surface-base px-3 py-2 text-sm text-foreground focus:border-amber-500/50 focus:outline-none"
          />
          <p className="text-[11px] text-muted-foreground">Saved on the booking and the activity log with your name. It will appear in “Checked out — still owes” until paid.</p>
          <button
            onClick={checkoutAnyway} disabled={pending || !ok}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Check out with balance owed
          </button>
        </div>
      </div>
    </div>
  );
}
