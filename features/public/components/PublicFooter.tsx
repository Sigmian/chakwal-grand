import Link from "next/link";
import { Phone, MapPin, Clock, Mail } from "lucide-react";

export function PublicFooter() {
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
                <p className="font-bold font-serif text-foreground">Chakwal Grand</p>
                <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Guest House</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium guest house chain serving Chakwal, Kallar Kahar, and Sargodha. Affordable luxury with 24/7 service.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://wa.me/923347742767" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors text-xs font-bold">
                WA
              </a>
              <a href="tel:+923347742767"
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
                { label: "Home",        href: "/"       },
                { label: "Our Rooms",   href: "/rooms"  },
                { label: "Book a Room", href: "/book"   },
                { label: "About Us",    href: "/#about" },
                { label: "Contact",     href: "/#contact" },
                { label: "Staff Login", href: "/login"  },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-gold-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Rooms */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Room Types</h4>
            <ul className="space-y-2.5">
              {[
                { label: "Classic Room — ₨2,000/night",   href: "/rooms" },
                { label: "Classic A/C — ₨2,500/night",   href: "/rooms" },
                { label: "Family Room — ₨2,500/night",   href: "/rooms" },
                { label: "Executive — ₨3,000/night",     href: "/rooms" },
                { label: "Executive A/C — ₨4,000/night", href: "/rooms" },
                { label: "Apartment A/C — ₨4,500/night", href: "/rooms" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-muted-foreground hover:text-gold-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <a href="tel:+923347742767" className="text-sm text-foreground hover:text-gold-400 transition-colors font-mono">
                    0334-7742767
                  </a>
                  <p className="text-xs text-muted-foreground mt-0.5">Call or WhatsApp</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">Near Dist. Complex,<br />Talagang Road, Chakwal</p>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-foreground">24/7 Available</p>
                  <p className="text-xs text-muted-foreground mt-0.5">A/C timing: 12 hours daily</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gold-400 mt-0.5 flex-shrink-0" />
                <a href="mailto:info@chakwalgrand.pk" className="text-sm text-muted-foreground hover:text-gold-400 transition-colors">
                  info@chakwalgrand.pk
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Chakwal Grand Guest House. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Advance bookings preferred · Check-in 2:00 PM · Check-out 12:00 PM
          </p>
        </div>
      </div>
    </footer>
  );
}
