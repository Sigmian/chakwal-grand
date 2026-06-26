import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Clock, ArrowRight, ChevronRight, Camera, Star } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Top 10 Places to Visit in Chakwal 2025 â€” Complete Tourist Guide",
  description: "Discover the most beautiful and historic places in Chakwal district â€” Katas Raj Temples, Kallar Kahar Lake, Choa Saidan Shah, Pharwala Fort, Salt Range & more. Best tourist spots in Chakwal Punjab 2025.",
  keywords: [
    "places to visit Chakwal", "tourist spots Chakwal", "Katas Raj Temples",
    "Kallar Kahar Lake", "Chakwal tourism 2025", "things to do Chakwal Punjab",
    "Salt Range Pakistan", "Choa Saidan Shah", "Pharwala Fort", "Tilla Jogian",
    "Chakwal attractions", "Chakwal sightseeing", "tourism Chakwal",
  ],
  alternates: { canonical: `${siteConfig.url}/blog/places-to-visit-chakwal` },
  openGraph: {
    title: "Top 10 Places to Visit in Chakwal 2025 â€” Complete Tourist Guide",
    description: "From Katas Raj Temples to Kallar Kahar Lake â€” complete guide to tourist attractions in Chakwal, Punjab, Pakistan.",
    url: `${siteConfig.url}/blog/places-to-visit-chakwal`,
    images: [{ url: `${siteConfig.url}/images/blogs/chakwal-landscape-punjab-pakistan.webp`, width: 1200, height: 630, alt: "Beautiful landscape Chakwal Punjab Pakistan tourist attraction" }],
  },
};

const ARTICLE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Top 10 Places to Visit in Chakwal â€” Complete Tourist Guide 2025",
  "description": "Discover the most beautiful and historic places in Chakwal district, Punjab Pakistan.",
  "image": `${siteConfig.url}/images/blogs/chakwal-landscape-punjab-pakistan.webp`,
  "url": `${siteConfig.url}/blog/places-to-visit-chakwal`,
  "datePublished": "2025-01-15",
  "dateModified": "2025-06-01",
  "author": { "@type": "Organization", "name": "Chakwal Guest House", "url": siteConfig.url },
  "publisher": { "@type": "Organization", "name": "Chakwal Guest House", "url": siteConfig.url },
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What are the top tourist places in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "The top tourist attractions in Chakwal are: Katas Raj Temples (5,000-year-old Hindu temple complex), Kallar Kahar Lake (scenic saline lake), Choa Saidan Shah (hill town with natural springs), Pharwala Fort (11th century Gakhar fort), Tilla Jogian (sacred hilltop monastery), and the Salt Range Hills." } },
    { "@type": "Question", "name": "Is Chakwal worth visiting?", "acceptedAnswer": { "@type": "Answer", "text": "Absolutely â€” Chakwal is one of Punjab's most underrated destinations. It has a 5,000-year-old temple complex (Katas Raj), a beautiful natural lake (Kallar Kahar), ancient forts, scenic Salt Range hills, and a cooler climate than nearby cities. It is an excellent 2-3 day trip from Rawalpindi or Lahore." } },
    { "@type": "Question", "name": "How far is Chakwal from Rawalpindi?", "acceptedAnswer": { "@type": "Answer", "text": "Chakwal city is approximately 80â€“90 km from Rawalpindi/Islamabad. The drive takes about 1.5 hours via the M-2 motorway and Chakwal road." } },
    { "@type": "Question", "name": "Is Kallar Kahar Lake in Chakwal?", "acceptedAnswer": { "@type": "Answer", "text": "Yes â€” Kallar Kahar Lake is located in Chakwal district, approximately 45 km from Chakwal city. It is a natural saline lake surrounded by the Salt Range hills and is a popular tourist spot." } },
  ],
};

