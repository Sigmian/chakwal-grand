import type { Metadata } from "next";
import Link from "next/link";
import { Phone, MapPin, Clock, MessageCircle, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | Chakwal Grand Guest House — Call & WhatsApp 0334-7742767",
  description: "Contact Chakwal Grand Guest House for room bookings, inquiries, and reservations. Call or WhatsApp 0334-7742767. Located in Chakwal, Kallar Kahar & Sargodha, Punjab.",
  keywords: ["contact Chakwal Grand Guest House", "Chakwal guest house phone number", "book guest house Chakwal", "Chakwal accommodation contact"],
  alternates: { canonical: "https://www.staychakwal.de/contact" },
  openGraph: {
    title: "Contact Chakwal Grand Guest House | 0334-7742767",
    description: "Get in touch for room bookings and inquiries. Call or WhatsApp 0334-7742767. Multiple locations in Punjab.",
    url: "https://www.staychakwal.de/contact",
  },
};

const CONTACT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact Chakwal Grand Guest House",
  "url": "https://www.staychakwal.de/contact",
  "mainEntity": {
    "@type": "LodgingBusiness",
    "name": "Chakwal Grand Guest House",
    "telephone": "+92-334-7742767",
    "email": "chakwalguesthouse@gmail.com",
    "url": "https://www.staychakwal.de",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Near District Courts, Talagang Road",
      "addressLocality": "Chakwal",
      "addressRegion": "Punjab",
      "addressCountry": "PK",
    },
    "openingHours": "Mo-Su 00:00-23:59",
  },
};

const BRANCHES = [
  {
    name:    "Chakwal — Main Branch",
    address: "Near District Courts, Talagang Road, Chakwal, Punjab",
    mapUrl:  "https://maps.google.com/?q=Near+District+Courts+Talagang+Road+Chakwal",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3317.3!2d72.856!3d32.931!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDU1JzUxLjUiTiA3MsKwNTEnMjEuNiJF!5e0!3m2!1sen!2spk!4v1",
  },
  {
    name:    "Kallar Kahar Branch",
    address: "Lake View Road, Near Salt Mine, Kallar Kahar, Chakwal, Punjab",
    mapUrl:  "https://maps.google.com/?q=Kallar+Kahar+Lake+View+Road+Chakwal",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3317.3!2d72.7!3d32.8!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDQ4JzAwLjAiTiA3MsKwNDInMDAuMCJF!5e0!3m2!1sen!2spk!4v1",
  },
  {
    name:    "Sargodha Branch",
    address: "University Road, Near Peoples Colony, Sargodha, Punjab",
    mapUrl:  "https://maps.google.com/?q=University+Road+Sargodha+Punjab",
    mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3317.3!2d72.67!3d32.08!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzLCsDA0JzQ4LjAiTiA3MsKwNDAnMTIuMCJF!5e0!3m2!1sen!2spk!4v1",
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
              Contact Chakwal Grand<br />Guest House
            </h1>
            <p className="text-lg text-muted-foreground">
              For room bookings, availability queries, or any assistance — we are available 24/7.
              Call us, WhatsApp us, or book online instantly.
            </p>
          </div>
        </section>

        {/* Contact Cards */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
              <a href="tel:+923347742767" className="card-luxury rounded-2xl p-6 text-center hover:border-gold-500/30 border border-transparent transition-all group">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-gold-500/20 transition-colors">
                  <Phone className="w-6 h-6 text-gold-400" />
                </div>
                <h2 className="font-bold text-foreground mb-1">Call Us</h2>
                <p className="text-gold-400 font-mono font-semibold">0334-7742767</p>
                <p className="text-xs text-muted-foreground mt-1">Available 24/7</p>
              </a>

              <a href="https://wa.me/923347742767?text=Hi, I want to book a room at Chakwal Grand Guest House" target="_blank" rel="noreferrer"
                className="card-luxury rounded-2xl p-6 text-center hover:border-[#25D366]/30 border border-transparent transition-all group">
                <div className="w-12 h-12 rounded-xl bg-[#25D366]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#25D366]/20 transition-colors">
                  <MessageCircle className="w-6 h-6 text-[#25D366]" />
                </div>
                <h2 className="font-bold text-foreground mb-1">WhatsApp</h2>
                <p className="text-[#25D366] font-mono font-semibold">0334-7742767</p>
                <p className="text-xs text-muted-foreground mt-1">Instant reply</p>
              </a>

              <div className="card-luxury rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-gold-400" />
                </div>
                <h2 className="font-bold text-foreground mb-1">Reception Hours</h2>
                <p className="text-foreground font-semibold">Open 24 Hours</p>
                <p className="text-xs text-muted-foreground mt-1">7 days a week</p>
              </div>
            </div>

            {/* Branch Locations */}
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Our Locations</p>
              <h2 className="text-3xl font-bold font-serif text-foreground">Find Us in Punjab</h2>
            </div>

            <div className="space-y-10">
              {BRANCHES.map(b => (
                <div key={b.name} className="card-luxury rounded-2xl overflow-hidden">
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
                      <a href="tel:+923347742767" className="px-4 py-2 bg-gold-gradient text-background text-sm font-bold rounded-lg hover:shadow-gold-lg transition-all">
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
                </div>
              ))}
            </div>

            {/* Policy info */}
            <div className="mt-12 card-luxury rounded-2xl p-6">
              <h2 className="font-bold text-foreground mb-4 text-lg">Important Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                {[
                  ["Check-In Time", "2:00 PM"],
                  ["Check-Out Time", "12:00 PM (Noon)"],
                  ["Payment Method", "Cash on Arrival"],
                  ["ID Required", "Original CNIC at Check-In"],
                  ["Cancellation", "Free — up to 24 hours before check-in"],
                  ["Booking", "Online or Call/WhatsApp 0334-7742767"],
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

        {/* CTA */}
        <section className="py-12 bg-surface-elevated">
          <div className="max-w-xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold font-serif text-foreground mb-4">Book Your Room Online</h2>
            <p className="text-muted-foreground mb-6">No advance payment needed. Reserve your room in 2 minutes.</p>
            <Link href="/book" className="inline-flex items-center gap-2 px-8 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all">
              Book a Room Now
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
