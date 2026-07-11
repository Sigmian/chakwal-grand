import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Phone, CheckCircle2, MapPin, Clock, Wifi, Snowflake, ShowerHead, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Best Guest House in Chakwal — Why Stay at Chakwal Guest House (CGH)",
  description: "Looking for the best guest house or hotel in Chakwal? Chakwal Guest House offers clean rooms, free WiFi, 24/7 service, and two central locations — from PKR 2,000/night. No advance payment required.",
  keywords: [
    "guest house in Chakwal", "hotel in Chakwal", "cheap accommodation Chakwal",
    "best guest house Chakwal", "Chakwal Guest House", "CGH Chakwal",
    "budget hotel Chakwal Punjab", "family guest house Chakwal", "AC rooms Chakwal",
    "where to stay Chakwal", "Chakwal rooms booking", "overnight stay Chakwal Punjab",
  ],
  alternates: { canonical: `${siteConfig.url}/blog/chakwal-guest-house-guide` },
  openGraph: {
    title: "Best Guest House in Chakwal — Why Stay at Chakwal Guest House",
    description: "The complete guide to staying at Chakwal Guest House — rooms, amenities, pricing, location, and how to book.",
    url: `${siteConfig.url}/blog/chakwal-guest-house-guide`,
    images: [{ url: `${siteConfig.url}/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg`, width: 1200, height: 630, alt: "Chakwal Guest House clean comfortable rooms Punjab Pakistan" }],
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Best Guest House in Chakwal — Why Stay at Chakwal Guest House (CGH)",
  "description": "A comprehensive guide to Chakwal Guest House — the most trusted accommodation in Chakwal, Punjab Pakistan.",
  "image": `${siteConfig.url}/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg`,
  "url": `${siteConfig.url}/blog/chakwal-guest-house-guide`,
  "datePublished": "2026-01-15",
  "dateModified": "2026-07-01",
  "author": { "@type": "Organization", "name": "Chakwal Guest House", "url": siteConfig.url },
  "publisher": { "@type": "Organization", "name": "Chakwal Guest House", "url": siteConfig.url },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What is the best guest house in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Chakwal Guest House is consistently rated the best guest house in Chakwal by online reviews. It has two conveniently located branches, clean and modern rooms, free WiFi, 24/7 service, and the most straightforward online booking process in the city." } },
    { "@type": "Question", "name": "How much does a room cost at Chakwal Guest House?", "acceptedAnswer": { "@type": "Answer", "text": "Rooms at Chakwal Guest House start from PKR 2,000 per night for a Classic room. Family rooms are available from PKR 2,500/night and air-conditioned executive rooms from PKR 4,000/night. All prices are per room, not per person, and include free WiFi and hot water." } },
    { "@type": "Question", "name": "Do I need to pay in advance to book at Chakwal Guest House?", "acceptedAnswer": { "@type": "Answer", "text": "No advance payment is required. You can book online to confirm your room, and then pay cash on arrival at the guesthouse. This makes it completely risk-free to book even if your travel plans might change." } },
    { "@type": "Question", "name": "Is there a family room available at Chakwal Guest House?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, Chakwal Guest House has spacious family rooms that can accommodate up to 4 adults and 2 children. The family rooms include extra beds and are priced from PKR 2,500/night." } },
    { "@type": "Question", "name": "Where is Chakwal Guest House located?", "acceptedAnswer": { "@type": "Answer", "text": "Chakwal Guest House has two locations. The Main Branch is near District Courts on Talagang Road — very central and easy to find. The Madina Town Branch is in Madina Town, Chakwal — a newer facility with modern fittings. Both locations are well-connected to the city's main attractions." } },
    { "@type": "Question", "name": "What is the check-in and check-out time at Chakwal Guest House?", "acceptedAnswer": { "@type": "Answer", "text": "Check-in at Chakwal Guest House is flexible — you can arrive at any time of day or night and the front desk will accommodate you. Check-out time is 12:00 PM (noon). CNIC is required at check-in for all guests." } },
  ],
};

