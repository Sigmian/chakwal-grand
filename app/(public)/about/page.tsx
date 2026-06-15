import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MapPin, Phone, Star, Shield, Clock, Users } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Reveal } from "@/features/public/components/Reveal";
import { CountUp } from "@/features/public/components/CountUp";

export const metadata: Metadata = {
  title: "About Us | Chakwal Grand Guest House — Best Stay in Chakwal",
  description: "Learn about Chakwal Grand Guest House — Chakwal's most trusted guest house with 3 locations across Punjab. Affordable luxury, family-friendly, 24/7 service since establishment.",
  keywords: ["about Chakwal Grand Guest House", "best guest house Chakwal", "trusted guest house Pakistan", "family guest house Chakwal Punjab"],
  alternates: { canonical: `${siteConfig.url}/about` },
  openGraph: {
    title: "About Chakwal Grand Guest House | Best Guest House in Chakwal",
    description: "Chakwal's most trusted guest house chain with branches in Chakwal, Kallar Kahar, and Sargodha. Family-friendly, affordable, 24/7 service.",
    url: `${siteConfig.url}/about`,
  },
};

const ABOUT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Chakwal Grand Guest House",
  "url": `${siteConfig.url}/about`,
  "description": "Chakwal Grand Guest House is the premier accommodation provider in Chakwal, Punjab with branches in Chakwal, Kallar Kahar, and Sargodha.",
  "mainEntity": {
    "@type": "LodgingBusiness",
    "name": "Chakwal Grand Guest House",
    "telephone": "+92-334-7742767",
    "url": siteConfig.url,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Near District Courts, Talagang Road",
      "addressLocality": "Chakwal",
      "addressRegion": "Punjab",
      "addressCountry": "PK",
    },
  },
};

const VALUES = [
  { icon: Shield,       title: "Safe & Secure",       desc: "CNIC-verified guests, CCTV security, and a safe environment for solo travelers, couples, and families." },
  { icon: Star,         title: "Premium Comfort",      desc: "Every room is furnished with quality beds, hot water, attached bathroom, TV, and free WiFi." },
  { icon: Clock,        title: "24/7 Service",         desc: "Our staff is available round the clock to ensure your stay is comfortable at any hour." },
  { icon: Users,        title: "Family Friendly",      desc: "Spacious family rooms with separate sitting areas, ideal for family trips and group stays." },
];

const BRANCHES = [
  { name: "Chakwal (Main Branch)", address: "Near District Courts, Talagang Road, Chakwal", city: "Chakwal" },
  { name: "Kallar Kahar Branch",   address: "Lake View Road, Near Salt Mine, Kallar Kahar, Chakwal", city: "Kallar Kahar" },
  { name: "Sargodha Branch",       address: "University Road, Near Peoples Colony, Sargodha", city: "Sargodha" },
];

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ABOUT_SCHEMA) }} />
      <main>
        {/* Hero */}
        <section className="pt-28 pb-16 bg-surface-elevated border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">Our Story</p>
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mb-6">
              Chakwal&apos;s Most Trusted<br />Guest House
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Chakwal Grand Guest House was established with one mission: to provide clean, safe, and affordable
              accommodation for travelers across Punjab. From solo businessmen to families visiting Katas Raj Temples
              and Kallar Kahar Lake, we have been the preferred choice for thousands of guests.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Who We Are</p>
                <h2 className="text-3xl font-bold font-serif text-foreground mb-5">
                  Premium Accommodation in Chakwal, Punjab
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Chakwal Grand Guest House is a chain of premium guest houses operating across Punjab, Pakistan.
                  We offer rooms ranging from classic budget rooms to fully air-conditioned executive suites and
                  family apartments — all at honest, transparent prices with no hidden charges.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Whether you are visiting Chakwal for business, tourism, or a family trip, our guest houses
                  provide a clean, comfortable, and safe home away from home. All rooms include free WiFi,
                  24/7 hot water, attached bathrooms, and round-the-clock staff assistance.
                </p>
                <div className="space-y-3">
                  {["No advance payment required — pay cash on arrival", "CNIC-verified, secure guest environment", "Free cancellation up to 24 hours before check-in"].map(point => (
                    <div key={point} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground">{point}</span>
                    </div>
                  ))}
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">Online booking available 24/7 at {siteConfig.url.replace("https://", "")}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { num: 3,  suffix: "",  label: "Branches in Punjab" },
                  { num: 10, suffix: "+", label: "Room Types" },
                  { text: "24/7",         label: "Staff Available" },
                  { text: "PKR 2,000",    label: "Starting Price/Night" },
                ].map((s, i) => (
                  <Reveal key={s.label} delay={i * 0.08}>
                    <div className="card-luxury rounded-2xl p-6 text-center h-full hover:border-gold-500/20 transition-colors">
                      <p className="text-3xl font-bold text-gold-400 font-serif mb-2">
                        {"text" in s ? s.text : <CountUp value={s.num} suffix={s.suffix} />}
                      </p>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-surface-elevated">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Why Choose Us</p>
              <h2 className="text-3xl font-bold font-serif text-foreground">What Sets Us Apart</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {VALUES.map(({ icon: Icon, title, desc }, i) => (
                <Reveal key={title} delay={i * 0.08}>
                  <div className="card-luxury rounded-2xl p-6 text-center h-full hover:-translate-y-1 hover:border-gold-500/30 transition-all group">
                    <div className="w-12 h-12 rounded-2xl bg-gold-gradient flex items-center justify-center mx-auto mb-4 shadow-gold-sm group-hover:shadow-gold-md transition-shadow">
                      <Icon className="w-6 h-6 text-background" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Branches */}
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Our Locations</p>
              <h2 className="text-3xl font-bold font-serif text-foreground">3 Branches Across Punjab</h2>
              <p className="text-muted-foreground mt-3">Find us in Chakwal, Kallar Kahar, and Sargodha</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {BRANCHES.map((b, i) => (
                <Reveal key={b.name} delay={i * 0.08}>
                  <div className="card-luxury rounded-2xl p-6 h-full hover:-translate-y-1 hover:border-gold-500/20 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center mb-4">
                      <MapPin className="w-5 h-5 text-background" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{b.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{b.address}</p>
                    <a href={`tel:${siteConfig.phoneE164}`} className="flex items-center gap-2 text-sm text-gold-400 hover:underline">
                      <Phone className="w-4 h-4" />
                      {siteConfig.phone}
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-surface-elevated">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold font-serif text-foreground mb-4">Ready to Book Your Stay?</h2>
            <p className="text-muted-foreground mb-8">Join thousands of satisfied guests who chose Chakwal Grand for their stay in Punjab.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/book" className="px-8 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
                Book a Room
              </Link>
              <a href={`tel:${siteConfig.phoneE164}`} className="px-8 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors">
                Call {siteConfig.phone}
              </a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
