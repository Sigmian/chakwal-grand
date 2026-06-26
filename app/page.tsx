import type { Metadata } from "next";
import Link from "next/link";
import {
  Star, MapPin, Phone, CheckCircle2, ChevronRight,
  Award, Wifi, Snowflake, ShowerHead, ShieldCheck, Users,
} from "lucide-react";
import { PublicNavbar }   from "@/features/public/components/PublicNavbar";
import { PublicFooter }   from "@/features/public/components/PublicFooter";
import { VideoHero }      from "@/features/public/components/VideoHero";
import { FeaturedRooms }  from "@/features/public/components/FeaturedRooms";
import { Reveal }         from "@/features/public/components/Reveal";
import { GallerySection } from "@/features/public/components/GallerySection";
import { FAQSection }     from "@/features/public/components/FAQSection";
import { ChatWidget }     from "@/features/public/components/ChatWidget";
import { getPublicBranches, getPublicReviews, getPublicRooms } from "@/server/actions/public";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Chakwal Guest House | Best Accommodation in Chakwal Punjab",
  description: "Welcome to Chakwal Guest House â€” the premier destination for travelers in Chakwal, Punjab. AC rooms, family suites, free WiFi & 24/7 room service from PKR 2,000/night. Book online instantly.",
  alternates: { canonical: siteConfig.url },
  openGraph: {
    title:       "Chakwal Guest House | Best Accommodation in Chakwal Punjab",
    description: "AC rooms, family suites & VIP rooms from PKR 2,000/night. Free WiFi, 24/7 service. Book your stay online at Chakwal Guest House.",
    url:         siteConfig.url,
    images:      [{ url: `${siteConfig.url}/images/blogs/chakwal-travel-mountains-punjab.webp`, width: 1200, height: 630, alt: "Chakwal Guest House â€” Premium Accommodation in Chakwal Punjab" }],
  },
};

const LOCAL_BUSINESS_SCHEMA = {
  "@context":    "https://schema.org",
  "@type":       "LodgingBusiness",
  "name":        "Chakwal Guest House",
  "description": "Premium guest house in Chakwal, Punjab offering AC rooms, family suites and VIP accommodation with free WiFi and 24/7 service.",
  "url":         siteConfig.url,
  "telephone":   siteConfig.phoneE164,
  "priceRange":  "PKR 2,000 - PKR 5,000",
  "image":       `${siteConfig.url}/images/blogs/chakwal-travel-mountains-punjab.webp`,
  "address": {
    "@type":           "PostalAddress",
    "addressLocality": "Chakwal",
    "addressRegion":   "Punjab",
    "addressCountry":  "PK",
  },
  "geo": {
    "@type":     "GeoCoordinates",
    "latitude":  "32.9318",
    "longitude": "72.8560",
  },
  "amenityFeature": [
    { "@type": "LocationFeatureSpecification", "name": "Free WiFi",        "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Air Conditioning", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "24/7 Room Service","value": true },
    { "@type": "LocationFeatureSpecification", "name": "Family Rooms",     "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Online Booking",   "value": true },
  ],
  "checkinTime":  "14:00",
  "checkoutTime": "12:00",
  "currenciesAccepted": "PKR",
  "paymentAccepted":    "Cash",
  "openingHours": "Mo-Su 00:00-23:59",
  "hasMap": "https://maps.google.com/?q=Chakwal+Grand+Guest+House+Chakwal",
  "sameAs": [siteConfig.url],
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the best guest house in Chakwal?",
      "acceptedAnswer": { "@type": "Answer", "text": "Chakwal Guest House is the most popular and highly-rated guest house in Chakwal, Punjab. It offers AC rooms, family suites, free WiFi, and 24/7 service from PKR 2,000/night." }
    },
    {
      "@type": "Question",
      "name": "How much does a room cost at Chakwal Guest House?",
      "acceptedAnswer": { "@type": "Answer", "text": "Room rates start from PKR 2,000/night for a Classic room, going up to PKR 4,500/night for an AC Apartment. All rooms include free WiFi, hot water, and attached bathroom." }
    },
    {
      "@type": "Question",
      "name": "Is there a family room available in Chakwal?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes, Chakwal Guest House has spacious family rooms that can accommodate 4 adults and 2 children. Available from PKR 2,500/night." }
    },
    {
      "@type": "Question",
      "name": "How do I book a room at Chakwal Guest House?",
      "acceptedAnswer": { "@type": "Answer", "text": `You can book online instantly at ${siteConfig.url.replace("https://", "")}, or call/WhatsApp us at ${siteConfig.phone}. No advance payment required â€” pay cash on arrival.` }
    },
    {
      "@type": "Question",
      "name": "Where is Chakwal Guest House located?",
      "acceptedAnswer": { "@type": "Answer", "text": "Our main branch is located Near District Courts, Talagang Road, Chakwal, Punjab. We also have branches in Kallar Kahar and Sargodha." }
    },
    {
      "@type": "Question",
      "name": "What is the check-in and check-out time?",
      "acceptedAnswer": { "@type": "Answer", "text": "Check-in time is 2:00 PM and check-out time is 12:00 PM (noon). CNIC is required at check-in." }
    },
  ],
};

