import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Katas Raj Temples Visitor Guide 2025 — History, Timings & How to Get There",
  description: "Complete visitor guide to Katas Raj Temples in Chakwal district. Learn about the history, sacred kund (pond), visiting timings, how to reach from Rawalpindi & Lahore, and nearby stay options.",
  keywords: ["Katas Raj Temples", "Katas Raj visitor guide", "Katas Raj history", "how to reach Katas Raj", "Katas Raj Chakwal", "Hindu temples Pakistan", "places to visit near Chakwal"],
  alternates: { canonical: "https://www.staychakwal.de/blog/katas-raj-temples-visitor-guide" },
  openGraph: {
    title: "Katas Raj Temples Visitor Guide 2025 — Chakwal, Punjab",
    description: "History, timings, directions, and tips for visiting Katas Raj Temples — one of Pakistan's most sacred and historic sites.",
    url: "https://www.staychakwal.de/blog/katas-raj-temples-visitor-guide",
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Katas Raj Temples Visitor Guide — History, Timings & How to Get There",
  "url": "https://www.staychakwal.de/blog/katas-raj-temples-visitor-guide",
  "datePublished": "2025-02-10",
  "about": { "@type": "TouristAttraction", "name": "Katas Raj Temples", "address": { "@type": "PostalAddress", "addressLocality": "Chakwal", "addressRegion": "Punjab", "addressCountry": "PK" } },
  "author": { "@type": "Organization", "name": "Chakwal Grand Guest House" },
  "publisher": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": "https://www.staychakwal.de" },
};

export default function KatasRajPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />
      <main>
        <section className="pt-28 pb-16 bg-surface-elevated border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6">
              <Link href="/blog" className="hover:text-gold-400 transition-colors">Blog</Link>
              <span>/</span><span>Katas Raj Temples Guide</span>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 px-3 py-1 rounded-full">Attractions</span>
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mt-4 mb-6">
              Katas Raj Temples — Complete Visitor Guide 2025
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Katas Raj Temples, located in Chakwal district of Punjab, are one of Pakistan&apos;s most
              significant historical and religious sites. Dating back over 5,000 years, this complex of
              ancient Hindu temples surrounds a sacred pond believed to have mystical origins.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

            {/* Quick Facts */}
            <div className="card-luxury rounded-2xl p-6">
              <h2 className="font-bold text-foreground mb-4">Quick Facts</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[["Location", "Chakwal district, Punjab, Pakistan"], ["Distance from Chakwal city", "~40 km"], ["Distance from Rawalpindi", "~75 km"], ["Entry Fee", "Free"], ["Best Time to Visit", "October – March"], ["Visiting Hours", "Sunrise to Sunset"], ["UNESCO Status", "Heritage Site (nominated)"], ["Also Known As", "Qila Katas, Satgraha"]].map(([label, val]) => (
                  <div key={label} className="border-b border-border pb-2">
                    <p className="text-muted-foreground text-xs">{label}</p>
                    <p className="text-foreground font-medium">{val}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">History of Katas Raj Temples</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Katas Raj Temples are a complex of ancient Hindu temples built around the sacred Katas Kund — a pond
                whose origin is described in Hindu mythology. According to legend, when Lord Shiva&apos;s wife Sati died,
                his tears fell and created two ponds: one in Pushkar, Rajasthan (India), and one here at Katas.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                The temples date back to different periods — some to the 7th century AD, others even older. The complex
                includes temples dedicated to Lord Shiva, Ram, and other Hindu deities. Scholars believe the Pandavas
                of the Mahabharata spent time in exile here.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                During the Mughal era, Emperor Akbar visited the site. The temples were maintained by successive rulers
                until Partition in 1947. Today, the site is maintained by Pakistan&apos;s Evacuee Trust Property Board and
                is open to visitors of all faiths.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">What to See at Katas Raj</h2>
              <div className="space-y-4">
                {[
                  { name: "Katas Kund (Sacred Pond)", desc: "The centerpiece of the complex — a beautiful square pond considered sacred in Hindu religion. The pond is fed by natural springs and is surrounded by ancient temples. Best visited at dawn when mist rises from the water." },
                  { name: "Satghara Temple", desc: "A cluster of seven ancient Hindu temples on the edge of the pond. These temples date back to the 7th-9th century and feature intricate stone carvings and architectural details." },
                  { name: "Ram Temple", desc: "A large temple complex dedicated to Lord Ram, believed to be where the Pandavas sought refuge during their exile. One of the best-preserved structures in the complex." },
                  { name: "Shiva Temple", desc: "The main Shiva temple at the site, built in the traditional North Indian architectural style. Still visited by Hindu pilgrims from Pakistan and abroad." },
                  { name: "Haveli Raja Dhian Singh", desc: "A historic haveli (mansion) adjacent to the temple complex, built during the Sikh period by Raja Dhian Singh, a minister of Maharaja Ranjit Singh." },
                ].map(({ name, desc }) => (
                  <div key={name} className="card-luxury rounded-2xl p-5">
                    <h3 className="font-bold text-foreground mb-2 text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      {name}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">How to Reach Katas Raj Temples</h2>
              <div className="space-y-3">
                {[
                  { from: "Chakwal city", route: "Take Pind Dadan Khan Road, then turn towards Katas village. Follow signs for Katas Raj.", time: "30–40 min drive" },
                  { from: "Rawalpindi / Islamabad", route: "Take M-2 motorway to Chakwal interchange, then follow directions to Katas Raj via Chakwal–Pind Dadan Khan road.", time: "1.5–2 hours" },
                  { from: "Lahore", route: "Take GT Road to Gujranwala, then to Chakwal via Kharian. Follow signs for Katas Raj.", time: "3.5–4 hours" },
                ].map(({ from, route, time }) => (
                  <div key={from} className="card-luxury rounded-xl p-4">
                    <p className="font-bold text-foreground text-sm mb-1">From {from}</p>
                    <p className="text-sm text-muted-foreground mb-1">{route}</p>
                    <p className="text-xs text-gold-400 flex items-center gap-1"><Clock className="w-3 h-3" />{time}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-luxury rounded-2xl p-6 border border-gold-500/20">
              <div className="flex items-start gap-3 mb-4">
                <Info className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                <h2 className="font-bold text-foreground text-lg">Visitor Tips</h2>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {["Visit early morning (7–9 AM) for the best light and fewer crowds", "Dress respectfully — this is an active religious site", "Entry is free, but donations are appreciated for maintenance", "Photography is allowed throughout the complex", "No food stalls inside — bring water and snacks", "The nearest petrol station is in Chakwal city — fill up before visiting", "Stay at Chakwal Grand Guest House (40 km away) for easy access"].map(tip => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className="text-gold-400 flex-shrink-0">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card-luxury rounded-2xl p-8 text-center border border-gold-500/20">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Stay Near Katas Raj Temples</h2>
              <p className="text-muted-foreground mb-6 text-sm">
                Chakwal Grand Guest House is the nearest quality accommodation to Katas Raj Temples — just 40 km away in Chakwal city.
                Book your stay and make the most of your visit to Chakwal district.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/book" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
                  Book a Room <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/rooms" className="inline-flex items-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors">
                  See Room Rates
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
