import type { Metadata } from "next";
import { Suspense } from "react";
import { getPublicBranches } from "@/server/actions/public";
import { BookingForm } from "@/features/public/components/BookingForm";
import { Loader2 } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Book a Room | ${siteConfig.name}`,
  description: "Book your room at Chakwal Grand Guest House. Check availability and confirm your booking in minutes.",
  alternates: { canonical: `${siteConfig.url}/book` },
  openGraph: {
    title:       "Book a Room | Chakwal Grand Guest House",
    description: "Reserve your room at Chakwal Grand Guest House. Instant confirmation, free cancellation up to 24 hours.",
    url:         `${siteConfig.url}/book`,
  },
};

export default async function BookPage() {
  const branches = await getPublicBranches();

  return (
    <div className="pt-28 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Online Booking</p>
          <h1 className="text-4xl font-bold font-serif text-foreground mb-3">Book Your Room</h1>
          <p className="text-muted-foreground">
            Check availability, choose your room, and confirm instantly — no payment required online.
          </p>
        </div>

        {/* Info strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { icon: "✅", label: "Free cancellation", sub: "24h before check-in" },
            { icon: "💵", label: "Pay on arrival",    sub: "No card required" },
            { icon: "📞", label: "Instant confirmation", sub: "Via call / WhatsApp" },
            { icon: "🛏️", label: "Best price",        sub: "Direct booking rate" },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="card-luxury rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gold-400" />
          </div>
        }>
          <BookingForm branches={branches as { id: string; name: string; city: string }[]} />
        </Suspense>
      </div>
    </div>
  );
}
