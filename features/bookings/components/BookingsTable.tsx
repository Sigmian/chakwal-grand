// ============================================================
// features/bookings/components/BookingsTable.tsx
// Data table for bookings with inline quick actions.
// ============================================================

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2, LogIn, LogOut, XCircle,
  ChevronLeft, ChevronRight, Eye, MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { confirmBooking, checkInBooking, checkOutBooking } from "@/server/actions/bookings";
import { Badge } from "@/components/shared";
import {
  formatDate, formatPKR,
  BOOKING_STATUS_CONFIG, PAYMENT_STATUS_CONFIG,
  ROOM_TYPE_CONFIG, getBranchColor,
} from "@/utils";
import type { Booking } from "@/types";
import { BookingStatus } from "@/types";

// ─── Types ────────────────────────────────────────────────────
interface Props {
  bookings:   (Booking & { room: { number: string; name: string; type: string }; customer: { name: string; phone: string; loyaltyTier: string }; branch: { name: string } })[];
  pagination: { page: number; totalPages: number; total: number };
}

// ─── Action Cell ─────────────────────────────────────────────
function QuickActions({ booking, onAction }: {
  booking: Props["bookings"][0];
  onAction: (id: string, action: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const actions = [
    booking.status === BookingStatus.PENDING    && { key: "confirm",   label: "Confirm",   icon: CheckCircle2, color: "text-blue-400"    },
    booking.status === BookingStatus.CONFIRMED  && { key: "checkin",   label: "Check In",  icon: LogIn,        color: "text-emerald-400" },
    booking.status === BookingStatus.CHECKED_IN && { key: "checkout",  label: "Check Out", icon: LogOut,       color: "text-amber-400"   },
    !["CHECKED_OUT", "CANCELLED"].includes(booking.status) && { key: "cancel", label: "Cancel", icon: XCircle, color: "text-red-400" },
  ].filter(Boolean) as Array<{ key: string; label: string; icon: React.ElementType; color: string }>;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-xl shadow-card-lg z-20 overflow-hidden"
            >
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    onClick={() => {
                      onAction(booking.id, action.key);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium hover:bg-accent/50 transition-colors ${action.color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {action.label}
                  </button>
                );
              })}
              <div className="border-t border-border/50">
                <Link
                  href={`/bookings/${booking.id}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  onClick={() => setOpen(false)}
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Table ──────────────────────────────────────────────
export function BookingsTable({ bookings, pagination }: Props) {
  const router      = useRouter();
  const [pending, startTransition] = useTransition();

  const handleAction = (id: string, action: string) => {
    // Early check-in / check-out guard — mirrors BookingActions.tsx
    if (action === "checkin" || action === "checkout") {
      const bk = bookings.find((b) => b.id === id);
      if (bk) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const target  = new Date(action === "checkin" ? bk.checkInDate : bk.checkOutDate);
        target.setHours(0, 0, 0, 0);
        if (target > today) {
          const days  = Math.round((target.getTime() - today.getTime()) / 86_400_000);
          const label = action === "checkin" ? "check-in" : "check-out";
          const fmt   = target.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" });
          if (!window.confirm(`Guest ${label} date is ${fmt} (${days} day${days !== 1 ? "s" : ""} away).\n\nCheck ${action === "checkin" ? "in" : "out"} early?`)) return;
        }
      }
    }

    startTransition(async () => {
      let result: { success: boolean; error?: string } | undefined;

      if (action === "confirm")  result = await confirmBooking(id);
      if (action === "checkin")  result = await checkInBooking(id);
      if (action === "checkout") result = await checkOutBooking(id);
      if (action === "cancel") {
        router.push(`/bookings/${id}?action=cancel`);
        return;
      }

      if (result?.success) {
        toast.success(`Booking ${action} successful`);
        router.refresh();
      } else {
        toast.error(result?.error ?? "Action failed");
      }
    });
  };

  if (bookings.length === 0) {
    return (
      <div className="card-luxury rounded-xl">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4 opacity-50">📋</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No bookings found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your filters or create a new booking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="card-luxury rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Guest / Ref</th>
                <th className="hidden sm:table-cell">Room</th>
                <th className="hidden md:table-cell">Branch</th>
                <th className="hidden sm:table-cell">Dates</th>
                <th>Amount</th>
                <th>Status</th>
                <th className="hidden md:table-cell">Payment</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const statusCfg  = BOOKING_STATUS_CONFIG[booking.status];
                const paymentCfg = PAYMENT_STATUS_CONFIG[booking.paymentStatus];
                const branchColor = getBranchColor((booking as any).branchId ?? "");

                return (
                  <tr key={booking.id} className="group">
                    {/* Guest + ref — always visible, room/date shown on mobile */}
                    <td>
                      <Link href={`/bookings/${booking.id}`} className="block">
                        <p className="text-sm font-semibold text-foreground">
                          {booking.customer?.name ?? "—"}
                        </p>
                        <p className="text-gold-400 font-bold text-xs hover:underline">
                          {booking.bookingRef}
                        </p>
                        {/* Mobile-only: room + dates inline */}
                        <p className="text-xs text-muted-foreground sm:hidden mt-0.5">
                          Rm {booking.room?.number} · {formatDate(booking.checkInDate)}
                        </p>
                      </Link>
                    </td>

                    {/* Room */}
                    <td className="hidden sm:table-cell">
                      <div>
                        <p className="text-sm text-foreground font-medium">
                          {booking.room?.name ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          #{booking.room?.number} · {booking.room?.type}
                        </p>
                      </div>
                    </td>

                    {/* Branch */}
                    <td className="hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${branchColor.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${branchColor.dot}`} />
                        {booking.branch?.name ?? "—"}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="hidden sm:table-cell">
                      <div>
                        <p className="text-xs text-foreground">
                          {formatDate(booking.checkInDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          → {formatDate(booking.checkOutDate)}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                          {booking.nights} night{booking.nights !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </td>

                    {/* Amount */}
                    <td>
                      <p className="text-sm font-bold text-gold-400 whitespace-nowrap">
                        {formatPKR(booking.totalAmount)}
                      </p>
                      <p className={`text-xs font-semibold md:hidden ${paymentCfg.color}`}>
                        {paymentCfg.label}
                      </p>
                    </td>

                    {/* Booking status */}
                    <td>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.bgColor} ${statusCfg.color} ${statusCfg.borderColor}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.color.replace("text-", "bg-")}`} />
                        <span className="hidden xs:inline">{statusCfg.label}</span>
                      </span>
                    </td>

                    {/* Payment status */}
                    <td className="hidden md:table-cell">
                      <span className={`text-xs font-semibold ${paymentCfg.color}`}>
                        {paymentCfg.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <QuickActions booking={booking} onAction={handleAction} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground">
            Showing {(pagination.page - 1) * 20 + 1}–
            {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} bookings
          </p>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/bookings?page=${pagination.page - 1}`}
              className={`p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-gold-500/40 transition-colors ${
                pagination.page <= 1 ? "opacity-40 pointer-events-none" : ""
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const p = i + 1;
              return (
                <Link
                  key={p}
                  href={`/bookings?page=${p}`}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center border transition-colors ${
                    p === pagination.page
                      ? "bg-gold-500/15 text-gold-400 border-gold-500/30"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
            <Link
              href={`/bookings?page=${pagination.page + 1}`}
              className={`p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-gold-500/40 transition-colors ${
                pagination.page >= pagination.totalPages ? "opacity-40 pointer-events-none" : ""
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
