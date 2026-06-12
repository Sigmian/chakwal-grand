import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star, Users, ChevronRight, CheckCircle2, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Best Family Guest House in Chakwal 2025 — Family Rooms, Rates & Booking | Chakwal Grand",
  description: "Looking for a family guest house in Chakwal? Chakwal Grand Guest House offers spacious family rooms for 4–6 guests, kids-friendly facilities, free WiFi, and 24/7 service from PKR 2,500/night. Book now, pay on arrival.",
  keywords: [
    "family guest house Chakwal", "best family hotel Chakwal", "family rooms Chakwal",
    "Chakwal family accommodation", "family trip Chakwal", "family stay Chakwal Punjab",
    "Chakwal Grand Guest House family", "kids friendly hotel Chakwal",
    "family room Chakwal price", "cheap family hotel Chakwal",
  ],
  alternates: { canonical: "https://www.staychakwal.de/blog/best-family-guest-house-chakwal" },
  openGraph: {
    title: "Best Family Guest House in Chakwal 2025 — Family Rooms & Rates",
    description: "Spacious family rooms, 24/7 service, free WiFi. Chakwal Grand Guest House — the top choice for families visiting Chakwal.",
    url: "https://www.staychakwal.de/blog/best-family-guest-house-chakwal",
    images: [{ url: "https://www.chakwalgrand.pk/images/rooms/suite-room-chakwal-grand-guest-house.jpg", width: 1200, height: 630, alt: "Family guest house room Chakwal clean comfortable" }],
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Best Family Guest House in Chakwal 2025 — Family Rooms, Rates & Booking",
  "description": "Complete guide to family accommodation in Chakwal, Punjab — room options, features, rates, and booking tips.",
  "image": "https://www.chakwalgrand.pk/images/rooms/suite-room-chakwal-grand-guest-house.jpg",
  "url": "https://www.staychakwal.de/blog/best-family-guest-house-chakwal",
  "datePublished": "2025-03-01",
  "dateModified": "2025-06-01",
  "author": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": "https://www.staychakwal.de" },
  "publisher": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": "https://www.staychakwal.de" },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Is there a family guest house in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — Chakwal Grand Guest House has dedicated family rooms accommodating 4 adults + 2 children from PKR 2,500/night. They also have apartment suites with kitchenettes ideal for families staying multiple nights." } },
    { "@type": "Question", "name": "What is the best hotel for families in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Chakwal Grand Guest House is the top-rated family accommodation in Chakwal, with a 5.0 Google rating. It offers spacious family rooms, 24/7 reception, hot water, and free WiFi." } },
    { "@type": "Question", "name": "How much does a family room cost in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Family rooms at Chakwal Grand Guest House start from PKR 2,500/night for non-AC, and PKR 3,500/night for AC family rooms. Apartment suites start from PKR 4,500/night. No advance payment required." } },
    { "@type": "Question", "name": "Are children allowed at guest houses in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — children are welcome at Chakwal Grand Guest House. Children under 5 stay free. Family rooms comfortably accommodate parents and children together with extra bedding available." } },
    { "@type": "Question", "name": "Is Chakwal safe for family travel?", "acceptedAnswer": { "@type": "Answer", "text": "Yes — Chakwal is considered one of the safer cities in Punjab for family travel. It is a military community with a strong law-and-order environment. Chakwal Grand Guest House has CCTV and 24/7 staff for guest safety." } },
  ],
};

