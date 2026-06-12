import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Star } from "lucide-react";
import { PublicNavbar } from "@/features/public/components/PublicNavbar";
import { PublicFooter } from "@/features/public/components/PublicFooter";
import { ChatWidget }   from "@/features/public/components/ChatWidget";

export const metadata: Metadata = {
  title: "Where to Stay in Chakwal 2025 — Best Guest Houses & Hotels in Chakwal",
  description: "Complete guide to the best accommodation options in Chakwal, Punjab. Find budget rooms, family suites, and executive rooms. Chakwal Grand Guest House — top-rated stay from PKR 2,000/night.",
  keywords: ["where to stay in Chakwal", "best guest house Chakwal", "hotel in Chakwal", "accommodation Chakwal Punjab", "Chakwal rooms booking", "cheap stay Chakwal", "guest house near Katas Raj"],
  alternates: { canonical: "https://www.staychakwal.de/blog/where-to-stay-chakwal" },
  openGraph: {
    title: "Where to Stay in Chakwal 2025 — Best Guest Houses & Hotels",
    description: "Chakwal Grand Guest House is the top-rated accommodation in Chakwal. AC rooms, family suites, free WiFi from PKR 2,000/night.",
    url: "https://www.staychakwal.de/blog/where-to-stay-chakwal",
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Where to Stay in Chakwal 2025 — Best Guest Houses & Hotels",
  "url": "https://www.staychakwal.de/blog/where-to-stay-chakwal",
  "datePublished": "2025-02-20",
  "author": { "@type": "Organization", "name": "Chakwal Grand Guest House" },
  "publisher": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": "https://www.staychakwal.de" },
};

const ROOMS = [
  { type: "Classic Room (Non-AC)", price: "PKR 2,000/night", capacity: "2 Adults", features: ["Free WiFi", "Hot Water", "Attached Bathroom", "TV"], best: "Budget travelers & solo visitors" },
  { type: "Classic Room (AC)",     price: "PKR 2,500/night", capacity: "2 Adults", features: ["Free WiFi", "Hot Water", "AC (12 hrs)", "TV"], best: "Couples & professionals" },
  { type: "Family Room (Non-AC)",  price: "PKR 2,500/night", capacity: "4 Adults + 2 Children", features: ["Spacious Room", "Sitting Area", "Hot Water", "TV"], best: "Families visiting Chakwal" },
  { type: "Executive Room (AC)",   price: "PKR 4,000/night", capacity: "2 Adults", features: ["Work Desk", "Sofa", "AC (12 hrs)", "Free WiFi"], best: "Business travelers" },
  { type: "Apartment Suite (AC)",  price: "PKR 4,500/night", capacity: "4 Adults", features: ["Kitchenette", "Living Area", "AC", "Mini Fridge"], best: "Long stays & families" },
];

export default function WhereToStayPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />
      <PublicNavbar />
      <main>
        <section className="pt-28 pb-16 bg-surface-elevated border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
              <Link href="/blog" className="hover:text-gold-400 transition-colors">Blog</Link>
              <span>/</span><span>Where to Stay in Chakwal</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full">Accommodation</span>
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mt-4 mb-6">
              Where to Stay in Chakwal 2025 — Best Guest Houses & Hotels
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Chakwal is growing rapidly as a tourist destination, and the demand for quality accommodation is higher than ever.
              Whether you are visiting for a weekend trip to Katas Raj, a family holiday at Kallar Kahar, or a business visit —
              here is everything you need to know about where to stay in Chakwal.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">What to Look for in Chakwal Accommodation</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                When choosing where to stay in Chakwal, there are a few key factors to consider:
              </p>
              <div className="space-y-3">
                {[
                  ["Safety & Security", "Chakwal is a conservative city. Choose a guest house that verifies guests with CNIC and has CCTV security."],
                  ["Cleanliness", "Look for guest houses with attached bathrooms, fresh linen, and maintained facilities."],
                  ["Location", "Choose accommodation near the city center for easy access to local restaurants, markets, and transport."],
                  ["Price Transparency", "Avoid places with hidden charges. Chakwal Grand Guest House lists all prices clearly online."],
                  ["24/7 Staff", "A guest house with round-the-clock staff ensures help is always available — especially for late check-ins."],
                ].map(([title, desc]) => (
                  <div key={title} className="card-luxury rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-2">
                #1 Chakwal Grand Guest House — Best Accommodation in Chakwal
              </h2>
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />)}
                <span className="text-sm text-muted-foreground ml-2">Top-rated in Chakwal</span>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Chakwal Grand Guest House is the most popular and recommended accommodation in Chakwal district.
                With 3 branches — in Chakwal city, Kallar Kahar, and Sargodha — it serves thousands of guests
                annually, from solo travelers and business visitors to large family groups.
              </p>

              <div className="space-y-4">
                {ROOMS.map(r => (
                  <div key={r.type} className="card-luxury rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-foreground">{r.type}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Best for: {r.best}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-gold-400 font-bold">{r.price}</p>
                        <p className="text-xs text-muted-foreground">{r.capacity}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.features.map(f => (
                        <span key={f} className="text-xs bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-0.5 rounded-full">{f}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm">
                <p className="font-bold text-emerald-400 mb-1">Special Discounts Available</p>
                <p className="text-muted-foreground">Stay 7+ nights and get 14% off. Stay 30+ nights and get 40% off. Discount applied automatically at checkout.</p>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Tips for Booking in Chakwal</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Book at least 2–3 days in advance during Eid, summer holidays (June–August), and long weekends", "Always bring your original CNIC — it is required at check-in at all reputable guest houses in Chakwal", "Confirm your booking via phone/WhatsApp after booking online to ensure availability", "For groups of 5+, call directly to inquire about group rates and room arrangements", "If visiting Katas Raj or Kallar Kahar, Chakwal city center is the most convenient base"].map(tip => (
                  <li key={tip} className="flex items-start gap-2 card-luxury rounded-xl p-3">
                    <span className="text-gold-400 flex-shrink-0">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-luxury rounded-2xl p-8 text-center border border-gold-500/20">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Ready to Book Your Stay in Chakwal?</h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Book online in 2 minutes. No advance payment required. Pay cash on arrival.
                Chakwal Grand Guest House — the best accommodation in Chakwal Punjab.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/book" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
                  Book Now — Free Cancellation <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="tel:+923347742767" className="inline-flex items-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors">
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
