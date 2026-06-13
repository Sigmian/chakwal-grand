// ============================================================
// app/(dashboard)/bookings/[bookingId]/page.tsx
// Booking detail — full lifecycle view with payment management
// ============================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Phone, MessageCircle } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { SectionHeader } from "@/components/shared";
import { BookingActions } from "@/features/bookings/components/BookingActions";
import { PaymentPanel } from "@/features/bookings/components/PaymentPanel";
import { BookingInvoice } from "@/features/bookings/components/BookingInvoice";
import { BookingAdjustmentPanel } from "@/features/bookings/components/BookingAdjustmentPanel";
import { CnicPanel } from "@/features/bookings/components/CnicPanel";
import {
  formatPKR, formatDate, formatDateTime,
  BOOKING_STATUS_CONFIG, PAYMENT_STATUS_CONFIG,
  ROOM_TYPE_CONFIG,
  buildWhatsAppUrl, buildBookingWhatsAppMessage,
} from "@/utils";

interface PageProps { params: { bookingId: string } }

export async function generateMetadata({ params }: PageProps) {
  const b = await prisma.booking.findUnique({ where: { id: params.bookingId } });
  return { title: b ? `Booking ${b.bookingRef}` : "Booking" };
}

export default async function BookingDetailPage({ params, searchParams }: PageProps & { searchParams: { action?: string } }) {
  await requirePermission("bookings:read");

  const booking = await prisma.booking.findUnique({
    where:   { id: params.bookingId },
    include: {
      room:     { include: { images: { where: { isCover: true }, take: 1 } } },
      customer: true,
      branch:   true,
      payments: { orderBy: { createdAt: "desc" } },
      salesAttached: {
        include: { lineItems: { include: { inventoryItem: { include: { product: true } } } } },
      },
      offer:    true,
    },
  });

  if (!booking) notFound();

  const statusCfg  = BOOKING_STATUS_CONFIG[booking.status];
  const paymentCfg = PAYMENT_STATUS_CONFIG[booking.paymentStatus];
  const typeCfg    = ROOM_TYPE_CONFIG[booking.room.type as keyof typeof ROOM_TYPE_CONFIG] ?? ROOM_TYPE_CONFIG.STANDARD;

  const whatsappMsg = buildBookingWhatsAppMessage({
    bookingRef:  booking.bookingRef,
    guestName:   booking.customer.name,
    roomName:    booking.room.name,
    checkIn:     formatDate(booking.checkInDate),
    checkOut:    formatDate(booking.checkOutDate),
    nights:      booking.nights,
    total:       Number(booking.totalAmount),
  });
  const whatsappUrl = buildWhatsAppUrl(booking.customer.phone, whatsappMsg);

  // POS sales attached total
  const extraChargesTotal = booking.salesAttached.reduce(
    (sum, s) => sum + Number(s.totalAmount), 0
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link href="/bookings" className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground font-serif">{booking.bookingRef}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusCfg.bgColor} ${statusCfg.color} ${statusCfg.borderColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {statusCfg.label}
            </span>
            <span className={`text-xs font-semibold ${paymentCfg.color}`}>
              {paymentCfg.label}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Created {formatDateTime(booking.createdAt)} · {booking.branch.name}
          </p>
        </div>

        {/* WhatsApp contact */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </a>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Booking + guest info */}
        <div className="xl:col-span-2 space-y-5">
          {/* Room card */}
          <div className="card-luxury rounded-xl overflow-hidden">
            <div className="flex">
              <div className="w-28 h-24 bg-accent/30 flex-shrink-0">
                {booking.room.images[0] && (
                  <img src={booking.room.images[0].url} alt={booking.room.name} className="w-full h-full object-cover" />
                )}
              </div>
              <div className="p-4 flex-1">
                <p className="text-xs text-muted-foreground font-medium mb-0.5">
                  {typeCfg.icon} {typeCfg.label} · Room {booking.room.number}
                </p>
                <h2 className="text-base font-bold text-foreground">{booking.room.name}</h2>
                <p className="text-xs text-muted-foreground">{booking.branch.name}</p>
              </div>
            </div>
          </div>

          {/* Stay details */}
          <div className="card-luxury rounded-xl p-5">
            <SectionHeader title="Stay Details" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Check-In",    value: formatDate(booking.checkInDate)   },
                { label: "Check-Out",   value: formatDate(booking.checkOutDate)  },
                { label: "Nights",      value: `${booking.nights} night${booking.nights !== 1 ? "s" : ""}` },
                { label: "Adults",      value: booking.adultCount.toString()     },
                { label: "Children",    value: booking.childCount.toString()     },
                { label: "Source",      value: booking.source ?? "website"       },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
                </div>
              ))}
              {booking.actualCheckIn && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Actual Check-In</p>
                  <p className="text-sm font-semibold text-emerald-400">{formatDateTime(booking.actualCheckIn)}</p>
                </div>
              )}
              {booking.actualCheckOut && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Actual Check-Out</p>
                  <p className="text-sm font-semibold text-amber-400">{formatDateTime(booking.actualCheckOut)}</p>
                </div>
              )}
            </div>
            {booking.specialRequests && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Special Requests</p>
                <p className="text-sm text-foreground">{booking.specialRequests}</p>
              </div>
            )}
            {booking.internalNotes && (
              <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <p className="text-xs text-amber-400 font-semibold mb-1">Staff Notes</p>
                <p className="text-sm text-muted-foreground">{booking.internalNotes}</p>
              </div>
            )}
          </div>

          {/* Guest info */}
          <div className="card-luxury rounded-xl p-5">
            <SectionHeader title="Guest Information" />
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-lg font-bold text-foreground">{booking.customer.name}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  {booking.customer.phone}
                </div>
                {booking.customer.email && (
                  <p className="text-sm text-muted-foreground">{booking.customer.email}</p>
                )}
                {booking.customer.city && (
                  <p className="text-sm text-muted-foreground">📍 {booking.customer.city}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Loyalty Tier</p>
                <p className="text-sm font-bold text-gold-400">{booking.customer.loyaltyTier}</p>
                <p className="text-xs text-muted-foreground">{booking.customer.totalVisits} visits</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href={`/customers/${booking.customer.id}`}
                className="text-xs text-gold-400 hover:underline"
              >
                View Full Profile →
              </Link>
            </div>
          </div>

          {/* POS charges */}
          {booking.salesAttached.length > 0 && (
            <div className="card-luxury rounded-xl p-5">
              <SectionHeader title="Room Charges" subtitle="Products sold during stay" />
              <div className="space-y-2">
                {booking.salesAttached.map((sale) =>
                  sale.lineItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <div>
                        <p className="text-sm text-foreground">{item.inventoryItem.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatPKR(Number(item.unitPrice))}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{formatPKR(Number(item.totalPrice))}</p>
                    </div>
                  ))
                )}
                <div className="flex items-center justify-between pt-2 font-semibold">
                  <span className="text-sm text-foreground">Extra Charges Total</span>
                  <span className="text-sm text-gold-400">{formatPKR(extraChargesTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Billing + actions */}
        <div className="space-y-5">
          {/* Bill summary */}
          <div className="card-luxury rounded-xl p-5">
            <SectionHeader title="Bill Summary" />
            <div className="space-y-2">
              {[
                { label: "Room Rate",    value: formatPKR(Number(booking.baseAmount)),    color: ""              },
                { label: "Discount",     value: `(${formatPKR(Number(booking.discountAmount))})`, color: "text-emerald-400", hide: Number(booking.discountAmount) === 0 },
                { label: "Extra Charges",value: formatPKR(extraChargesTotal),             color: "",              hide: extraChargesTotal === 0 },
                { label: "Tax",          value: formatPKR(Number(booking.taxAmount)),     color: "",              hide: Number(booking.taxAmount) === 0 },
              ].filter((r) => !r.hide).map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className={`text-sm font-medium ${color || "text-foreground"}`}>{value}</span>
                </div>
              ))}
              <div className="border-t border-border my-2" />
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm font-bold text-foreground">Total</span>
                <span className="text-lg font-bold text-gold-400">{formatPKR(Number(booking.totalAmount))}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm text-emerald-400">Paid</span>
                <span className="text-sm font-semibold text-emerald-400">{formatPKR(Number(booking.paidAmount))}</span>
              </div>
              {Number(booking.totalAmount) - Number(booking.paidAmount) > 0 && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-amber-400">Remaining</span>
                  <span className="text-sm font-semibold text-amber-400">
                    {formatPKR(Number(booking.totalAmount) - Number(booking.paidAmount))}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment history */}
          {booking.payments.length > 0 && (
            <div className="card-luxury rounded-xl p-5">
              <SectionHeader title="Payments" />
              <div className="space-y-2">
                {booking.payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                    <div>
                      <p className="text-xs font-medium text-foreground">{p.method.replace(/_/g, " ")}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDateTime(p.createdAt)}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-400">{formatPKR(Number(p.amount))}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Billing adjustments */}
          <BookingAdjustmentPanel
            bookingId={booking.id}
            bookingStatus={booking.status}
            baseAmount={Number(booking.baseAmount)}
            currentDiscount={Number(booking.discountAmount)}
            currentExtra={Number(booking.extraCharges)}
          />

          {/* CNIC verification */}
          <CnicPanel
            customerId={booking.customer.id}
            cnic={booking.customer.cnic ?? null}
            cnicImage={(booking.customer as any).cnicImage ?? null}
          />

          {/* Add payment */}
          <PaymentPanel
            bookingId={booking.id}
            remaining={Number(booking.totalAmount) - Number(booking.paidAmount)}
            bookingStatus={booking.status as never}
          />

          {/* Booking actions */}
          <BookingActions
            booking={{
              id:     booking.id,
              status: booking.status,
              bookingRef: booking.bookingRef,
            }}
            showCancel={searchParams.action === "cancel"}
          />

          {/* Invoice — shown once booking is confirmed */}
          {!["PENDING", "CANCELLED"].includes(booking.status) && (
            <BookingInvoice
              invoice={{
                bookingRef:     booking.bookingRef,
                customerName:   booking.customer.name,
                customerPhone:  booking.customer.phone,
                roomName:       booking.room.name,
                roomNumber:     booking.room.number,
                roomType:       typeCfg.label,
                branchName:     booking.branch.name,
                branchAddress:  booking.branch.address ?? undefined,
                checkIn:        formatDate(booking.checkInDate),
                checkOut:       formatDate(booking.checkOutDate),
                nights:         booking.nights,
                pricePerNight:  Number(booking.baseAmount) / booking.nights,
                baseAmount:     Number(booking.baseAmount),
                discountAmount: Number(booking.discountAmount),
                extraCharges:   Number(booking.extraCharges),
                taxAmount:      Number(booking.taxAmount),
                totalAmount:    Number(booking.totalAmount),
                paidAmount:     Number(booking.paidAmount),
                confirmedAt:    formatDateTime(booking.createdAt),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