const ROOM_TYPES = [
  {
    name: "Family Room (Non-AC)", price: "PKR 2,500/night",
    capacity: "4 Adults + 2 Children", best: "Budget family trips",
    image: "/images/rooms/classic-room-chakwal-grand-guest-house.jpg",
    imageAlt: "Family room non-AC Chakwal Grand Guest House Pakistan clean comfortable",
    features: ["Spacious layout", "Sitting area with chairs", "Hot water 24/7", "TV cable", "Extra bedding on request", "Attached bathroom"],
  },
  {
    name: "Family Room (AC)", price: "PKR 3,500/night",
    capacity: "4 Adults + 2 Children", best: "Summer/hot weather visits",
    image: "/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg",
    imageAlt: "Family room air conditioned Chakwal Grand Guest House Pakistan clean",
    features: ["Air conditioning 12 hrs/day", "Spacious layout", "Hot water 24/7", "TV cable", "Free WiFi", "Attached bathroom"],
  },
  {
    name: "Apartment Suite (AC)", price: "PKR 4,500/night",
    capacity: "4–6 Adults", best: "Extended stays, large families",
    image: "/images/rooms/premium-room-chakwal-grand-guest-house.jpg",
    imageAlt: "Apartment suite Chakwal Grand Guest House kitchenette living area family stay",
    features: ["Kitchenette (basic cooking)", "Separate living room", "Air conditioning", "Mini fridge", "Free WiFi", "Premium linen"],
  },
];

const FAMILY_FEATURES = [
  { icon: "🛏️", title: "Extra Bedding", desc: "Additional mattresses and pillows available on request — accommodates children of all ages without extra charge." },
  { icon: "🚿", title: "Hot Water 24/7", desc: "Round-the-clock hot water supply — critical for families with young children, especially in winter months." },
  { icon: "📶", title: "Free WiFi", desc: "High-speed WiFi in all rooms — keep children entertained during downtime with streaming and downloads." },
  { icon: "🔒", title: "Secure Environment", desc: "CCTV throughout the premises, 24/7 reception, and CNIC-verified guest registration for maximum family safety." },
  { icon: "🅿️", title: "Vehicle Parking", desc: "Secure parking for family cars, vans, or buses — essential when travelling with luggage and kids." },
  { icon: "📞", title: "24/7 Reception", desc: "Staff available around the clock to help with late check-ins, early breakfast needs, or local travel advice." },
];

const FAMILY_ATTRACTIONS = [
  { name: "Katas Raj Temples", time: "45 min drive", desc: "Children love the ancient temples and sacred pond — great for history lessons in a stunning setting.", tip: "Free entry, open daily" },
  { name: "Kallar Kahar Lake", time: "50 min drive", desc: "Boat rides on the lake are a hit with kids. The adjacent wildlife park has peacocks and deer.", tip: "Boat hire ~PKR 400/hr" },
  { name: "Kallar Kahar Wildlife Park", time: "50 min drive", desc: "Peacocks walking freely, deer grazing — a natural zoo experience that children absolutely love.", tip: "Best in morning hours" },
  { name: "Khewra Salt Mine", time: "1.5 hr drive", desc: "Underground tunnels and pink salt walls feel like a real adventure for children and adults alike.", tip: "Entry ~PKR 30/adult" },
];

