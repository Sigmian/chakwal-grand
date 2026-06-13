import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Star, ChevronRight, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Where to Stay in Chakwal 2025 — Best Guest Houses & Hotels | Chakwal Grand",
  description: "Complete guide to the best accommodation in Chakwal, Punjab. Chakwal Grand Guest House — top-rated, AC rooms, family suites, free WiFi from PKR 2,000/night. Book now, pay on arrival.",
  keywords: [
    "where to stay in Chakwal", "best guest house Chakwal", "hotel in Chakwal Punjab",
    "accommodation Chakwal", "Chakwal rooms booking", "cheap stay Chakwal",
    "guest house near Katas Raj", "Chakwal Grand Guest House", "family guest house Chakwal",
    "budget hotel Chakwal", "Chakwal hotel price", "safe guest house Chakwal",
  ],
  alternates: { canonical: "https://www.staychakwal.de/blog/where-to-stay-chakwal" },
  openGraph: {
    title: "Where to Stay in Chakwal 2025 — Best Guest Houses & Hotels",
    description: "Chakwal Grand Guest House — top-rated accommodation in Chakwal. AC rooms, family suites, free WiFi from PKR 2,000/night.",
    url: "https://www.staychakwal.de/blog/where-to-stay-chakwal",
    images: [{ url: "https://www.staychakwal.de/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg", width: 1200, height: 630, alt: "Best guest house room Chakwal Punjab" }],
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Where to Stay in Chakwal 2025 — Best Guest Houses & Hotels",
  "description": "Complete guide to the best accommodation options in Chakwal, Punjab, Pakistan.",
  "image": "https://www.staychakwal.de/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg",
  "url": "https://www.staychakwal.de/blog/where-to-stay-chakwal",
  "datePublished": "2025-02-20",
  "dateModified": "2025-06-01",
  "author": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": "https://www.staychakwal.de" },
  "publisher": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": "https://www.staychakwal.de" },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What is the cheapest guest house in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Chakwal Grand Guest House offers the most affordable quality accommodation in Chakwal, with rooms starting from PKR 2,000/night for a non-AC classic room. No advance payment required — pay cash on arrival." } },
    { "@type": "Question", "name": "Is there a family guest house in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — Chakwal Grand Guest House has dedicated family rooms accommodating 4 adults + 2 children starting from PKR 2,500/night. They also have apartment suites with kitchenettes for longer family stays." } },
    { "@type": "Question", "name": "Which is the best hotel in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Chakwal Grand Guest House is rated the best accommodation in Chakwal with a 5.0 Google rating from 20+ reviews. It has branches in Chakwal city, Kallar Kahar, and Sargodha." } },
    { "@type": "Question", "name": "Do Chakwal guest houses require CNIC?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, by law all registered guest houses in Pakistan must collect a copy of the guest's CNIC at check-in. Always carry your original CNIC when travelling." } },
    { "@type": "Question", "name": "Is there an AC guest house in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — Chakwal Grand Guest House has AC rooms available (Classic AC Room from PKR 2,500/night and Executive AC Room from PKR 4,000/night). AC is available for 12 hours per day as standard." } },
  ],
};

const ROOMS = [
  { type: "Classic Room (Non-AC)", price: "PKR 2,000", capacity: "2 Adults", features: ["Free WiFi", "Hot Water 24/7", "Attached Bathroom", "TV", "Clean Linen"], best: "Budget travelers, solo visitors" },
  { type: "Classic Room (AC)", price: "PKR 2,500", capacity: "2 Adults", features: ["Free WiFi", "Hot Water", "Air Conditioning (12 hrs)", "TV", "Attached Bath"], best: "Couples, business professionals" },
  { type: "Family Room (Non-AC)", price: "PKR 2,500", capacity: "4 Adults + 2 Children", features: ["Spacious Layout", "Sitting Area", "Hot Water", "TV", "Extra Bedding"], best: "Families visiting Chakwal" },
  { type: "Executive Room (AC)", price: "PKR 4,000", capacity: "2 Adults", features: ["Work Desk", "Sofa Chair", "AC (12 hrs)", "Free WiFi", "Premium Linen"], best: "Business travelers, longer stays" },
  { type: "Apartment Suite (AC)", price: "PKR 4,500", capacity: "4 Adults", features: ["Kitchenette", "Living Area", "AC", "Mini Fridge", "Full Attached Bath"], best: "Long stays, extended family visits" },
];

