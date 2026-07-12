import Link from "next/link";
import { Phone, MapPin, Clock, Mail, Facebook, Star } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getPublicRoomTypes } from "@/server/actions/public";

const TYPE_ORDER = ["STANDARD", "FAMILY", "DELUXE", "SUITE", "VIP"] as const;
const TYPE_LABEL: Record<string, string> = {
  STANDARD: "Classic Room",
  FAMILY:   "Family Room",
  DELUXE:   "Executive Room",
  SUITE:    "Apartment Suite",
  VIP:      "VIP Suite",
};

export async function PublicFooter() {
  const rooms = await getPublicRoomTypes();

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
                <span className="text-background font-bold font-serif text-lg">{siteConfig.shortName}</span>
              </div>
              <div>
                <p className="font-bold font-serif text-foreground">Chakwal</p>
                <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Guest House</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              {siteConfig.tagline}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2">
              Compare current rooms at our Main Branch and Madina Town branch in Chakwal.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href={siteConfig.social.whatsappUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp"
                className="w-9 h-9 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
              </a>
              <a href={siteConfig.social.facebookUrl} target="_blank" rel="noreferrer" aria-label="Facebook"
                className="w-9 h-9 rounded-xl bg-[#1877F2]/10 border border-[#1877F2]/30 flex items-center justify-center text-[#1877F2] hover:bg-[#1877F2]/20 transition-colors">
                <Facebook className="w-4 h-4 fill-current" />
              </a>
              <a href={siteConfig.social.googleBusinessUrl} target="_blank" rel="noreferrer" aria-label="Google Reviews"
                className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 hover:bg-gold-500/20 transition-colors">
                <Star className="w-4 h-4 fill-current" />
              </a>
              <a href={`tel:${siteConfig.phoneE164}`} aria-label="Call"
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
                { label: "Main Branch", href: "/locations/main-branch-talagang-road" },
                { label: "Madina Town", href: "/locations/madina-town" },
                { label: "Travel Blog",  href: "/blog"        },
                { label: "Guest Portal", href: "/guest/login" },
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
                    {label} — PKR {price.toLocaleString()}/night
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
            © {new Date().getFullYear()} {siteConfig.name}. All Rights Reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/privacy-policy" className="text-xs text-muted-foreground hover:text-gold-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-gold-400 transition-colors">Terms of Use</Link>
            <span className="text-xs text-muted-foreground hidden sm:inline">Check-in {siteConfig.checkInTime} · Check-out {siteConfig.checkOutTime}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
