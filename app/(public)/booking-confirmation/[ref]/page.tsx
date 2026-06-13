import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2, MapPin, Phone, BedDouble,
  CalendarDays, Users, Clock, MessageSquare,
} from "lucide-react";
import { getBookingByRef } from "@/server/actions/public";
import { siteConfig } from "@/config/site";
import { BookingCountdown }    from "@/features/public/components/BookingCountdown";
import { BookingQRCode }       from "@/features/public/components/BookingQRCode";
import { ICSDownload }          from "@/features/public/components/ICSDownload";
import { ReceiptDownload }      from "@/features/public/components/ReceiptDownload";
import { ShareBookingButton }   from "@/features/public/components/ShareBookingButton";
import { formatPKR }         from "@/utils";
import type { Metadata } from "next";

interface Props { params: { ref: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Booking ${params.ref} — Chakwal Grand` };
}

export default async function BookingConfirmationPage({ params }: Props) {
  const booking = await getBookingByRef(params.ref);
  if (!booking) notFound();

  const room     = booking.room;
  const customer = booking.customer;
  const branch   = booking.branch;

  const coverImage = room.images.find((i) => i.isCover) ?? room.images[0] ?? null;

  const checkInStr  = booking.checkInDate.toISOString().split("T")[0];
  const checkOutStr = booking.checkOutDate.toISOString().split("T")[0];

  const checkInFmt  = booking.checkInDate.toLocaleDateString("en-PK",  { weekday: "long",  day: "numeric", month: "long", year: "numeric" });
  const checkOutFmt = booking.checkOutDate.toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "long", year: "numeric" });

  const total    = Number(booking.totalAmount);
  const discount = Number(booking.discountAmount);
  const base     = Number(booking.baseAmount);
  const pricePer = Math.round(base / booking.nights);

  // Derive branch address from siteConfig (DB branch may not have address field)
  const branchAddress =
    (branch as any).address ??
    siteConfig.branches.find((b) => b.name.toLowerCase().includes(branch.city.toLowerCase()))?.address ??
    siteConfig.branches[0].address;

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branchAddress)}`;

  const waMessage = encodeURIComponent(
    `السلام علیکم! My booking ref is ${booking.bookingRef}. Please confirm my reservation.\n\nRoom: ${room.name}\nCheck-in: ${checkInFmt}\nGuest: ${customer.name}`
  );

