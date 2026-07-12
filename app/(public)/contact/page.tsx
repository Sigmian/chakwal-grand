import type { Metadata } from "next";
import Link from "next/link";
import { Phone, MapPin, Clock, MessageCircle } from "lucide-react";
import { ContactForm } from "@/features/public/components/ContactForm";
import { siteConfig } from "@/config/site";
import { Reveal } from "@/features/public/components/Reveal";

export const metadata: Metadata = {
  title: `Contact Us — Call & WhatsApp ${siteConfig.phone}`,
  description: `Contact Chakwal Guest House for room bookings, inquiries, and reservations. Call or WhatsApp ${siteConfig.phone}. Two branches in Chakwal, Punjab — Main Branch & Madina Town Branch.`,
  keywords: ["contact Chakwal Guest House", "Chakwal guest house phone number", "book guest house Chakwal", "Chakwal accommodation contact"],
  alternates: { canonical: `${siteConfig.url}/contact` },
  openGraph: {
    title: `Contact Chakwal Guest House | ${siteConfig.phone}`,
    description: `Get in touch for room bookings and inquiries. Call or WhatsApp ${siteConfig.phone}. Multiple locations in Punjab.`,
    url: `${siteConfig.url}/contact`,
  },
};

const CONTACT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact Chakwal Guest House",
  "url": `${siteConfig.url}/contact`,
  "mainEntity": {
    "@type": "LodgingBusiness",
    "name": "Chakwal Guest House",
    "telephone": "+92-334-7742767",
    "email": "chakwalguesthouse@gmail.com",
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

const BRANCHES = [
  {
    name:    "Chakwal — Main Branch",
    address: "Near District Courts, Talagang Road, Chakwal, Punjab",
    mapUrl:  "https://maps.google.com/?q=Near+District+Courts+Talagang+Road+Chakwal",
    mapEmbed: "https://www.google.com/maps?q=Chakwal,Punjab,Pakistan&z=13&output=embed",
  },
  {
    name:    "Madina Town Branch",
    address: "Madina Town, Chakwal, Punjab — confirmed map pin available",
    mapUrl:  "https://maps.app.goo.gl/XwdyMoE1VWSjJfWDA",
    mapEmbed: "https://www.google.com/maps?q=Madina+Town+Chakwal,Punjab,Pakistan&z=14&output=embed",
  },
];

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(CONTACT_SCHEMA) }} />
      <main>
        {/* Hero */}
        <section className="pt-28 pb-16 bg-surface-elevated border-b border-border">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">Get In Touch</p>
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mb-6">
              Contact Chakwal<br />Guest House
            </h1>
            <p className="text-lg text-muted-foreground">
              For room availability, branch directions or booking questions, call, WhatsApp or use the online booking form.
            </p>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
              <a href={`tel:${siteConfig.phoneE164}`} className="card-luxury rounded-2xl p-6 text-center hover:border-gold-500/30 border border-transparent transition-all group">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-500/20 transition-colors">
                  <Phone className="w-6 h-6 text-gold-400" />
                </div>
                <h2 className="font-bold text-foreground mb-1">Call Us</h2>
                <p className="text-gold-400 font-mono font-semibold">{siteConfig.phone}</p>
                <p className="text-xs text-muted-foreground mt-1">Call to confirm current response hours</p>
              </a>

              <a href={siteConfig.social.whatsappUrl} target="_blank" rel="noreferrer"
                className="card-luxury rounded-2xl p-6 text-center hover:border-[#25D366]/30 border border-transparent transition-all group">
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#25D366]/20 transition-colors">
                  <MessageCircle className="w-6 h-6 text-[#25D366]" />
                </div>
                <h2 className="font-bold text-foreground mb-1">WhatsApp</h2>
                <p className="text-[#25D366] font-mono font-semibold">{siteConfig.phone}</p>
                <p className="text-xs text-muted-foreground mt-1">Response time may vary</p>
              </a>

              <div className="card-luxury rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-gold-400" />
                </div>
                <h2 className="font-bold text-foreground mb-1">Arrival Details</h2>
                <p className="text-foreground font-semibold">Confirm before travel</p>
                <p className="text-xs text-muted-foreground mt-1">Especially for late arrivals</p>
              </div>
            </Reveal>

            {/* Branch Locations */}
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Our Locations</p>
              <h2 className="text-3xl font-bold font-serif text-foreground">Find Us in Chakwal</h2>
            </div>

            <div className="space-y-10">
              {BRANCHES.map((b, i) => (
                <Reveal key={b.name} delay={i * 0.06} className="card-luxury rounded-2xl overflow-hidden block">
                  <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-5 h-5 text-background" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{b.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{b.address}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                      <a href={`tel:${siteConfig.phoneE164}`} className="px-4 py-2 bg-gold-gradient text-background text-sm font-bold rounded-lg hover:shadow-gold-lg transition-all">
                        Call Now
                      </a>
                      <a href={b.mapUrl} target="_blank" rel="noreferrer" className="px-4 py-2 border border-gold-500/30 text-gold-400 text-sm font-semibold rounded-lg hover:bg-gold-500/10 transition-colors">
                        Get Directions
                      </a>
                    </div>
                  </div>
                  <div className="h-64 border-t border-border overflow-hidden">
                    <iframe
                      src={b.mapEmbed}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map of ${b.name}`}
                    />
                  </div>
                </Reveal>
              ))}
            </div>

            {/* Policy info */}
            <div className="mt-12 card-luxury rounded-2xl p-6">
              <h2 className="font-bold text-foreground mb-4 text-lg">Important Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                {[
                  ["Check-In Time", "Flexible (anytime)"],
                  ["Check-Out Time", "12:00 PM (Noon)"],
                  ["Payment Method", "Cash on Arrival"],
                  ["ID Required", "Original CNIC at Check-In"],
                  ["Cancellation", "Free — up to 24 hours before check-in"],
                  ["Booking", `Online or Call/WhatsApp ${siteConfig.phone}`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between border-b border-border pb-2">
                    <span className="font-medium text-foreground">{label}</span>
                    <span>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 bg-surface-elevated border-t border-border">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Get In Touch</p>
              <h2 className="text-3xl font-bold font-serif text-foreground mb-3">Send Us a Message</h2>
              <p className="text-muted-foreground">Fill the form below and we&apos;ll respond via WhatsApp within minutes.</p>
            </div>
            <div className="card-luxury rounded-2xl p-6 sm:p-8">
              <ContactForm />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 bg-surface-base border-t border-border">
          <div className="max-w-xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Book Your Room Online</h2>
            <p className="text-muted-foreground mb-6">Review the current room, branch, price and booking terms before confirming.</p>
            <Link href="/book" className="inline-flex items-center gap-2 px-8 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
              Book a Room Now
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