const PLACES = [
  {
    num: "01", name: "Katas Raj Temples", type: "Historic & Religious", distance: "40 km from Chakwal city",
    image: "/images/blogs/katas-raj-temples-chakwal-pakistan.webp",
    imageAlt: "Ancient Hindu temple complex Katas Raj Chakwal Punjab Pakistan",
    desc: "The crown jewel of Chakwal tourism, Katas Raj Temples is one of the most sacred Hindu pilgrimage sites in all of South Asia. Dating back over 5,000 years, the complex features seven ancient temples surrounding the holy Katas Kund pond â€” believed to have formed from the tears of Lord Shiva. Mentioned in the Mahabharata, this UNESCO-recognized heritage site draws historians, pilgrims, and photographers from across the world.",
    highlights: ["Free entry", "Open daily sunrise to sunset", "Best visited 7â€“9 AM", "Photography allowed"],
    tip: "Visit early morning for golden hour light and to beat the weekend crowds. Combine with a stop at Kallar Kahar for a full-day trip.",
    link: "/blog/katas-raj-temples-visitor-guide",
    linkLabel: "Full Katas Raj visitor guide â†’",
  },
  {
    num: "02", name: "Kallar Kahar Lake", type: "Natural Lake", distance: "45 km from Chakwal",
    image: "/images/blogs/sacred-pond-katas-raj-chakwal.webp",
    imageAlt: "Kallar Kahar Lake Chakwal Pakistan Salt Range hills scenic view",
    desc: "Kallar Kahar is a stunning natural saline lake nestled in the Salt Range hills, covering approximately 9â€“10 kmÂ². Famous for its changing colours with the seasons â€” deep blue in winter, emerald green in spring â€” the lake is a paradise for nature lovers and photographers. The lake is surrounded by green parks, boating facilities, and the Kallar Kahar Wildlife Park where you can spot peacocks and migratory birds. A historical Babur&apos;s Throne (Takht-e-Babri) is located nearby.",
    highlights: ["Boating available", "Wildlife park adjacent", "Babur's Throne nearby", "Peacock sightings"],
    tip: "Visit at sunset for the most spectacular views. Rowboat rentals are available at the lakeside for approximately PKR 200â€“400/hour.",
    link: null, linkLabel: null,
  },
  {
    num: "03", name: "Choa Saidan Shah", type: "Hill Town", distance: "30 km from Chakwal",
    image: "/images/blogs/chakwal-landscape-punjab-pakistan.webp",
    imageAlt: "Choa Saidan Shah hill town Salt Range Punjab Pakistan green hills",
    desc: "Perched in the Salt Range hills, Choa Saidan Shah is a picturesque hill town famous for its mild climate, natural mineral springs, and the revered shrine of Hazrat Saidan Shah. The town sits at an elevation that keeps it noticeably cooler than the plains â€” making it a perfect escape from Rawalpindi&apos;s summer heat. The surrounding hills provide excellent hiking trails with panoramic views, and the weekly bazaar is a colourful cultural experience.",
    highlights: ["Natural springs", "Cooler climate than plains", "Shrine of Hazrat Saidan Shah", "Weekly bazaar"],
    tip: "The town&apos;s spring water is famous throughout Punjab â€” buy some freshly bottled natural spring water from local vendors.",
    link: null, linkLabel: null,
  },
  {
    num: "04", name: "Pharwala Fort (Qila Pharwala)", type: "Historic Fort", distance: "25 km from Chakwal",
    image: "/images/blogs/salt-range-mountain-chakwal-pakistan.webp",
    imageAlt: "Pharwala Fort ancient ruins hilltop panoramic view Chakwal Punjab Pakistan",
    desc: "Pharwala Fort is a magnificent 11th-century fortification built by the Gakhar tribe â€” a Rajput clan that controlled much of this region before the Mughal era. Perched dramatically on a hilltop above a narrow gorge, the fort offers breathtaking panoramic views of the surrounding valleys. Despite centuries of neglect, the massive stone walls and towers remain impressive. Visiting requires a short but rewarding hike up the hillside path.",
    highlights: ["11th century architecture", "Panoramic valley views", "Short 20-min hike", "Gakhar tribe heritage"],
    tip: "Wear sturdy footwear for the uphill climb. Best visited in the morning to avoid the afternoon heat. Take water.",
    link: null, linkLabel: null,
  },
  {
    num: "05", name: "Tilla Jogian", type: "Religious & Scenic Hilltop", distance: "40 km from Chakwal",
    image: "/images/blogs/chakwal-travel-mountains-punjab.webp",
    imageAlt: "Tilla Jogian sacred hilltop Pakistan Salt Range scenic mountain landscape",
    desc: "Rising 975 metres above sea level, Tilla Jogian is the highest peak in the Salt Range and one of the most sacred sites in Punjab. The hilltop hosts an ancient Hindu and Jain monastery complex, revered for centuries as a place of meditation and spiritual retreat. The climb to the summit takes approximately 1.5â€“2 hours and rewards you with possibly the most spectacular 360-degree panorama in all of Punjab â€” on a clear day, you can see as far as the Himalayas.",
    highlights: ["Highest peak in Salt Range", "Ancient monastery complex", "360Â° panoramic views", "Spiritual atmosphere"],
    tip: "Start the climb no later than 7 AM in summer. Carry at least 2 litres of water. The descent can be slippery â€” take your time.",
    link: null, linkLabel: null,
  },
  {
    num: "06", name: "Kallar Kahar Wildlife Park", type: "Nature & Wildlife", distance: "45 km from Chakwal",
    image: "/images/blogs/chakwal-landscape-punjab-pakistan.webp",
    imageAlt: "Kallar Kahar Wildlife Park Chakwal Pakistan peacock nature forest",
    desc: "Adjacent to the lake, Kallar Kahar Wildlife Park covers a substantial area of natural woodland and lakeside habitat. The park is home to a breeding population of peacocks (Pakistan&apos;s most famous bird), along with deer, monkeys, and a rich variety of migratory waterfowl that visit in winter. The park is ideal for a family picnic, birdwatching, and relaxed nature walks with excellent facilities.",
    highlights: ["Peacock breeding population", "Migratory bird watching", "Deer and monkey sightings", "Family picnic facilities"],
    tip: "Best time for birdwatching is Octoberâ€“March when migratory birds from Central Asia arrive. Bring binoculars.",
    link: null, linkLabel: null,
  },
  {
    num: "07", name: "Salt Range Hills", type: "Nature & Geology", distance: "Throughout Chakwal district",
    image: "/images/blogs/salt-range-mountain-chakwal-pakistan.webp",
    imageAlt: "Salt Range hills Pakistan ancient geological formation Chakwal district",
    desc: "The Salt Range is one of the world&apos;s most geologically significant mountain ranges â€” an ancient fold of the Earth&apos;s crust containing rocks that are over 600 million years old. Stretching across Chakwal and Khushab districts, the range contains the world-famous Khewra Salt Mine (one of the largest in the world), ancient fossils, and stunning red sandstone landscapes. Trekking routes, off-road tracks, and viewpoints make it a paradise for adventure travelers.",
    highlights: ["600 million year old geology", "Khewra Salt Mine access", "Trekking routes", "Off-road 4x4 tracks"],
    tip: "Combine a Salt Range visit with Katas Raj and Kallar Kahar for an epic full-day tour of Chakwal&apos;s natural wonders.",
    link: null, linkLabel: null,
  },
  {
    num: "08", name: "Khewra Salt Mine", type: "Industrial Wonder", distance: "50 km from Chakwal",
    image: "/images/blogs/hindu-temple-architecture-pakistan.webp",
    imageAlt: "Khewra Salt Mine underground tunnel Jhelum Pakistan pink Himalayan salt",
    desc: "Technically in neighbouring Jhelum district but easily visited from Chakwal, Khewra Salt Mine is the second largest salt mine in the world and one of Pakistan&apos;s top tourist attractions. The underground complex features vast chambers with walls of glowing pink Himalayan salt, a salt mosque, a salt replica of the Great Wall of China, and a brackish underground lake. The guided tour takes approximately 1.5â€“2 hours.",
    highlights: ["Second largest salt mine globally", "Underground salt mosque", "Pink Himalayan salt walls", "Guided tours available"],
    tip: "Tours run 9 AM â€“ 5 PM daily. Entry fee is approximately PKR 30 for adults. Combine with Katas Raj for a perfect 2-day Chakwal trip.",
    link: null, linkLabel: null,
  },
];

