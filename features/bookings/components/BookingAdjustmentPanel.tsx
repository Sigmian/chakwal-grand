"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Percent, Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { applyBookingAdjustment } from "@/server/actions/bookings";
import { formatPKR, cn } from "@/utils";

interface Props {
  bookingId:    string;
  bookingStatus: string;
  baseAmount:   number;
  currentDiscount: number;
  currentExtra:    number;
}

const inputCls = "w-full bg-surface-base border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50 transition-colors";

export function BookingAdjustmentPanel({
  bookingId, bookingStatus, baseAmount, currentDiscount, currentExtra,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen]     = useState(false);
  const [type, setType]     = useState<"DISCOUNT" | "EXTRA_CHARGE">("DISCOUNT");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const canAdjust = !["CANCELLED", "CHECKED_OUT"].includes(bookingStatus);

  const handleSubmit = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0)  { toast.error("Enter a valid amount"); return; }
    if (!reason.trim())    { toast.error("Reason is required"); return; }

    startTransition(async () => {
      const res = await applyBookingAdjustment({
        bookingId,
        adjustmentType: type,
        amount: amt,
        description: reason.trim(),
      });

      if (res.success) {
        toast.success(
          type === "DISCOUNT"
            ? `Discount of ${formatPKR(amt)} applied`
            : `Extra charge of ${formatPKR(amt)} added`
        );
        setAmount("");
        setReason("");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to apply adjustment");
      }
    });
  };

  return (
    <div className="card-luxury rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between p-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Percent className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-foreground">Billing Adjustment</p>
            <p className="text-xs text-muted-foreground">
              {currentDiscount > 0 ? `${formatPKR(currentDiscount)} discount applied` : "Add discount or extra charge"}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="border-t border-border px-5 pb-5 space-y-4 pt-4">
          {!canAdjust && (
            <p className="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
              Adjustments cannot be made on {bookingStatus.toLowerCase()} bookings.
            </p>
          )}

          {/* Current state */}
          {(currentDiscount > 0 || currentExtra > 0) && (
            <div className="bg-surface-base rounded-xl p-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Current Adjustments</p>
              {currentDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400">Discount applied</span>
                  <span className="text-emerald-400 font-semibold">−{formatPKR(currentDiscount)}</span>
                </div>
              )}
              {currentExtra > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-amber-400">Extra charges</span>
                  <span className="text-amber-400 font-semibold">+{formatPKR(currentExtra)}</span>
                </div>
              )}
            </div>
          )}

          {canAdjust && (
            <>
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2">
                {(["DISCOUNT", "EXTRA_CHARGE"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={cn(
                      "py-2 rounded-xl text-xs font-bold border transition-all",
                      type === t
                        ? t === "DISCOUNT"
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                          : "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t === "DISCOUNT" ? "Discount" : "Extra Charge"}
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Amount (₨) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 500"
                  className={inputCls}
                />
                {type === "DISCOUNT" && baseAmount > 0 && (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {[10, 15, 20, 25].map(pct => (
                      <button
                        key={pct}
                        onClick={() => setAmount(String(Math.round(baseAmount * pct / 100)))}
                        className="text-[10px] px-2 py-1 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-gold-500/30 transition-colors"
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Reason *
                </label>
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder={type === "DISCOUNT" ? "e.g. Loyalty discount, complaint resolution" : "e.g. Late checkout fee, damages"}
                  className={inputCls}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={isPending || !amount || !reason}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50",
                  type === "DISCOUNT"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                    : "bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25"
                )}
              >
                {isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Plus className="w-4 h-4" />}
                {isPending ? "Applying…" : type === "DISCOUNT" ? "Apply Discount" : "Add Extra Charge"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
