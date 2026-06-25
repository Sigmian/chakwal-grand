import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Clock, MapPin, Info, Users, Camera, Star, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Katas Raj Temples Complete Visitor Guide 2025 â€” History, Timings, How to Reach",
  description: "Complete visitor guide to Katas Raj Temples in Chakwal, Punjab. 5,000-year-old sacred Hindu site â€” history, architecture, visiting timings, how to reach from Rawalpindi & Lahore, best time to visit, and nearby stay options. Updated 2025.",
  keywords: [
    "Katas Raj Temples", "Katas Raj visitor guide", "Katas Raj history",
    "how to reach Katas Raj", "Katas Raj Chakwal", "Hindu temples Pakistan",
    "Katas Raj timings", "Katas Raj temple complex", "places to visit Chakwal",
    "Qila Katas", "Katas Raj pond sacred", "Katas Raj Mahabharata",
    "tourist attractions Chakwal Punjab", "Katas Raj 2025",
  ],
  alternates: { canonical: `${siteConfig.url}/blog/katas-raj-temples-visitor-guide` },
  openGraph: {
    title: "Katas Raj Temples â€” Complete Visitor Guide 2025 | Chakwal Punjab",
    description: "Everything you need to know before visiting Katas Raj Temples â€” one of Pakistan's most sacred and historic sites. History, timings, directions, and travel tips.",
    url: `${siteConfig.url}/blog/katas-raj-temples-visitor-guide`,
    images: [{ url: `${siteConfig.url}/images/blogs/katas-raj-temples-chakwal-pakistan.webp`, width: 1200, height: 630, alt: "Katas Raj Temples Chakwal Pakistan" }],
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Katas Raj Temples Complete Visitor Guide 2025 â€” History, Timings, How to Reach",
  "description": "Complete visitor guide to Katas Raj Temples, Chakwal â€” history, architecture, how to visit, timings, and travel tips.",
  "image": `${siteConfig.url}/images/blogs/katas-raj-temples-chakwal-pakistan.webp`,
  "url": `${siteConfig.url}/blog/katas-raj-temples-visitor-guide`,
  "datePublished": "2025-01-10",
  "dateModified": "2025-06-01",
  "author": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": siteConfig.url },
  "publisher": { "@type": "Organization", "name": "Chakwal Grand Guest House", "url": siteConfig.url, "logo": { "@type": "ImageObject", "url": `${siteConfig.url}/images/logo.png` } },
  "mainEntityOfPage": { "@type": "WebPage", "@id": `${siteConfig.url}/blog/katas-raj-temples-visitor-guide` },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What is the entry fee for Katas Raj Temples?", "acceptedAnswer": { "@type": "Answer", "text": "Entry to Katas Raj Temples is completely free. There is no admission charge for Pakistani citizens or foreign visitors." } },
    { "@type": "Question", "name": "How far is Katas Raj from Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Katas Raj Temples are approximately 40 km from Chakwal city. The drive takes about 40â€“50 minutes by car via the Pind Dadan Khan Road." } },
    { "@type": "Question", "name": "How far is Katas Raj from Rawalpindi/Islamabad?", "acceptedAnswer": { "@type": "Answer", "text": "Katas Raj is approximately 120â€“130 km from Rawalpindi and Islamabad. The journey takes about 2 hours via the M-2 motorway and Kallar Kahar interchange." } },
    { "@type": "Question", "name": "What is the best time to visit Katas Raj Temples?", "acceptedAnswer": { "@type": "Answer", "text": "The best time to visit is October to March when the weather is cool and pleasant. Visit early morning (7â€“9 AM) for the best photography light and fewer crowds." } },
    { "@type": "Question", "name": "How old are the Katas Raj Temples?", "acceptedAnswer": { "@type": "Answer", "text": "The Katas Raj Temple complex dates back to the 7thâ€“10th centuries CE during the Hindu Shahi period, though some structures have origins going back 2,500â€“5,000 years. The site is mentioned in the ancient Hindu epic Mahabharata." } },
    { "@type": "Question", "name": "Where to stay near Katas Raj Temples?", "acceptedAnswer": { "@type": "Answer", "text": "Chakwal Grand Guest House in Chakwal city is the most convenient accommodation for visiting Katas Raj, located just 40 km away. Rooms start from PKR 2,000/night." } },
    { "@type": "Question", "name": "Is Katas Raj open all week?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, Katas Raj Temples are open every day of the week from sunrise to sunset. There are no fixed closing days." } },
  ],
};