  return (
    <div className="min-h-screen bg-surface-base py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ── */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold font-serif text-foreground mb-2">
            Booking Received!
          </h1>
          <p className="text-muted-foreground">
            We'll call you within 30 minutes to confirm your stay.
          </p>
        </div>

        {/* ── Booking Reference ── */}
        <div className="card-luxury rounded-2xl p-6 text-center mb-5 border border-gold-500/20">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Booking Reference
          </p>
          <p className="text-4xl font-bold font-serif text-gold-400 tracking-wide">
            {booking.bookingRef}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Save this number — you'll need it at check-in
          </p>
          <div className="mt-4 flex justify-center">
            <BookingQRCode value={`${siteConfig.url}/my-booking?ref=${booking.bookingRef}`} size={100} />
          </div>
        </div>

        {/* ── Countdown ── */}
        <div className="mb-5">
          <BookingCountdown checkInDate={checkInStr} />
        </div>

        {/* ── Room card ── */}
        <div className="card-luxury rounded-2xl overflow-hidden mb-5">
          {coverImage ? (
            <div className="relative h-52 w-full">
              <Image
                src={coverImage.url}
                alt={coverImage.altText ?? room.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-base/80 to-transparent" />
              <div className="absolute bottom-4 left-5">
                <p className="text-white font-bold text-xl font-serif drop-shadow">{room.name}</p>
                <p className="text-white/70 text-sm">Room {room.number} · {branch.name}</p>
              </div>
            </div>
          ) : (
            <div className="h-24 bg-accent flex items-center justify-center gap-3 px-6">
              <BedDouble className="w-8 h-8 text-gold-400" />
              <div>
                <p className="font-bold text-foreground text-lg">{room.name}</p>
                <p className="text-sm text-muted-foreground">Room {room.number} · {branch.name}</p>
              </div>
            </div>
          )}

          <div className="p-6 space-y-4">
            {/* Date row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-base rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="w-4 h-4 text-gold-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check-In</span>
                </div>
                <p className="font-bold text-foreground text-sm">{checkInFmt}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> From 2:00 PM
                </p>
              </div>
              <div className="bg-surface-base rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CalendarDays className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Check-Out</span>
                </div>
                <p className="font-bold text-foreground text-sm">{checkOutFmt}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> By 12:00 PM
                </p>
              </div>
            </div>

            {/* Guest + nights */}
            <div className="flex items-center justify-between text-sm py-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>
                  {booking.adultCount} adult{booking.adultCount > 1 ? "s" : ""}
                  {booking.childCount > 0 ? ` + ${booking.childCount} child` : ""}
                  {" · "}{booking.nights} night{booking.nights > 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-muted-foreground font-medium">
                Guest: <span className="text-foreground">{customer.name}</span>
              </span>
            </div>

            {/* Pricing */}
            <div className="bg-surface-base rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {formatPKR(pricePer)} × {booking.nights} night{booking.nights > 1 ? "s" : ""}
                </span>
                <span className="text-foreground font-medium">{formatPKR(base)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400">Discount applied</span>
                  <span className="text-emerald-400 font-semibold">− {formatPKR(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border/50">
                <span className="text-foreground">Total Due on Arrival</span>
                <span className="text-gold-400 font-serif">{formatPKR(total)}</span>
              </div>
              <p className="text-xs text-amber-400 flex items-center gap-1 pt-1">
                <span className="text-base">⚠</span> Cash payment only · CNIC required at check-in
              </p>
            </div>
          </div>
        </div>

        {/* ── Location ── */}
        <div className="card-luxury rounded-2xl p-5 mb-5">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-foreground text-sm mb-1">{branch.name} Branch</p>
              <p className="text-sm text-muted-foreground">{branchAddress}</p>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-gold-400 hover:text-gold-300 font-semibold transition-colors"
              >
                Open in Google Maps →
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a href={`tel:${siteConfig.phoneE164}`} className="text-sm text-foreground font-mono hover:text-gold-400 transition-colors">
                {siteConfig.phone}
              </a>
            </div>
          </div>
        </div>

        {/* ── Important notes ── */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
          <p className="text-amber-400 font-semibold text-sm mb-2">📌 Important Notes</p>
          <ul className="space-y-1 text-amber-400/80 text-xs">
            <li>• Check-in: 2:00 PM · Check-out: 12:00 PM</li>
            <li>• Bring your original CNIC — it is required at check-in</li>
            <li>• A/C is available {siteConfig.acHoursDaily} hours daily</li>
            <li>• Advance booking preferred — call ahead to confirm</li>
          </ul>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <ReceiptDownload
            bookingRef={booking.bookingRef}
            guestName={customer.name}
            guestPhone={customer.phone}
            roomName={room.name}
            roomNumber={room.number}
            branchName={branch.name}
            checkIn={checkInStr}
            checkOut={checkOutStr}
            nights={booking.nights}
            adults={booking.adultCount}
            children={booking.childCount}
            pricePerNight={pricePer}
            discountAmount={discount}
            totalAmount={total}
          />
          <ICSDownload
            bookingRef={booking.bookingRef}
            roomName={room.name}
            checkInDate={checkInStr}
            checkOutDate={checkOutStr}
            branchName={branch.name}
            address={branchAddress}
          />
          <a
            href={`https://wa.me/${siteConfig.whatsapp}?text=${waMessage}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold rounded-xl hover:bg-[#25D366]/25 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            WhatsApp Us
          </a>
          {booking.shareToken && (
            <ShareBookingButton bookingRef={booking.bookingRef} shareToken={booking.shareToken} />
          )}
        </div>

        {/* ── Guest Portal ── */}
        <div className="bg-surface-elevated border border-gold-500/20 rounded-2xl p-5 mb-5 text-center">
          <p className="text-sm font-bold text-foreground mb-1">Track Orders & Your Stay</p>
          <p className="text-xs text-muted-foreground mb-4">
            After check-in, use our Guest Portal to order food & drinks to your room and view your bill live.
          </p>
          <Link
            href="/guest/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all"
          >
            Open Guest Portal
          </Link>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
