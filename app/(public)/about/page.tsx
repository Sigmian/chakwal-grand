import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, MapPin, Phone, CalendarCheck, Building2, Users } from "lucide-react";
import { siteConfig } from "@/config/site";
import { Reveal } from "@/features/public/components/Reveal";

export const metadata: Metadata = {
  title: "About Chakwal Guest House",
  description: "Learn about Chakwal Guest House and compare its Main Branch near District Courts with its Madina Town branch in Chakwal.",
  keywords: ["about Chakwal Guest House", "family guest house Chakwal Punjab"],
  alternates: { canonical: `${siteConfig.url}/about` },
  openGraph: {
    title: "About Chakwal Guest House | Two Chakwal Locations",
    description: "Learn about Chakwal Guest House's Main Branch and Madina Town branch.",
    url: `${siteConfig.url}/about`,
  },
};

const ABOUT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Chakwal Guest House",
  "url": `${siteConfig.url}/about`,
  "description": "Chakwal Guest House offers rooms at two locations in Chakwal, Punjab.",
  "mainEntity": {
    "@type": "LodgingBusiness",
    "name": "Chakwal Guest House",
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
  { icon: CalendarCheck, title: "Current Availability", desc: "Available rooms and listed prices come from the active room inventory." },
  { icon: Building2, title: "Room-Level Details", desc: "Each room listing identifies its branch, occupancy and currently recorded facilities." },
  { icon: MapPin, title: "Two Locations", desc: "Choose the Main Branch near District Courts or the Madina Town branch." },
  { icon: Users, title: "Direct Assistance", desc: "Call or WhatsApp to confirm bed setup, arrival directions or another essential requirement." },
];

const BRANCHES = [
  { name: "Main Branch",         address: "Near District Courts, Talagang Road, Chakwal", city: "Chakwal",      label: "Flagship" },
  { name: "Madina Town Branch",  address: "Madina Town, Chakwal — confirmed map pin available", city: "Chakwal", label: "Madina Town" },
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
              About Chakwal<br />Guest House
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Chakwal Guest House provides room options at two locations in Chakwal. This website lets guests compare
              current rooms, identify the correct branch and check availability before travelling.
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
                  Accommodation at Two Chakwal Locations
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Chakwal Guest House operates a Main Branch near District Courts on Talagang Road and a branch in
                  Madina Town, Chakwal. Current room options vary by branch and availability.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Compare the branch, occupancy, price and listed facilities on each room page. If a facility is
                  essential to your stay, call before booking so the team can confirm it for the selected room.
                </p>
                <div className="space-y-3">
                  {["Current room prices shown during booking", "Selected branch shown before confirmation", "Booking terms available for review"].map(point => (
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
                  { text: "2", label: "Chakwal Locations" },
                  { text: "Live", label: "Room Availability" },
                  { text: "Direct", label: "Online Booking" },
                  { text: "Call", label: "Arrival Assistance" },
                ].map((s, i) => (
                  <Reveal key={s.label} delay={i * 0.08}>
                    <div className="card-luxury rounded-2xl p-6 text-center h-full hover:border-gold-500/20 transition-colors">
                      <p className="text-3xl font-bold text-gold-400 font-serif mb-2">
                        {s.text}
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
              <h2 className="text-3xl font-bold font-serif text-foreground">Two Locations in Chakwal</h2>
              <p className="text-muted-foreground mt-3">Main Branch & Madina Town Branch — both in Chakwal, Punjab</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <p className="text-muted-foreground mb-8">Compare current rooms and confirm the branch and booking details for your stay.</p>
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
