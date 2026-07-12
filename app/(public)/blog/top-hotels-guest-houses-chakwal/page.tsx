import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ExternalLink, MapPin, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";

const canonical = `${siteConfig.url}/blog/top-hotels-guest-houses-chakwal`;

export const metadata: Metadata = {
  title: "Top 5 Hotels & Guest Houses in Chakwal — 2026 Guide",
  description: "Compare five publicly listed hotels and guest houses in Chakwal, including locations, booking sources and questions to check before reserving.",
  keywords: ["top hotels in Chakwal", "guest house in Chakwal", "hotels in Chakwal", "Chakwal accommodation", "where to stay in Chakwal"],
  alternates: { canonical },
  openGraph: {
    title: "Top 5 Hotels & Guest Houses in Chakwal — 2026 Guide",
    description: "A transparent, source-linked shortlist for comparing accommodation in Chakwal.",
    url: canonical,
    type: "article",
    images: [{
      url: `${siteConfig.url}/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg`,
      width: 1200,
      height: 630,
      alt: "Room listed by Chakwal Guest House in Chakwal",
    }],
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Top 5 Hotels & Guest Houses in Chakwal — 2026 Guide",
  description: "A transparent, source-linked shortlist for comparing hotels and guest houses in Chakwal.",
  url: canonical,
  datePublished: "2026-07-12",
  dateModified: "2026-07-12",
  author: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
  publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url, logo: { "@type": "ImageObject", url: `${siteConfig.url}/images/logo.png` } },
  image: `${siteConfig.url}/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg`,
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Which guest house in Chakwal offers direct online booking?",
      acceptedAnswer: { "@type": "Answer", text: "Chakwal Guest House publishes current room listings and a direct booking flow on its own website. Other properties may be available through third-party platforms; check the linked source for current availability." },
    },
    {
      "@type": "Question",
      name: "How should I compare hotels and guest houses in Chakwal?",
      acceptedAnswer: { "@type": "Answer", text: "Compare the exact location, recent reviews, room occupancy, current total price, verified facilities, payment method and cancellation terms for the same dates." },
    },
    {
      "@type": "Question",
      name: "Are the properties in this guide independently ranked?",
      acceptedAnswer: { "@type": "Answer", text: "No. Chakwal Guest House publishes this guide and is presented first as the publisher's featured direct-booking option. The other real properties are included from public travel-platform listings, and their order is not a quality score." },
    },
  ],
};

const alternatives = [
  {
    number: 2,
    name: "Al Murtaza Guest House",
    summary: "A real Chakwal property appearing in current public travel-directory results. Skyscanner describes it as being in Chakwal city centre; confirm the exact map pin, room and terms on the booking source.",
    sourceLabel: "View public listing",
    sourceUrl: "https://www.skyscanner.com.sa/hotels/pakistan/chakwal-hotels/al-murtaza-guest-house/ht-223946253",
  },
  {
    number: 3,
    name: "Hotel Royal Green",
    summary: "A property included in Tripadvisor's current Chakwal accommodation list. The guide found no sufficiently detailed first-party page to verify room-level facilities, so check current platform information directly.",
    sourceLabel: "View Chakwal directory",
    sourceUrl: "https://www.tripadvisor.co.uk/Hotels-g8560914-Chakwal_Punjab_Province-Hotels.html",
  },
  {
    number: 4,
    name: "Diamond Guest House Chakwal",
    summary: "A Chakwal guest house with a Booking.com property page and visibility in Tripadvisor's accommodation results. Use the platform page for current room details, policies and availability.",
    sourceLabel: "View Booking.com listing",
    sourceUrl: "https://www.booking.com/hotel/pk/diamond-guest-house-chakwal.html",
  },
  {
    number: 5,
    name: "Islamabad Guest House Chakwal",
    summary: "A real property appearing in Tripadvisor and Hotels.com Chakwal results. Verify the exact location, current photos, facilities and booking conditions on the platform you use.",
    sourceLabel: "View Chakwal directory",
    sourceUrl: "https://www.tripadvisor.com/Hotels-g8560914-c2-Chakwal_Punjab_Province-Hotels.html",
  },
];

export default function TopHotelsGuestHousesChakwalPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <article>
        <header className="pt-20 pb-14 bg-surface-elevated border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">Accommodation Guide · Reviewed July 2026</p>
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mb-6">Top 5 Hotels &amp; Guest Houses in Chakwal</h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              A source-linked shortlist of real Chakwal accommodation options, followed by the checks that matter before you reserve.
            </p>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <aside className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 mb-12">
            <h2 className="font-bold text-foreground mb-2">Publisher disclosure and methodology</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This guide is published by Chakwal Guest House, so it is not an independent ranking. CGH is listed first as our featured direct-booking option. The other properties are real businesses found in public travel-platform results and are described neutrally. Their order is for readability, not a claim that one is better or worse. No competitor review score or facility is reproduced unless a linked public source supports it.
            </p>
          </aside>

          <section className="mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Publisher&apos;s featured option</p>
            <div className="card-luxury rounded-3xl p-7 sm:p-9 border border-gold-500/30 bg-gradient-to-br from-gold-500/8 to-transparent">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-10 h-10 rounded-xl bg-gold-gradient text-background font-bold flex items-center justify-center">1</span>
                <div>
                  <h2 className="text-2xl font-bold font-serif text-foreground">Chakwal Guest House</h2>
                  <p className="text-xs text-gold-400">Featured by the publisher · Direct booking available</p>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                CGH provides current room listings and direct booking on its own website, with a Main Branch near District Courts on Talagang Road and a Madina Town branch with a confirmed Google Maps pin. Guests can check the selected branch, occupancy, listed facilities and current price before confirming.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 mb-7">
                {["Two branch pages with directions", "Current room inventory and prices", "Direct call and WhatsApp contact", "Online booking-reference flow"].map((item) => (
                  <p key={item} className="flex items-center gap-2 text-sm text-foreground"><CheckCircle2 className="w-4 h-4 text-gold-400 flex-shrink-0" />{item}</p>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/rooms" className="px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl text-center">View current rooms</Link>
                <Link href="/location" className="px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl text-center"><MapPin className="w-4 h-4 inline mr-2" />Compare locations</Link>
                <a href={`tel:${siteConfig.phoneE164}`} className="px-6 py-3 border border-border text-foreground font-semibold rounded-xl text-center"><Phone className="w-4 h-4 inline mr-2" />{siteConfig.phone}</a>
              </div>
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-3">Other publicly listed Chakwal options</h2>
            <p className="text-muted-foreground mb-7">Check the linked source for current information. Inclusion is not an endorsement or non-recommendation.</p>
            <div className="space-y-5">
              {alternatives.map((property) => (
                <div key={property.name} className="card-luxury rounded-2xl p-6 border border-transparent hover:border-gold-500/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <span className="w-9 h-9 rounded-xl bg-surface-base border border-border text-gold-400 font-bold flex items-center justify-center flex-shrink-0">{property.number}</span>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{property.name}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{property.summary}</p>
                      <a href={property.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-400 hover:underline">
                        {property.sourceLabel}<ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-5">How to choose the right stay</h2>
            <div className="prose prose-invert max-w-none text-muted-foreground space-y-4">
              <p>Compare every property for the same dates and number of guests. A starting price from an old article or search result may not be the final amount for your room.</p>
              <p>Open the exact map pin and compare it with the purpose of your visit. Confirm the entrance and late-arrival arrangement before travelling, particularly when a property has more than one location.</p>
              <p>Check recent reviews for repeated themes rather than relying only on the average score. Verify facilities important to your stay—such as bed setup, cooling, parking, hot water or accessibility—directly with the selected property.</p>
              <p>Read the payment, cancellation, tax and extra-person terms before confirming. Keep a written booking reference and use the official contact shown by the property or booking platform.</p>
            </div>
          </section>

          <section className="rounded-3xl bg-surface-elevated border border-gold-500/20 p-7 sm:p-10 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold font-serif text-foreground mb-3">Compare CGH rooms and locations</h2>
            <p className="text-muted-foreground mb-7">Use live room listings for current prices, then confirm the selected branch and booking terms.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/rooms" className="px-7 py-3 bg-gold-gradient text-background font-bold rounded-xl">View rooms</Link>
              <Link href="/locations/main-branch-talagang-road" className="px-7 py-3 border border-border text-foreground font-semibold rounded-xl">Main Branch</Link>
              <Link href="/locations/madina-town" className="px-7 py-3 border border-border text-foreground font-semibold rounded-xl">Madina Town</Link>
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