const TOURIST_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "TouristAttraction",
  "name": "Katas Raj Temples",
  "description": "Ancient Hindu temple complex in Chakwal district, Punjab, Pakistan. One of the most sacred Hindu sites in Pakistan, dating back over 1,500 years.",
  "url": `${siteConfig.url}/blog/katas-raj-temples-visitor-guide`,
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Katas, Choa Saidanshah",
    "addressRegion": "Chakwal, Punjab",
    "addressCountry": "PK",
  },
  "geo": { "@type": "GeoCoordinates", "latitude": "32.7144", "longitude": "72.7003" },
  "touristType": ["History lovers", "Religious tourists", "Photographers", "Families"],
  "isAccessibleForFree": true,
  "openingHoursSpecification": { "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "06:00", "closes": "18:00" },
};

const TOC = [
  { id: "overview",      label: "Overview & Quick Facts" },
  { id: "history",       label: "History of Katas Raj Temples" },
  { id: "architecture",  label: "Architecture & Structures" },
  { id: "pond",          label: "The Sacred Katas Kund (Pond)" },
  { id: "what-to-see",   label: "What to See Inside" },
  { id: "how-to-reach",  label: "How to Reach Katas Raj" },
  { id: "best-time",     label: "Best Time to Visit" },
  { id: "tips",          label: "Visitor Tips & Rules" },
  { id: "nearby",        label: "Nearby Attractions" },
  { id: "stay",          label: "Where to Stay" },
  { id: "faq",           label: "Frequently Asked Questions" },
];

