import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, Car, Sun, CloudRain, ChevronRight, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Complete Chakwal Travel Guide 2025 — How to Get There, Stay & Explore | Chakwal Grand",
  description: "Planning a trip to Chakwal, Punjab? Complete travel guide covering best time to visit, how to reach Chakwal from Rawalpindi/Lahore, accommodation, places to visit, local food, and insider travel tips for 2025.",
  keywords: [
    "Chakwal travel guide", "visiting Chakwal Punjab", "how to reach Chakwal",
    "Chakwal tourism 2025", "Chakwal trip plan", "Chakwal weather",
    "best time to visit Chakwal", "Chakwal from Rawalpindi", "Chakwal from Lahore",
    "Chakwal transport", "Chakwal local food", "Chakwal district guide",
  ],
  alternates: { canonical: "https://www.staychakwal.de/blog/chakwal-travel-guide" },
  openGraph: {
    title: "Complete Chakwal Travel Guide 2025 — How to Get There, Stay & Explore",
    description: "Everything you need to know for a perfect trip to Chakwal — transport, accommodation, attractions, food, and insider tips.",
    url: "https://www.staychakwal.de/blog/chakwal-travel-guide",
    images: [{ url: "https://images.unsplash.com/photo-1722082933604-2f3e07c58c10?w=1200&q=80", width: 1200, height: 630, alt: "Chakwal Punjab Pakistan landscape travel guide" }],
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Complete Chakwal Travel Guide 2025 — How to Get There, Stay & Explore",
  "description": "The complete travel guide to Chakwal, Punjab, Pakistan — transport, accommodation, attractions, food, and travel tips.",
  "image": "https://images.unsplash.com/photo-1722082933604-2f3e07c58c10?w=1200&q=80",
  "url": "https://www.staychakwal.de/blog/chakwal-travel-guide",
  "datePublished": "2025-02-01",
  "dateModified": "2025-06-01",
  "author": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": "https://www.staychakwal.de" },
  "publisher": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": "https://www.staychakwal.de" },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "Is Chakwal worth visiting as a tourist?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely — Chakwal is one of Punjab's most underrated destinations. It offers the ancient Katas Raj Temples, beautiful Kallar Kahar Lake, the scenic Salt Range, historic forts, and a cooler climate than Rawalpindi. It's perfect for a 2–3 day trip." } },
    { "@type": "Question", "name": "How far is Chakwal from Islamabad?", "acceptedAnswer": { "@type": "Answer", "text": "Chakwal city is approximately 80–90 km from Islamabad/Rawalpindi. The drive takes about 1.5 hours via the M-2 motorway and Chakwal road, or about 2 hours via the older GT Road route." } },
    { "@type": "Question", "name": "What is the climate like in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Chakwal has a semi-arid climate. Winters (November–February) are cold, sometimes reaching 0–5°C at night. Summers (May–August) are hot, reaching 40°C. The best time to visit is October–March for pleasant weather." } },
    { "@type": "Question", "name": "What language do people speak in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "The main languages in Chakwal are Punjabi and Urdu. Most locals in Chakwal city can communicate in Urdu. English is understood in hotels, guest houses, and formal establishments." } },
    { "@type": "Question", "name": "What is Chakwal famous for?", "acceptedAnswer": { "@type": "Answer", "text": "Chakwal is famous for Katas Raj Temples (ancient Hindu pilgrimage site), Kallar Kahar Lake, the Salt Range hills, Pharwala Fort, and Tilla Jogian. It is also known for its military community — many retired army officers and their families live in Chakwal." } },
  ],
};

const SEASONS = [
  { icon: "❄️", season: "October – March", rating: "★★★★★ Best Season", color: "border-blue-500/30 bg-blue-500/5", temp: "5–22°C", desc: "Cool and perfect for all outdoor activities. Ideal for visiting Katas Raj, hiking in the Salt Range, and exploring Kallar Kahar. This is peak tourist season — book accommodation in advance for weekends." },
  { icon: "🌸", season: "April – June", rating: "★★★☆☆ Good", color: "border-amber-500/30 bg-amber-500/5", temp: "20–38°C", desc: "Spring with occasional rain and wildflowers across the Salt Range. Getting warm by June — AC rooms become essential. Early morning visits to outdoor sites recommended. Still very scenic." },
  { icon: "🌧️", season: "July – September", rating: "★★☆☆☆ Hot & Wet", color: "border-red-500/30 bg-red-500/5", temp: "30–42°C", desc: "Monsoon season — hot, humid, and wet. Some roads to Katas Raj and Tilla Jogian may have flooding. Indoor attractions like Khewra Salt Mine remain accessible. Kallar Kahar fills up beautifully after heavy rains." },
];

