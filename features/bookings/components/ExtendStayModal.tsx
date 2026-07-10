"use client";

// ============================================================
// features/bookings/components/ExtendStayModal.tsx
// Multi-step "Extend Stay" wizard for reception staff.
// Steps: Date + Preview → Confirm → Success
// ============================================================

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  X, CalendarPlus, ArrowRight, Check, Loader2,
  MessageCircle, PrinterIcon, AlertTriangle, Clock,
} from "lucide-react";
import { extendBooking } from "@/server/actions/bookings";
import { cn, formatPKR, buildWhatsAppUrl } from "@/utils";
import { PaymentMethod } from "@/types";

// ── Props ─────────────────────────────────────────────────────

interface BookingData {
  id:             string;
  bookingRef:     string;
  guestName:      string;
  guestPhone:     string;
  roomNumber:     string;
  roomName:       string;
  branchName:     string;
  checkInDate:    string; // ISO
  checkOutDate:   string; // ISO  e.g. "2026-07-10T00:00:00.000Z"
  nights:         number;
  pricePerNight:  number;
  totalAmount:    number;
  paidAmount:     number;
  discountAmount: number;
  taxAmount:      number;
  extraCharges:   number;
}

interface Props {
  booking: BookingData;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────

function diffDays(a: Date, b: Date): number {
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / 86_400_000));
}

/** Format Date → "YYYY-MM-DD" for <input type="date"> */
function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Format Date → readable string */
function readableDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Karachi",
  });
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]:          "💵 Cash",
  [PaymentMethod.BANK_TRANSFER]: "🏦 Bank Transfer",
  [PaymentMethod.JAZZCASH]:      "📱 JazzCash",
  [PaymentMethod.EASYPAISA]:     "📲 EasyPaisa",
  [PaymentMethod.ONLINE_CARD]:   "💳 Card / Online",
};

const inputCls =
  "w-full bg-surface-base border border-border rounded-xl px-3 py-2.5 text-sm text-foreground " +
  "placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50 transition-colors";

// ── Component ─────────────────────────────────────────────────