export default function PlacesToVisitPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />

      {/* Hero */}
      <div className="relative h-[50vh] min-h-[350px] w-full overflow-hidden">
        <Image src="/images/blogs/chakwal-landscape-punjab-pakistan.webp" alt="Scenic landscape Chakwal Punjab Pakistan mountains hills tourist destination" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Link href="/blog" className="hover:text-gold-400 transition-colors">Blog</Link>
            <ChevronRight className="w-3 h-3" /><span>Places to Visit Chakwal</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/20 px-3 py-1 rounded-full">Tourism Guide</span>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-foreground mt-3 mb-3 leading-tight">
            Top 10 Places to Visit in Chakwal<br className="hidden sm:block" /> â€” Complete Tourist Guide 2025
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
            Chakwal district, Punjab â€” from 5,000-year-old temples to natural salt lakes. Discover why Chakwal is Pakistan&apos;s most underrated tourist destination.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Intro */}
        <div className="prose prose-invert max-w-none mb-10">
          <p className="text-muted-foreground leading-relaxed text-lg">
            Chakwal district in Punjab, Pakistan, is home to some of the most historically rich and naturally beautiful destinations in the entire country. Yet it remains largely off the mainstream tourist radar â€” which means fewer crowds, lower prices, and a more authentic experience than better-known destinations.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            Whether you are a history enthusiast, nature lover, photographer, or just looking for a peaceful weekend escape from Rawalpindi or Lahore â€” Chakwal has something extraordinary to offer. Here are the <strong className="text-foreground">top places to visit in Chakwal</strong> in 2025.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
          {[
            { val: "8+", label: "Major Attractions" },
            { val: "5,000", label: "Years of History" },
            { val: "40 km", label: "From City to Katas Raj" },
            { val: "Free", label: "Entry to Most Sites" },
          ].map(s => (
            <div key={s.label} className="card-luxury rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-gold-400">{s.val}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Places */}
        <div className="space-y-10">
          {PLACES.map(p => (
            <article key={p.num} className="card-luxury rounded-2xl overflow-hidden">
              <div className="relative h-52 sm:h-64">
                <Image src={p.image} alt={p.imageAlt} fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent flex items-end p-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-4xl font-bold text-gold-400/25 font-serif">{p.num}</span>
                      <div>
                        <h2 className="text-xl font-bold font-serif text-foreground">{p.name}</h2>
                        <div className="flex flex-wrap gap-2 mt-0.5">
                          <span className="text-xs text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">{p.type}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{p.distance}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{p.desc}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.highlights.map(h => (
                    <span key={h} className="text-xs bg-surface-base text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1">
                      <Camera className="w-3 h-3 text-gold-400" />{h}
                    </span>
                  ))}
                </div>
                <div className="flex items-start gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground"><strong className="text-emerald-400">Pro Tip:</strong> {p.tip}</p>
                </div>
                {p.link && (
                  <Link href={p.link} className="inline-flex items-center gap-1 mt-3 text-xs text-gold-400 hover:underline">
                    {p.linkLabel}
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* FAQ */}
        <section className="mt-14">
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
        <div className="card-luxury rounded-2xl p-8 text-center border border-gold-500/20 mt-10">
          <div className="flex justify-center mb-3">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-gold-400 fill-gold-400" />)}
          </div>
          <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Planning a Trip to Chakwal?</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-lg mx-auto">
            Stay at Chakwal Guest House â€” the most trusted accommodation in Chakwal district. AC rooms, family suites, free WiFi from PKR 2,000/night. Pay cash on arrival, no advance payment required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/book" className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
              Book Your Room <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/blog/where-to-stay-chakwal" className="inline-flex items-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors">
              Accommodation Guide
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
