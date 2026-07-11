import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, Phone, Clock, Car, MapPin, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Chakwal from Islamabad & Rawalpindi — Day Trip or Overnight Stay Guide 2026",
  description: "Planning a trip to Chakwal from Islamabad or Rawalpindi? Learn the route, distance (80 km, ~1.5 hours), what to see, and why an overnight stay beats a rushed day trip. Complete 2026 guide.",
  keywords: [
    "Chakwal from Islamabad", "Chakwal from Rawalpindi", "Islamabad to Chakwal",
    "Rawalpindi to Chakwal", "day trip Chakwal", "weekend trip Chakwal Islamabad",
    "Chakwal distance Islamabad", "Chakwal road trip", "how to reach Chakwal",
    "Chakwal travel guide", "Pindi to Chakwal", "Chakwal overnight trip",
  ],
  alternates: { canonical: `${siteConfig.url}/blog/chakwal-from-islamabad` },
  openGraph: {
    title: "Chakwal from Islamabad & Rawalpindi — Day Trip or Overnight Stay Guide 2026",
    description: "Everything you need to know about visiting Chakwal from Islamabad — route, distance, what to see, and the case for staying overnight.",
    url: `${siteConfig.url}/blog/chakwal-from-islamabad`,
    images: [{ url: `${siteConfig.url}/images/blogs/salt-range-mountain-chakwal-pakistan.webp`, width: 1200, height: 630, alt: "Chakwal from Islamabad route Salt Range Punjab Pakistan" }],
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Chakwal from Islamabad & Rawalpindi — Day Trip or Overnight Stay Guide 2026",
  "description": "A complete guide to visiting Chakwal from Islamabad and Rawalpindi — routes, distance, attractions, day-trip vs overnight advice.",
  "image": `${siteConfig.url}/images/blogs/salt-range-mountain-chakwal-pakistan.webp`,
  "url": `${siteConfig.url}/blog/chakwal-from-islamabad`,
  "datePublished": "2026-02-01",
  "dateModified": "2026-07-01",
  "author": { "@type": "Organization", "name": "Chakwal Guest House", "url": siteConfig.url },
  "publisher": { "@type": "Organization", "name": "Chakwal Guest House", "url": siteConfig.url },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "How far is Chakwal from Islamabad?", "acceptedAnswer": { "@type": "Answer", "text": "Chakwal city is approximately 80–90 km from Islamabad/Rawalpindi. The drive takes about 1.5 hours via the M-2 motorway to the Chakwal motorway exit, then 20–25 minutes on the Chakwal city road. Alternatively, the older Talagang Road via Fateh Jang takes about 2 hours but passes through more scenic terrain." } },
    { "@type": "Question", "name": "Can I do a day trip from Islamabad to Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, a day trip from Islamabad to Chakwal is possible, but you will only have time for one or two attractions if you want to avoid rushing. Katas Raj Temples or Kallar Kahar Lake as the main destination works well as a day trip. For both sites plus the Salt Range, an overnight stay is strongly recommended." } },
    { "@type": "Question", "name": "What bus service goes from Rawalpindi to Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Daewoo Express, Faisal Movers, and Skyways all operate regular services from Rawalpindi (Rawalpindi Mor / Pirwadhai terminal) to Chakwal. The journey takes about 1.5–2 hours and tickets cost PKR 200–350. Buses run from early morning until late evening." } },
    { "@type": "Question", "name": "Is it worth staying overnight in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely yes. An overnight stay lets you see Katas Raj in the early morning calm, visit Kallar Kahar Lake the next day, eat a proper Chakwal breakfast, and return to Islamabad without feeling rushed. Chakwal Guest House offers clean rooms from PKR 2,000/night with no advance payment required." } },
    { "@type": "Question", "name": "What is the best route from Rawalpindi to Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "The fastest route is via the M-2 motorway (Islamabad–Lahore motorway), exiting at the Chakwal interchange and then following the Chakwal city road for approximately 22 km. Total distance from Rawalpindi is about 85 km and takes 1.5 hours. Toll charges apply on the motorway." } },
  ],
};

