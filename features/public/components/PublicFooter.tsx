import Link from "next/link";
import { Phone, MapPin, Clock, Mail } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getPublicRooms } from "@/server/actions/public";

const TYPE_ORDER = ["STANDARD", "FAMILY", "DELUXE", "SUITE", "VIP"] as const;
const TYPE_LABEL: Record<string, string> = {
  STANDARD: "Classic Room",
  FAMILY:   "Family Room",
  DELUXE:   "Executive Room",
  SUITE:    "Apartment Suite",
  VIP:      "VIP Suite",
};

export async function PublicFooter() {
  const rooms = await getPublicRooms();

  // Build one entry per room type: lowest price in that type
  const roomEntries = TYPE_ORDER
    .map(type => {
      const match = rooms.filter(r => r.type === type);
      if (!match.length) return null;
      const minPrice = Math.min(...match.map(r => Number(r.pricePerNight)));
      return { label: TYPE_LABEL[type], price: minPrice };
    })
    .filter(Boolean) as { label: string; price: number }[];

  return (
    <footer className="bg-surface-elevated border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main footer grid */}
        <div className="py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center shadow-gold-sm">
                <span className="text-background font-bold font-serif text-lg">CG</span>
              </div>
              <div>
                <p className="font-bold font-serif text-foreground">{siteConfig.name.split(" ").slice(0, 2).join(" ")}</p>
                <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Guest House</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium guest house chain serving Chakwal, Kallar Kahar, and Sargodha. Affordable luxury with 24/7 service.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href={siteConfig.social.whatsappUrl} target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-xs font-bold">
                WA
              </a>
              <a href={`tel:${siteConfig.phoneE164}`}
                className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 hover:bg-gold-500/20 transition-colors">
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Quick Links</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Home",         href: "/"           },
                { label: "Our Rooms",    href: "/rooms"      },
                { label: "Book a Room",  href: "/book"       },
                { label: "My Booking",  href: "/my-booking" },
                { label: "About Us",    href: "/about"      },
                { label: "Contact Us",  href: "/contact"    },
                { label: "Our Location",href: "/location"   },
                { label: "Travel Blog", href: "/blog"       },

              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-gold-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Room Types — prices pulled live from DB */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Room Types</h4>
            <ul className="space-y-2.5">
              {roomEntries.map(({ label, price }) => (
                <li key={label}>
                  <Link href="/rooms" className="text-sm text-muted-foreground hover:text-gold-400 transition-colors">
                    {label} — ₨{price.toLocaleString()}/night
                  </Link>
                </li>
              ))}
              {roomEntries.length === 0 && (
                <li>
                  <Link href="/rooms" className="text-sm text-muted-foreground hover:text-gold-400 transition-colors">
                    View all room types →
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Contact — all values from siteConfig */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <a href={`tel:${siteConfig.phoneE164}`} className="text-sm text-foreground hover:text-gold-400 transition-colors font-mono">
                    {siteConfig.phone}
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">Call or WhatsApp</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{siteConfig.branches[0].address}</p>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-foreground">24/7 Available</p>
                  <p className="text-xs text-muted-foreground mt-0.5">A/C timing: {siteConfig.acHoursDaily} hours daily</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <a href={`mailto:${siteConfig.email}`} className="text-sm text-muted-foreground hover:text-gold-400 transition-colors">
                  {siteConfig.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Advance bookings preferred · Check-in {siteConfig.checkInTime} · Check-out {siteConfig.checkOutTime}
          </p>
        </div>
      </div>
    </footer>
  );
}
