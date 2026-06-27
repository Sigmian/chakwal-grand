import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Calendar, Users, MapPin, Phone, Home, BedDouble } from "lucide-react";
import prisma from "@/lib/db/prisma";
import { formatPKR } from "@/utils";

export const metadata: Metadata = { title: "Booking Confirmation" };

interface Props { params: { ref: string } }

async function getBookingByRef(ref: string) {
  return prisma.booking.findUnique({
    where: { bookingRef: ref },
    include: {
      room:     { select: { name: true, number: true, type: true } },
      branch:   { select: { name: true, city: true, phone: true, address: true } },
      customer: { select: { name: true, phone: true } },
    },
  });
}

export default async function BookingConfirmationPage({ params }: Props) {
  const booking = await getBookingByRef(params.ref.toUpperCase());
  if (!booking) notFound();

  const nights = booking.nights ?? 1;
  const ci = new Date(booking.checkInDate).toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const co = new Date(booking.checkOutDate).toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const STATUS_STYLE: Record<string, string> = {
    PENDING:    "bg-amber-500/15 border-amber-500/30 text-amber-400",
    CONFIRMED:  "bg-green-500/15 border-green-500/30 text-green-400",
    CHECKED_IN: "bg-blue-500/15 border-blue-500/30 text-blue-400",
    CANCELLED:  "bg-red-500/15 border-red-500/30 text-red-400",
  };
  const STATUS_LABEL: Record<string, string> = {
    PENDING: "Awaiting Confirmation", CONFIRMED: "Confirmed",
    CHECKED_IN: "Checked In", CANCELLED: "Cancelled",
  };

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-bold font-serif text-foreground mb-2">Booking Received!</h1>
          <p className="text-muted-foreground">
            Thank you, <strong className="text-foreground">{booking.customer?.name}</strong>. We&apos;ll confirm your booking via phone within 30 minutes.
          </p>
        </div>

        <div className="card-luxury rounded-2xl overflow-hidden mb-6">
          <div className="bg-gold-500/10 border-b border-gold-500/20 px-6 py-5 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400/70 mb-1">Booking Reference</p>
            <p className="text-4xl font-bold font-serif text-gold-400 tracking-widest">{booking.bookingRef}</p>
            <div className={`inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_STYLE[booking.status] ?? STATUS_STYLE.PENDING}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
              {STATUS_LABEL[booking.status] ?? booking.status}
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center"><BedDouble className="w-6 h-6 text-gold-400" /></div>
              <div>
                <p className="font-bold text-foreground">{booking.room?.name}</p>
                <p className="text-xs text-muted-foreground">Room {booking.room?.number}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="font-bold text-gold-400 font-serif">{formatPKR(Number(booking.totalAmount))}</p>
                <p className="text-xs text-muted-foreground">Total · {nights} night{nights > 1 ? "s" : ""}</p>
              </div>
            </div>

            {[
              { icon: Calendar, label: "Check-in",  value: ci },
              { icon: Calendar, label: "Check-out", value: co },
              { icon: Users,    label: "Guests",    value: `${booking.adultCount} adult${booking.adultCount > 1 ? "s" : ""}${booking.childCount ? ` + ${booking.childCount} child${booking.childCount > 1 ? "ren" : ""}` : ""}` },
              { icon: MapPin,   label: "Branch",    value: `${booking.branch?.name}, ${booking.branch?.city}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-gold-400" />
                </div>
                <div className="flex justify-between w-full">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span className="text-sm font-semibold text-foreground text-right max-w-[55%]">{value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-6 mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">Important Notes</p>
            <ul className="text-xs text-amber-400/80 space-y-1">
              <li>• Check-in: 2:00 PM · Check-out: 12:00 PM</li>
              <li>• A/C available 12 hours daily (included in room rate)</li>
              <li>• Payment on arrival — cash preferred</li>
              <li>• Bring original CNIC for verification</li>
              <li>• Advance booking recommended — call to confirm</li>
            </ul>
          </div>
        </div>

        {booking.branch?.phone && (
          <div className="card-luxury rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <p className="font-semibold text-foreground text-sm">Need to modify or confirm?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Call or WhatsApp — mention your reference number</p>
            </div>
            <div className="flex gap-3">
              <a href={`https://wa.me/923347742767?text=Booking Reference: ${booking.bookingRef} — Please confirm my booking.`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold rounded-xl hover:bg-[#25D366]/25 transition-colors">
                WhatsApp
              </a>
              <a href={`tel:${booking.branch.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 px-4 py-2.5 bg-gold-500/15 border border-gold-500/30 text-gold-400 text-sm font-semibold rounded-xl hover:bg-gold-500/25 transition-colors">
                <Phone className="w-4 h-4" /> Call
              </a>
            </div>
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Home className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