const ROUTES = [
  {
    name: "Via M-2 Motorway (Recommended)",
    from: "Rawalpindi / Islamabad",
    distance: "85 km",
    time: "1.5 hours",
    cost: "PKR 300–400 fuel + PKR 100 toll",
    directions: [
      "Head to Islamabad Motorway entry (Zero Point / Golra Mor)",
      "Take the M-2 motorway heading towards Lahore",
      "Exit at the Chakwal interchange (approximately 60 km from Islamabad)",
      "Follow the Chakwal city road for 22 km into Chakwal city",
      "The road is well-signed from the motorway exit",
    ],
    pros: ["Fastest route", "Excellent road quality", "Well-lit and safe"],
    cons: ["Toll charges apply", "Less scenic than alternate route"],
  },
  {
    name: "Via Talagang Road / Fateh Jang",
    from: "Rawalpindi / Islamabad",
    distance: "95 km",
    time: "2 hours",
    cost: "PKR 350–450 fuel (no toll)",
    directions: [
      "Head toward Rawalpindi's Potohar housing areas or Fateh Jang road",
      "Take the Fateh Jang – Tamman – Chakwal road",
      "The route passes through Potohar Plateau villages — scenic drive",
      "Arrives in Chakwal city from the northwest side",
    ],
    pros: ["No motorway toll", "Scenic Potohar Plateau views", "Interesting villages along the way"],
    cons: ["Slower, more winding road", "Less suitable after dark"],
  },
  {
    name: "By Daewoo / Faisal Movers Bus",
    from: "Rawalpindi Bus Terminal (Pirwadhai / Rawalpindi Mor)",
    distance: "85 km",
    time: "1.5 – 2 hours",
    cost: "PKR 200 – 350 per person",
    directions: [
      "Go to Rawalpindi Mor or Pirwadhai Bus Terminal",
      "Look for Chakwal-bound Daewoo Express or Faisal Movers services",
      "Buses run from approximately 6 AM to 10 PM",
      "In Chakwal, take a rickshaw to your destination (PKR 100–150)",
    ],
    pros: ["Very cheap", "No driving required", "Comfortable AC seats on major buses"],
    cons: ["Fixed schedule", "Need rickshaw from Chakwal bus terminal", "Less flexible for sightseeing"],
  },
];

const ITINERARIES = [
  {
    type: "Day Trip (8 hours)",
    target: "One major attraction",
    schedule: [
      { time: "7:00 AM", task: "Depart Islamabad/Rawalpindi via M-2 motorway" },
      { time: "8:30 AM", task: "Arrive Chakwal — quick breakfast at local dhaba" },
      { time: "9:00 AM", task: "Drive to Katas Raj Temples (40 km, 45 min) OR Kallar Kahar (45 km, 50 min)" },
      { time: "9:45 AM – 12:30 PM", task: "Explore Katas Raj Temples or Kallar Kahar Lake" },
      { time: "1:00 PM", task: "Lunch at Choa Saidan Shah (near Katas Raj) or Kallar Kahar town" },
      { time: "2:30 PM", task: "Begin return journey via motorway" },
      { time: "4:00 PM", task: "Arrive back in Rawalpindi / Islamabad" },
    ],
    verdict: "Works well if you want to visit just Katas Raj or just Kallar Kahar. Feels rushed if you try both.",
  },
  {
    type: "Overnight Stay (2 days)",
    target: "Full Chakwal experience — both major sites",
    schedule: [
      { time: "Day 1, 7:00 AM", task: "Depart Islamabad via M-2 motorway" },
      { time: "Day 1, 8:30 AM", task: "Check in to Chakwal Guest House, freshen up" },
      { time: "Day 1, 9:30 AM", task: "Drive to Katas Raj Temples — 2–3 hours exploring" },
      { time: "Day 1, 1:00 PM", task: "Lunch at Choa Saidan Shah" },
      { time: "Day 1, 3:00 PM", task: "Pharwala Fort visit or Salt Range viewpoints" },
      { time: "Day 1, 7:00 PM", task: "Dinner at Chakwal city dhaba, evening at bazaar" },
      { time: "Day 2, 8:00 AM", task: "Nihari breakfast — the classic Chakwal morning" },
      { time: "Day 2, 9:00 AM", task: "Drive to Kallar Kahar Lake — boating, wildlife park" },
      { time: "Day 2, 12:30 PM", task: "Babur's Throne (Takht-e-Babri) visit, lunch" },
      { time: "Day 2, 3:00 PM", task: "Salt Range viewpoint drive, sunset at Kallar Kahar" },
      { time: "Day 2, 6:00 PM", task: "Return to Islamabad — arrive by 7:30 PM" },
    ],
    verdict: "The right way to see Chakwal. You leave feeling like you actually experienced the place, not just rushed through it.",
  },
];

