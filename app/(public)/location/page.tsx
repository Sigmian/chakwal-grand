import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Navigation, Phone, Clock, Car } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Reveal } from "@/features/public/components/Reveal";

export const metadata: Metadata = {
  title: "Location & Directions — Chakwal, Punjab",
  description: "Find Chakwal Guest House easily. Two locations in Chakwal — Main Branch near District Courts & Madina Town Branch. Get directions, map & contact details.",
  keywords: ["Chakwal Guest House location", "guest house near Chakwal city", "how to reach Chakwal Guest House", "Talagang Road Chakwal guest house", "accommodation near Katas Raj"],
  alternates: { canonical: `${siteConfig.url}/location` },
  openGraph: {
    title: "Location | Chakwal Guest House — Near District Courts, Chakwal",
    description: "We are located near District Courts, Talagang Road, Chakwal. Easy access from Rawalpindi, Islamabad, and Lahore via GT Road.",
    url: `${siteConfig.url}/location`,
  },
};

const LOCATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  "name": "Chakwal Guest House",
  "url": siteConfig.url,
  "telephone": "+92-334-7742767",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Near District Courts, Talagang Road",
    "addressLocality": "Chakwal",
    "addressRegion": "Punjab",
    "postalCode": "48800",
    "addressCountry": "PK",
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude":  "32.9318",
    "longitude": "72.8560",
  },
  "hasMap": siteConfig.social.googleBusinessUrl,
};

const BRANCHES = [
  {
    name:        "Main Branch — Near District Courts",
    address:     "Near District Courts, Talagang Road, Chakwal",
    description: "Our flagship location in the heart of Chakwal city, easily accessible from the main GT Road and city center. Trusted by thousands of guests since our founding.",
    distance:    "2 km from Chakwal Bus Stand",
    mapUrl:      "https://maps.google.com/?q=Near+District+Courts+Talagang+Road+Chakwal+Punjab",
    label:       "Flagship",
  },
  {
    name:        "Madina Town Branch — New Location",
    address:     "Madina Town, Chakwal",
    description: "Our brand-new Madina Town branch featuring spacious rooms, a private apartment with lawn and garage, and modern standard rooms. Perfect for families and extended stays.",
    distance:    "Madina Town, Chakwal",
    mapUrl:      "https://maps.google.com/?q=Madina+Town+Chakwal+Punjab",
    label:       "New — Grand Opening",
  },
];

const HOW_TO_REACH = [
  { from: "Rawalpindi / Islamabad", via: "GT Road → Chakwal Road", time: "~1.5 hours" },
  { from: "Lahore",                 via: "GT Road → Chakwal Bypass", time: "~3 hours" },
  { from: "Jhelum",                 via: "Pind Dadan Khan Road", time: "~1 hour" },
  { from: "Faisalabad",             via: "Sargodha Road → Chakwal", time: "~3 hours" },
];

export default function LocationPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCATION_SCHEMA) }} />
      <main>
        {/* Hero */}
        <section className="pt-28 pb-16 bg-surface-elevated border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">Find Us</p>
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mb-6">
              Our Two Locations in Chakwal
            </h1>
            <p className="text-lg text-muted-foreground">
              Chakwal Guest House has two locations in Chakwal — our Main Branch near
              District Courts and our new Madina Town Branch. Both are easily accessible.
            </p>
          </div>
        </section>

        {/* Embedded Map */}
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="rounded-2xl overflow-hidden border border-gold-500/20 shadow-card-lg">
                <iframe
                  title="Chakwal Guest House location map"
                  src={siteConfig.mapEmbed}
                  width="100%"
                  height="420"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full grayscale-[0.2] contrast-[1.05]"
                  style={{ border: 0 }}
                  allowFullScreen
                />
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={siteConfig.social.googleBusinessUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-md transition-all text-sm"
                >
                  <MapPin className="w-4 h-4" />
                  View on Google Maps
                </a>
                <a
                  href={`tel:${siteConfig.phoneE164}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-all text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Call for Directions
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Branches */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {BRANCHES.map((b, i) => (
              <Reveal key={b.name} delay={i * 0.06} className="card-luxury rounded-2xl p-6 block hover:border-gold-500/20 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center flex-shrink-0">
                      <span className="text-background font-bold text-sm">{i + 1}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h2 className="font-bold text-foreground text-lg">{b.name}</h2>
                        {"label" in b && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${b.label === "Flagship" ? "bg-gold-500/15 text-gold-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                            {b.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {b.address}
                      </p>
                      <p className="text-xs text-gold-400 mt-1 flex items-center gap-1.5">
                        <Navigation className="w-3 h-3" />
                        {b.distance}
                      </p>
                    </div>
                  </div>
                  <a href={b.mapUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-lg transition-all flex-shrink-0">
                    <Navigation className="w-4 h-4" />
                    Get Directions
                  </a>
                </div>
                <p className="text-sm text-muted-foreground">{b.description}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* How to Reach */}
        <section className="py-16 bg-surface-elevated">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Directions</p>
              <h2 className="text-3xl font-bold font-serif text-foreground">How to Reach Chakwal</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {HOW_TO_REACH.map(({ from, via, time }, i) => (
                <Reveal key={from} delay={i * 0.06} className="card-luxury rounded-2xl p-5 flex items-start gap-4 hover:border-gold-500/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <Car className="w-5 h-5 text-gold-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">From {from}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">via {via}</p>
                    <p className="text-xs text-gold-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {time}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Contact + Book CTA */}
        <section className="py-12">
          <div className="max-w-xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Need Help Finding Us?</h2>
            <p className="text-muted-foreground mb-6">Call or WhatsApp us and our staff will guide you directly to our doorstep.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={`tel:${siteConfig.phoneE164}`} className="flex items-center justify-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
                <Phone className="w-4 h-4" /> Call {siteConfig.phone}
              </a>
              <Link href="/book" className="flex items-center justify-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors">
                Book Online
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
