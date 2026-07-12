import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Terms of Use | ${siteConfig.name}`,
  description: "Terms and conditions for staying at Chakwal Guest House in Chakwal, Punjab, Pakistan.",
  alternates: { canonical: `${siteConfig.url}/terms` },
};

export default function TermsPage() {
  return (
    <main className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">Legal</p>
        <h1 className="text-4xl font-bold font-serif text-foreground mb-2">Terms of Use</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: June 2025</p>

        <div className="space-y-8 text-muted-foreground">

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Booking & Reservations</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>All bookings are subject to room availability at the time of confirmation.</li>
              <li>A valid CNIC (National Identity Card) is required at check-in for all adult guests as per Pakistani law.</li>
              <li>Bookings made online are tentative until confirmed by our reception team.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Check-In & Check-Out</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Check-in is flexible — guests are welcome to arrive at any time. Let us know your arrival time so we can have your room ready.</li>
              <li>Standard check-out time: 12:00 PM (Noon). Late check-out may incur additional charges.</li>
              <li>Guests must vacate the room by check-out time unless an extension is arranged.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Payment</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Payment is due at check-in or as per the agreed arrangement.</li>
              <li>We accept cash, bank transfer, JazzCash, and EasyPaisa.</li>
              <li>In-room canteen orders are added to your total bill.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Cancellation Policy</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>The cancellation terms shown on your booking confirmation apply to that reservation. Contact us before cancelling if the terms are unclear.</li>
              <li>Late cancellations or no-shows may be subject to a one-night charge at management&apos;s discretion.</li>
              <li>To cancel, call or WhatsApp us at {siteConfig.phone}.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Guest Conduct</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Guests are expected to maintain decorum and respect other guests and staff.</li>
              <li>Noise should be kept to a minimum after 11:00 PM.</li>
              <li>Damage to property will be charged to the guest.</li>
              <li>Chakwal Guest House reserves the right to refuse service to anyone who violates our policies.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Liability</h2>
            <p className="text-sm">Chakwal Guest House is not liable for loss of personal belongings. Guests are advised to keep valuables secure. We are not responsible for circumstances beyond our control (power outages, weather events, etc.).</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Contact</h2>
            <p className="text-sm">For queries about these terms, contact us at{" "}
              <a href="mailto:chakwalguesthouse@gmail.com" className="text-gold-400 hover:underline">chakwalguesthouse@gmail.com</a>{" "}
              or call <a href={`tel:${siteConfig.phoneE164}`} className="text-gold-400 hover:underline">{siteConfig.phone}</a>.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
