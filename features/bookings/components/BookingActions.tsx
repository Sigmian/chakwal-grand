// ============================================================
// features/bookings/components/BookingActions.tsx
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, LogIn, LogOut, XCircle, Loader2, CalendarPlus } from "lucide-react";
import { confirmBooking, checkInBooking, checkOutBooking, cancelBooking } from "@/server/actions/bookings";
import { BookingStatus } from "@/types";
import { ExtendStayModal } from "./ExtendStayModal";

interface BookingForExtend {
  id:             string;
  bookingRef:     string;
  guestName:      string;
  guestPhone:     string;
  roomNumber:     string;
  roomName:       string;
  branchName:     string;
  checkInDate:    string;
  checkOutDate:   string;
  nights:         number;
  pricePerNight:  number;
  totalAmount:    number;
  paidAmount:     number;
  discountAmount: number;
  taxAmount:      number;
  extraCharges:         number;
  extensionDiscountPct: number;
  extensionOfferName:   string | null;
}

interface Props {
  booking: { id: string; status: string; bookingRef: string; checkInDate: string; checkOutDate: string };
  extendData?: BookingForExtend;
  showCancel?: boolean;
}

export function BookingActions({ booking, extendData, showCancel }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancelOpen,   setCancelOpen]   = useState(showCancel ?? false);
  const [extendOpen,   setExtendOpen]   = useState(false);
  const [reason,       setReason]       = useState("");
  const [confirmWarn,  setConfirmWarn]  = useState<{ action: "checkin" | "checkout"; msg: string } | null>(null);

  const executeAction = (action: "confirm" | "checkin" | "checkout") => {
    startTransition(async () => {
      const result =
        action === "confirm"  ? await confirmBooking(booking.id)
        : action === "checkin"  ? await checkInBooking(booking.id)
        : await checkOutBooking(booking.id);

      if (result.success) {
        toast.success(`${action === "confirm" ? "Confirmed" : action === "checkin" ? "Checked in" : "Checked out"} successfully`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Action failed");
      }
    });
  };

  const handleAction = (action: "confirm" | "checkin" | "checkout") => {
    if (action === "checkin") {
      const today     = new Date();
      today.setHours(0, 0, 0, 0);
      const checkIn   = new Date(booking.checkInDate);
      checkIn.setHours(0, 0, 0, 0);
      if (checkIn > today) {
        const fmt = checkIn.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" });
        setConfirmWarn({ action: "checkin", msg: `Guest's check-in date is ${fmt}. Checking in now is ${Math.round((checkIn.getTime() - today.getTime()) / 86_400_000)} day(s) early. Continue?` });
        return;
      }
    }
    if (action === "checkout") {
      const today     = new Date();
      today.setHours(0, 0, 0, 0);
      const checkOut  = new Date(booking.checkOutDate);
      checkOut.setHours(0, 0, 0, 0);
      if (checkOut > today) {
        const fmt = checkOut.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" });
        setConfirmWarn({ action: "checkout", msg: `Guest's check-out date is ${fmt}. Checking out now is ${Math.round((checkOut.getTime() - today.getTime()) / 86_400_000)} day(s) early. Continue?` });
        return;
      }
    }
    executeAction(action);
  };

  const handleCancel = () => {
    if (!reason.trim()) { toast.error("Please provide a cancellation reason"); return; }
    startTransition(async () => {
      const result = await cancelBooking(booking.id, { reason });
      if (result.success) {
        toast.success(`Booking ${booking.bookingRef} cancelled`);
        setCancelOpen(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Cancellation failed");
      }
    });
  };

  const status = booking.status as BookingStatus;

  return (
    <>
    {extendOpen && extendData && (
      <ExtendStayModal booking={extendData} onClose={() => setExtendOpen(false)} />
    )}

    {/* Early check-in / check-out warning dialog */}
    {confirmWarn && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-surface-elevated border border-amber-500/30 rounded-2xl p-6 max-w-sm w-full shadow-xl space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              {confirmWarn.action === "checkin"
                ? <LogIn className="w-5 h-5 text-amber-400" />
                : <LogOut className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <p className="font-bold text-foreground text-sm mb-1">Early {confirmWarn.action === "checkin" ? "Check-In" : "Check-Out"}</p>
              <p className="text-muted-foreground text-xs leading-relaxed">{confirmWarn.msg}</p>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => setConfirmWarn(null)}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { const a = confirmWarn.action; setConfirmWarn(null); executeAction(a); }}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-semibold hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
            >
              Yes, Proceed
            </button>
          </div>
        </div>
      </div>
    )}

    <div className="card-luxury rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Actions</h3>

      {status === BookingStatus.PENDING && (
        <button
          onClick={() => handleAction("confirm")}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold rounded-xl hover:bg-blue-500/20 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          Confirm Booking
        </button>
      )}

      {status === BookingStatus.CONFIRMED && (
        <button
          onClick={() => handleAction("checkin")}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-xl hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          Check In Guest
        </button>
      )}

      {status === BookingStatus.CHECKED_IN && (
        <button
          onClick={() => handleAction("checkout")}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-500/20 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Check Out Guest
        </button>
      )}

      {/* Extend Stay — available for CONFIRMED and CHECKED_IN bookings */}
      {extendData && [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN].includes(status) && (
        <button
          onClick={() => setExtendOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold rounded-xl hover:bg-blue-500/20 transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          Extend Stay
        </button>
      )}

      {![BookingStatus.CHECKED_OUT, BookingStatus.CANCELLED].includes(status) && (
        <>
          {!cancelOpen ? (
            <button
              onClick={() => setCancelOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Cancel Booking
            </button>
          ) : (
            <div className="space-y-3 pt-2 border-t border-border/50">
              <p className="text-xs font-semibold text-red-400">Cancellation Reason</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this booking being cancelled?"
                rows={3}
                className="w-full bg-surface-elevated border border-red-500/20 rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-red-500/40 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setCancelOpen(false)}
                  className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground"
                >
                  Back
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isPending || !reason.trim()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 text-sm font-semibold hover:bg-red-500/25 disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Confirm Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