const ROOMS = [
  {
    name: "Classic Room",
    price: "PKR 2,000",
    priceNote: "per night",
    capacity: "2 Adults",
    image: "/images/rooms/classic-room-chakwal-grand-guest-house.jpg",
    imageAlt: "Classic room Chakwal Guest House clean comfortable Punjab Pakistan",
    features: ["Attached private bathroom", "Hot water 24/7", "Free WiFi", "Clean bedding & towels", "Ceiling fan", "TV"],
    best: "Solo travellers & budget-conscious guests",
  },
  {
    name: "Family Room",
    price: "PKR 2,500",
    priceNote: "per night",
    capacity: "4 Adults + Kids",
    image: "/images/rooms/premium-room-chakwal-grand-guest-house.jpg",
    imageAlt: "Family room Chakwal Guest House large comfortable Punjab Pakistan",
    features: ["Spacious layout with extra beds", "Attached private bathroom", "Hot water 24/7", "Free WiFi", "Child-friendly setup", "TV"],
    best: "Families visiting Chakwal for tourism or family events",
  },
  {
    name: "Executive AC Room",
    price: "PKR 4,000",
    priceNote: "per night",
    capacity: "2 Adults",
    image: "/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg",
    imageAlt: "Executive AC room Chakwal Guest House air conditioned Punjab Pakistan",
    features: ["Air conditioning (12 hours included)", "Premium furnishings", "Attached private bathroom", "Hot water 24/7", "Free high-speed WiFi", "TV"],
    best: "Business travellers, couples & guests seeking comfort",
  },
  {
    name: "VIP Suite",
    price: "PKR 5,000",
    priceNote: "per night",
    capacity: "2–4 Adults",
    image: "/images/rooms/suite-room-chakwal-grand-guest-house.jpg",
    imageAlt: "VIP suite Chakwal Guest House luxury room Punjab Pakistan",
    features: ["Largest room in the property", "Air conditioning included", "Seating area", "Premium bathroom fittings", "Free high-speed WiFi", "TV + extra amenities"],
    best: "Guests wanting the best room in Chakwal for a special occasion",
  },
];

const AMENITIES = [
  { Icon: Wifi,        name: "Free WiFi",           desc: "High-speed internet in all rooms — no password limits or throttling." },
  { Icon: Snowflake,   name: "Air Conditioning",     desc: "Available in Executive and Suite rooms, included in the room rate (12 hours/day)." },
  { Icon: ShowerHead,  name: "Hot Water 24/7",       desc: "Reliable geyser hot water in every attached bathroom, around the clock." },
  { Icon: ShieldCheck, name: "Security & CCTV",      desc: "Full CCTV coverage of common areas, front desk staffed around the clock." },
  { Icon: CheckCircle2, name: "24/7 Room Service",   desc: "Room service and front desk assistance available at all hours." },
  { Icon: MapPin,      name: "Two Central Locations", desc: "Main Branch near District Courts and Madina Town Branch — both highly accessible." },
];

const BOOKING_STEPS = [
  { step: "01", title: "Choose Your Dates", desc: "Visit the booking page and select your check-in and check-out dates — availability is updated in real time." },
  { step: "02", title: "Pick Your Room", desc: "Select from Classic, Family, Executive AC, or VIP Suite based on your budget and group size." },
  { step: "03", title: "Enter Your Details", desc: "Provide your name, CNIC number, phone number, and any special requests. No payment card needed." },
  { step: "04", title: "Confirm Your Booking", desc: "You'll receive an instant booking confirmation via SMS and WhatsApp with your booking reference number." },
  { step: "05", title: "Arrive & Pay Cash", desc: "Show up any time — the front desk is staffed 24/7. Pay your room rate in cash on arrival. No extra charges." },
];

const TOC = [
  { id: "why-cgh", label: "Why Choose Chakwal Guest House?" },
  { id: "rooms", label: "Rooms & Pricing" },
  { id: "amenities", label: "Amenities" },
  { id: "location", label: "Location & Branches" },
  { id: "booking", label: "How to Book" },
  { id: "faq", label: "FAQ" },
];

