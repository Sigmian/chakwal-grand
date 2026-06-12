import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Users, Shield, Wifi, Snowflake } from "lucide-react";
import { PublicNavbar } from "@/features/public/components/PublicNavbar";
import { PublicFooter } from "@/features/public/components/PublicFooter";
import { ChatWidget }   from "@/features/public/components/ChatWidget";

export const metadata: Metadata = {
  title: "Best Family Guest House in Chakwal — Chakwal Grand Guest House",
  description: "Looking for a safe, clean and affordable family guest house in Chakwal? Chakwal Grand offers spacious family rooms with AC, free WiFi, and 24/7 service. Book from PKR 2,500/night.",
  keywords: ["family guest house Chakwal", "family room Chakwal", "guest house for families Chakwal", "safe guest house Chakwal", "best family accommodation Chakwal Punjab"],
  alternates: { canonical: "https://www.staychakwal.de/blog/best-family-guest-house-chakwal" },
  openGraph: {
    title: "Best Family Guest House in Chakwal — Chakwal Grand",
    description: "Spacious family rooms, 24/7 service, CNIC-verified security. Chakwal Grand is the #1 family guest house in Chakwal Punjab.",
    url: "https://www.staychakwal.de/blog/best-family-guest-house-chakwal",
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Best Family Guest House in Chakwal — Why Families Choose Chakwal Grand",
  "description": "Chakwal Grand Guest House offers the best family accommodation in Chakwal with spacious rooms, 24/7 service, and affordable rates.",
  "url": "https://www.staychakwal.de/blog/best-family-guest-house-chakwal",
  "datePublished": "2025-01-20",
  "author": { "@type": "Organization", "name": "Chakwal Grand Guest House" },
  "publisher": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": "https://www.staychakwal.de" },
};

const FEATURES = [
  { icon: Users,     title: "Spacious Family Rooms",    desc: "Our family rooms accommodate up to 4 adults and 2 children comfortably, with a separate sitting area and ample wardrobe space." },
  { icon: Shield,    title: "CNIC-Verified Security",   desc: "All guests are CNIC-verified at check-in. CCTV cameras throughout the property ensure your family's safety 24/7." },
  { icon: Wifi,      title: "Free WiFi for Everyone",   desc: "High-speed WiFi is available in all rooms and common areas — so the kids can stream and you can stay connected." },
  { icon: Snowflake, title: "AC Rooms Available",       desc: "Beat the Punjab heat with our fully air-conditioned family rooms. AC available 12 hours daily (evening + night)." },
];

export default function FamilyGuestHousePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />
      <PublicNavbar />
      <main>
        <section className="pt-28 pb-16 bg-surface-elevated border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
              <Link href="/blog" className="hover:text-gold-400 transition-colors">Blog</Link>
              <span>/</span>
              <span>Family Guest House Chakwal</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full">Accommodation</span>
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mt-4 mb-6">
              Best Family Guest House in Chakwal — Why Thousands of Families Choose Chakwal Grand
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Finding safe, clean, and affordable family accommodation in Chakwal can be challenging.
              Chakwal Grand Guest House has been the preferred choice for families visiting Chakwal,
              Kallar Kahar, and Katas Raj for years — and here is exactly why.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

            <div className="prose-custom">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">What Makes a Good Family Guest House in Chakwal?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When traveling with your family, you need more than just a bed. You need space, safety, cleanliness,
                and staff who treat your family with respect. In Chakwal, where tourism is growing rapidly — especially
                around Katas Raj Temples, Kallar Kahar Lake, and the Salt Range — demand for quality family
                accommodation has increased significantly.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Chakwal Grand Guest House was built specifically to meet this demand. Our family rooms are designed
                for comfort — spacious enough for parents and children, with clean bathrooms, hot water, television,
                and all essential amenities.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card-luxury rounded-2xl p-5">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-gold-400" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2 text-sm">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Family Room Rates at Chakwal Grand</h2>
              <div className="card-luxury rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-base">
                      <th className="text-left p-4 font-bold text-foreground">Room Type</th>
                      <th className="text-right p-4 font-bold text-foreground">Rate/Night</th>
                      <th className="text-right p-4 font-bold text-foreground">Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Family Room (Non-AC)", "PKR 2,500", "4 Adults + 2 Children"],
                      ["Family Room (AC)", "PKR 3,500", "4 Adults + 2 Children"],
                      ["Apartment Suite (AC)", "PKR 4,500", "4 Adults + Kitchenette"],
                    ].map(([room, price, cap]) => (
                      <tr key={room} className="border-b border-border last:border-0">
                        <td className="p-4 text-foreground">{room}</td>
                        <td className="p-4 text-right text-gold-400 font-bold">{price}</td>
                        <td className="p-4 text-right text-muted-foreground text-xs">{cap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">All rates include free WiFi, hot water, and attached bathroom. Pay cash on arrival.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">What is Included in Every Family Room?</h2>
              <div className="space-y-3">
                {["Spacious room with quality beds and fresh linen", "Attached private bathroom with 24/7 hot water", "Free high-speed WiFi", "LED television", "Wardrobe and storage space", "CCTV security throughout the property", "24/7 reception and staff assistance", "No advance payment — pay cash on arrival", "Free cancellation up to 24 hours before check-in"].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-gold-400 flex-shrink-0" />
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">How to Book a Family Room at Chakwal Grand</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Booking is simple and takes less than 2 minutes. No advance payment is required — you simply
                reserve your room online or by phone, and pay cash when you arrive. We accept walk-ins too,
                but we strongly recommend booking in advance — especially during Eid, summer holidays, and
                weekends when Chakwal sees high tourist activity.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/book" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
                  Book a Family Room <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="tel:+923347742767" className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors">
                  Call 0334-7742767
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
      <ChatWidget />
    </>
  );
}