export function ExtendStayModal({ booking, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Current check-out date (normalised to midnight UTC)
  const currentCheckOut = useMemo(() => new Date(booking.checkOutDate), [booking.checkOutDate]);

  // Minimum selectable date = day after current checkout
  const minNewDate = useMemo(() => {
    const d = new Date(currentCheckOut);
    d.setUTCDate(d.getUTCDate() + 1);
    return toInputDate(d);
  }, [currentCheckOut]);

  // Form state
  const [step,          setStep]          = useState<"form" | "confirm" | "success">("form");
  const [newCheckOut,   setNewCheckOut]   = useState(minNewDate);
  const [payAmt,        setPayAmt]        = useState("");
  const [payMethod,     setPayMethod]     = useState<PaymentMethod>(PaymentMethod.CASH);
  const [payRef,        setPayRef]        = useState("");
  const [notes,         setNotes]         = useState("");
  const [serverError,   setServerError]   = useState<string | null>(null);
  const [successData,   setSuccessData]   = useState<Awaited<ReturnType<typeof extendBooking>>["data"]>();

  // ── Derived price preview ─────────────────────────────────

  const preview = useMemo(() => {
    if (!newCheckOut) return null;
    const newCO       = new Date(newCheckOut + "T12:00:00.000Z");
    const nightsAdded = diffDays(currentCheckOut, newCO);
    const addCharge   = booking.pricePerNight * nightsAdded;
    const newBase     = booking.totalAmount + addCharge; // totalAmount already includes prev discount/tax
    const prevBalance = booking.totalAmount - booking.paidAmount;
    const paymentNow  = Number(payAmt) || 0;
    const newBalance  = newBase - booking.paidAmount - paymentNow;
    return { nightsAdded, addCharge, newTotal: newBase, prevBalance, newBalance, paymentNow };
  }, [newCheckOut, booking, payAmt]);

  // ── Confirm handler ────────────────────────────────────────

  const handleConfirm = () => {
    setServerError(null);
    startTransition(async () => {
      const paymentNow = Number(payAmt) || 0;
      const res = await extendBooking({
        bookingId:       booking.id,
        newCheckOutDate: newCheckOut,
        paymentAmount:   paymentNow > 0 ? paymentNow : undefined,
        paymentMethod:   paymentNow > 0 ? payMethod   : undefined,
        paymentRef:      payRef || undefined,
        notes:           notes  || undefined,
      });

      if (res.success) {
        setSuccessData(res.data);
        setStep("success");
        router.refresh();
      } else {
        setServerError(res.error ?? "Failed to extend stay");
        toast.error(res.error ?? "Failed to extend stay");
        setStep("form"); // send back to form so user can adjust
      }
    });
  };

  // ── WhatsApp message builder ───────────────────────────────

  const buildWhatsAppMsg = () => {
    if (!successData) return "";
    const lines = [
      `*Stay Extended — ${successData.bookingRef}*`,
      ``,
      `Assalam o Alaikum ${successData.guestName} ji 👋`,
      `Aapki stay extend ho gayi hai. Updated details:`,
      ``,
      `🏨 Room: ${successData.roomNumber} — ${booking.branchName}`,
      `📅 New Check-out: ${successData.newCheckOut}`,
      `🌙 Nights Added: ${successData.nightsAdded}`,
      `💰 Additional Charge: ${formatPKR(successData.additionalCharge)}`,
      successData.paymentAmount > 0
        ? `✅ Payment Received: ${formatPKR(successData.paymentAmount)}`
        : "",
      successData.newBalance > 0
        ? `⚠️ Outstanding Balance: ${formatPKR(successData.newBalance)}`
        : `✅ Fully Paid`,
      ``,
      `Shukriya for staying with us! 🙏`,
    ].filter(Boolean).join("\n");
    return lines;
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
    >
      {/* Modal card */}
      <div className="relative w-full max-w-lg bg-surface-elevated rounded-2xl border border-border shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <CalendarPlus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-base">
                {step === "success" ? "Stay Extended ✓" : "Extend Stay"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {booking.bookingRef} · {booking.guestName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* ── STEP: FORM ── */}
          {step === "form" && (
            <>
              {/* Current stay summary */}
              <div className="bg-surface-base rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Room</p>
                  <p className="text-sm font-bold text-foreground">{booking.roomNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Check-out</p>
                  <p className="text-sm font-bold text-amber-400">
                    {readableDate(booking.checkOutDate)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Nights</p>
                  <p className="text-sm font-bold text-foreground">{booking.nights}</p>
                </div>
              </div>

              {/* Server error */}
              {serverError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{serverError}</p>
                </div>
              )}

              {/* New checkout date */}
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  New Check-out Date *
                </label>
                <input
                  type="date"
                  min={minNewDate}
                  value={newCheckOut}
                  onChange={e => setNewCheckOut(e.target.value)}
                  className={inputCls}
                />
                {preview && (
                  <p className="text-xs text-blue-400 mt-1.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {preview.nightsAdded} additional night{preview.nightsAdded !== 1 ? "s" : ""} added
                  </p>
                )}
              </div>

              {/* Price preview */}
              {preview && (
                <div className="bg-surface-base rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Price Preview
                  </p>
                  {[
                    { label: "Price / night",        value: formatPKR(booking.pricePerNight), color: "" },
                    { label: `× ${preview.nightsAdded} night${preview.nightsAdded !== 1 ? "s" : ""}`, value: "", color: "" },
                    { label: "Additional charge",    value: formatPKR(preview.addCharge),    color: "text-amber-400" },
                    { label: "Previous balance due", value: formatPKR(preview.prevBalance),  color: preview.prevBalance > 0 ? "text-red-400" : "text-muted-foreground" },
                  ].map(({ label, value, color }) => value && (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className={cn("text-xs font-semibold", color || "text-foreground")}>{value}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-2 mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground">New Total</span>
                    <span className="text-base font-bold text-gold-400">{formatPKR(preview.newTotal)}</span>
                  </div>
                </div>
              )}

              {/* Payment section */}
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Record Payment (optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={payAmt}
                      onChange={e => setPayAmt(e.target.value)}
                      placeholder={preview ? `Amount (balance: ${formatPKR(preview.newBalance + (Number(payAmt) || 0))})` : "Amount"}
                      min="0"
                      className={inputCls}
                    />
                    {/* Quick-fill buttons */}
                    {preview && preview.newTotal > 0 && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {[
                          { label: "Add. charge", val: Math.round(preview.addCharge) },
                          { label: "Full balance", val: Math.round(preview.newBalance + (Number(payAmt) || 0)) },
                        ].filter(b => b.val > 0).map(({ label, val }) => (
                          <button
                            key={label}
                            onClick={() => setPayAmt(String(val))}
                            className="text-[10px] px-2 py-1 rounded-lg border border-border text-muted-foreground hover:text-gold-400 hover:border-gold-500/30 transition-colors"
                          >
                            {label}: {formatPKR(val)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <select
                    value={payMethod}
                    onChange={e => setPayMethod(e.target.value as PaymentMethod)}
                    className={cn(inputCls, "col-span-1")}
                  >
                    {Object.values(PaymentMethod).map(m => (
                      <option key={m} value={m}>{METHOD_LABELS[m]}</option>
                    ))}
                  </select>
                  <input
                    value={payRef}
                    onChange={e => setPayRef(e.target.value)}
                    placeholder="Txn / Ref ID"
                    className={cn(inputCls, "col-span-1")}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <input
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  className={inputCls}
                />
              </div>

              {/* New balance preview */}
              {preview && (
                <div className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl border",
                  preview.newBalance > 0
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-green-500/10 border-green-500/20"
                )}>
                  <span className={cn("text-sm font-medium", preview.newBalance > 0 ? "text-amber-400" : "text-green-400")}>
                    {preview.newBalance > 0 ? "Balance after extension" : "Fully paid ✓"}
                  </span>
                  {preview.newBalance > 0 && (
                    <span className="text-base font-bold text-amber-400">{formatPKR(preview.newBalance)}</span>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── STEP: CONFIRM ── */}
          {step === "confirm" && preview && (
            <>
              <p className="text-sm text-muted-foreground">
                Please review the extension details carefully before confirming.
              </p>

              <div className="bg-surface-base rounded-xl divide-y divide-border/50">
                {[
                  { label: "Guest",            value: booking.guestName },
                  { label: "Room",             value: `${booking.roomNumber} — ${booking.branchName}` },
                  { label: "Old check-out",    value: readableDate(booking.checkOutDate),                      color: "text-muted-foreground line-through" },
                  { label: "New check-out",    value: readableDate(newCheckOut + "T12:00:00.000Z"),            color: "text-blue-400 font-bold" },
                  { label: "Nights added",     value: `+${preview.nightsAdded}`,                              color: "text-blue-400" },
                  { label: "Additional charge",value: formatPKR(preview.addCharge),                           color: "text-amber-400" },
                  { label: "Payment now",      value: preview.paymentNow > 0 ? `${formatPKR(preview.paymentNow)} (${METHOD_LABELS[payMethod]?.replace(/^\S+\s/, "")})` : "None", color: preview.paymentNow > 0 ? "text-emerald-400" : "" },
                  { label: "New outstanding",  value: preview.newBalance > 0 ? formatPKR(preview.newBalance) : "Fully paid ✓", color: preview.newBalance > 0 ? "text-red-400" : "text-emerald-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className={cn("text-sm font-semibold text-foreground", color)}>{value}</span>
                  </div>
                ))}
              </div>

              {serverError && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{serverError}</p>
                </div>
              )}
            </>
          )}

          {/* ── STEP: SUCCESS ── */}
          {step === "success" && successData && (
            <>
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">Stay Extended Successfully!</h3>
                <p className="text-sm text-muted-foreground">
                  {successData.guestName}&apos;s stay extended by {successData.nightsAdded} night{successData.nightsAdded !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="bg-surface-base rounded-xl divide-y divide-border/50">
                {[
                  { label: "New check-out",     value: successData.newCheckOut,                                     color: "text-blue-400 font-bold" },
                  { label: "Nights added",      value: `+${successData.nightsAdded}`,                              color: "text-blue-400" },
                  { label: "Additional charge", value: formatPKR(successData.additionalCharge),                    color: "text-amber-400" },
                  successData.paymentAmount > 0 ? { label: "Payment received", value: formatPKR(successData.paymentAmount), color: "text-emerald-400" } : null,
                  { label: "Outstanding",       value: successData.newBalance > 0 ? formatPKR(successData.newBalance) : "Nil — fully paid ✓", color: successData.newBalance > 0 ? "text-red-400" : "text-emerald-400" },
                ].filter(Boolean).map((row) => {
                  const { label, value, color } = row!;
                  return (
                    <div key={label} className="flex items-center justify-between px-4 py-3">
                      <span className="text-xs text-muted-foreground">{label}</span>
                      <span className={cn("text-sm font-semibold text-foreground", color)}>{value}</span>
                    </div>
                  );
                })}
              </div>

              {/* WhatsApp */}
              <a
                href={buildWhatsAppUrl(successData.guestPhone, buildWhatsAppMsg())}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl font-semibold text-sm hover:bg-emerald-500/20 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Send Update to Guest via WhatsApp
              </a>
            </>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 border-t border-border flex-shrink-0">
          {step === "form" && (
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newCheckOut) { toast.error("Select a new check-out date"); return; }
                  setServerError(null);
                  setStep("confirm");
                }}
                disabled={!newCheckOut || !preview}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-semibold hover:bg-blue-500/25 disabled:opacity-50 transition-colors"
              >
                Preview Extension
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === "confirm" && (
            <div className="flex gap-3">
              <button
                onClick={() => { setServerError(null); setStep("form"); }}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gold-gradient text-background rounded-xl text-sm font-bold disabled:opacity-60 transition-opacity"
              >
                {isPending
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Extending…</>
                  : <><Check className="w-4 h-4" /> Confirm Extension</>
                }
              </button>
            </div>
          )}

          {step === "success" && (
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
