"use client";

import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { cn } from "@/utils";
import { siteConfig } from "@/config/site";

const FAQS = [
  {
    category: "Booking & Reservations",
    items: [
      {
        q: "How do I book a room?",
        a: `You can book online through our website (click 'Book Now'), send a WhatsApp message to ${siteConfig.phone}, or call us directly. Online bookings get an instant reference number. We recommend calling to confirm your booking once made.`,
      },
      {
        q: "Is advance booking required?",
        a: "Advance booking is strongly recommended to guarantee your room, especially on weekends and public holidays. Walk-in guests are welcome based on availability, but calling ahead ensures you get your preferred room type.",
      },
      {
        q: "What is your cancellation policy?",
        a: `Cancellation terms can vary by booking. Review the terms shown before confirmation and call ${siteConfig.phone} before cancelling if anything is unclear.`,
      },
      {
        q: "Do I need to pay anything online to book?",
        a: "The payment method and amount due are shown during the booking process. Review those details before confirming, or call us if you need another arrangement.",
      },
    ],
  },
  {
    category: "Rooms & Amenities",
    items: [
      {
        q: "What is included in the room rate?",
        a: "Facilities differ by room and branch. Open the room details to review the listed facilities, occupancy and branch, and confirm any essential requirement before booking.",
      },
      {
        q: "Do you have air-conditioned rooms?",
        a: "Air-conditioned options are identified in the current room listings when available. Check the room details for the selected branch and dates.",
      },
      {
        q: "Are meals included?",
        a: "Do not assume meals are included. Check the selected room and booking details, or call us to confirm current meal options for your branch.",
      },
      {
        q: "Do you have family rooms?",
        a: "Family options may be listed when available. Check each room's exact adult and child occupancy, branch, bed details and current price before booking.",
      },
    ],
  },
  {
    category: "Check-in & Check-out",
    items: [
      {
        q: "What are the check-in and check-out times?",
        a: "Check-out is 12:00 PM. Confirm the available check-in time during booking and contact us in advance for a late or unusual arrival.",
      },
      {
        q: "What documents do I need at check-in?",
        a: "All guests must present their original CNIC (National Identity Card) at check-in. Foreign nationals should bring their passport. This is a legal requirement for all guest houses in Pakistan.",
      },
      {
        q: "Can I request early check-in?",
        a: `Early check-in is subject to room availability. Please call us at ${siteConfig.phone} the day before to request it. We'll do our best to accommodate you, sometimes at a small extra charge for the additional hours.`,
      },
    ],
  },
  {
    category: "Location & Facilities",
    items: [
      {
        q: "Where are you located?",
        a: "We have two Chakwal locations: the Main Branch near District Courts on Talagang Road and the Madina Town branch. Use the confirmed pin on the Madina Town branch page for directions.",
      },
      {
        q: "Is parking available?",
        a: "Parking arrangements can differ by branch and vehicle size. Call before arrival to confirm suitable space for your vehicle.",
      },
      {
        q: "Is the guest house suitable for families?",
        a: "Check the current family-room occupancy and facilities for your selected branch. For children, older relatives or accessibility needs, call to confirm the exact room setup before booking.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("border border-border rounded-xl overflow-hidden transition-all", open && "border-gold-500/30")}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-accent/50 transition-colors"
      >
        <span className={cn("text-sm font-medium leading-snug", open ? "text-gold-400" : "text-foreground")}>{q}</span>
        <ChevronDown className={cn("w-4 h-4 flex-shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180 text-gold-400")} />
      </button>
      {open && (
        <div className="px-5 pb-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground leading-relaxed pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

export function FAQSection() {
  const [activeCategory, setActiveCategory] = useState(FAQS[0].category);

  return (
    <section id="faq" className="py-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">FAQ</p>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to know about staying at Chakwal Guest House. Can't find your answer?
            Ask our AI assistant or call us directly.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {FAQS.map(({ category }) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-all",
                activeCategory === category
                  ? "bg-gold-gradient text-background shadow-gold-sm"
                  : "bg-surface-elevated border border-border text-muted-foreground hover:border-gold-500/30 hover:text-foreground"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ items */}
        {FAQS.filter(f => f.category === activeCategory).map(({ items }) => (
          <div key={activeCategory} className="space-y-2">
            {items.map(({ q, a }) => (
              <FAQItem key={q} q={q} a={a} />
            ))}
          </div>
        ))}

        {/* Still need help? */}
        <div className="mt-10 card-luxury rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-gold-500/10">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Still have questions?</p>
              <p className="text-xs text-muted-foreground mt-0.5">Use WhatsApp or call to confirm a requirement</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <a href={siteConfig.social.whatsappUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold rounded-xl hover:bg-[#25D366]/25 transition-colors">
              WhatsApp Us
            </a>
            <a href={`tel:${siteConfig.phoneE164}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-gold-500/15 border border-gold-500/30 text-gold-400 text-xs font-semibold rounded-xl hover:bg-gold-500/25 transition-colors">
              Call {siteConfig.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
