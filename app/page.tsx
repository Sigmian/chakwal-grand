import type { Metadata } from "next";
import Link from "next/link";
import { Star, MapPin, Phone, CheckCircle2, ChevronRight } from "lucide-react";
import { PublicNavbar }   from "@/features/public/components/PublicNavbar";
import { PublicFooter }   from "@/features/public/components/PublicFooter";
import { VideoHero }      from "@/features/public/components/VideoHero";
import { GallerySection } from "@/features/public/components/GallerySection";
import { FAQSection }     from "@/features/public/components/FAQSection";
import { ChatWidget }     from "@/features/public/components/ChatWidget";
import { getPublicBranches, getPublicReviews, getPublicRooms } from "@/server/actions/public";
import { formatPKR } from "@/utils";

export const metadata: Metadata = {
  title: "Chakwal Grand Guest House | Best Accommodation in Chakwal Punjab",
  description: "Welcome to Chakwal Grand Guest House — the premier destination for travelers in Chakwal, Punjab. AC rooms, family suites, free WiFi & 24/7 room service from PKR 2,000/night. Book online instantly.",
  alternates: { canonical: "https://www.staychakwal.de" },
  openGraph: {
    title:       "Chakwal Grand Guest House | Best Accommodation in Chakwal Punjab",
    description: "AC rooms, family suites & VIP rooms from PKR 2,000/night. Free WiFi, 24/7 service. Book your stay online at Chakwal Grand Guest House.",
    url:         "https://www.staychakwal.de",
    images:      [{ url: "/images/logo.png", width: 1200, height: 630, alt: "Chakwal Grand Guest House" }],
  },
};

