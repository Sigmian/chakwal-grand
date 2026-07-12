import type { Metadata } from "next";
import Link from "next/link";
import {
  Star, MapPin, Phone, CheckCircle2, ChevronRight,
  Wifi, Snowflake, CalendarCheck, ShieldCheck,
} from "lucide-react";
import { PublicNavbar }   from "@/features/public/components/PublicNavbar";
import { PublicFooter }   from "@/features/public/components/PublicFooter";
import { VideoHero }      from "@/features/public/components/VideoHero";
import { FeaturedRooms }  from "@/features/public/components/FeaturedRooms";
import { Reveal }         from "@/features/public/components/Reveal";
import { GallerySection } from "@/features/public/components/GallerySection";
import { FAQSection }     from "@/features/public/components/FAQSection";
import { ChatWidget }            from "@/features/public/components/ChatWidget";
import { ReviewsCarousel }       from "@/features/public/components/ReviewsCarousel";
import { GrandOpeningFireworks } from "@/features/public/components/GrandOpeningFireworks";
import { getPublicBranches, getPublicReviews, getPublicRooms, getGrandOpeningOffer } from "@/server/actions/public";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Chakwal Guest House | Rooms at Two Chakwal Locations",
  description: siteConfig.description,
  alternates: { canonical: siteConfig.url },
  openGraph: {
    title:       "Chakwal Guest House | Rooms at Two Chakwal Locations",
    description: siteConfig.description,
    url:         siteConfig.url,
    siteName:    siteConfig.name,
    images:      [{ url: `${siteConfig.url}/images/blogs/chakwal-travel-mountains-punjab.webp`, width: 1200, height: 630, alt: "Chakwal Guest House — Clean, comfortable rooms in Chakwal, Punjab" }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Chakwal Guest House | Rooms at Two Chakwal Locations",
    description: siteConfig.description,
    images:      [`${siteConfig.url}/images/blogs/chakwal-travel-mountains-punjab.webp`],
  },
};

const LOCAL_BUSINESS_SCHEMA = {
  "@context":    "https://schema.org",
  "@type":       ["LodgingBusiness", "Hotel"],
  "@id":         `${siteConfig.url}#hotel`,
  "name":        "Chakwal Guest House",
  "alternateName": "CGH",
  "brand":       { "@type": "Brand", "name": "Chakwal Guest House" },
  "description": siteConfig.description,
  "slogan":      siteConfig.tagline,
  "url":         siteConfig.url,
  "telephone":   siteConfig.phoneE164,
  "email":       siteConfig.email,
  "image":       `${siteConfig.url}/images/blogs/chakwal-travel-mountains-punjab.webp`,
  "logo":        `${siteConfig.url}/images/logo.png`,
  "address": {
    "@type":           "PostalAddress",
    "streetAddress":   siteConfig.branches[0].address,
    "addressLocality": "Chakwal",
    "addressRegion":   "Punjab",
    "addressCountry":  "PK",
  },
  "checkoutTime": "12:00",
  "currenciesAccepted": "PKR",
  "hasMap": siteConfig.social.googleBusinessUrl,
  "sameAs": [
    siteConfig.url,
    siteConfig.social.facebookUrl,
    siteConfig.social.googleBusinessUrl,
  ],
};

const ORGANIZATION_SCHEMA = {
  "@context":    "https://schema.org",
  "@type":       "Organization",
  "@id":         `${siteConfig.url}#organization`,
  "name":        "Chakwal Guest House",
  "alternateName": "CGH",
  "url":         siteConfig.url,
  "logo":        `${siteConfig.url}/images/logo.png`,
  "description": siteConfig.description,
  "contactPoint": {
    "@type":      "ContactPoint",
    "telephone":  siteConfig.phoneE164,
    "contactType": "Reservations",
    "areaServed": "PK",
    "availableLanguage": ["en", "ur"],
  },
  "sameAs": [
    siteConfig.social.facebookUrl,
    siteConfig.social.googleBusinessUrl,
  ],
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Where can I view rooms at Chakwal Guest House?",
      "acceptedAnswer": { "@type": "Answer", "text": `Current room options and availability are shown at ${siteConfig.url}/rooms. Confirm branch-specific facilities before booking.` }
    },
    {
      "@type": "Question",
      "name": "How much does a room cost at Chakwal Guest House?",
      "acceptedAnswer": { "@type": "Answer", "text": `Room prices depend on the active room inventory and dates. View current prices at ${siteConfig.url}/rooms or call ${siteConfig.phone}.` }
    },
    {
      "@type": "Question",
      "name": "Is there a family room available in Chakwal?",
      "acceptedAnswer": { "@type": "Answer", "text": "Family room availability and capacity vary by room and branch. Check the current room details for exact occupancy before booking." }
    },
    {
      "@type": "Question",
      "name": "How do I book a room at Chakwal Guest House?",
      "acceptedAnswer": { "@type": "Answer", "text": `You can check availability online at ${siteConfig.url.replace("https://", "")}, or call/WhatsApp us at ${siteConfig.phone}. Payment and cancellation terms are shown during booking.` }
    },
    {
      "@type": "Question",
      "name": "Where is Chakwal Guest House located?",
      "acceptedAnswer": { "@type": "Answer", "text": "We have two locations in Chakwal, Punjab — Main Branch near District Courts, Talagang Road, and our new Madina Town Branch in Madina Town, Chakwal." }
    },
    {
      "@type": "Question",
      "name": "What is the check-in and check-out time?",
      "acceptedAnswer": { "@type": "Answer", "text": "Check-out is 12:00 PM. Confirm the available check-in time and required documents during booking, especially for a late arrival." }
    },
  ],
};

