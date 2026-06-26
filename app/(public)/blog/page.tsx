import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Travel Blog â€” Chakwal Tourism & Travel Guide",
  description: "Explore Chakwal tourism guides, travel tips, places to visit near Chakwal, Katas Raj Temples, Kallar Kahar Lake, and the best accommodation options in Chakwal Punjab.",
  keywords: ["Chakwal tourism", "places to visit Chakwal", "Chakwal travel guide", "Katas Raj Temples", "Kallar Kahar Lake", "travel Pakistan Punjab"],
  alternates: { canonical: `${siteConfig.url}/blog` },
  openGraph: {
    title:       "Travel Blog â€” Chakwal Tourism & Travel Guide",
    description: "Explore Chakwal tourism guides, travel tips, places to visit near Chakwal, Katas Raj Temples, Kallar Kahar Lake, and accommodation in Punjab.",
    url:         `${siteConfig.url}/blog`,
    images:      [{ url: `${siteConfig.url}/images/blogs/chakwal-travel-mountains-punjab.webp`, width: 1200, height: 630, alt: "Chakwal travel blog" }],
  },
};

const BLOGS = [
  {
    slug:    "places-to-visit-chakwal",
    title:   "Top 10 Places to Visit in Chakwal â€” Complete Tourist Guide 2025",
    excerpt: "Discover the most beautiful and historic places in Chakwal district â€” from Katas Raj Temples to Kallar Kahar Lake, Salt Range, and Choa Saidan Shah.",
    date:    "2025-01-15",
    tag:     "Tourism",
  },
  {
    slug:    "best-family-guest-house-chakwal",
    title:   "Best Family Guest House in Chakwal â€” Why Families Choose Chakwal Guest House",
    excerpt: "Looking for a safe, spacious, and affordable family guest house in Chakwal? Here is why thousands of families choose Chakwal Guest House for their stays in Punjab.",
    date:    "2025-01-20",
    tag:     "Accommodation",
  },
  {
    slug:    "chakwal-travel-guide",
    title:   "Complete Chakwal Travel Guide 2025 â€” How to Get There, Stay & Explore",
    excerpt: "Planning a trip to Chakwal? This complete travel guide covers transport, accommodation, weather, food, and top attractions in Chakwal district, Punjab.",
    date:    "2025-02-01",
    tag:     "Travel Guide",
  },
  {
    slug:    "katas-raj-temples-visitor-guide",
    title:   "Katas Raj Temples Visitor Guide â€” History, Timings & How to Get There",
    excerpt: "A complete guide to visiting the sacred Katas Raj Temples in Chakwal â€” one of Pakistan's most important Hindu pilgrimage sites. History, visiting tips, and nearby stay options.",
    date:    "2025-02-10",
    tag:     "Attractions",
  },
  {
    slug:    "where-to-stay-chakwal",
    title:   "Where to Stay in Chakwal â€” Best Guest Houses & Hotels 2025",
    excerpt: "A comprehensive guide to the best accommodation options in Chakwal â€” from budget rooms to executive suites. Find out why Chakwal Guest House is the top-rated guest house in the city.",
    date:    "2025-02-20",
    tag:     "Accommodation",
  },
];

export default function BlogIndexPage() {
  return (
    <>
      <main>
        <section className="pt-28 pb-16 bg-surface-elevated border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">Travel & Tourism</p>
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mb-6">Chakwal Travel Blog</h1>
            <p className="text-lg text-muted-foreground">
              Tourism guides, travel tips, and local insights for visiting Chakwal, Kallar Kahar, and surrounding areas of Punjab, Pakistan.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {BLOGS.map(b => (
              <Link key={b.slug} href={`/blog/${b.slug}`}
                className="card-luxury rounded-2xl p-6 flex flex-col sm:flex-row gap-4 hover:border-gold-500/30 border border-transparent transition-all group block">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
                      {b.tag}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {new Date(b.date).toLocaleDateString("en-PK", { year:"numeric", month:"long", day:"numeric" })}
                    </span>
                  </div>
                  <h2 className="font-bold text-foreground text-lg mb-2 group-hover:text-gold-400 transition-colors">
                    {b.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{b.excerpt}</p>
                </div>
                <div className="flex items-center flex-shrink-0">
                  <ArrowRight className="w-5 h-5 text-gold-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
