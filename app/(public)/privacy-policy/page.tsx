import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Privacy Policy | ${siteConfig.name}`,
  description: "Privacy policy for Chakwal Grand Guest House. Learn how we collect and protect your personal information.",
  alternates: { canonical: `${siteConfig.url}/privacy-policy` },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">Legal</p>
        <h1 className="text-4xl font-bold font-serif text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: June 2025</p>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Information We Collect</h2>
            <p>When you make a booking or use our services, we collect:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
              <li>Name, phone number, and CNIC (for identity verification at check-in)</li>
              <li>Booking details including check-in/check-out dates and room preference</li>
              <li>Payment information (amount paid; we do not store card details)</li>
              <li>In-room order history during your stay</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>To process and confirm your room booking</li>
              <li>To manage your stay and in-room service requests</li>
              <li>To contact you regarding your reservation via phone or WhatsApp</li>
              <li>To comply with legal obligations (CNIC verification as required by Pakistani law)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Data Sharing</h2>
            <p className="text-sm">We do not sell or share your personal data with third parties for marketing purposes. Your information is accessed only by our staff members who need it to manage your stay.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. Data Security</h2>
            <p className="text-sm">We use industry-standard security measures to protect your data. All data is stored on secured servers with access controls.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">5. Data Retention</h2>
            <p className="text-sm">We retain your booking records for a minimum of 3 years as required by Pakistani hospitality regulations. You may request deletion of non-legally-required data by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">6. Your Rights</h2>
            <p className="text-sm">You have the right to access, correct, or request deletion of your personal data. Contact us at{" "}
              <a href="mailto:chakwalguesthouse@gmail.com" className="text-gold-400 hover:underline">
                chakwalguesthouse@gmail.com
              </a>{" "}or call{" "}
              <a href={`tel:${siteConfig.phoneE164}`} className="text-gold-400 hover:underline">{siteConfig.phone}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">7. Contact</h2>
            <p className="text-sm">For privacy-related inquiries, contact Chakwal Grand Guest House at <a href="mailto:chakwalguesthouse@gmail.com" className="text-gold-400 hover:underline">chakwalguesthouse@gmail.com</a> or visit us at Near District Courts, Talagang Road, Chakwal, Punjab, Pakistan.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
