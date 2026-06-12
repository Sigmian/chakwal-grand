import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Car, Sun, CloudRain } from "lucide-react";

export const metadata: Metadata = {
  title: "Complete Chakwal Travel Guide 2025 — How to Get There, Stay & Explore",
  description: "Planning a trip to Chakwal, Punjab? Complete travel guide covering best time to visit, how to reach Chakwal, accommodation options, places to visit, local food, and travel tips for 2025.",
  keywords: ["Chakwal travel guide", "visiting Chakwal Punjab", "how to reach Chakwal", "Chakwal tourism 2025", "Chakwal trip plan", "Chakwal weather", "best time to visit Chakwal"],
  alternates: { canonical: "https://www.staychakwal.de/blog/chakwal-travel-guide" },
  openGraph: {
    title: "Complete Chakwal Travel Guide 2025",
    description: "Everything you need to know for a perfect trip to Chakwal — transport, accommodation, attractions, food, and insider tips.",
    url: "https://www.staychakwal.de/blog/chakwal-travel-guide",
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Complete Chakwal Travel Guide 2025 — How to Get There, Stay & Explore",
  "url": "https://www.staychakwal.de/blog/chakwal-travel-guide",
  "datePublished": "2025-02-01",
  "author": { "@type": "Organization", "name": "Chakwal Grand Guest House" },
  "publisher": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": "https://www.staychakwal.de" },
};

const SEASONS = [
  { icon: Sun,       season: "October – March",  rating: "★★★★★ Best",     desc: "Cool and pleasant. Perfect for sightseeing, hiking in the Salt Range, and visiting Katas Raj Temples. This is peak tourist season." },
  { icon: CloudRain, season: "April – June",      rating: "★★★☆☆ Good",     desc: "Spring season with occasional rain. Flowers bloom across the Salt Range. Can get warm by June — AC rooms recommended." },
  { icon: Sun,       season: "July – September",  rating: "★★☆☆☆ Hot & Wet", desc: "Monsoon season. Very hot and humid. Some areas may have flooded roads. Indoor attractions only — Katas Raj Lake fills up beautifully after rains." },
];

const TRANSPORT = [
  { from: "Rawalpindi / Islamabad", how: "Daewoo Bus, Faisal Movers, or private car via M-2 motorway and Chakwal road", time: "1.5 – 2 hours", cost: "PKR 200–300 by bus" },
  { from: "Lahore",                 how: "Daewoo Bus or car via GT Road through Gujranwala and Gujrat", time: "3 – 3.5 hours", cost: "PKR 700–900 by bus" },
  { from: "Jhelum",                 how: "Local transport or car via Pind Dadan Khan road", time: "45 min – 1 hour", cost: "PKR 150–200" },
  { from: "Faisalabad",             how: "Car via Sargodha road then Chakwal", time: "3 hours", cost: "PKR 600–800 by bus" },
];

export default function ChakwalTravelGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />
      <main>
        <section className="pt-28 pb-16 bg-surface-elevated border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
              <Link href="/blog" className="hover:text-gold-400 transition-colors">Blog</Link>
              <span>/</span><span>Chakwal Travel Guide</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full">Travel Guide</span>
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mt-4 mb-6">
              Complete Chakwal Travel Guide 2025
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Chakwal is one of Punjab&apos;s most underrated tourist destinations — a district rich in history, natural beauty,
              and spiritual significance. This complete travel guide will help you plan the perfect trip to Chakwal.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Best Time to Visit Chakwal</h2>
              <div className="space-y-4">
                {SEASONS.map(({ icon: Icon, season, rating, desc }) => (
                  <div key={season} className="card-luxury rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-gold-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-foreground text-sm">{season}</h3>
                        <span className="text-xs text-gold-400">{rating}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">How to Reach Chakwal</h2>
              <div className="space-y-4">
                {TRANSPORT.map(t => (
                  <div key={t.from} className="card-luxury rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <Car className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-foreground text-sm mb-1">From {t.from}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{t.how}</p>
                        <div className="flex gap-4 text-xs">
                          <span className="text-gold-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {t.time}</span>
                          <span className="text-muted-foreground">{t.cost}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Where to Stay in Chakwal</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For accommodation in Chakwal, <strong className="text-foreground">Chakwal Grand Guest House</strong> is the most popular and trusted choice.
                With 3 branches across the district — in Chakwal city, Kallar Kahar, and Sargodha — we offer rooms for every budget
                and group size. Rates start from PKR 2,000/night, and no advance payment is required.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[["Classic Room", "PKR 2,000", "2 Adults"], ["Family Room", "PKR 2,500", "4 Adults"], ["Executive AC", "PKR 4,000", "2 Adults + AC"]].map(([room, price, cap]) => (
                  <div key={room} className="card-luxury rounded-xl p-4 text-center">
                    <p className="font-bold text-foreground text-sm">{room}</p>
                    <p className="text-gold-400 font-bold text-lg mt-1">{price}</p>
                    <p className="text-xs text-muted-foreground">{cap} / night</p>
                  </div>
                ))}
              </div>
              <Link href="/book" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
                Book Now — No Payment Required <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Top Places to Visit in Chakwal</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Katas Raj Temples — 5,000-year-old Hindu pilgrimage site (40 km from Chakwal city)", "Kallar Kahar Lake — scenic saline lake with boating and wildlife park", "Choa Saidan Shah — hill town with natural springs and mild climate", "Salt Range Hills — ancient geological formation ideal for trekking", "Pharwala Fort — 11th century Gakhar fort with panoramic views", "Tilla Jogian — sacred hilltop monastery with breathtaking views"].map(place => (
                  <li key={place} className="flex items-start gap-2">
                    <span className="text-gold-400 mt-1">→</span>
                    <span>{place}</span>
                  </li>
                ))}
              </ul>
              <Link href="/blog/places-to-visit-chakwal" className="inline-flex items-center gap-2 mt-4 text-gold-400 text-sm hover:underline">
                Read our full guide to places in Chakwal <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Chakwal Travel Tips</h2>
              <ul className="space-y-3 text-sm">
                {["Always book accommodation in advance, especially during Eid and school holidays — Chakwal fills up fast.", "Carry your original CNIC — it is required at all guest houses and some tourist sites.", "Visit Katas Raj Temples early morning to avoid crowds and for the best photography light.", "Rent a car or book a local taxi for day trips — public transport between tourist sites is limited.", "Try local food at Chakwal city's dhaba restaurants — chapli kebab and daal chawal are must-tries.", "Keep PKR cash handy — most establishments in Chakwal are cash-only."].map(tip => (
                  <li key={tip} className="flex items-start gap-3 card-luxury rounded-xl p-3">
                    <span className="text-gold-400 font-bold flex-shrink-0">✓</span>
                    <span className="text-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
