import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { getPublicRooms, getGrandOpeningOffer } from "@/server/actions/public";
import { RoomsClient } from "@/features/public/components/RoomsClient";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Rooms & Suites",
  description: "Explore AC rooms, family suites and VIP rooms at Chakwal Guest House in Chakwal, Punjab. Rates from PKR 2,000/night. View availability and book online.",
  keywords: ["rooms in Chakwal", "AC room Chakwal", "family suite Chakwal", "VIP room Chakwal", "cheap hotel room Chakwal", "Chakwal Guest House rooms"],
  alternates: { canonical: `${siteConfig.url}/rooms` },
  openGraph: {
    title:       `Rooms & Suites | ${siteConfig.name}`,
    description: "AC rooms, family suites & VIP rooms from PKR 2,000/night in Chakwal, Punjab.",
    url:         `${siteConfig.url}/rooms`,
  },
};

export const revalidate = 60;

export default async function RoomsPage() {
  const [rooms, grandOpeningOffer] = await Promise.all([
    getPublicRooms(),
    getGrandOpeningOffer(siteConfig.branchIds.madinaTown),
  ]);

  return (
    <div className="pt-28 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Our Accommodations</p>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mb-4">
          Find Your Perfect Room
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          From cozy classic rooms to spacious family suites — all with complimentary WiFi, hot water, and 24/7 service.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/rooms/pick"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-md transition-all text-sm"
          >
            <Building2 className="w-4 h-4" /> Choose Your Room by Floor <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-muted-foreground self-center hidden sm:block">
            or browse by category below · tick rooms to compare side-by-side
          </p>
        </div>
      </div>

      {/* Rooms grid with comparison */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <RoomsClient
          rooms={rooms as any}
          grandOpeningOffer={grandOpeningOffer ? {
            branchId: siteConfig.branchIds.madinaTown,
            discountValue: Number(grandOpeningOffer.discountValue),
            expiresAt: grandOpeningOffer.expiresAt?.toISOString() ?? "",
          } : null}
        />
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="card-luxury rounded-3xl p-8 sm:p-12 text-center border border-gold-500/20 bg-gradient-to-br from-gold-500/5 to-transparent">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-foreground mb-4">
            Ready to Book Your Stay?
          </h2>
          <p className="text-muted-foreground mb-8">
            Check availability for your dates and confirm your room in minutes. No payment required online — pay on arrival.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-md transition-all">
              Check Availability
            </Link>
            <a href={`tel:${siteConfig.phoneE164}`}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-border text-foreground font-semibold rounded-xl hover:bg-accent transition-colors">
              Call {siteConfig.phone}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
