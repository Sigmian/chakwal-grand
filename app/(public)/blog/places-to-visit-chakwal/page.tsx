import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import { PublicNavbar } from "@/features/public/components/PublicNavbar";
import { PublicFooter } from "@/features/public/components/PublicFooter";
import { ChatWidget }   from "@/features/public/components/ChatWidget";

export const metadata: Metadata = {
  title: "Top 10 Places to Visit in Chakwal 2025 — Complete Tourist Guide",
  description: "Discover the most beautiful places in Chakwal district — Katas Raj Temples, Kallar Kahar Lake, Choa Saidan Shah, Salt Range, Tarbela Dam & more. Best tourist spots in Chakwal Punjab.",
  keywords: ["places to visit Chakwal", "tourist spots Chakwal", "Katas Raj Temples", "Kallar Kahar Lake", "Chakwal tourism", "things to do Chakwal Punjab", "Salt Range Pakistan"],
  alternates: { canonical: "https://www.staychakwal.de/blog/places-to-visit-chakwal" },
  openGraph: {
    title: "Top 10 Places to Visit in Chakwal 2025",
    description: "From Katas Raj Temples to Kallar Kahar Lake — complete guide to tourist attractions in Chakwal, Punjab.",
    url: "https://www.staychakwal.de/blog/places-to-visit-chakwal",
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Top 10 Places to Visit in Chakwal — Complete Tourist Guide 2025",
  "description": "Discover the most beautiful and historic places in Chakwal district, Punjab Pakistan.",
  "url": "https://www.staychakwal.de/blog/places-to-visit-chakwal",
  "datePublished": "2025-01-15",
  "dateModified": "2025-01-15",
  "author": { "@type": "Organization", "name": "Chakwal Grand Guest House" },
  "publisher": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": "https://www.staychakwal.de" },
};

const PLACES = [
  { num: "01", name: "Katas Raj Temples", type: "Historic & Religious Site", distance: "40 km from Chakwal city", desc: "One of the most sacred Hindu pilgrimage sites in Pakistan, Katas Raj Temples date back over 5,000 years. The complex features ancient temples surrounding a holy pond (kund) believed to have formed from the tears of Lord Shiva. It is a UNESCO-recognized heritage site and a must-visit in Chakwal district.", tip: "Best visited early morning. Free entry." },
  { num: "02", name: "Kallar Kahar Lake", type: "Natural Lake & Viewpoint", distance: "45 km from Chakwal", desc: "A stunning natural saline lake surrounded by the Salt Range hills. Kallar Kahar is a popular picnic spot with boating, green parks, and the famous Kallar Kahar Wildlife Park nearby. The lake changes colors with the seasons — a photographer's paradise.", tip: "Boat rides available. Visit at sunset for best views." },
  { num: "03", name: "Choa Saidan Shah", type: "Hill Town & Pilgrimage", distance: "30 km from Chakwal", desc: "A picturesque hill town famous for its mild climate, natural springs, and the shrine of Hazrat Saidan Shah. The town is surrounded by the scenic Salt Range hills and is a popular weekend getaway from Rawalpindi and Islamabad.", tip: "Famous for fresh spring water and local food." },
  { num: "04", name: "Salt Range Hills", type: "Nature & Hiking", distance: "Throughout Chakwal district", desc: "The Salt Range is one of Pakistan's oldest geological formations, stretching across Chakwal and Khushab. Ideal for trekking, off-road driving, and photography. The range contains one of the world's largest salt mines at Khewra.", tip: "Best for hiking between October and March." },
  { num: "05", name: "Pharwala Fort", type: "Historic Fort", distance: "Near Chakwal", desc: "An ancient fort built by the Hindu Gakhar tribe, perched on a hilltop overlooking the valley. Pharwala Fort offers stunning panoramic views and a fascinating glimpse into pre-Mughal history. The fort dates back to the 11th century.", tip: "Wear sturdy shoes for the climb." },
  { num: "06", name: "Kallar Kahar Wildlife Park", type: "Wildlife & Nature", distance: "45 km from Chakwal", desc: "Home to deer, peacocks, and migratory birds, the Kallar Kahar Wildlife Park is a serene escape from city life. The park surrounds the lake and provides a natural habitat for various bird species, making it ideal for birdwatching.", tip: "Great for family picnics and photography." },
  { num: "07", name: "Tilla Jogian", type: "Religious & Scenic", distance: "40 km from Chakwal", desc: "A sacred hilltop monastery with breathtaking views of the entire Salt Range. Tilla Jogian is one of the oldest Hindu pilgrimage sites in the region, and the climb offers some of the most spectacular scenery in Punjab.", tip: "The climb takes about 1.5 hours. Worth every step." },
  { num: "08", name: "Dhok Pathan", type: "Adventure & Off-Road", distance: "Near Kallar Kahar", desc: "A popular off-road destination with rugged terrain and scenic valleys. Dhok Pathan attracts adventure tourists and 4x4 enthusiasts from across Pakistan, offering challenging tracks through the Salt Range landscape.", tip: "4x4 vehicle recommended." },
];

export default function PlacesToVisitPage() {
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
              <span>Places to Visit Chakwal</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full">Tourism</span>
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mt-4 mb-6">
              Top 10 Places to Visit in Chakwal — Complete Tourist Guide 2025
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Chakwal district in Punjab, Pakistan is home to some of the most historically rich and naturally
              beautiful destinations in the country. From 5,000-year-old temples to stunning salt lakes —
              here are the top places to visit on your Chakwal trip.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {PLACES.map(p => (
              <article key={p.num} className="card-luxury rounded-2xl p-6">
                <div className="flex items-start gap-4 mb-3">
                  <span className="text-3xl font-bold text-gold-400/30 font-serif leading-none flex-shrink-0">{p.num}</span>
                  <div>
                    <h2 className="text-xl font-bold font-serif text-foreground">{p.name}</h2>
                    <div className="flex flex-wrap gap-3 mt-1">
                      <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">{p.type}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{p.distance}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{p.desc}</p>
                <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> <strong>Tip:</strong> {p.tip}
                </p>
              </article>
            ))}

            {/* CTA */}
            <div className="card-luxury rounded-2xl p-8 text-center border border-gold-500/20">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Visiting Chakwal?</h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Stay at Chakwal Grand Guest House — the most trusted accommodation in Chakwal district.
                AC rooms, family suites, free WiFi, and 24/7 service from PKR 2,000/night.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/book" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
                  Book Your Room <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/rooms" className="inline-flex items-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors">
                  View Room Rates
                </Link>
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