export default function KatasRajPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(TOURIST_SCHEMA) }} />

      {/* Hero */}
      <div className="relative h-[55vh] min-h-[380px] w-full overflow-hidden">
        <Image src="/images/blogs/katas-raj-temples-chakwal-pakistan.webp" alt="Katas Raj Temples ancient Hindu temple complex Chakwal Punjab Pakistan" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link href="/blog" className="hover:text-gold-400 transition-colors">Blog</Link>
            <ChevronRight className="w-3 h-3" /><span>Katas Raj Temples Guide</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/20 px-3 py-1 rounded-full">Historic Attraction</span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-foreground mt-3 mb-3 leading-tight">
            Katas Raj Temples â€” Complete<br className="hidden sm:block" /> Visitor Guide 2025
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            5,000-year-old sacred Hindu temple complex in Chakwal, Punjab â€” one of Pakistan&apos;s most important heritage sites and a must-visit for history lovers and tourists.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Sidebar TOC */}
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
              <div className="mt-5 pt-4 border-t border-border">
                <Link href="/book" className="block text-center py-2 bg-gold-gradient text-background text-xs font-bold rounded-lg hover:shadow-gold-lg transition-all">
                  Book Stay Near Katas Raj
                </Link>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <article className="flex-1 min-w-0 space-y-12">

            {/* Quick Facts */}
            <section id="overview">
              <div className="card-luxury rounded-2xl p-6 border border-gold-500/20">
                <h2 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
                  <Info className="w-5 h-5 text-gold-400" /> Quick Facts â€” Katas Raj Temples
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    ["ðŸ“ Location", "Katas, Choa Saidanshah, Chakwal"],
                    ["ðŸ•Œ Type", "Hindu Temple Complex"],
                    ["ðŸ“… Age", "~1,500 â€“ 5,000+ years"],
                    ["ðŸ’° Entry Fee", "FREE"],
                    ["ðŸ• Open", "Sunrise to Sunset (Daily)"],
                    ["ðŸ“ Distance", "40 km from Chakwal city"],
                    ["ðŸš— From Rawalpindi", "~120 km (2 hours)"],
                    ["ðŸš— From Lahore", "~250 km (3.5 hours)"],
                    ["â­ TripAdvisor Rating", "4.5 / 5 (Top Attraction)"],
                    ["ðŸ“· Photography", "Allowed (free)"],
                    ["ðŸ§­ GPS", "32.7144Â°N, 72.7003Â°E"],
                    ["ðŸ›ï¸ Era", "Hindu Shahi Dynasty (615â€“950 CE)"],
                  ].map(([label, val]) => (
                    <div key={String(label)} className="bg-surface-base rounded-xl p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{String(val)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* History */}
            <section id="history">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">History of Katas Raj Temples</h2>
              <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden mb-6">
                <Image src="/images/blogs/hindu-temple-architecture-pakistan.webp" alt="Ancient Hindu temple architecture Katas Raj temples Chakwal Pakistan" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent flex items-end p-4">
                  <p className="text-xs text-muted-foreground italic">Katas Raj Temples date back to the Hindu Shahi dynasty, 7thâ€“10th century CE</p>
                </div>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>Katas Raj Temples â€” also known as <strong className="text-foreground">Qila Katas</strong> or <strong className="text-foreground">Satghara</strong> â€” represent one of the most significant and spiritually important Hindu temple complexes in all of South Asia. Located near Choa Saidanshah in Chakwal district, Punjab, the complex sits at an altitude of approximately 2,000 feet (610 meters) on the Potohar Plateau.</p>
                <p>The site&apos;s history stretches back over 5,000 years, with its earliest connections to the ancient Hindu epic <strong className="text-foreground">Mahabharata</strong>. According to Hindu tradition, the Pandava brothers â€” the five heroes of the Mahabharata â€” spent part of their 12-year exile in this very location. The sacred pond (kund) at the center of the complex is mentioned in ancient Sanskrit texts.</p>
                <p>The temple structures themselves primarily date to the <strong className="text-foreground">Hindu Shahi dynasty period (615â€“950 CE)</strong>, with some structures from earlier Buddhist periods also present. The complex was extensively documented by the British archaeologist <strong className="text-foreground">Alexander Cunningham in 1872â€“73</strong>, who identified it as one of the most important archaeological sites in the Punjab region.</p>
                <p>The site was significantly restored between <strong className="text-foreground">2005 and 2018</strong>, with the Pakistan government investing in preservation of the ancient structures under the Evacuee Trust Property Board (ETPB). Today, Katas Raj is an active Hindu pilgrimage site and draws both religious visitors and history enthusiasts from across Pakistan and abroad.</p>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mt-4">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">âš¡ Did You Know?</p>
                  <p className="text-sm">In 2016, the Supreme Court of Pakistan took <em>suo motu</em> action when the sacred Katas Kund pond was found nearly dry due to groundwater extraction by nearby cement factories. The Court ordered the factories to stop extraction and restore water levels â€” a landmark ruling for cultural heritage protection in Pakistan.</p>
                </div>
              </div>
            </section>

            {/* Architecture */}
            <section id="architecture">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Architecture & Structures</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="relative h-48 rounded-2xl overflow-hidden">
                  <Image src="/images/blogs/temple-stone-carvings-ancient.webp" alt="Hindu temple stone architecture carvings Katas Raj Pakistan" fill className="object-cover" />
                </div>
                <div className="relative h-48 rounded-2xl overflow-hidden">
                  <Image src="/images/blogs/ancient-stone-temple-pakistan.webp" alt="Ancient stone temple complex Katas Raj Chakwal Pakistan architecture" fill className="object-cover" />
                </div>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>The Katas Raj complex spans approximately <strong className="text-foreground">4 hectares</strong> and features a remarkable collection of temples from different historical periods, arranged around the central sacred pond. The architectural style reflects a blend of <strong className="text-foreground">Hindu Shahi, Buddhist, and early Islamic influences</strong>, making it a unique testament to the region&apos;s multi-religious history.</p>
                <p>The temple structures are built predominantly from <strong className="text-foreground">soft yellow sandstone</strong> quarried from the nearby Salt Range. Architectural features include distinctive <strong className="text-foreground">dentils, trefoil arches, fluted pillars, and pointed shikhara-style roofs</strong> â€” characteristic of the North Indian temple architecture tradition of the 7thâ€“10th centuries.</p>
                <div className="space-y-3 mt-4">
                  {[
                    { name: "Satghara Complex (Seven Temples)", desc: "The most iconic cluster of temples at Katas Raj â€” a group of seven ancient temples arranged around the sacred pond. These date primarily to the 7thâ€“9th century CE and represent the spiritual heart of the complex." },
                    { name: "Ram Mandir (Ramachandra Temple)", desc: "One of the largest and best-preserved temples at the site, dedicated to Lord Ram. Believed to be the location where the Pandavas sought refuge during their exile. Features intricate stone carvings." },
                    { name: "Hanuman Mandir", desc: "A smaller temple dedicated to Lord Hanuman, featuring traditional North Indian shikhara architecture. Still actively visited by Hindu worshippers during religious festivals." },
                    { name: "Shiva Temple", desc: "The central Shiva temple overlooking the sacred pond, considered the most holy structure in the complex. Houses a Shivalinga believed to have been installed by Lord Krishna himself according to Hindu tradition." },
                    { name: "Buddhist Stupa Remains", desc: "Evidence of an earlier Buddhist presence at the site, with remains of a stupa dating to the Mauryan period (3rd century BCE). This demonstrates the site's religious significance across multiple faiths." },
                    { name: "Haveli of Hari Singh Nalwa", desc: "A large mansion adjacent to the temple complex, built during the Sikh period by Hari Singh Nalwa â€” the legendary general of Maharaja Ranjit Singh's Sikh Empire." },
                  ].map(s => (
                    <div key={s.name} className="card-luxury rounded-xl p-4 flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-gold-400 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-foreground text-sm">{s.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Sacred Pond */}
            <section id="pond">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">The Sacred Katas Kund (Pond)</h2>
              <div className="relative h-64 rounded-2xl overflow-hidden mb-6">
                <Image src="/images/blogs/sacred-pond-katas-raj-chakwal.webp" alt="Sacred Katas Kund pond Katas Raj temple complex Chakwal Pakistan" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent flex items-end p-4">
                  <p className="text-xs text-muted-foreground italic">The Katas Kund â€” the sacred pond at the center of the temple complex</p>
                </div>
              </div>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>The <strong className="text-foreground">Katas Kund</strong> â€” the sacred square pond at the heart of the temple complex â€” is the spiritual centerpiece of the entire site. According to Hindu mythology, the pond was formed from the <strong className="text-foreground">tears of Lord Shiva</strong> when he mourned the death of his beloved wife Sati. The word &quot;Katas&quot; itself is derived from the Sanskrit <em>&quot;Kataksha&quot;</em> meaning &quot;tearful eyes.&quot;</p>
                <p>The pond is fed by natural underground springs and has historically maintained a constant water level throughout the seasons. The water is considered <strong className="text-foreground">sacred (holy water)</strong> by Hindu worshippers, and pilgrims perform ritual bathing in the pond during major festivals, particularly <strong className="text-foreground">Maha Shivaratri</strong>.</p>
                <p>The pond is mentioned in the ancient text <em>Mahabharata</em>, where it is described as one of the holiest tirthas (pilgrimage spots) in the Punjab region â€” considered on par with the sacred pond at Pushkar in Rajasthan, India.</p>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">ðŸŒŠ Current Status of the Pond</p>
                  <p className="text-sm text-muted-foreground">Following the Supreme Court intervention in 2016, water levels in the Katas Kund have been gradually recovering. However, visitors may notice the water level varies depending on seasonal rainfall and ongoing conservation efforts. The pond&apos;s restoration is an ongoing project being monitored by Pakistan&apos;s environmental authorities.</p>
                </div>
              </div>
            </section>

            {/* How to Reach */}
            <section id="how-to-reach">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">How to Reach Katas Raj Temples</h2>
              <div className="space-y-4">
                {[
                  { from: "Chakwal City", route: "Take the Chakwalâ€“Pind Dadan Khan Road (D.G. Khan Road) towards Choa Saidanshah. Turn off at the Katas Raj signboard. The road is well-marked.", time: "40â€“50 min", distance: "~40 km", tip: "Best route â€” good road condition" },
                  { from: "Rawalpindi / Islamabad", route: "Take M-2 Motorway towards Lahore. Exit at Kallar Kahar interchange. Follow signs for Katas Raj via Choa Saidanshah Road.", time: "~2 hours", distance: "~120â€“130 km", tip: "Motorway toll applies â€” bring PKR 300" },
                  { from: "Lahore", route: "Take M-2 Motorway towards Islamabad. Exit at Kallar Kahar interchange. Follow signs for Katas Raj.", time: "~3.5 hours", distance: "~250 km", tip: "Early start recommended to avoid heat" },
                  { from: "Jhelum", route: "Drive via Pind Dadan Khan road towards Chakwal, then follow directions to Katas Raj via Choa Saidanshah.", time: "~1.5 hours", distance: "~70 km", tip: "Scenic mountain route" },
                ].map(r => (
                  <div key={r.from} className="card-luxury rounded-2xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-foreground">From {r.from}</h3>
                      <div className="flex gap-3 text-xs flex-shrink-0">
                        <span className="text-gold-400 flex items-center gap-1"><Clock className="w-3 h-3" />{r.time}</span>
                        <span className="text-muted-foreground">{r.distance}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{r.route}</p>
                    <p className="text-xs text-emerald-400">âœ“ {r.tip}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 card-luxury rounded-2xl p-5">
                <h3 className="font-bold text-foreground mb-3 text-sm">By Public Transport</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2"><span className="text-gold-400 flex-shrink-0">â†’</span>From Rawalpindi/Islamabad: Take a bus or wagon to Chakwal (PKR 200â€“300). From Chakwal, hire a rickshaw or local taxi to Katas Raj (PKR 500â€“800 one way).</li>
                  <li className="flex items-start gap-2"><span className="text-gold-400 flex-shrink-0">â†’</span>From Lahore: Take a Daewoo or Faisal Movers bus to Chakwal. Then hire local transport to Katas Raj.</li>
                  <li className="flex items-start gap-2"><span className="text-gold-400 flex-shrink-0">â†’</span>There is no direct public bus to Katas Raj â€” local transport (chingchi rickshaw or Suzuki van) is the only option from Chakwal city.</li>
                </ul>
              </div>
            </section>

            {/* Best time */}
            <section id="best-time">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Best Time to Visit Katas Raj</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {[
                  { season: "October â€“ March", emoji: "ðŸŒ¤ï¸", rating: "â˜…â˜…â˜…â˜…â˜… Best", color: "border-emerald-500/30 bg-emerald-500/5", desc: "Cool and pleasant weather (5â€“22Â°C). Perfect for exploring all day. This is peak tourist season â€” weekends can be crowded." },
                  { season: "April â€“ June", emoji: "ðŸŒ¸", rating: "â˜…â˜…â˜…â˜†â˜† Good", color: "border-amber-500/30 bg-amber-500/5", desc: "Spring with occasional rain. Flowers bloom in the Salt Range. Getting warm by June. Early morning visits recommended." },
                  { season: "July â€“ September", emoji: "ðŸŒ§ï¸", rating: "â˜…â˜…â˜†â˜†â˜† Avoid", color: "border-red-500/30 bg-red-500/5", desc: "Hot and humid monsoon season (up to 40Â°C). Roads may flood. Not ideal for outdoor sightseeing." },
                ].map(s => (
                  <div key={s.season} className={`rounded-2xl p-5 border ${s.color}`}>
                    <div className="text-3xl mb-2">{s.emoji}</div>
                    <h3 className="font-bold text-foreground text-sm">{s.season}</h3>
                    <p className="text-xs text-gold-400 mb-2">{s.rating}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>
              <div className="card-luxury rounded-2xl p-5">
                <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2"><Star className="w-4 h-4 text-gold-400" />Special Events & Festivals</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong className="text-foreground">Maha Shivratri (February/March):</strong> The most important festival at Katas Raj. Hindu pilgrims from across Pakistan gather for prayers, ritual bathing in the sacred pond, and religious ceremonies. The atmosphere is extraordinary.</p>
                  <p><strong className="text-foreground">Diwali (October/November):</strong> The festival of lights brings Hindu worshippers to the temple complex for evening prayers and lamp-lighting ceremonies.</p>
                  <p><strong className="text-foreground">Holi (March):</strong> The festival of colours is celebrated with smaller gatherings at the temple complex.</p>
                </div>
              </div>
            </section>

            {/* Tips */}
            <section id="tips">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Visitor Tips & Rules</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: "ðŸ•", title: "Arrive Early", tip: "Visit at 7â€“8 AM for the best photography light, cooler temperatures, and before tour groups arrive. The morning mist rising from the pond is stunning." },
                  { icon: "ðŸ‘—", title: "Dress Respectfully", tip: "This is an active religious site. Dress modestly â€” covered shoulders and legs are recommended, especially when entering temple buildings." },
                  { icon: "ðŸ“·", title: "Photography Tips", tip: "Photography is allowed everywhere. The best shots are from the northern side of the pond looking south, with all temples reflected in the water." },
                  { icon: "ðŸ¥¤", title: "Bring Supplies", tip: "There are no cafes or restaurants inside the complex. Bring water (at least 1 litre per person), snacks, and sunscreen." },
                  { icon: "ðŸš—", title: "Fuel Up in Chakwal", tip: "Fill up your petrol tank in Chakwal city before visiting. There are no petrol stations near the temple complex." },
                  { icon: "ðŸ‘Ÿ", title: "Wear Comfortable Shoes", tip: "The temple complex involves walking on uneven stone surfaces and some climbing. Wear closed-toe comfortable shoes." },
                  { icon: "ðŸ”‡", title: "Be Respectful", tip: "Maintain silence near the sacred pond and temple buildings. Do not enter active prayer areas during ongoing religious ceremonies." },
                  { icon: "ðŸ—‘ï¸", title: "Leave No Trace", tip: "Do not litter inside the complex. Plastic bags and wrappers spoil this ancient site â€” take your rubbish back with you." },
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

            {/* Nearby */}
            <section id="nearby">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Nearby Attractions</h2>
              <div className="space-y-3">
                {[
                  { name: "Kallar Kahar Lake", dist: "12 km", desc: "Beautiful natural saline lake surrounded by Salt Range hills. Ideal for boating and photography. Home to peacocks and migratory birds." },
                  { name: "Choa Saidanshah Town", dist: "3 km", desc: "Charming hill town with fresh natural springs, a weekly bazaar, local restaurants for lunch, and the shrine of Hazrat Saidan Shah." },
                  { name: "Malot Fort (Molat Fort)", dist: "15 km", desc: "12th-century red sandstone fort built by the Janjua emperor. One of Pakistan's most photogenic historic forts." },
                  { name: "Chakwal City", dist: "40 km", desc: "District headquarters with hotels, restaurants, banks, and the nearest quality accommodation (Chakwal Grand Guest House)." },
                  { name: "Khewra Salt Mine", dist: "50 km", desc: "One of the world's largest salt mines â€” an underground complex with stunning pink Himalayan salt walls, open to tourists." },
                ].map(a => (
                  <div key={a.name} className="card-luxury rounded-xl p-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-foreground text-sm">{a.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                    </div>
                    <span className="text-xs text-gold-400 flex-shrink-0 font-mono">{a.dist}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Stay */}
            <section id="stay">
              <h2 className="text-2xl font-bold font-serif text-foreground mb-5">Where to Stay Near Katas Raj</h2>
              <div className="relative h-52 rounded-2xl overflow-hidden mb-5">
                <Image src="/images/rooms/executive-room-chakwal-grand-guest-house.jpg" alt="Executive room Chakwal Grand Guest House near Katas Raj temples" fill className="object-cover" />
              </div>
              <p className="text-muted-foreground leading-relaxed mb-5">
                There is no quality accommodation directly in Katas or Choa Saidanshah. <strong className="text-foreground">Chakwal city (40 km away)</strong> is the best base for visiting Katas Raj, with Chakwal Grand Guest House being the most recommended option for tourists.
              </p>
              <div className="card-luxury rounded-2xl p-6 border border-gold-500/20">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-foreground text-lg">Chakwal Grand Guest House</h3>
                    <p className="text-xs text-muted-foreground">Near District Courts, Talagang Road, Chakwal</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-gold-400 fill-gold-400" />)}
                      <span className="text-xs text-muted-foreground ml-1">5.0 â€” 20 Google Reviews</span>
                    </div>
                  </div>
                  <span className="text-gold-400 font-bold text-sm flex-shrink-0">From PKR 2,000/night</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-5 text-xs text-muted-foreground">
                  {["Free WiFi", "Hot Water 24/7", "AC Rooms Available", "Family Rooms", "Cash on Arrival", "Free Cancellation"].map(f => (
                    <div key={f} className="flex items-center gap-1.5"><span className="text-gold-400">âœ“</span>{f}</div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/book" className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-lg transition-all">
                    Book Now â€” No Payment Required <ArrowRight className="w-4 h-4" />
                  </Link>
                  <a href={`tel:${siteConfig.phoneE164}`} className="flex-1 flex items-center justify-center gap-2 py-3 border border-gold-500/30 text-gold-400 text-sm font-semibold rounded-xl hover:bg-gold-500/10 transition-colors">
                    Call {siteConfig.phone}
                  </a>
                </div>
              </div>
            </section>

            {/* FAQ */}
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
              <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Planning to Visit Katas Raj?</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
                Stay at Chakwal Grand Guest House â€” just 40 km from Katas Raj Temples. Clean rooms, free WiFi, 24/7 service, and no advance payment required. The most trusted accommodation in Chakwal district.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/book" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
                  Book a Room <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/blog/places-to-visit-chakwal" className="inline-flex items-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors">
                  More Chakwal Attractions
                </Link>
              </div>
            </section>

          </article>
        </div>
      </div>
    </>
  );
}
