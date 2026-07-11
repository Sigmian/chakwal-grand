import { siteConfig } from "@/config/site";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, MapPin, Phone, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "10 Best Things to Do in Chakwal — Complete Travel Guide 2026",
  description: "Discover the best things to do in Chakwal, Punjab Pakistan — from exploring ancient Katas Raj Temples and Kallar Kahar Lake to hiking the Salt Range. A complete activity guide for 2026.",
  keywords: [
    "things to do in Chakwal", "Chakwal activities", "what to do in Chakwal",
    "Chakwal tourist attractions", "Chakwal sightseeing", "Katas Raj Temples",
    "Kallar Kahar Lake", "Chakwal tourism", "places to visit Chakwal Punjab",
    "Chakwal weekend trip", "Chakwal day trip", "Chakwal travel 2026",
  ],
  alternates: { canonical: `${siteConfig.url}/blog/things-to-do-chakwal` },
  openGraph: {
    title: "10 Best Things to Do in Chakwal — Complete Travel Guide 2026",
    description: "From Katas Raj Temples to Kallar Kahar Lake — the definitive guide to things to do in Chakwal, Punjab Pakistan.",
    url: `${siteConfig.url}/blog/things-to-do-chakwal`,
    images: [{ url: `${siteConfig.url}/images/blogs/chakwal-travel-mountains-punjab.webp`, width: 1200, height: 630, alt: "Things to do in Chakwal Punjab Pakistan" }],
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "10 Best Things to Do in Chakwal — Complete Travel Guide 2026",
  "description": "A comprehensive guide to the best things to do in Chakwal, Punjab — Katas Raj Temples, Kallar Kahar Lake, hiking, local food, and more.",
  "image": `${siteConfig.url}/images/blogs/chakwal-travel-mountains-punjab.webp`,
  "url": `${siteConfig.url}/blog/things-to-do-chakwal`,
  "datePublished": "2026-01-10",
  "dateModified": "2026-07-01",
  "author": { "@type": "Organization", "name": "Chakwal Guest House", "url": siteConfig.url },
  "publisher": { "@type": "Organization", "name": "Chakwal Guest House", "url": siteConfig.url },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What are the best things to do in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "The top things to do in Chakwal include visiting Katas Raj Temples, boating at Kallar Kahar Lake, hiking Tilla Jogian, exploring Pharwala Fort, visiting Khewra Salt Mine, and enjoying local Punjabi cuisine at dhabas in the city." } },
    { "@type": "Question", "name": "Is Chakwal worth visiting from Islamabad?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely. Chakwal is only 80–90 km from Islamabad (about 1.5–2 hours by road) and packs a huge amount into a short trip — ancient temples, a scenic lake, mountain hiking, and great local food. It is one of the most underrated day trips from Islamabad." } },
    { "@type": "Question", "name": "How many days do you need in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Two days is ideal — one day for Katas Raj Temples and Choa Saidan Shah, and a second day for Kallar Kahar Lake and the Salt Range. However, a single overnight stay already lets you cover the main highlights without feeling rushed." } },
    { "@type": "Question", "name": "Is Katas Raj Temples free to enter?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, entry to Katas Raj Temples is free for all visitors. The site is maintained by the government and is open year-round. The best time to visit is early morning to avoid the afternoon heat." } },
  ],
};