export default function BestFamilyGuestHousePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

      {/* Hero */}
      <div className="relative h-[50vh] min-h-[350px] w-full overflow-hidden">
        <Image src="/images/rooms/suite-room-chakwal-grand-guest-house.jpg" alt="Best family guest house suite room Chakwal Grand Guest House Punjab Pakistan" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link href="/blog" className="hover:text-gold-400 transition-colors">Blog</Link>
            <ChevronRight className="w-3 h-3" /><span>Family Guest House Chakwal</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/20 px-3 py-1 rounded-full">Family Travel</span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-foreground mt-3 mb-3 leading-tight">
            Best Family Guest House in Chakwal 2025<br className="hidden sm:block" /> — Rooms, Rates & Family Tips
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            Planning a family trip to Chakwal? Complete guide to family-friendly accommodation, what to look for, and the best attractions for families.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* TOC Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 card-luxury rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-3">Quick Navigation</p>
              <ul className="space-y-2">
                {[
                  { id: "intro", label: "Why Chakwal for Families?" },
                  { id: "what-to-look-for", label: "What Families Need" },
                  { id: "rooms", label: "Family Room Options" },
                  { id: "features", label: "Family-Friendly Features" },
                  { id: "pricing", label: "Rates & Discounts" },
                  { id: "attractions", label: "Family Attractions" },
                  { id: "tips", label: "Family Travel Tips" },
                  { id: "faq", label: "FAQ" },
                ].map(item => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="text-xs text-muted-foreground hover:text-gold-400 transition-colors flex items-center gap-2">
                      <ChevronRight className="w-3 h-3 text-gold-400/50" />{item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-border space-y-2">
                <Link href="/book" className="block text-center py-2 bg-gold-gradient text-background text-xs font-bold rounded-lg hover:shadow-gold-lg transition-all">Book Family Room</Link>
                <a href="tel:+923347742767" className="block text-center py-2 border border-gold-500/30 text-gold-400 text-xs font-semibold rounded-lg hover:bg-gold-500/10 transition-colors">Call 0334-7742767</a>
              </div>
            </div>
          </aside>

          <article className="flex-1 min-w-0 space-y-12">

            <section id="intro">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Why Chakwal is Perfect for a Family Trip</h2>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>
                  More and more Pakistani families are choosing Chakwal for their holiday getaways — and for good reason. The district offers a rare combination of historical wonders, natural beauty, and family-safe activities, all within 2 hours of Rawalpindi and Islamabad.
                </p>
                <p>
                  The <Link href="/blog/katas-raj-temples-visitor-guide" className="text-gold-400 hover:underline">Katas Raj Temples</Link> give children a real sense of Pakistan&apos;s ancient history. Kallar Kahar Lake offers boat rides and peacock spotting that kids absolutely love. And unlike crowded tourist spots, Chakwal remains largely undiscovered — meaning shorter queues, lower prices, and a more relaxed experience for the whole family.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { val: "PKR 2,500", label: "Family room from" },
                    { val: "Free", label: "Under 5 stay free" },
                    { val: "4+", label: "Family attractions" },
                    { val: "24/7", label: "Staff on duty" },
                  ].map(s => (
                    <div key={s.label} className="card-luxury rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-gold-400">{s.val}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="what-to-look-for">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">What Families Need in a Guest House</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Travelling with children requires more from accommodation than a solo trip. When choosing a family guest house in Chakwal, look for these specific features:
              </p>
              <div className="space-y-3">
                {[
                  "Room size that comfortably fits parents + children without feeling cramped — at least 300 sq ft",
                  "Hot water supply at all hours — children need baths and parents need showers regardless of the time",
                  "24/7 reception — families with young children often have unpredictable schedules, including late arrivals",
                  "Secure premises with CCTV and single entry point — peace of mind when children are in the building",
                  "Flexibility on check-in/check-out times — young children make schedules unpredictable",
                  "Nearby local restaurants for family meals — avoid long travel for food with hungry children",
                ].map((point, i) => (
                  <div key={i} className="flex items-start gap-3 card-luxury rounded-xl p-3">
                    <CheckCircle2 className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{point}</span>
                  </div>
                ))}
              </div>
            </section>

            <section id="rooms">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Family Room Options at Chakwal Grand</h2>
              <div className="space-y-6">
                {ROOM_TYPES.map(r => (
                  <div key={r.name} className="card-luxury rounded-2xl overflow-hidden">
                    <div className="relative h-48">
                      <Image src={r.image} alt={r.imageAlt} fill className="object-cover" />
                    </div>
                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-bold text-foreground text-lg">{r.name}</h3>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3" /> {r.capacity}
                          </p>
                          <p className="text-xs text-gold-400 mt-0.5">Best for: {r.best}</p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="text-gold-400 font-bold text-xl">{r.price}</p>
                          <p className="text-xs text-muted-foreground">No advance payment</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {r.features.map(f => (
                          <span key={f} className="text-xs bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-0.5 rounded-full">{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="features">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Family-Friendly Features</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FAMILY_FEATURES.map(f => (
                  <div key={f.title} className="card-luxury rounded-xl p-4 flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{f.icon}</span>
                    <div>
                      <p className="font-bold text-foreground text-sm">{f.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="pricing">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Rates & Family Discounts</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs text-muted-foreground font-semibold pb-3 pr-4">Room Type</th>
                      <th className="text-right text-xs text-muted-foreground font-semibold pb-3 pr-4">Standard Rate</th>
                      <th className="text-right text-xs text-muted-foreground font-semibold pb-3">7+ Nights (14% off)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { room: "Family Room (Non-AC)", rate: "PKR 2,500/night", disc: "PKR 2,150/night" },
                      { room: "Family Room (AC)", rate: "PKR 3,500/night", disc: "PKR 3,010/night" },
                      { room: "Apartment Suite (AC)", rate: "PKR 4,500/night", disc: "PKR 3,870/night" },
                    ].map(r => (
                      <tr key={r.room} className="border-b border-border/50">
                        <td className="py-3 pr-4 text-foreground">{r.room}</td>
                        <td className="py-3 pr-4 text-right text-muted-foreground">{r.rate}</td>
                        <td className="py-3 text-right text-emerald-400 font-semibold">{r.disc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-xs font-bold text-emerald-400 mb-1">7+ Nights — 14% Off</p>
                  <p className="text-xs text-muted-foreground">Ideal for extended family trips or business stays. Applied automatically at checkout.</p>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs font-bold text-blue-400 mb-1">Children Under 5 — Free</p>
                  <p className="text-xs text-muted-foreground">Young children stay completely free in parents&apos; room. Extra bedding provided at no charge.</p>
                </div>
              </div>
            </section>

            <section id="attractions">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Best Chakwal Attractions for Families</h2>
              <div className="relative h-48 rounded-2xl overflow-hidden mb-5">
                <Image src="/images/blogs/sacred-pond-katas-raj-chakwal.jpg" alt="Kallar Kahar Lake Chakwal family scenic tourist destination Punjab Pakistan" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-4">
                  <p className="text-xs text-muted-foreground italic">Kallar Kahar Lake — boat rides are a favourite with children</p>
                </div>
              </div>
              <div className="space-y-4">
                {FAMILY_ATTRACTIONS.map(a => (
                  <div key={a.name} className="card-luxury rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="font-bold text-foreground">{a.name}</h3>
                      <span className="text-xs text-gold-400 flex-shrink-0">{a.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{a.desc}</p>
                    <p className="text-xs text-emerald-400">✓ {a.tip}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="tips">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Family Travel Tips for Chakwal</h2>
              <ul className="space-y-3">
                {[
                  "Book your family room at least 3–4 days in advance, especially during Eid holidays and school vacations — family rooms are limited and fill up fast.",
                  "Carry each family member's CNIC (or B-form for children). Guest house registration requires family documentation for all guests.",
                  "For children under 12, avoid Tilla Jogian — the hike is steep and not suitable for young kids. Kallar Kahar and Katas Raj are much more family-friendly.",
                  "Bring a packed lunch and water for day trips to Katas Raj — there are no restaurants or shops inside the temple complex.",
                  "If travelling with infants, call ahead to request a cot or extra mattress so it is ready when you arrive.",
                  "Most local restaurants in Chakwal do not have high chairs — bring a portable booster seat if your child needs one.",
                  "WhatsApp the guest house before arrival to confirm your room is ready and get precise directions for GPS navigation.",
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

            <section className="card-luxury rounded-2xl p-8 text-center border border-gold-500/20">
              <div className="flex justify-center gap-0.5 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-gold-400 fill-gold-400" />)}
              </div>
              <h2 className="text-2xl font-bold font-serif text-foreground mb-2">Book Your Family Room in Chakwal</h2>
              <p className="text-muted-foreground text-sm mb-2">5.0 Google Rating · 20+ Verified Reviews · Trusted by Hundreds of Families</p>
              <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
                Chakwal Grand Guest House — the most trusted family accommodation in Chakwal Punjab. Spacious rooms, 24/7 service, free WiFi. No advance payment — pay cash on arrival.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/book" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
                  Book Family Room <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="tel:+923347742767" className="inline-flex items-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors">
                  <Phone className="w-4 h-4" /> Call 0334-7742767
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Also see: <Link href="/blog/places-to-visit-chakwal" className="text-gold-400 hover:underline">Places to visit in Chakwal</Link> · <Link href="/blog/chakwal-travel-guide" className="text-gold-400 hover:underline">Chakwal travel guide</Link>
              </p>
            </section>

          </article>
        </div>
      </div>
    </>
  );
}
