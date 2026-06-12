"use client";

import { BedDouble, Calendar, Users, CreditCard, ShoppingBag, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { formatPKR, cn } from "@/utils";
import type { getGuestDashboard } from "@/server/actions/guest";

type DashData = Extract<Awaited<ReturnType<typeof getGuestDashboard>>, { authenticated: true }>;

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED:  "text-blue-400 bg-blue-500/10 border-blue-500/20",
  CHECKED_IN: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  CHECKED_OUT:"text-muted-foreground bg-accent border-border",
};

const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING:   "Received",
  PREPARING: "Preparing",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};


export function GuestDashboardContent({ data }: { data: DashData }) {
  const { guest, booking, room, branch, billing, orders } = data;

  const checkInDate  = new Date(booking.checkIn);
  const checkOutDate = new Date(booking.checkOut);
  const today        = new Date();
  const daysLeft     = Math.max(0, Math.ceil((checkOutDate.getTime() - today.getTime()) / 86_400_000));
  const isCheckedIn  = booking.status === "CHECKED_IN";

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">

      {/* Hero room card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0a1628] to-[#1a2d4a] border border-gold-500/20 p-6 shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gold-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gold-400/80 mb-1">Your Room</p>
              <h2 className="text-3xl font-bold text-foreground">{room.number}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">{room.name} · Floor {room.floor}</p>
            </div>
            <span className={cn(
              "text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wide",
              STATUS_COLORS[booking.status] ?? "text-muted-foreground bg-accent border-border"
            )}>
              {booking.status === "CHECKED_IN" ? "Checked In" : booking.status.replace("_", " ")}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/5 rounded-xl p-3">
              <Calendar className="w-4 h-4 text-gold-400 mb-1" />
              <p className="text-[10px] text-muted-foreground">Check-in</p>
              <p className="text-xs font-semibold text-foreground">
                {checkInDate.toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <Calendar className="w-4 h-4 text-gold-400 mb-1" />
              <p className="text-[10px] text-muted-foreground">Check-out</p>
              <p className="text-xs font-semibold text-foreground">
                {checkOutDate.toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
              </p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <BedDouble className="w-4 h-4 text-gold-400 mb-1" />
              <p className="text-[10px] text-muted-foreground">Nights</p>
              <p className="text-xs font-semibold text-foreground">{booking.nights}</p>
            </div>
          </div>

          {isCheckedIn && daysLeft > 0 && (
            <p className="text-xs text-gold-400/80 mt-4 text-center">
              {daysLeft === 1 ? "Checkout tomorrow" : `${daysLeft} nights remaining`}
            </p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      {isCheckedIn && (
        <Link
          href="/guest/canteen"
          className="flex items-center justify-between p-4 bg-surface-elevated border border-border rounded-2xl hover:border-gold-500/40 hover:shadow-gold transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center shadow-gold">
              <ShoppingBag className="w-5 h-5 text-background" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Room Service / Canteen</p>
              <p className="text-xs text-muted-foreground">Order food & drinks to your room</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold-400 transition-colors" />
        </Link>
      )}

      {/* Billing card */}
      <div className="bg-surface-elevated border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-gold-400" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Bill Summary</h3>
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Room charges ({booking.nights} night{booking.nights !== 1 ? "s" : ""})</span>
            <span className="font-semibold text-foreground">{formatPKR(billing.roomCharges)}</span>
          </div>
          {billing.canteenTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Canteen / Room service</span>
              <span className="font-semibold text-foreground">{formatPKR(billing.canteenTotal)}</span>
            </div>
          )}
          {billing.extraCharges > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Other charges</span>
              <span className="font-semibold text-foreground">{formatPKR(billing.extraCharges)}</span>
            </div>
          )}
          {billing.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-semibold text-green-400">- {formatPKR(billing.discount)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2.5 flex justify-between">
            <span className="text-sm font-bold text-foreground">Total Payable</span>
            <span className="text-sm font-bold text-gold-400">{formatPKR(billing.totalPayable)}</span>
          </div>
          {billing.paidAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid</span>
              <span className="text-green-400 font-semibold">- {formatPKR(billing.paidAmount)}</span>
            </div>
          )}
          {billing.balanceDue > 0 && (
            <div className="flex justify-between text-sm bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mt-1">
              <span className="text-amber-400 font-bold">Balance Due</span>
              <span className="text-amber-400 font-bold">{formatPKR(billing.balanceDue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      {orders.length > 0 && (
        <div className="bg-surface-elevated border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-400" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Recent Orders</h3>
            </div>
            <Link href="/guest/orders" className="text-xs text-gold-400 hover:underline">View all</Link>
          </div>

          <div className="space-y-3">
            {orders.slice(0, 3).map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {order.itemCount} item{order.itemCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString("en-PK", { hour: "numeric", minute: "2-digit", hour12: true, day: "numeric", month: "short" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatPKR(order.totalAmount)}</p>
                  <p className={cn("text-xs font-semibold", {
                    "text-amber-400":   order.status === "PENDING",
                    "text-blue-400":    order.status === "PREPARING",
                    "text-green-400":   order.status === "DELIVERED",
                    "text-red-400":     order.status === "CANCELLED",
                  })}>
                    {ORDER_STATUS_LABEL[order.status] ?? order.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stay info */}
      <div className="bg-surface-elevated border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-gold-400" />
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Stay Details</h3>
        </div>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">Guests</span>
          <span className="font-semibold text-foreground">
            {booking.adults} adult{booking.adults !== 1 ? "s" : ""}
            {booking.children > 0 ? ` + ${booking.children} child` : ""}
          </span>
          <span className="text-muted-foreground">Branch</span>
          <span className="font-semibold text-foreground">{branch.name}</span>
          <span className="text-muted-foreground">Address</span>
          <span className="font-semibold text-foreground text-xs">{branch.address}</span>
          <span className="text-muted-foreground">Reception</span>
          <a href={`tel:${branch.phone}`} className="font-semibold text-gold-400 hover:underline">
            {branch.phone}
          </a>
        </div>
      </div>

      <div className="pb-4" />
    </div>
  );
}