const ACTIVITIES = [
  {
    num: "01",
    title: "Visit the Ancient Katas Raj Temples",
    subtitle: "40 km from Chakwal city · Free entry · Allow 2–3 hours",
    image: "/images/blogs/katas-raj-temples-chakwal-pakistan.webp",
    imageAlt: "Katas Raj ancient Hindu temples sacred pond Chakwal Punjab Pakistan",
    body: [
      "Katas Raj is Chakwal's crown jewel — a 5,000-year-old Hindu temple complex built around a sacred blue pool called the Katas Kund. According to Hindu legend, this pond was formed by the tears of Lord Shiva after the death of his wife Sati. It is one of the holiest sites in Hinduism and the most important pilgrimage site in Pakistan.",
      "The complex includes over a dozen temples dating from the 7th to the 9th century CE, all built in striking white stone. The main Shiva temple, the Ram temple, and the Hanuman temple are all set around the shimmering blue water — creating a scene that feels otherworldly and deeply peaceful.",
      "Even if you have no connection to Hinduism, the sheer historical weight and architectural beauty of Katas Raj is breathtaking. Photography is permitted throughout the complex. Arrive early (before 9 AM) for the best light and fewer crowds.",
    ],
    tip: "Combine this with a stop at Choa Saidan Shah (just 3 km away) for lunch at the natural spring-fed town.",
  },
  {
    num: "02",
    title: "Go Boating at Kallar Kahar Lake",
    subtitle: "45 km from Chakwal city · Entry free · Boating PKR 200–400",
    image: "/images/blogs/chakwal-landscape-punjab-pakistan.webp",
    imageAlt: "Kallar Kahar Lake scenic view Punjab Pakistan nature travel",
    body: [
      "Kallar Kahar is a natural saline lake nestled in a valley of the Salt Range — one of Pakistan's most photogenic landscapes. The lake fills beautifully after the monsoon season, and the surrounding hills turn vivid green from September through February.",
      "The lake has paddleboats and rowboats for rent — a relaxing hour on the water with the Salt Range hills reflected around you is a genuinely memorable experience. The shore is dotted with peacocks (yes, wild peacocks wander freely), and the Kallar Kahar Wildlife Park is just minutes away.",
      "Above the lake, a famous viewpoint road winds up through the hills — the views looking down at the lake and across the Salt Range are some of the best landscape vistas in all of Punjab. Sunset from this viewpoint is extraordinary.",
    ],
    tip: "Visit Takht-e-Babri (Babur's Throne) just 2 km from the lake — a carved stone platform where the Mughal emperor Babur is said to have rested during his 1519 campaign.",
  },
  {
    num: "03",
    title: "Hike Tilla Jogian",
    subtitle: "40 km from Chakwal · Moderate hike · Allow half a day",
    image: "/images/blogs/salt-range-mountain-chakwal-pakistan.webp",
    imageAlt: "Tilla Jogian Salt Range mountain hiking Chakwal Punjab Pakistan",
    body: [
      "At 975 metres, Tilla Jogian is the highest peak in the Salt Range — and one of the most rewarding hikes in Punjab. The summit hosts an ancient monastery site associated with the Hindu saint Gorakh Nath, and the 360-degree views from the top stretch from the plains of Punjab to the peaks of Azad Kashmir on clear days.",
      "The trail takes about 1.5–2 hours to climb and is well-used by local hikers. The path winds through juniper trees and rocky outcrops, and the final ridge walk offers views in every direction. It is a moderate hike suitable for anyone in reasonable fitness — no technical climbing required.",
      "The cooler months (October through February) are ideal for this hike. Summers can be very hot on the exposed ridge. Carry water and wear grip-soled shoes.",
    ],
    tip: "Start no later than 8 AM to reach the summit before the midday heat. The descent takes about 1 hour.",
  },
  {
    num: "04",
    title: "Explore Pharwala Fort",
    subtitle: "25 km from Chakwal city · Free entry · Allow 1–2 hours",
    image: "/images/blogs/chakwal-travel-mountains-punjab.webp",
    imageAlt: "Pharwala Fort ancient ruins Chakwal district Punjab Pakistan",
    body: [
      "Built in the 11th century by the Gakhar clan, Pharwala Fort sits dramatically on a rocky spur overlooking the surrounding plains. The fort is largely in ruins today, but the scale of the walls and towers still hints at its former power — it was one of the most important Gakhar strongholds in the pre-Mughal Potohar Plateau.",
      "The ruins include the main fort walls, bastions, a mosque, and a deep well. The setting is remote and dramatic, with few other tourists — you can often have the entire site to yourself. The views from the fort ramparts across the valleys below are excellent.",
      "The approach road requires a short hike of about 20 minutes from where you can park. Wear good shoes and visit in the morning for the best light.",
    ],
    tip: "Combine Pharwala Fort with a visit to the nearby Margalla Quarry viewpoint for panoramic Salt Range views.",
  },
  {
    num: "05",
    title: "Tour Khewra Salt Mine",
    subtitle: "50 km from Chakwal · Entry ~PKR 30 · Allow 2 hours",
    image: "/images/blogs/ancient-stone-temple-pakistan.webp",
    imageAlt: "Khewra Salt Mine interior Pink Himalayan salt underground Pakistan",
    body: [
      "The Khewra Salt Mine, on the edge of Chakwal district, is the world's second-largest salt mine and one of Pakistan's most visited tourist attractions. The mine has been active since at least the Mughal era and descends 14 levels underground — visitors take a train tour through the first few levels of pink-walled tunnels.",
      "Inside, miners have carved out remarkable salt sculptures, a replica of the Great Wall of China, a mosque, and a prayer hall — all from pure pink Himalayan salt that glows a warm amber under electric lights. The temperature inside is a constant cool 18°C, making it particularly refreshing in summer.",
      "The mine is an easy extension to any Chakwal trip, especially since the road from Chakwal to Khewra passes through beautiful Salt Range scenery.",
    ],
    tip: "Go early on weekdays — weekends and Pakistani public holidays see large crowds. Photography is permitted inside.",
  },
  {
    num: "06",
    title: "Drive Through the Salt Range",
    subtitle: "Starts 10 km from Chakwal · Self-drive recommended",
    image: "/images/blogs/salt-range-mountain-chakwal-pakistan.webp",
    imageAlt: "Salt Range hills scenic drive Punjab Pakistan landscape",
    body: [
      "The Salt Range is one of the most geologically fascinating landscapes in Asia — a range of rocky hills that form the northern edge of the Potohar Plateau, stretching 300 km from the Jhelum River to beyond Chakwal. The rocks here are some of the oldest sedimentary formations in South Asia, and the colours change dramatically with the light — ochre, purple, and deep red in the afternoon sun.",
      "A self-drive through the Salt Range between Chakwal and Kallar Kahar is one of the finest road trips in Punjab. The road climbs through switchbacks past rocky escarpments, drops into valleys of wheat and mustard (in winter), and offers constant views across the plateau.",
      "Key stopping points include the Nammal Lake viewpoint, the Chakwal-Kallar Kahar road scenic spots, and the highland village of Choa Saidan Shah, which sits on natural springs and has a distinctive, cooler microclimate.",
    ],
    tip: "Rent a car from Rawalpindi or Chakwal for maximum flexibility — local taxis can also be hired for a full-day Salt Range drive for PKR 2,000–3,000.",
  },
  {
    num: "07",
    title: "Visit Choa Saidan Shah",
    subtitle: "30 km from Chakwal · Free entry · Allow 1–2 hours",
    image: "/images/blogs/chakwal-landscape-punjab-pakistan.webp",
    imageAlt: "Choa Saidan Shah natural springs hill town Chakwal Punjab",
    body: [
      "Choa Saidan Shah is a small hill town known for its natural springs and cooler temperatures — the name literally means 'the spring of the holy man.' The town sits in a valley below the Salt Range and is a popular stopover for travellers between Chakwal and Katas Raj.",
      "The main draw is the natural freshwater springs that flow through the town, creating a lush green oasis in the otherwise semi-arid landscape. Local stalls sell fresh sugarcane juice and seasonal fruit — a welcome refreshment after a morning of sightseeing.",
      "The town is also notable for a large shrine complex dedicated to a local Sufi saint, which draws pilgrims throughout the year. The atmosphere is calm and welcoming.",
    ],
    tip: "Perfect for a late-morning stop between Katas Raj and your return to Chakwal city. The lunch dhabas here are excellent.",
  },
  {
    num: "08",
    title: "Eat at Chakwal's Local Dhabas",
    subtitle: "Chakwal city center · Budget: PKR 150–500 per person",
    image: "/images/blogs/chakwal-landscape-punjab-pakistan.webp",
    imageAlt: "Chakwal local food dhaba restaurant Punjab Pakistan traditional cuisine",
    body: [
      "No trip to Chakwal is complete without eating at the local dhaba restaurants — roadside eateries that serve traditional Punjabi food cooked over open fires in massive iron karahis. Chakwal's dhabas punch well above their weight in quality.",
      "Must-try dishes include nihari (slow-cooked beef or mutton stew) served with hot naan bread at breakfast, chapli kebab (spiced minced meat patties grilled over charcoal), daal makhani (black lentils simmered overnight with butter and cream), and paye (slow-cooked trotters) — a Chakwal specialty that restaurants start cooking from midnight.",
      "The Kacheri Chowk and Main Bazar areas have the highest concentration of good dhabas. Most are cash-only and close late at night. Prices are extremely reasonable — a full meal for two rarely costs more than PKR 600–800.",
    ],
    tip: "Ask your guesthouse for the dhaba nearest to them — locals always know where the best food is, and the best places rarely have English signage.",
  },
  {
    num: "09",
    title: "Explore Chakwal City's Bazaars",
    subtitle: "Chakwal city center · Free · Allow 1–2 hours",
    image: "/images/blogs/chakwal-landscape-punjab-pakistan.webp",
    imageAlt: "Chakwal city bazaar market traditional shops Punjab Pakistan",
    body: [
      "Chakwal's old bazaars offer a window into a traditional Punjab market town that has changed little in decades. The main bazaar near the courts and clock tower is a dense, noisy, colourful stretch of cloth merchants, spice sellers, halwai sweet shops, and hardware vendors.",
      "Look for Chakwal's famous ajrak and block-printed fabrics — the city has a long tradition of textile craftsmanship. The halwai shops sell freshly made barfi, gulab jamun, and jalebi that are genuinely among the best in the region.",
      "The bazaar is most lively in the late afternoon and evening, when the day cools and families come out to shop. Friday afternoons see the bazaar at its quietest as shops close for Jumu'ah prayer.",
    ],
    tip: "The sweet shops near the main mosque sell exceptional kulfi (Pakistani ice cream) in the evenings — a perfect end to a day of sightseeing.",
  },
  {
    num: "10",
    title: "Stay Overnight and Wake Up Slowly",
    subtitle: "Best experienced: October – March · Full overnight stay recommended",
    image: "/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg",
    imageAlt: "Comfortable overnight stay Chakwal Guest House clean room Punjab Pakistan",
    body: [
      "The single best thing you can do in Chakwal is not rush it. Many visitors make the mistake of treating Chakwal as a quick day trip from Islamabad and end up missing half of what makes the district special. An overnight stay completely changes the experience.",
      "When you wake up in Chakwal in the morning — especially in winter — the city has a quiet, misty calm that feels miles from the chaos of the twin cities. You can eat a proper nihari breakfast, visit Katas Raj when it opens and have it nearly to yourself, and then head to Kallar Kahar for sunset without being constrained by a long drive home.",
      "Chakwal Guest House is the most trusted accommodation option in the city, with two branches — one near District Courts on Talagang Road and one in Madina Town. Rooms start from PKR 2,000/night with free WiFi, hot water, and 24/7 service.",
    ],
    tip: "Book 2–3 days in advance for weekend visits. No advance payment needed — pay cash on arrival.",
  },
];