const TOC = [
  { id: "distance", label: "Distance & Travel Time" },
  { id: "routes", label: "Routes from Islamabad" },
  { id: "day-trip", label: "Day Trip vs Overnight" },
  { id: "itineraries", label: "Sample Itineraries" },
  { id: "what-to-see", label: "What to See in Chakwal" },
  { id: "faq", label: "FAQ" },
];

export default function ChakwalFromIslamabadPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

      {/* Hero */}
      <div className="relative h-[50vh] min-h-[350px] w-full overflow-hidden">
        <Image
          src="/images/blogs/salt-range-mountain-chakwal-pakistan.webp"
          alt="Chakwal from Islamabad Salt Range road trip Punjab Pakistan landscape"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link href="/" className="hover:text-gold-400 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/blog" className="hover:text-gold-400 transition-colors">Blog</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Chakwal from Islamabad</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/20 px-3 py-1 rounded-full">Day Trips & Travel</span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-foreground mt-3 mb-3 leading-tight">
            Day Trip or Overnight Stay:<br className="hidden sm:block" /> Chakwal from Islamabad & Rawalpindi
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 7 min read</span>
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
                  Book Accommodation
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
                Chakwal is one of the best weekend getaways from Islamabad that most residents of the twin cities have never properly explored. At just 85 km from Rawalpindi — roughly 1.5 hours by car via the M-2 motorway — it is closer than most people expect, and considerably more interesting.
              </p>
              <p>
                The question is not whether to go. It is whether to go for a day trip or to stay overnight. This guide gives you honest advice on both, with exact routes, cost estimates, and sample itineraries so you can plan the visit that suits you.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { val: "85 km", label: "From Rawalpindi" },
                  { val: "1.5 hr", label: "Drive via M-2" },
                  { val: "PKR 2K", label: "Room from (overnight)" },
                  { val: "2 days", label: "Ideal trip length" },
                ].map(s => (
                  <div key={s.label} className="card-luxury rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-gold-400">{s.val}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Distance */}
            <section id="distance" className="scroll-mt-28">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Distance from Islamabad to Chakwal</h2>
              <div className="relative h-48 rounded-2xl overflow-hidden mb-5">
                <Image
                  src="/images/blogs/chakwal-travel-mountains-punjab.webp"
                  alt="Chakwal landscape from Islamabad road trip Punjab mountains"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Chakwal city sits approximately 80–90 km southeast of Islamabad, and 85 km from Rawalpindi&apos;s central area. The exact distance depends on your starting point and route, but plan for 1.5 hours via the motorway or 2 hours via older roads.
                </p>
                <p>
                  This puts Chakwal firmly in the &ldquo;easy weekend trip&rdquo; category — closer than Abbottabad (2 hours), Murree (1.5 hours with traffic), and far less congested than either. The M-2 motorway provides an excellent quality road for most of the journey.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
                {[
                  { from: "Islamabad (F-6/7)", dist: "80 km", time: "1.5 hours" },
                  { from: "Rawalpindi (Saddar)", dist: "85 km", time: "1.5 hours" },
                  { from: "Rawalpindi Mor", dist: "80 km", time: "1.5 hours" },
                ].map(r => (
                  <div key={r.from} className="card-luxury rounded-xl p-4">
                    <p className="font-bold text-foreground text-sm">{r.from}</p>
                    <p className="text-gold-400 font-bold text-xl mt-2">{r.dist}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" /> {r.time}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Routes */}
            <section id="routes" className="scroll-mt-28">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Routes from Islamabad to Chakwal</h2>
              <div className="space-y-5">
                {ROUTES.map(route => (
                  <div key={route.name} className="card-luxury rounded-2xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Car className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-bold text-foreground">{route.name}</h3>
                        <p className="text-xs text-muted-foreground">From: {route.from}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {route.distance}
                      </span>
                      <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {route.time}
                      </span>
                      <span className="text-xs text-muted-foreground bg-surface-base px-2 py-1 rounded-lg">{route.cost}</span>
                    </div>
                    <ol className="space-y-1.5 mb-4">
                      {route.directions.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="text-gold-400 font-mono flex-shrink-0">{i + 1}.</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                    <div className="flex gap-4 flex-wrap">
                      <div>
                        <p className="text-xs font-bold text-green-400 mb-1">Pros</p>
                        {route.pros.map(p => (
                          <p key={p} className="text-xs text-muted-foreground flex items-start gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" /> {p}
                          </p>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-400 mb-1">Cons</p>
                        {route.cons.map(c => (
                          <p key={c} className="text-xs text-muted-foreground flex items-start gap-1">
                            <span className="text-amber-400 flex-shrink-0">–</span> {c}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Day trip vs overnight */}
            <section id="day-trip" className="scroll-mt-28">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Day Trip vs Overnight Stay — Which Should You Choose?</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  The honest answer is that an overnight stay is significantly better — but a day trip is still worthwhile if your schedule does not allow more.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                <div className="card-luxury rounded-2xl p-5 border border-amber-500/20">
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-amber-400">Day Trip</span>
                    <span className="text-xs text-muted-foreground font-normal">8 hours</span>
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> No accommodation cost</div>
                    <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> Good for visiting one main attraction</div>
                    <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> Back home the same day</div>
                    <div className="flex items-start gap-2 mt-3"><span className="text-red-400 flex-shrink-0">×</span> Cannot visit both Katas Raj and Kallar Kahar</div>
                    <div className="flex items-start gap-2"><span className="text-red-400 flex-shrink-0">×</span> Miss the early-morning calm at Katas Raj</div>
                    <div className="flex items-start gap-2"><span className="text-red-400 flex-shrink-0">×</span> No time for proper local food experience</div>
                    <div className="flex items-start gap-2"><span className="text-red-400 flex-shrink-0">×</span> Salt Range driving in the dark on the return</div>
                  </div>
                </div>
                <div className="card-luxury rounded-2xl p-5 border border-gold-500/30">
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                    <span className="text-gold-400">Overnight Stay</span>
                    <span className="text-xs text-muted-foreground font-normal">2 days</span>
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> Cover both Katas Raj and Kallar Kahar comfortably</div>
                    <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> Visit Katas Raj early morning — far better experience</div>
                    <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> Time for nihari breakfast, bazaar evening, local life</div>
                    <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> Add Pharwala Fort or Tilla Jogian without rushing</div>
                    <div className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" /> Return Islamabad refreshed, not exhausted</div>
                    <div className="flex items-start gap-2 mt-3"><span className="text-amber-400 flex-shrink-0">+</span> Extra cost: PKR 2,000–4,000 for room</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 px-4 py-3 rounded-xl bg-gold-500/5 border border-gold-500/20">
                <p className="text-sm text-muted-foreground"><span className="text-gold-400 font-bold">Our recommendation:</span> If you have never been to Chakwal before, spend at least one night. The room at Chakwal Guest House costs from PKR 2,000 — a fraction of what you would pay anywhere in Islamabad for a comparable room. It is genuinely worth it.</p>
              </div>
            </section>

            {/* Itineraries */}
            <section id="itineraries" className="scroll-mt-28">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Sample Itineraries</h2>
              <div className="space-y-6">
                {ITINERARIES.map(itin => (
                  <div key={itin.type} className="card-luxury rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-foreground">{itin.type}</h3>
                      <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-1 rounded-full">{itin.target}</span>
                    </div>
                    <div className="space-y-2 my-4">
                      {itin.schedule.map(s => (
                        <div key={s.time} className="flex items-start gap-3">
                          <span className="text-xs font-mono text-gold-400 flex-shrink-0 bg-gold-500/10 px-2 py-1 rounded min-w-[120px]">{s.time}</span>
                          <span className="text-sm text-muted-foreground">{s.task}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-400 italic mt-3 pt-3 border-t border-border">{itin.verdict}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* What to see */}
            <section id="what-to-see" className="scroll-mt-28">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">What to See in Chakwal</h2>
              <div className="relative h-52 rounded-2xl overflow-hidden mb-5">
                <Image
                  src="/images/blogs/katas-raj-temples-chakwal-pakistan.webp"
                  alt="Katas Raj Temples Chakwal Pakistan ancient Hindu temple sacred pond"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-3">
                {[
                  { name: "Katas Raj Temples", dist: "40 km from Chakwal city", desc: "5,000-year-old Hindu temple complex around a sacred pool. The single most important attraction in the entire district — do not skip it.", link: "/blog/katas-raj-temples-visitor-guide", priority: "Must-see" },
                  { name: "Kallar Kahar Lake", dist: "45 km from Chakwal city", desc: "Natural saline lake surrounded by Salt Range hills — boating, wildlife park, peacocks, and one of Punjab's finest sunset viewpoints.", priority: "Must-see" },
                  { name: "Tilla Jogian", dist: "40 km from Chakwal city", desc: "Highest Salt Range peak with ancient monastery ruins and 360-degree views. A moderate 1.5-hour hike from the base.", priority: "Recommended" },
                  { name: "Pharwala Fort", dist: "25 km from Chakwal city", desc: "11th-century Gakhar fort on a rocky spur — ruins of walls and bastions with sweeping views. Short hike from the car park.", priority: "Recommended" },
                  { name: "Choa Saidan Shah", dist: "30 km from Chakwal city", desc: "Natural spring hill town — a perfect lunch stop between Katas Raj and Chakwal city. Cool, green, and relaxing.", priority: "Recommended" },
                  { name: "Khewra Salt Mine", dist: "50 km from Chakwal city", desc: "World's second-largest salt mine with underground train tours, pink salt walls, and salt sculptures. Technically in Jhelum district but en route from Chakwal.", priority: "Optional" },
                ].map(a => (
                  <div key={a.name} className="card-luxury rounded-xl p-4 flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-bold text-foreground text-sm">{a.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          a.priority === "Must-see" ? "bg-gold-500/20 text-gold-400" :
                          a.priority === "Recommended" ? "bg-blue-500/20 text-blue-400" :
                          "bg-surface-base text-muted-foreground"
                        }`}>{a.priority}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{a.dist}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.desc}</p>
                      {a.link && <Link href={a.link} className="text-xs text-gold-400 hover:underline mt-1 inline-block">Full visitor guide →</Link>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                For a comprehensive guide to all activities, see:{" "}
                <Link href="/blog/things-to-do-chakwal" className="text-gold-400 hover:underline">10 best things to do in Chakwal</Link>
              </p>
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
              <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Stay in Chakwal — From PKR 2,000/Night</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
                Chakwal Guest House is 85 km from Rawalpindi — the most trusted accommodation in Chakwal. Clean rooms, free WiFi, 24/7 service. Book online free, pay cash on arrival.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/book" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all text-sm">
                  Book a Room <ArrowRight className="w-4 h-4" />
                </Link>
                <a href={`tel:${siteConfig.phoneE164}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors text-sm">
                  <Phone className="w-4 h-4" /> {siteConfig.phone}
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Also read:{" "}
                <Link href="/blog/things-to-do-chakwal" className="text-gold-400 hover:underline">Things to do in Chakwal</Link>
                {" · "}
                <Link href="/blog/katas-raj-temples-visitor-guide" className="text-gold-400 hover:underline">Katas Raj visitor guide</Link>
                {" · "}
                <Link href="/blog/chakwal-guest-house-guide" className="text-gold-400 hover:underline">Why stay at Chakwal Guest House</Link>
              </p>
            </section>

          </article>
        </div>
      </div>
    </>
  );
}
