import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Navigation, Phone, Clock, Car } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Location & Directions | Chakwal Grand Guest House — Chakwal, Punjab",
  description: "Find Chakwal Grand Guest House easily. Located near District Courts, Talagang Road, Chakwal. Also branches in Kallar Kahar & Sargodha. Get directions, map & contact details.",
  keywords: ["Chakwal Grand Guest House location", "guest house near Chakwal city", "how to reach Chakwal Grand", "Talagang Road Chakwal guest house", "accommodation near Katas Raj"],
  alternates: { canonical: `${siteConfig.url}/location` },
  openGraph: {
    title: "Location | Chakwal Grand Guest House — Near District Courts, Chakwal",
    description: "We are located near District Courts, Talagang Road, Chakwal. Easy access from Rawalpindi, Islamabad, and Lahore via GT Road.",
    url: `${siteConfig.url}/location`,
  },
};

const LOCATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  "name": "Chakwal Grand Guest House",
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
  "hasMap": "https://maps.google.com/?q=Chakwal+Grand+Guest+House+Chakwal+Punjab",
};

const BRANCHES = [
  {
    name:        "Chakwal — Main Branch",
    address:     "Near District Courts, Talagang Road, Chakwal",
    description: "Our flagship location in the heart of Chakwal city, easily accessible from the main GT Road and city center.",
    distance:    "2 km from Chakwal Bus Stand",
    mapUrl:      "https://maps.google.com/?q=Near+District+Courts+Talagang+Road+Chakwal+Punjab",
  },
  {
    name:        "Kallar Kahar Branch",
    address:     "Lake View Road, Near Salt Mine, Kallar Kahar, Chakwal",
    description: "Perfect for visitors to Kallar Kahar Lake, Salt Range, and Katas Raj Temples. Scenic lakeside location.",
    distance:    "500m from Kallar Kahar Lake",
    mapUrl:      "https://maps.google.com/?q=Kallar+Kahar+Lake+View+Road+Chakwal",
  },
  {
    name:        "Sargodha Branch",
    address:     "University Road, Near Peoples Colony, Sargodha",
    description: "Conveniently located near Sargodha University and the main commercial area of Sargodha city.",
    distance:    "Near Sargodha University",
    mapUrl:      "https://maps.google.com/?q=University+Road+Near+Peoples+Colony+Sargodha",
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
              Our Locations in Punjab
            </h1>
            <p className="text-lg text-muted-foreground">
              Chakwal Grand Guest House has 3 branches across Punjab — in Chakwal, Kallar Kahar,
              and Sargodha. All locations are easily accessible and centrally located.
            </p>
          </div>
        </section>

        {/* Branches */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            {BRANCHES.map((b, i) => (
              <div key={b.name} className="card-luxury rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center flex-shrink-0">
                      <span className="text-background font-bold text-sm">{i + 1}</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-foreground text-lg">{b.name}</h2>
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
              </div>
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
              {HOW_TO_REACH.map(({ from, via, time }) => (
                <div key={from} className="card-luxury rounded-2xl p-5 flex items-start gap-4">
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
                </div>
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