const TOC = [
  { id: "01", label: "Katas Raj Temples" },
  { id: "02", label: "Kallar Kahar Lake" },
  { id: "03", label: "Hike Tilla Jogian" },
  { id: "04", label: "Pharwala Fort" },
  { id: "05", label: "Khewra Salt Mine" },
  { id: "06", label: "Salt Range Drive" },
  { id: "07", label: "Choa Saidan Shah" },
  { id: "08", label: "Local Dhaba Food" },
  { id: "09", label: "Chakwal Bazaars" },
  { id: "10", label: "Stay Overnight" },
];

export default function ThingsToDoChakwalPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

      {/* Hero */}
      <div className="relative h-[50vh] min-h-[350px] w-full overflow-hidden">
        <Image
          src="/images/blogs/chakwal-travel-mountains-punjab.webp"
          alt="Things to do in Chakwal Punjab Pakistan mountains landscape travel guide"
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
            <span>Things to Do in Chakwal</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/20 px-3 py-1 rounded-full">Activities & Tourism</span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-foreground mt-3 mb-3 leading-tight">
            10 Best Things to Do in Chakwal<br className="hidden sm:block" /> — Complete Travel Guide 2026
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 8 min read</span>
            <span>Updated July 2026</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col lg:flex-row gap-10">

          {/* Sidebar TOC */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 card-luxury rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-gold-400 mb-3">10 Things to Do</p>
              <ul className="space-y-2">
                {TOC.map(item => (
                  <li key={item.id}>
                    <a href={`#activity-${item.id}`} className="text-xs text-muted-foreground hover:text-gold-400 transition-colors flex items-center gap-2">
                      <span className="text-gold-400/60 font-mono text-[10px]">{item.id}</span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-5 pt-4 border-t border-border space-y-2">
                <Link href="/book" className="block text-center py-2 bg-gold-gradient text-background text-xs font-bold rounded-lg hover:shadow-gold-lg transition-all">
                  Book Your Stay
                </Link>
                <a href={`tel:${siteConfig.phoneE164}`} className="block text-center py-2 border border-gold-500/30 text-gold-400 text-xs rounded-lg hover:bg-gold-500/10 transition-colors">
                  Call {siteConfig.phone}
                </a>
              </div>
            </div>
          </aside>

          {/* Article body */}
          <article className="flex-1 min-w-0 space-y-14">

            {/* Intro */}
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p className="text-lg text-foreground font-medium">
                Chakwal is one of Punjab&apos;s most rewarding — and most overlooked — destinations. Just 80 km from Islamabad, it packs ancient temples, a stunning lake, mountain hikes, and exceptional local food into a district that most Pakistani tourists drive straight past on the motorway.
              </p>
              <p>
                Whether you are planning a day trip from Rawalpindi, a weekend break, or an extended stay, this guide covers the 10 best things to do in Chakwal in 2026 — with practical details on distance, cost, and how to fit everything into your trip.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { val: "80 km", label: "From Islamabad" },
                  { val: "Free", label: "Most attractions" },
                  { val: "2 days", label: "Ideal trip length" },
                  { val: "5,000+", label: "Years of history" },
                ].map(s => (
                  <div key={s.label} className="card-luxury rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-gold-400">{s.val}</p>
                    <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Activities */}
            {ACTIVITIES.map((act) => (
              <section key={act.num} id={`activity-${act.num}`} className="scroll-mt-28">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-black text-gold-400/20 font-mono leading-none">{act.num}</span>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold font-serif text-foreground leading-tight">{act.title}</h2>
                    <p className="text-xs text-gold-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {act.subtitle}
                    </p>
                  </div>
                </div>

                <div className="relative h-52 sm:h-64 rounded-2xl overflow-hidden mb-5">
                  <Image src={act.image} alt={act.imageAlt} fill className="object-cover" />
                </div>

                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  {act.body.map((para, i) => <p key={i}>{para}</p>)}
                </div>

                <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-xl bg-gold-500/5 border border-gold-500/20">
                  <span className="text-gold-400 text-xs font-bold uppercase tracking-wider flex-shrink-0 mt-0.5">Tip:</span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{act.tip}</p>
                </div>
              </section>
            ))}

            {/* FAQ */}
            <section>
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
              <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Visiting Chakwal? Stay at Chakwal Guest House</h2>
              <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
                Chakwal Guest House is the most trusted accommodation in Chakwal — clean rooms, free WiFi, 24/7 service, and two convenient locations. Rooms from PKR 2,000/night. No advance payment required.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/book" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all text-sm">
                  Book Your Room <ArrowRight className="w-4 h-4" />
                </Link>
                <a href={`tel:${siteConfig.phoneE164}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors text-sm">
                  <Phone className="w-4 h-4" /> {siteConfig.phone}
                </a>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Also read:{" "}
                <Link href="/blog/chakwal-travel-guide" className="text-gold-400 hover:underline">Complete Chakwal travel guide</Link>
                {" · "}
                <Link href="/blog/katas-raj-temples-visitor-guide" className="text-gold-400 hover:underline">Katas Raj visitor guide</Link>
                {" · "}
                <Link href="/blog/chakwal-from-islamabad" className="text-gold-400 hover:underline">Chakwal day trip from Islamabad</Link>
              </p>
            </section>

          </article>
        </div>
      </div>
    </>
  );
}