export default function ChakwalGuestHouseGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

      {/* Hero */}
      <div className="relative h-[50vh] min-h-[350px] w-full overflow-hidden">
        <Image
          src="/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg"
          alt="Best guest house in Chakwal — Chakwal Guest House clean comfortable rooms Punjab Pakistan"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link href="/" className="hover:text-gold-400 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/blog" className="hover:text-gold-400 transition-colors">Blog</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Chakwal Guest House Guide</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/20 px-3 py-1 rounded-full">Accommodation Guide</span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-foreground mt-3 mb-3 leading-tight">
            Best Guest House in Chakwal<br className="hidden sm:block" /> — Why Stay at CGH
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 6 min read</span>
            <span>Updated July 2026</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Sidebar TOC */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 card-luxury rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-3">Contents</p>
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
                <Link href="/book" className="block text-center py-2 bg-gold-gradient text-background text-xs font-bold rounded-lg hover:shadow-gold-lg transition-all">
                  Book Now — Free
                </Link>
                <a href={`tel:${siteConfig.phoneE164}`} className="block text-center py-2 border border-gold-500/30 text-gold-400 text-xs rounded-lg hover:bg-gold-500/10 transition-colors">
                  Call {siteConfig.phone}
                </a>
              </div>
            </div>
          </aside>

          {/* Article body */}
          <article className="flex-1 min-w-0 space-y-12">

            {/* Intro */}
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p className="text-lg text-foreground font-medium">
                Finding reliable accommodation in Chakwal used to mean settling for dingy roadside rooms with questionable cleanliness and no online booking system. Chakwal Guest House was built to change that — and it has become the most reviewed and trusted guest house in the city.
              </p>
              <p>
                Whether you are visiting for business, attending a family event, or exploring the region&apos;s remarkable tourist sites, this guide covers everything you need to know about staying at Chakwal Guest House — rooms, amenities, pricing, location, and how to book.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { val: "5.0★", label: "Google rating" },
                  { val: "PKR 2K", label: "Starting price" },
                  { val: "2", label: "Branch locations" },
                  { val: "24/7", label: "Front desk service" },
                ].map(s => (
                  <div key={s.label} className="card-luxury rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-gold-400">{s.val}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Why CGH */}
            <section id="why-cgh" className="scroll-mt-28">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Why Choose Chakwal Guest House?</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Chakwal is a market city of around 200,000 people, and accommodation options range widely in quality. Most traditional guest houses in Chakwal lack basic amenities like reliable WiFi, proper hot water, or a functioning online booking system. Chakwal Guest House was built from the ground up to offer a genuinely comfortable stay — not just somewhere to sleep.
                </p>
                <p>
                  The key difference is attention to the basics: rooms are cleaned to hotel standards after every checkout, hot water is genuinely available 24 hours a day (not just in the mornings), the WiFi works reliably, and the front desk is staffed around the clock so you can check in at 3 AM without a problem.
                </p>
                <p>
                  The guest house has earned a 5.0 star rating on Google from over 20 verified guest reviews — a rating that reflects consistent quality rather than a single good experience. It is used by business travellers, families visiting relatives in Chakwal, and tourists exploring Katas Raj and Kallar Kahar alike.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                {[
                  "No advance payment — book free, pay cash on arrival",
                  "Free cancellation up to 24 hours before check-in",
                  "CCTV and 24/7 front desk for your safety",
                  "Two branch locations across Chakwal city",
                  "Family-friendly with extra beds available",
                  "Online booking with instant confirmation",
                ].map(point => (
                  <div key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Rooms */}
            <section id="rooms" className="scroll-mt-28">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Rooms & Pricing at Chakwal Guest House</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Chakwal Guest House offers four room types to suit different budgets and group sizes — all with attached private bathrooms, hot water, and free WiFi included in the price.
              </p>
              <div className="space-y-6">
                {ROOMS.map(room => (
                  <div key={room.name} className="card-luxury rounded-2xl overflow-hidden">
                    <div className="relative h-48 sm:h-56">
                      <Image src={room.image} alt={room.imageAlt} fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5 flex items-end justify-between">
                        <div>
                          <h3 className="font-bold text-foreground text-lg">{room.name}</h3>
                          <p className="text-xs text-muted-foreground">{room.capacity}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gold-400">{room.price}</p>
                          <p className="text-xs text-muted-foreground">{room.priceNote}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                        {room.features.map(f => (
                          <div key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
                            {f}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gold-400 italic">Best for: {room.best}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Amenities */}
            <section id="amenities" className="scroll-mt-28">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Amenities at Chakwal Guest House</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {AMENITIES.map(({ Icon, name, desc }) => (
                  <div key={name} className="card-luxury rounded-xl p-4 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4.5 h-4.5 text-gold-400" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Location */}
            <section id="location" className="scroll-mt-28">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Location — Two Branches in Chakwal</h2>
              <p className="text-muted-foreground leading-relaxed mb-5">
                Chakwal Guest House has two branch locations, both centrally situated within Chakwal city. When booking, you can choose the branch that best suits your plans.
              </p>
              <div className="space-y-4">
                {siteConfig.branches.map(branch => (
                  <div key={branch.id} className="card-luxury rounded-2xl p-5 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-background" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-foreground">{branch.name}</h3>
                        {branch.label && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gold-500/15 text-gold-400">
                            {branch.label}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{branch.address}</p>
                      <p className="text-xs text-muted-foreground mt-2">{branch.city}, Punjab, Pakistan</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                Both locations are within 10 minutes of Chakwal&apos;s main bazaar, bus terminal, and major road connections to Rawalpindi, Jhelum, and Lahore. If you are arriving by bus, both branches are easily reachable by rickshaw for PKR 100–150.
              </p>
            </section>

            {/* Booking */}
            <section id="booking" className="scroll-mt-28">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">How to Book at Chakwal Guest House</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Booking is simple and completely free — no credit card, no advance payment, no booking fee. Here is the step-by-step process:
              </p>
              <div className="space-y-3">
                {BOOKING_STEPS.map(s => (
                  <div key={s.step} className="card-luxury rounded-xl p-4 flex items-start gap-4">
                    <span className="text-2xl font-black text-gold-400/30 font-mono leading-none flex-shrink-0">{s.step}</span>
                    <div>
                      <p className="font-bold text-foreground text-sm">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link href="/book" className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all text-sm">
                  Book Online Now <ArrowRight className="w-4 h-4" />
                </Link>
                <a href={siteConfig.social.whatsappUrl} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] font-semibold rounded-xl hover:bg-[#25D366]/25 transition-colors text-sm">
                  Book via WhatsApp
                </a>
                <a href={`tel:${siteConfig.phoneE164}`} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 border border-border text-foreground font-semibold rounded-xl hover:bg-accent transition-colors text-sm">
                  <Phone className="w-4 h-4" /> Call to Book
                </a>
              </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="scroll-mt-28">
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

            {/* CTA */}
            <section className="card-luxury rounded-2xl p-8 text-center border border-gold-500/20">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Ready to Book Your Stay in Chakwal?</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
                Rooms from PKR 2,000/night. No advance payment required — just book online and pay cash when you arrive. Free WiFi, 24/7 service, and a warm welcome guaranteed.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/book" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all text-sm">
                  Book Now — It&apos;s Free <ArrowRight className="w-4 h-4" />
                </Link>
                <a href={`tel:${siteConfig.phoneE164}`} className="inline-flex items-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors text-sm">
                  <Phone className="w-4 h-4" /> {siteConfig.phone}
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Also read:{" "}
                <Link href="/blog/things-to-do-chakwal" className="text-gold-400 hover:underline">Things to do in Chakwal</Link>
                {" · "}
                <Link href="/blog/chakwal-from-islamabad" className="text-gold-400 hover:underline">Day trip from Islamabad</Link>
                {" · "}
                <Link href="/blog/chakwal-travel-guide" className="text-gold-400 hover:underline">Complete travel guide</Link>
              </p>
            </section>

          </article>
        </div>
      </div>
    </>
  );
}
