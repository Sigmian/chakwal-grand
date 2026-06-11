// ============================================================
// features/bookings/components/PaymentPanel.tsx
// Payment recording panel — supports both inline use (with
// full payment history) and compact use (remaining balance only)
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CreditCard, Plus, Check, Receipt, Loader2,
} from "lucide-react";
import { addPayment } from "@/server/actions/bookings";
import { cn, formatPKR, formatDateTime } from "@/utils";
import { Badge } from "@/components/shared";
import { PaymentMethod, PaymentStatus, BookingStatus } from "@/types";

interface Payment {
  id:        string;
  amount:    number | string;
  method:    PaymentMethod;
  status:    PaymentStatus;
  reference?: string | null;
  note?:     string | null;
  paidAt?:   Date | null;
  createdAt: Date;
}

// Two usage modes: full (with totalAmount + payments list) or compact
interface FullProps {
  bookingId:   string;
  totalAmount: number;
  paidAmount:  number;
  payments:    Payment[];
  canRecord?:  boolean;
  remaining?:  never;
  bookingStatus?: never;
}

interface CompactProps {
  bookingId:     string;
  remaining:     number;
  bookingStatus: BookingStatus;
  totalAmount?:  never;
  paidAmount?:   never;
  payments?:     never;
  canRecord?:    boolean;
}

type Props = FullProps | CompactProps;

const METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]:         "💵 Cash",
  [PaymentMethod.BANK_TRANSFER]:"🏦 Bank Transfer",
  [PaymentMethod.JAZZCASH]:     "📱 JazzCash",
  [PaymentMethod.EASYPAISA]:    "📲 EasyPaisa",
  [PaymentMethod.ONLINE_CARD]:  "💳 Card/Online",
};

const STATUS_STYLE: Record<PaymentStatus, string> = {
  [PaymentStatus.PAID]:     "text-green-400 bg-green-500/10 border-green-500/20",
  [PaymentStatus.UNPAID]:   "text-amber-400 bg-amber-500/10 border-amber-500/20",
  [PaymentStatus.PARTIAL]:  "text-orange-400 bg-orange-500/10 border-orange-500/20",
  [PaymentStatus.REFUNDED]: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

export function PaymentPanel(props: Props) {
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm]      = useState(false);
  const [form, setForm] = useState({
    amount:    "",
    method:    PaymentMethod.CASH,
    reference: "",
    note:      "",
  });

  // Resolve values from either usage mode
  const isCompact   = props.remaining !== undefined;
  const remaining   = isCompact ? props.remaining : Math.max(0, (props.totalAmount ?? 0) - (props.paidAmount ?? 0));
  const isPaidFull  = remaining <= 0;
  const canRecord   = props.canRecord ?? true;
  const isCancelled = isCompact && props.bookingStatus === BookingStatus.CANCELLED;

  // Full mode extras
  const totalAmount = isCompact ? undefined : props.totalAmount;
  const paidAmount  = isCompact ? undefined : props.paidAmount;
  const payments    = isCompact ? undefined : props.payments;
  const paidPct     = totalAmount ? Math.min(100, ((paidAmount ?? 0) / totalAmount) * 100) : 0;

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAdd = () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    startTransition(async () => {
      const res = await addPayment({
        bookingId: props.bookingId,
        amount:    amt,
        method:    form.method,
        reference: form.reference || undefined,
        notes:     form.note || undefined,
      });
      if (res.success) {
        toast.success(`Payment of ${formatPKR(amt)} recorded`);
        setForm({ amount: "", method: PaymentMethod.CASH, reference: "", note: "" });
        setShowForm(false);
      } else {
        toast.error(res.error ?? "Failed to record payment");
      }
    });
  };

  if (isCancelled) return null;

  return (
    <div className="card-luxury p-5 space-y-4">
      {/* Header */}
      <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
        <CreditCard className="w-4 h-4 text-gold-400" />
        {isCompact ? "Record Payment" : "Payment Summary"}
      </h3>

      {/* Full mode: progress + totals */}
      {!isCompact && totalAmount !== undefined && (
        <div>
          <div className="h-2 bg-accent rounded-full overflow-hidden mb-3">
            <div
              className={cn("h-full rounded-full transition-all", isPaidFull ? "bg-green-500" : "bg-gold-gradient")}
              style={{ width: `${paidPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total",   value: formatPKR(totalAmount),         color: "text-foreground" },
              { label: "Paid",    value: formatPKR(paidAmount ?? 0),     color: "text-green-400"  },
              { label: "Balance", value: formatPKR(remaining),           color: remaining > 0 ? "text-amber-400" : "text-muted-foreground" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-2 bg-surface-highlight rounded-xl">
                <p className={cn("text-sm font-bold", color)}>{value}</p>
                <p className="text-2xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compact mode: just remaining balance */}
      {isCompact && !isPaidFull && (
        <div className="flex items-center justify-between py-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <span className="text-sm text-amber-400 font-medium">Balance due</span>
          <span className="text-base font-bold text-amber-400">{formatPKR(remaining)}</span>
        </div>
      )}

      {isPaidFull && (
        <div className="flex items-center gap-2 py-2 px-3 bg-green-500/10 border border-green-500/20 rounded-xl">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400 font-semibold">Paid in full</span>
        </div>
      )}

      {/* Add payment form */}
      {canRecord && !isPaidFull && (
        <>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-border hover:border-gold-500/40 rounded-xl text-sm text-muted-foreground hover:text-gold-400 transition-all"
            >
              <Plus className="w-4 h-4" />
              Record Payment
            </button>
          ) : (
            <div className="space-y-3 p-4 bg-surface-highlight rounded-xl border border-border/50">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <input
                    type="number"
                    value={form.amount}
                    onChange={set("amount")}
                    placeholder={`Amount (max ${formatPKR(remaining)})`}
                    autoFocus
                    className="w-full bg-surface-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50"
                  />
                </div>
                <select
                  value={form.method}
                  onChange={set("method")}
                  className="bg-surface-base border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold-500/50"
                >
                  {Object.values(PaymentMethod).map(m => (
                    <option key={m} value={m}>{METHOD_LABELS[m] ?? m}</option>
                  ))}
                </select>
                <input
                  value={form.reference}
                  onChange={set("reference")}
                  placeholder="Ref / Txn ID"
                  className="bg-surface-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-lg disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {isPending ? "Saving…" : "Confirm"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Full mode: payment history */}
      {!isCompact && payments && payments.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5" />
            History
          </p>
          <div className="space-y-2">
            {payments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-surface-highlight rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-foreground">{formatPKR(Number(p.amount))}</p>
                  <p className="text-xs text-muted-foreground">{METHOD_LABELS[p.method]?.replace(/^\S+\s/, "")}{p.reference ? ` · ${p.reference}` : ""}</p>
                </div>
                <div className="text-right">
                  <span className={cn("text-2xs px-1.5 py-0.5 rounded border font-semibold", STATUS_STYLE[p.status])}>
                    {p.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{formatDateTime(p.paidAt ?? p.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
