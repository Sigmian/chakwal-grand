"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Phone } from "lucide-react";
import { cn } from "@/utils";

const NAV = [
  { label: "Home",       href: "/"          },
  { label: "Rooms",      href: "/rooms"     },
  { label: "About",      href: "/#about"    },
  { label: "FAQ",        href: "/#faq"      },
  { label: "My Booking", href: "/my-booking" },
  { label: "Contact",    href: "/#contact"  },
];

export function PublicNavbar() {
  const pathname   = usePathname();
  const [open, setOpen]       = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
      scrolled
        ? "bg-surface-base/95 backdrop-blur-md border-b border-border shadow-card"
        : "bg-transparent"
    )}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/images/logo.png"
              alt="Chakwal Grand Guest House"
              width={48}
              height={48}
              className="rounded-xl shadow-gold-sm group-hover:shadow-gold-md transition-shadow"
              priority
            />
            <div>
              <p className="font-bold font-serif text-foreground leading-tight text-base">Chakwal Grand</p>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Guest House</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {NAV.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  pathname === href
                    ? "text-gold-400 bg-gold-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a href="tel:+923347742767" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold-400 transition-colors">
              <Phone className="w-3.5 h-3.5" />
              <span className="font-mono">0334-7742767</span>
            </a>
            <Link
              href="/book"
              className="px-5 py-2.5 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              Book Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden border-t border-border bg-surface-elevated/95 backdrop-blur-md">
            <div className="py-4 space-y-1 px-2">
              {NAV.map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  {label}
                </Link>
              ))}
              <div className="pt-2 pb-1 border-t border-border mt-2">
                <a href="tel:+923347742767" className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  0334-7742767
                </a>
                <Link
                  href="/book"
                  onClick={() => setOpen(false)}
                  className="block mx-4 mt-2 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl text-center"
                >
                  Book Now
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