const TRANSPORT = [
  { from: "Rawalpindi / Islamabad", how: "Daewoo Bus, Faisal Movers, or Skyways from Rawalpindi Mor. By car: take M-2 motorway then Chakwal road.", time: "1.5 – 2 hours", cost: "Bus: PKR 200–300 | Car: PKR 500–700 fuel", tip: "M-2 motorway is faster. Toll applies." },
  { from: "Lahore", how: "Daewoo Express or Faisal Movers from Lahore (Thokar Niaz Baig). By car: GT Road via Gujranwala then Jhelum–Chakwal road.", time: "3 – 3.5 hours", cost: "Bus: PKR 700–900 | Car: PKR 1,500–2,000 fuel", tip: "M-2 motorway route via Pindi is faster than GT Road." },
  { from: "Jhelum", how: "Local Daewoo service or private car via Pind Dadan Khan road directly to Chakwal.", time: "45 min – 1 hour", cost: "Bus: PKR 150–200 | Car: PKR 300–400 fuel", tip: "Scenic mountain route through the Salt Range." },
  { from: "Faisalabad", how: "Car via Sargodha road then Shahpur–Chakwal road. Limited bus service available.", time: "3 – 3.5 hours", cost: "Bus: PKR 600–800 | Car: PKR 1,200–1,500 fuel", tip: "Book car rental from Faisalabad for more flexibility." },
];

const FOOD = [
  { dish: "Daal Chawal", where: "Any local dhaba restaurant", price: "PKR 150–250", note: "Chakwal&apos;s daal is famously rich and flavourful" },
  { dish: "Chapli Kebab", where: "Main Bazar area dhabas", price: "PKR 100–150 per piece", note: "Freshly made with local spices — don&apos;t miss it" },
  { dish: "Nihari", where: "Early morning restaurants near the bazaar", price: "PKR 250–400", note: "Best eaten for breakfast — served with naan" },
  { dish: "Paye (Trotters)", where: "Specialized paye restaurants", price: "PKR 300–500", note: "A Chakwal specialty — slow-cooked overnight" },
  { dish: "Fresh Fruit", where: "Fruit sellers throughout the city", price: "PKR 100–300/kg", note: "Chakwal district is known for excellent mangoes in season" },
];

const TOC = [
  { id: "intro", label: "Why Visit Chakwal?" },
  { id: "weather", label: "Best Time to Visit" },
  { id: "transport", label: "How to Reach Chakwal" },
  { id: "stay", label: "Where to Stay" },
  { id: "attractions", label: "Top Attractions" },
  { id: "food", label: "Local Food & Dining" },
  { id: "itinerary", label: "Sample Itinerary (2 Days)" },
  { id: "tips", label: "Essential Travel Tips" },
  { id: "faq", label: "FAQ" },
];