export const revalidate = 60;

export default async function HomePage() {
  const [branches, reviews, rooms, guestCount] = await Promise.all([
    getPublicBranches(),
    getPublicReviews(),
    getPublicRooms(),
    import("@/lib/db/prisma").then(m => m.default.customer.count()),
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
      {reviewSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }} />}
      <PublicNavbar />

      <main>
        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• HERO (VIDEO) */}
        <VideoHero
          branches={branches as { id: string; name: string; city: string }[]}
          startingFrom={rooms.length > 0 ? Math.min(...rooms.map(r => Number(r.pricePerNight))) : 2000}
          totalGuests={guestCount > 0 ? guestCount : undefined}
          avgRating={avgRating}
        />

        {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• TRUST STRIP */}
        <section className="border-y border-gold-500/10 bg-surface-elevated/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Star,        title: avgRating ? `${avgRating.toFixed(1)} / 5` : "4.8 / 5", sub: `${reviews.length || "120"}+ guest reviews` },
                { icon: Users,       title: guestCount > 0 ? `${guestCount}+` : "500+",            sub: "Happy guests hosted" },
                { icon: CheckCircle2, title: "No prepayment",                                       sub: "Pay cash on arrival" },
                { icon: ShieldCheck, title: "Free cancellation",                                   sub: "Up to 24h before" },
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
                Every room is equipped with WiFi, hot water, and attached bathroom â€” built for comfort at every budget.
              </p>
            </Reveal>

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
                { Icon: Award,       title: "Best Value",      body: "Transparent pricing with no hidden charges. Rates from PKR 2,000/night for fully-equipped rooms." },
                { Icon: Wifi,        title: "Fast WiFi",       body: "High-speed internet in all rooms â€” perfect for business travellers and long stays." },
                { Icon: Snowflake,   title: "A/C Available",   body: "Air conditioning in select rooms, included in the room rate (12 hours daily)." },
                { Icon: ShowerHead,  title: "Hot Water 24/7",  body: "Attached bathrooms with reliable hot water available around the clock." },
                { Icon: ShieldCheck, title: "Safe & Secure",   body: "CCTV coverage, front-desk staffed 24/7, secure key access to all rooms." },
                { Icon: MapPin,      title: "Prime Locations", body: "Centrally located in Chakwal, Kallar Kahar, and Sargodha â€” close to all amenities." },
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
                    <span className="text-xs text-muted-foreground">Â· {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </Reveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review, i) => (
                  <Reveal key={review.id} delay={i * 0.06}>
                    <div className={`card-luxury rounded-2xl p-6 h-full ${review.isFeatured ? "border border-gold-500/20" : ""}`}>
                      <div className="flex items-center gap-1 mb-3">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star key={idx} className={`w-4 h-4 ${idx < review.rating ? "text-gold-400 fill-gold-400" : "text-border"}`} />
                        ))}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed mb-4 line-clamp-4">&ldquo;{review.body}&rdquo;</p>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-xs font-bold text-gold-400">
                          {review.customer?.name?.[0]?.toUpperCase() ?? "G"}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{review.customer?.name ?? "Guest"}</p>
                          {review.customer?.city && <p className="text-[10px] text-muted-foreground">{review.customer.city}</p>}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
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
              Book online for instant confirmation, or call us directly â€” our team is available 24/7 to help you find the perfect room.
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
                "No payment required online",
                "Pay cash on arrival",
                "Free cancellation",
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