const LOCAL_BUSINESS_SCHEMA = {
  "@context":    "https://schema.org",
  "@type":       "LodgingBusiness",
  "name":        "Chakwal Grand Guest House",
  "description": "Premium guest house in Chakwal, Punjab offering AC rooms, family suites and VIP accommodation with free WiFi and 24/7 service.",
  "url":         "https://www.staychakwal.de",
  "telephone":   "+92-334-7742767",
  "priceRange":  "PKR 2,000 - PKR 5,000",
  "image":       "https://www.staychakwal.de/images/logo.png",
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
  "sameAs": ["https://www.staychakwal.de"],
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is the best guest house in Chakwal?",
      "acceptedAnswer": { "@type": "Answer", "text": "Chakwal Grand Guest House is the most popular and highly-rated guest house in Chakwal, Punjab. It offers AC rooms, family suites, free WiFi, and 24/7 service from PKR 2,000/night." }
    },
    {
      "@type": "Question",
      "name": "How much does a room cost at Chakwal Grand Guest House?",
      "acceptedAnswer": { "@type": "Answer", "text": "Room rates start from PKR 2,000/night for a Classic room, going up to PKR 4,500/night for an AC Apartment. All rooms include free WiFi, hot water, and attached bathroom." }
    },
    {
      "@type": "Question",
      "name": "Is there a family room available in Chakwal?",
      "acceptedAnswer": { "@type": "Answer", "text": "Yes, Chakwal Grand Guest House has spacious family rooms that can accommodate 4 adults and 2 children. Available from PKR 2,500/night." }
    },
    {
      "@type": "Question",
      "name": "How do I book a room at Chakwal Grand Guest House?",
      "acceptedAnswer": { "@type": "Answer", "text": "You can book online instantly at staychakwal.de, or call/WhatsApp us at 0334-7742767. No advance payment required — pay cash on arrival." }
    },
    {
      "@type": "Question",
      "name": "Where is Chakwal Grand Guest House located?",
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

const TYPE_ICON: Record<string, string> = {
  STANDARD: "🛏️", DELUXE: "⭐", SUITE: "🏠", FAMILY: "👨‍👩‍👧", VIP: "👑",
};
const TYPE_LABEL: Record<string, string> = {
  STANDARD: "Classic", DELUXE: "Executive", SUITE: "Suite / Apartment", FAMILY: "Family", VIP: "VIP",
};

export default async function HomePage() {
  const [branches, reviews, rooms] = await Promise.all([
    getPublicBranches(),
    getPublicReviews(),
    getPublicRooms(),
  ]);

  // Pick one representative room per type
  const featured = ["STANDARD", "FAMILY", "DELUXE", "SUITE"]
    .map(type => rooms.find(r => r.type === type))
    .filter(Boolean);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
      <PublicNavbar />

      <main>
        {/* ══════════════════════════════════════════════ HERO (VIDEO) */}
        <VideoHero branches={branches as { id: string; name: string; city: string }[]} />

        {/* ══════════════════════════════════════════════ ROOMS */}
        <section className="py-20 bg-surface-elevated">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Accommodations</p>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-4">Room Categories</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Every room is equipped with WiFi, hot water, and attached bathroom — built for comfort at every budget.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featured.map(room => room && (
                <Link key={room.id} href="/rooms"
                  className="card-luxury rounded-2xl p-6 border border-transparent hover:border-gold-500/30 hover:-translate-y-1 transition-all group">
                  <div className="text-3xl mb-4">{TYPE_ICON[room.type]}</div>
                  <h3 className="font-bold text-foreground mb-1 group-hover:text-gold-400 transition-colors">
                    {room.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed line-clamp-2">{room.description}</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-gold-400 font-serif">{formatPKR(Number(room.pricePerNight))}</p>
                      <p className="text-[10px] text-muted-foreground">/ night</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 font-medium">
                      {TYPE_LABEL[room.type]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/rooms" className="inline-flex items-center gap-2 px-6 py-3 border border-border text-sm font-semibold text-foreground rounded-xl hover:bg-accent transition-colors">
                View All Rooms <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════ WHY US */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Why Choose Us</p>
              <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground">
                The Chakwal Grand Difference
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: "🏆", title: "Best Value",         body: "Transparent pricing with no hidden charges. Rates from ₨2,000/night for fully-equipped rooms." },
                { icon: "📶", title: "Fast WiFi",          body: "High-speed internet in all rooms — perfect for business travellers and long stays." },
                { icon: "❄️",  title: "A/C Available",    body: "Air conditioning in select rooms, included in the room rate (12 hours daily)." },
                { icon: "🚿", title: "Hot Water 24/7",     body: "Attached bathrooms with reliable hot water available around the clock." },
                { icon: "🔒", title: "Safe & Secure",      body: "CCTV coverage, front-desk staffed 24/7, secure key access to all rooms." },
                { icon: "📍", title: "Prime Locations",    body: "Centrally located in Chakwal, Kallar Kahar, and Sargodha — close to all amenities." },
              ].map(({ icon, title, body }) => (
                <div key={title} className="card-luxury rounded-2xl p-6 hover:-translate-y-1 transition-transform">
                  <div className="text-3xl mb-4">{icon}</div>
                  <h3 className="font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════ BRANCHES */}
        {branches.length > 0 && (
          <section id="about" className="py-20 bg-surface-elevated">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Our Locations</p>
                <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-4">Find Us Near You</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {branches.map(branch => (
                  <div key={branch.id} className="card-luxury rounded-2xl p-6 border border-transparent hover:border-gold-500/20 transition-all">
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
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════ REVIEWS */}
        {reviews.length > 0 && (
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Guest Reviews</p>
                <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-4">What Our Guests Say</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map(review => (
                  <div key={review.id} className={`card-luxury rounded-2xl p-6 ${review.isFeatured ? "border border-gold-500/20" : ""}`}>
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? "text-gold-400 fill-gold-400" : "text-border"}`} />
                      ))}
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-4 line-clamp-4">"{review.body}"</p>
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
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════════════════ CONTACT CTA */}
        <section id="contact" className="py-20 bg-gradient-to-br from-gold-500/5 via-surface-elevated to-surface-elevated border-y border-gold-500/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Get In Touch</p>
            <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-4">
              Ready to Plan Your Stay?
            </h2>
            <p className="text-muted-foreground mb-10 max-w-2xl mx-auto">
              Book online for instant confirmation, or call us directly — our team is available 24/7 to help you find the perfect room.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/book"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all text-sm">
                Book a Room Online
              </Link>
              <a href="https://wa.me/923347742767" target="_blank" rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] font-semibold rounded-xl hover:bg-[#25D366]/25 transition-colors text-sm">
                Chat on WhatsApp
              </a>
              <a href="tel:+923347742767"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-border text-foreground font-semibold rounded-xl hover:bg-accent transition-colors text-sm">
                <Phone className="w-4 h-4" />
                0334-7742767
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

        {/* ══════════════════════════════════════════════ GALLERY */}
        <GallerySection />

        {/* ══════════════════════════════════════════════ FAQ */}
        <FAQSection />
      </main>

      <PublicFooter />
      <ChatWidget />
    </>
  );
}