export default function ChakwalTravelGuidePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

      {/* Hero */}
      <div className="relative h-[50vh] min-h-[350px] w-full overflow-hidden">
        <Image src="https://images.unsplash.com/photo-1722082933604-2f3e07c58c10?w=1400&q=85&auto=format&fit=crop" alt="Chakwal Punjab Pakistan landscape mountains hills travel destination" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link href="/blog" className="hover:text-gold-400 transition-colors">Blog</Link>
            <ChevronRight className="w-3 h-3" /><span>Chakwal Travel Guide</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/20 px-3 py-1 rounded-full">Travel Guide</span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-foreground mt-3 mb-3 leading-tight">
            Complete Chakwal Travel Guide 2025<br className="hidden sm:block" /> — How to Get There, Stay & Explore
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            Everything you need for a perfect trip to Chakwal, Punjab — transport, accommodation, attractions, food, and local tips.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* TOC */}
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
                <Link href="/book" className="block text-center py-2 bg-gold-gradient text-background text-xs font-bold rounded-lg hover:shadow-gold-lg transition-all">Book Accommodation</Link>
                <a href="tel:+923347742767" className="block text-center py-2 border border-gold-500/30 text-gold-400 text-xs rounded-lg hover:bg-gold-500/10 transition-colors">Call 0334-7742767</a>
              </div>
            </div>
          </aside>

          <article className="flex-1 min-w-0 space-y-12">

            <section id="intro">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Why Visit Chakwal, Punjab?</h2>
              <div className="relative h-52 rounded-2xl overflow-hidden mb-5">
                <Image src="https://images.unsplash.com/photo-1631654337728-0096fd65864e?w=900&q=80&auto=format&fit=crop" alt="Katas Raj ancient temples Chakwal Punjab Pakistan heritage site" fill className="object-cover" />
              </div>
              <div className="space-y-3 text-muted-foreground leading-relaxed">
                <p>Chakwal is one of Punjab&apos;s most underrated tourist destinations — a district packed with historical wonders, natural beauty, and cultural richness that few tourists ever discover. Located in the heart of the Potohar Plateau, Chakwal offers something for every kind of traveler.</p>
                <p>History lovers will be blown away by <Link href="/blog/katas-raj-temples-visitor-guide" className="text-gold-400 hover:underline">Katas Raj Temples</Link> — a 5,000-year-old Hindu pilgrimage complex that rivals anything in Rajasthan. Nature lovers will find paradise at Kallar Kahar Lake and the ancient Salt Range hills. And the entire district moves at a pace that feels worlds away from the chaos of Lahore or Islamabad.</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  {[
                    { val: "5,000+", label: "Years of history" },
                    { val: "80 km", label: "From Islamabad" },
                    { val: "Free", label: "Entry to Katas Raj" },
                    { val: "12°C", label: "Average winter temp" },
                  ].map(s => (
                    <div key={s.label} className="card-luxury rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-gold-400">{s.val}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="weather">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Best Time to Visit Chakwal</h2>
              <div className="space-y-4">
                {SEASONS.map(s => (
                  <div key={s.season} className={`rounded-2xl p-5 border ${s.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{s.icon}</span>
                        <div>
                          <h3 className="font-bold text-foreground text-sm">{s.season}</h3>
                          <span className="text-xs text-gold-400">{s.rating}</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground bg-surface-base px-2 py-1 rounded-lg">{s.temp}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="transport">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">How to Reach Chakwal</h2>
              <div className="space-y-4">
                {TRANSPORT.map(t => (
                  <div key={t.from} className="card-luxury rounded-2xl p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <Car className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                      <h3 className="font-bold text-foreground text-sm">From {t.from}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{t.how}</p>
                    <div className="flex flex-col sm:flex-row gap-2 text-xs">
                      <span className="text-gold-400 flex items-center gap-1 bg-gold-500/10 px-2 py-1 rounded-lg"><Clock className="w-3 h-3" /> {t.time}</span>
                      <span className="text-muted-foreground bg-surface-base px-2 py-1 rounded-lg">{t.cost}</span>
                    </div>
                    <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">✓ {t.tip}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 card-luxury rounded-2xl p-5">
                <h3 className="font-bold text-foreground mb-3 text-sm">Within Chakwal — Getting Around</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-gold-400">→</span>Rickshaws (tuk-tuks) are the most common local transport for short distances — fare PKR 50–150.</li>
                  <li className="flex items-start gap-2"><span className="text-gold-400">→</span>For day trips to Katas Raj/Kallar Kahar, hire a local taxi from Chakwal city — negotiate PKR 1,500–2,500 for a full-day trip.</li>
                  <li className="flex items-start gap-2"><span className="text-gold-400">→</span>Ride-hailing apps (InDrive) operate in Chakwal city — cheaper than negotiating with local taxis.</li>
                  <li className="flex items-start gap-2"><span className="text-gold-400">→</span>Renting your own car from Rawalpindi is recommended for maximum flexibility — gives you freedom to explore the Salt Range at your own pace.</li>
                </ul>
              </div>
            </section>

            <section id="stay">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Where to Stay in Chakwal</h2>
              <div className="relative h-48 rounded-2xl overflow-hidden mb-5">
                <Image src="https://images.unsplash.com/photo-1759828536741-ba79f6ef37c1?w=900&q=80&auto=format&fit=crop" alt="Clean comfortable guest house room Chakwal Grand Punjab Pakistan" fill className="object-cover" />
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For accommodation in Chakwal, <strong className="text-foreground">Chakwal Grand Guest House</strong> is the most popular and trusted option — rated 5.0 stars on Google with 20+ verified reviews. It has 3 branches across the district: Chakwal city, Kallar Kahar, and Sargodha.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {[
                  { room: "Classic Room", price: "PKR 2,000", cap: "2 Adults" },
                  { room: "Family Room", price: "PKR 2,500", cap: "4 Adults + Kids" },
                  { room: "Executive AC", price: "PKR 4,000", cap: "2 Adults + AC" },
                ].map(r => (
                  <div key={r.room} className="card-luxury rounded-xl p-4 text-center">
                    <p className="font-bold text-foreground text-sm">{r.room}</p>
                    <p className="text-gold-400 font-bold text-xl mt-1">{r.price}</p>
                    <p className="text-xs text-muted-foreground">{r.cap} / night</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/book" className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all text-sm">
                  Book Now — No Payment Required <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/blog/where-to-stay-chakwal" className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors text-sm">
                  Full Accommodation Guide
                </Link>
              </div>
            </section>

            <section id="attractions">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Top Attractions in Chakwal</h2>
              <div className="space-y-3">
                {[
                  { name: "Katas Raj Temples", dist: "40 km", desc: "5,000-year-old sacred Hindu temple complex — the #1 attraction in Chakwal.", link: "/blog/katas-raj-temples-visitor-guide" },
                  { name: "Kallar Kahar Lake", dist: "45 km", desc: "Natural saline lake with boating, wildlife park, and peacocks." },
                  { name: "Choa Saidan Shah", dist: "30 km", desc: "Cool hill town with natural springs — perfect for a lunch stop." },
                  { name: "Pharwala Fort", dist: "25 km", desc: "11th century Gakhar fort with panoramic views — a short hike." },
                  { name: "Tilla Jogian", dist: "40 km", desc: "Highest Salt Range peak with ancient monastery and 360° views." },
                  { name: "Khewra Salt Mine", dist: "50 km", desc: "World&apos;s 2nd largest salt mine — underground tours with pink Himalayan salt walls." },
                ].map(a => (
                  <div key={a.name} className="card-luxury rounded-xl p-4 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-foreground text-sm">{a.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                        {a.link && <Link href={a.link} className="text-xs text-gold-400 hover:underline mt-1 inline-block">Read full guide →</Link>}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-gold-400 flex-shrink-0">{a.dist}</span>
                  </div>
                ))}
              </div>
            </section>

            <section id="food">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Local Food & Dining in Chakwal</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Chakwal has a strong food culture rooted in traditional Punjabi cuisine. The local dhaba restaurants serve some of the most flavourful cooking you&apos;ll find anywhere in Punjab — here are the must-try dishes:
              </p>
              <div className="space-y-3">
                {FOOD.map(f => (
                  <div key={f.dish} className="card-luxury rounded-xl p-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-foreground text-sm">{f.dish}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{f.where}</p>
                      <p className="text-xs text-amber-400 mt-1 italic">{f.note}</p>
                    </div>
                    <span className="text-xs text-gold-400 font-semibold flex-shrink-0">{f.price}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 italic">Note: Most local restaurants in Chakwal are cash-only. Keep PKR cash handy.</p>
            </section>

            <section id="itinerary">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Sample Chakwal Itinerary — 2 Days</h2>
              <div className="space-y-4">
                {[
                  {
                    day: "Day 1 — Chakwal City + Katas Raj",
                    schedule: [
                      { time: "7:00 AM", activity: "Check-in at Chakwal Grand Guest House, freshen up" },
                      { time: "8:00 AM", activity: "Quick breakfast at city dhaba (nihari + naan)" },
                      { time: "9:00 AM", activity: "Drive to Katas Raj Temples (40 km, 45 min)" },
                      { time: "10:00 AM – 1:00 PM", activity: "Explore Katas Raj — temples, sacred pond, architecture photography" },
                      { time: "1:30 PM", activity: "Lunch at Choa Saidan Shah (3 km from Katas Raj)" },
                      { time: "3:00 PM", activity: "Drive back towards Chakwal — stop at Pharwala Fort viewpoint" },
                      { time: "6:00 PM", activity: "Evening at Chakwal city market, dinner at local restaurant" },
                      { time: "9:00 PM", activity: "Return to guest house" },
                    ],
                  },
                  {
                    day: "Day 2 — Kallar Kahar + Salt Range",
                    schedule: [
                      { time: "8:00 AM", activity: "Breakfast and checkout (or keep room for another night)" },
                      { time: "9:00 AM", activity: "Drive to Kallar Kahar Lake (45 km, 50 min)" },
                      { time: "10:00 AM – 12:00 PM", activity: "Boating on Kallar Kahar Lake, wildlife park visit (peacocks!)" },
                      { time: "12:30 PM", activity: "Visit Babur&apos;s Throne (Takht-e-Babri) nearby" },
                      { time: "2:00 PM", activity: "Lunch in Kallar Kahar town" },
                      { time: "3:30 PM", activity: "Drive toward Salt Range — viewpoints and landscape photography" },
                      { time: "5:00 PM", activity: "Sunset at Kallar Kahar lake viewpoint" },
                      { time: "7:00 PM", activity: "Return drive to Islamabad/Lahore (or stay another night)" },
                    ],
                  },
                ].map(day => (
                  <div key={day.day} className="card-luxury rounded-2xl p-5">
                    <h3 className="font-bold text-foreground mb-4">{day.day}</h3>
                    <div className="space-y-2">
                      {day.schedule.map(s => (
                        <div key={s.time} className="flex items-start gap-3">
                          <span className="text-xs font-mono text-gold-400 flex-shrink-0 bg-gold-500/10 px-2 py-1 rounded min-w-[80px]">{s.time}</span>
                          <span className="text-sm text-muted-foreground">{s.activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="tips">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Essential Chakwal Travel Tips</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: "💳", title: "Carry Cash", tip: "Most places in Chakwal are cash-only. ATMs are available at HBL and MCB in the city center." },
                  { icon: "🪪", title: "Bring CNIC", tip: "Your original CNIC is required at all guest houses and some tourist sites. Never leave home without it." },
                  { icon: "⛽", title: "Fuel in City", tip: "Fill your petrol in Chakwal city before heading to Katas Raj or Salt Range — limited fuel stations on these routes." },
                  { icon: "💧", title: "Carry Water", tip: "No shops or stalls inside Katas Raj or at Pharwala Fort. Carry at least 1 litre of water per person." },
                  { icon: "📡", title: "Mobile Signal", tip: "Zong and Telenor have the best coverage in Chakwal district. Signal can be weak in the Salt Range hills." },
                  { icon: "📅", title: "Book in Advance", tip: "Book accommodation 2–3 days before your visit, especially for Eid or school holidays — rooms fill up fast." },
                  { icon: "👗", title: "Dress Conservatively", tip: "Chakwal is a traditional city. Women should cover their heads and shoulders when visiting religious sites." },
                  { icon: "🌅", title: "Start Early", tip: "Begin sightseeing by 7–8 AM to beat the heat and crowds, especially at Katas Raj and Tilla Jogian." },
                ].map(t => (
                  <div key={t.title} className="card-luxury rounded-xl p-4 flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">{t.icon}</span>
                    <div>
                      <p className="font-bold text-foreground text-sm">{t.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
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
              <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Ready to Plan Your Chakwal Trip?</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
                Book your stay at Chakwal Grand Guest House — clean rooms, 24/7 service, free WiFi, and the warmest hospitality in Chakwal. No advance payment required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/book" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
                  Book Accommodation <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="tel:+923347742767" className="inline-flex items-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors">
                  <Phone className="w-4 h-4" /> Call for Help Planning
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Also read: <Link href="/blog/places-to-visit-chakwal" className="text-gold-400 hover:underline">Top places to visit in Chakwal</Link> · <Link href="/blog/katas-raj-temples-visitor-guide" className="text-gold-400 hover:underline">Katas Raj complete guide</Link>
              </p>
            </section>

          </article>
        </div>
      </div>
    </>
  );
}