const TOC = [
  { id: "intro", label: "Introduction" },
  { id: "what-to-look-for", label: "What to Look for in Chakwal Accommodation" },
  { id: "chakwal-grand", label: "Chakwal Grand Guest House — #1 Rated" },
  { id: "room-types", label: "Room Types & Prices" },
  { id: "facilities", label: "Facilities & Amenities" },
  { id: "location", label: "Location & Nearby Places" },
  { id: "discounts", label: "Discounts & Special Rates" },
  { id: "booking-tips", label: "Booking Tips" },
  { id: "faq", label: "Frequently Asked Questions" },
];

export default function WhereToStayPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

      {/* Hero */}
      <div className="relative h-[50vh] min-h-[350px] w-full overflow-hidden">
        <Image src="/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg" alt="Air conditioned guest house room Chakwal Grand Guest House Punjab Pakistan" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link href="/blog" className="hover:text-gold-400 transition-colors">Blog</Link>
            <ChevronRight className="w-3 h-3" /><span>Where to Stay in Chakwal</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/20 px-3 py-1 rounded-full">Accommodation Guide</span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-foreground mt-3 mb-3 leading-tight">
            Where to Stay in Chakwal 2025<br className="hidden sm:block" /> — Best Guest Houses & Hotels
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            From budget rooms to family suites — your complete guide to accommodation in Chakwal, Punjab. Updated for 2025.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* TOC Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 card-luxury rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-3">Table of Contents</p>
              <ul className="space-y-2">
                {TOC.map(item => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="text-xs text-muted-foreground hover:text-gold-400 transition-colors flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-gold-400/50" />{item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-border space-y-2">
                <Link href="/book" className="block text-center py-2 bg-gold-gradient text-background text-xs font-bold rounded-lg hover:shadow-gold-lg transition-all">Book Now — Free Cancel</Link>
                <a href={`tel:${siteConfig.phoneE164}`} className="block text-center py-2 border border-gold-500/30 text-gold-400 text-xs font-semibold rounded-lg hover:bg-gold-500/10 transition-colors">Call {siteConfig.phone}</a>
              </div>
            </div>
          </aside>

          {/* Article */}
          <article className="flex-1 min-w-0 space-y-12">

            <section id="intro">
              <p className="text-muted-foreground leading-relaxed text-base">
                Chakwal is rapidly becoming one of Punjab&apos;s most visited districts — with tourists flocking to <Link href="/blog/katas-raj-temples-visitor-guide" className="text-gold-400 hover:underline">Katas Raj Temples</Link>, Kallar Kahar Lake, and the scenic Salt Range hills. As tourism has grown, so has the demand for reliable, clean, and affordable accommodation. But not all options in Chakwal meet the standard — many small hotels lack proper facilities, security, or even hot water.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                This guide covers everything you need to know about <strong className="text-foreground">where to stay in Chakwal</strong> — what to look for, the best options available, room types, prices, and booking tips for 2025.
              </p>
            </section>

            <section id="what-to-look-for">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">What to Look for in Chakwal Accommodation</h2>
              <div className="relative h-48 rounded-2xl overflow-hidden mb-5">
                <Image src="/images/rooms/classic-room-chakwal-grand-guest-house.jpg" alt="Classic standard room Chakwal Grand Guest House Pakistan clean comfortable" fill className="object-cover" />
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">Before choosing your accommodation in Chakwal, check these key factors:</p>
              <div className="space-y-3">
                {[
                  { title: "Safety & Security", icon: "🔒", desc: "Reputable guest houses verify guests with CNIC copies and have CCTV security cameras. Always choose registered, ETPB-verified or publicly reviewed properties." },
                  { title: "Hot Water & Cleanliness", icon: "🚿", desc: "Hot water availability is crucial, especially in winter when Chakwal gets very cold. Attached bathrooms with clean linen are a must." },
                  { title: "Central Location", icon: "📍", desc: "Choose accommodation near Chakwal city center for easy access to local restaurants, transport hubs, and roads to attractions like Katas Raj and Kallar Kahar." },
                  { title: "Transparent Pricing", icon: "💰", desc: "Avoid guest houses with hidden charges for WiFi, extra guests, or utilities. Look for clear published prices — what you see online should be what you pay." },
                  { title: "24/7 Reception", icon: "⏰", desc: "A guest house with round-the-clock staff ensures you have help for late check-ins, early departures, or any issues during your stay." },
                  { title: "Online Reviews", icon: "⭐", desc: "Check Google reviews before booking. A property with 15+ reviews and 4.5+ stars is generally trustworthy. Read recent reviews (last 6 months) for current conditions." },
                ].map(item => (
                  <div key={item.title} className="card-luxury rounded-xl p-4 flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="chakwal-grand">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-2">
                #1 Chakwal Grand Guest House — Best Accommodation in Chakwal
              </h2>
              <div className="flex items-center gap-1 mb-4">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-gold-400 fill-gold-400" />)}
                <span className="text-sm text-muted-foreground ml-2">5.0 Google Rating — 20 verified reviews</span>
              </div>
              <div className="relative h-56 rounded-2xl overflow-hidden mb-5">
                <Image src="/images/rooms/executive-room-chakwal-grand-guest-house.jpg" alt="Executive premium room Chakwal Grand Guest House modern interior design" fill className="object-cover" />
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Chakwal Grand Guest House</strong> is the most popular and trusted accommodation in Chakwal district. With <strong className="text-foreground">3 branches</strong> — in Chakwal city, Kallar Kahar, and Sargodha — it has served thousands of guests annually since its founding, from solo travelers and business professionals to large family groups.
                </p>
                <p>
                  Located near the District Courts on Talagang Road, the Chakwal city branch is the most convenient for tourists — positioned centrally with easy access to all major attractions, the Chakwal bus terminal, and local restaurants.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    ["⭐ Google Rating", "5.0 / 5.0"],
                    ["👥 Reviews", "20+ verified"],
                    ["🏠 Branches", "3 across Punjab"],
                    ["💰 Starting Rate", "PKR 2,000/night"],
                    ["💳 Payment", "Cash on arrival"],
                    ["🚫 Advance Payment", "Not required"],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="bg-surface-base rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{String(val)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="room-types">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Room Types & Prices 2025</h2>
              <div className="space-y-4">
                {ROOMS.map(r => (
                  <div key={r.type} className="card-luxury rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-foreground">{r.type}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Best for: {r.best}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-gold-400 font-bold text-lg">{r.price}</p>
                        <p className="text-xs text-muted-foreground">{r.capacity} / night</p>
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
              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="font-bold text-emerald-400 mb-1 text-sm">Long-Stay Discounts</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>✓ 7+ nights stay → <strong className="text-foreground">14% discount</strong> automatically applied</p>
                  <p>✓ 30+ nights stay → <strong className="text-foreground">40% discount</strong> — ideal for business assignments</p>
                  <p>✓ Group bookings (5+ rooms) → contact directly for group rates</p>
                </div>
              </div>
            </section>

            <section id="facilities">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Facilities & Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: "📶", facility: "Free WiFi", desc: "High-speed internet in all rooms" },
                  { icon: "🚿", facility: "Hot Water 24/7", desc: "Round-the-clock hot water supply" },
                  { icon: "❄️", facility: "Air Conditioning", desc: "AC rooms available (12 hrs/day)" },
                  { icon: "📺", facility: "Cable TV", desc: "Local and international channels" },
                  { icon: "🧹", facility: "Daily Housekeeping", desc: "Fresh linen and room cleaning" },
                  { icon: "📞", facility: "24/7 Reception", desc: "Staff always available to assist" },
                  { icon: "🔒", facility: "CCTV Security", desc: "Full premises under surveillance" },
                  { icon: "🅿️", facility: "Parking", desc: "Vehicle parking on premises" },
                  { icon: "🍽️", facility: "Nearby Dining", desc: "Restaurants within 2 min walk" },
                ].map(item => (
                  <div key={item.facility} className="card-luxury rounded-xl p-4 text-center">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <p className="font-semibold text-foreground text-xs">{item.facility}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="location">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Location & Nearby Attractions</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Chakwal Grand Guest House is ideally located near <strong className="text-foreground">District Courts, Talagang Road, Chakwal</strong> — at the heart of the city. This central location makes it the perfect base for exploring all of Chakwal district&apos;s major attractions.
              </p>
              <div className="space-y-3">
                {[
                  { place: "Katas Raj Temples", dist: "40 km", time: "45 min drive" },
                  { place: "Kallar Kahar Lake", dist: "45 km", time: "50 min drive" },
                  { place: "Choa Saidan Shah", dist: "30 km", time: "35 min drive" },
                  { place: "Chakwal Bus Terminal", dist: "2 km", time: "5 min by rickshaw" },
                  { place: "Chakwal City Market", dist: "1 km", time: "10 min walk" },
                  { place: "Khewra Salt Mine", dist: "80 km", time: "1.5 hr drive" },
                ].map(item => (
                  <div key={item.place} className="flex items-center justify-between p-3 card-luxury rounded-xl">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      <span className="text-sm text-foreground">{item.place}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-gold-400">{item.dist}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="booking-tips">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Tips for Booking in Chakwal</h2>
              <ul className="space-y-3">
                {[
                  "Book 2–3 days in advance during Eid holidays, school summer holidays (June–August), and long weekends — Chakwal accommodation fills up fast.",
                  "Always bring your original CNIC — it is required at check-in at all registered guest houses and hotels in Chakwal, as per Pakistani law.",
                  "Confirm your booking via WhatsApp after booking online to ensure room availability and get the exact address.",
                  "For groups of 5 or more, call directly to ask about group rates and special room arrangements.",
                  "If visiting Katas Raj or Kallar Kahar, book at the Chakwal city branch for the most convenient access to both sites.",
                  "Keep PKR cash handy — most accommodation in Chakwal is cash-only. The nearest ATM is at Habib Bank, 5 min from the guest house.",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 card-luxury rounded-xl p-4 list-none">
                    <span className="text-gold-400 font-bold flex-shrink-0 text-sm">{String(i+1).padStart(2, "0")}</span>
                    <span className="text-sm text-muted-foreground leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id="faq">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {FAQ_SCHEMA.mainEntity.map((faq) => (
                  <details key={faq.name} className="card-luxury rounded-2xl group">
                    <summary className="p-5 font-bold text-foreground text-sm cursor-pointer flex items-center justify-between list-none hover:text-gold-400 transition-colors">
                      {faq.name}
                      <ChevronRight className="w-4 h-4 text-gold-400 flex-shrink-0 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                      {faq.acceptedAnswer.text}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Final CTA */}
            <section className="card-luxury rounded-2xl p-8 text-center border border-gold-500/20">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Book Your Stay in Chakwal Today</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
                Chakwal Grand Guest House — the most trusted accommodation in Chakwal Punjab. Book online in 2 minutes. No advance payment required. Pay cash on arrival. Free cancellation.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/book" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
                  Book Now — Free Cancellation <ArrowRight className="w-4 h-4" />
                </Link>
                <a href={`tel:${siteConfig.phoneE164}`} className="inline-flex items-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors">
                  <Phone className="w-4 h-4" /> Call {siteConfig.phone}
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Also see: <Link href="/blog/katas-raj-temples-visitor-guide" className="text-gold-400 hover:underline">Katas Raj Visitor Guide</Link> · <Link href="/blog/places-to-visit-chakwal" className="text-gold-400 hover:underline">Places to Visit in Chakwal</Link>
              </p>
            </section>

          </article>
        </div>
      </div>
    </>
  );
}