export const revalidate = 60;

export default async function HomePage() {
  const [branches, reviews, rooms, grandOpeningOffer] = await Promise.all([
    getPublicBranches(),
    getPublicReviews(),
    getPublicRooms(),
    getGrandOpeningOffer(siteConfig.branchIds.madinaTown),
  ]);

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : undefined;

  // Pick one representative room per type, serialized to plain objects
  // (Prisma Decimal can't cross the serverâ†’client boundary).
  const featured = ["STANDARD", "FAMILY", "DELUXE", "SUITE"]
    .map(type => rooms.find(r => r.type === type))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map(r => ({
      id:            r.id,
      name:          r.name,
      type:          r.type,
      pricePerNight: Number(r.pricePerNight),
      maxAdults:     r.maxAdults,
      maxChildren:   r.maxChildren,
      description:   r.description,
      amenities:     r.amenities,
      images:        r.images.map(img => ({
        url: img.url, altText: img.altText, isCover: img.isCover, sortOrder: img.sortOrder,
      })),
    }));

  const reviewSchema = reviews.length >= 3 ? {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "name": "Chakwal Guest House",
    "url": siteConfig.url,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": avgRating?.toFixed(1),
      "bestRating": "5",
      "worstRating": "1",
      "ratingCount": reviews.length,
    },
  } : null;

  return (
    <>
      <GrandOpeningFireworks />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
      {reviewSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }} />}
      <PublicNavbar />

      <main>
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• HERO (VIDEO) */}
        <VideoHero
          branches={branches as { id: string; name: string; city: string }[]}
          startingFrom={rooms.length > 0 ? Math.min(...rooms.map(r => Number(r.pricePerNight))) : undefined}
          avgRating={avgRating}
        />

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TRUST STRIP */}
        <section className="border-y border-gold-500/10 bg-surface-elevated/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ...(avgRating && reviews.length ? [{ icon: Star, title: `${avgRating.toFixed(1)} / 5`, sub: `${reviews.length} verified site review${reviews.length === 1 ? "" : "s"}` }] : []),
                { icon: MapPin, title: `${branches.length || siteConfig.branches.length} locations`, sub: "Choose the branch that suits your visit" },
                { icon: CalendarCheck, title: "Live availability", sub: "Check current rooms and prices" },
                { icon: ShieldCheck, title: "Clear booking details", sub: "Review terms before confirmation" },
              ].map(({ icon: Icon, title, sub }) => (
                <div key={title} className="flex items-center gap-3 justify-center md:justify-start">
                  <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-gold-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground leading-tight truncate">{title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• ROOMS */}
        <section className="py-20 bg-surface-elevated">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Accommodations</p>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-4">Rooms Designed for Comfort</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Every room is equipped with WiFi, hot water, and attached bathroom — built for comfort at every budget.
              </p>
            </Reveal>

            {grandOpeningOffer && (
              <Reveal className="mb-8">
                <Link href="/book" className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-900/60 via-teal-900/40 to-emerald-900/60 border border-emerald-500/30 hover:border-emerald-500/50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-xl">
                      🔥
                    </div>
                    <div>
                      <p className="font-bold text-emerald-300 text-sm sm:text-base">Grand Opening — 50% OFF at Madina Town Branch</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Rooms from <span className="text-muted-foreground line-through">PKR 3,500</span>{" "}
                        <span className="text-emerald-400 font-bold">PKR 1,750/night</span>
                        {grandOpeningOffer.expiresAt && (
                          <> · Valid until {new Date(grandOpeningOffer.expiresAt).toLocaleDateString("en-PK", { day: "numeric", month: "long" })}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-sm font-bold text-emerald-400 group-hover:gap-3 transition-all flex-shrink-0">
                    Book Now <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              </Reveal>
            )}

            <FeaturedRooms rooms={featured as any} />

            <div className="text-center mt-10">
              <Link href="/rooms" className="inline-flex items-center gap-2 px-6 py-3 border border-border text-sm font-semibold text-foreground rounded-xl hover:bg-accent hover:border-gold-500/30 transition-all">
                View All Rooms <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• WHY US */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Why Choose Us</p>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground">
                The Chakwal Guest House Difference
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { Icon: CalendarCheck, title: "Current Prices", body: "Room prices come from active inventory so you can compare the options currently listed." },
                { Icon: Wifi, title: "Room Details", body: "Review the facilities shown for each room and confirm any essential requirement before booking." },
                { Icon: Snowflake, title: "A/C Options", body: "Air-conditioned options are identified on their room listings when available." },
                { Icon: ShieldCheck, title: "Booking Clarity", body: "Review the selected branch, occupancy, dates, price and terms before confirmation." },
                { Icon: MapPin, title: "Two Chakwal Locations", body: "Choose the Main Branch near District Courts or the Madina Town branch." },
                { Icon: Phone, title: "Direct Assistance", body: `Call or WhatsApp ${siteConfig.phone} to confirm a requirement or request arrival directions.` },
              ].map(({ Icon, title, body }, i) => (
                <Reveal key={title} delay={i * 0.06}>
                  <div className="card-luxury rounded-2xl p-6 h-full hover:-translate-y-1 hover:border-gold-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-gold-gradient flex items-center justify-center mb-4 shadow-gold-sm group-hover:shadow-gold-md transition-shadow">
                      <Icon className="w-6 h-6 text-background" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• BRANCHES */}
        {branches.length > 0 && (
          <section id="about" className="py-20 bg-surface-elevated">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Reveal className="text-center mb-12">
                <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Our Locations</p>
                <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-4">Find Us Near You</h2>
              </Reveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map((branch, i) => (
                  <Reveal key={branch.id} delay={i * 0.08}>
                    <div className="card-luxury rounded-2xl p-6 h-full border border-transparent hover:border-gold-500/20 hover:-translate-y-1 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center mb-4">
                        <MapPin className="w-5 h-5 text-background" />
                      </div>
                      <h3 className="font-bold text-foreground mb-1">{branch.name}</h3>
                      <p className="text-sm text-gold-400 font-medium mb-3">{branch.city}</p>
                      {branch.address && (
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{branch.address}</p>
                      )}
                      {branch.phone && (
                        <a href={`tel:${branch.phone.replace(/\s/g, "")}`}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold-400 transition-colors">
                          <Phone className="w-3.5 h-3.5" />
                          {branch.phone}
                        </a>
                      )}
                      {siteConfig.branches.find((item) => item.id === branch.id)?.pageUrl && (
                        <Link href={siteConfig.branches.find((item) => item.id === branch.id)!.pageUrl} className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-gold-400 hover:underline">
                          View branch details <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• REVIEWS */}
        {reviews.length > 0 && (
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Reveal className="text-center mb-12">
                <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Guest Reviews</p>
                <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-4">What Our Guests Say</h2>
                {avgRating && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? "text-gold-400 fill-gold-400" : "text-border"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-foreground">{avgRating.toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">· {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </Reveal>
              <Reveal>
                <ReviewsCarousel
                  reviews={reviews.map((r) => ({
                    id:         r.id,
                    rating:     r.rating,
                    body:       r.body,
                    isFeatured: r.isFeatured ?? false,
                    name:       r.customer?.name ?? "Guest",
                    city:       r.customer?.city ?? null,
                  }))}
                />
              </Reveal>
            </div>
          </section>
        )}

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• CONTACT CTA */}
        <section id="contact" className="py-20 bg-gradient-to-br from-gold-500/5 via-surface-elevated to-surface-elevated border-y border-gold-500/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Get In Touch</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-4">
              Ready to Plan Your Stay?
            </h2>
            <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
              Check current availability online, or call us directly to confirm a room requirement or arrival detail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/book"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all text-sm">
                Book a Room Online
              </Link>
              <a href={siteConfig.social.whatsappUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] font-semibold rounded-xl hover:bg-[#25D366]/25 transition-colors text-sm">
                Chat on WhatsApp
              </a>
              <a href={`tel:${siteConfig.phoneE164}`}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border text-foreground font-semibold rounded-xl hover:bg-accent transition-colors text-sm">
                <Phone className="w-4 h-4" />
                {siteConfig.phone}
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
              {[
                "Current prices shown during booking",
                "Branch shown before confirmation",
                "Call or WhatsApp for assistance",
                "CNIC required at check-in",
              ].map(item => (
                <span key={item} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• GALLERY */}
        <GallerySection />

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• FAQ */}
        <FAQSection />
      </main>

      <PublicFooter />
      <ChatWidget />
    </>
  );
}
