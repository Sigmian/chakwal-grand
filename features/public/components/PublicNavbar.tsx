"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, Phone, MapPin, ChevronDown, ArrowLeftRight } from "lucide-react";
import { cn } from "@/utils";
import { siteConfig } from "@/config/site";
import { useBranchContext } from "@/components/providers/BranchProvider";

const NAV = [
  { label: "Home",         href: "/"           },
  { label: "Rooms",        href: "/rooms"      },
  { label: "Gallery",      href: "/gallery"    },
  { label: "Blog",         href: "/blog"       },
  { label: "About",        href: "/about"      },
  { label: "Locations",    href: "/location"   },
  { label: "Contact",      href: "/contact"    },
  { label: "My Booking",   href: "/my-booking" },
  { label: "My Stay",      href: "/guest/login"},
  { label: "My Account",   href: "/my-account" },
];

export function PublicNavbar() {
  const pathname   = usePathname();
  const [open, setOpen]           = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const branchRef = useRef<HTMLDivElement>(null);

  const { selectedBranchId, setSelectedBranch, clearBranch, isLoaded } = useBranchContext();
  const selectedBranch = siteConfig.branches.find(b => b.id === selectedBranchId) ?? null;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close branch dropdown on outside click or ESC
  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (branchRef.current && !branchRef.current.contains(e.target as Node)) {
        setBranchOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setBranchOpen(false); setOpen(false); }
    };
    document.addEventListener("mousedown", onMouse);
    document.addEventListener("keydown",   onKey);
    return () => {
      document.removeEventListener("mousedown", onMouse);
      document.removeEventListener("keydown",   onKey);
    };
  }, []);

  const handleSwitchBranch = (branchId: string) => {
    setSelectedBranch(branchId as typeof siteConfig.branchIds[keyof typeof siteConfig.branchIds], true);
    setBranchOpen(false);
    setOpen(false);
  };

  const handleShowModal = () => {
    clearBranch();
    setBranchOpen(false);
    setOpen(false);
  };

  return (
    <header className={cn(
      "left-0 right-0 z-50 transition-all duration-300",
      scrolled
        ? "bg-surface-base/95 backdrop-blur-md border-b border-border shadow-card"
        : "bg-transparent"
    )}>
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <Image
              src="/images/logo.png"
              alt="Chakwal Guest House"
              width={48}
              height={48}
              className="rounded-xl shadow-gold-sm group-hover:shadow-gold-md transition-shadow"
              priority
            />
            <div>
              <p className="font-bold font-serif text-foreground leading-tight text-base">Chakwal</p>
              <p className="text-[10px] text-muted-foreground tracking-widest uppercase">Guest House</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            {NAV.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-medium transition-all",
                  (href === "/" ? pathname === href : pathname.startsWith(href))
                    ? "text-gold-400 bg-gold-500/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Right side: Branch selector + phone + CTA */}
          <div className="hidden md:flex items-center gap-2">

            {/* Branch indicator — skeleton prevents CLS on hydration */}
            {!isLoaded && (
              <div className="h-8 w-28 rounded-xl bg-surface-elevated/50 border border-border animate-pulse" />
            )}
            {isLoaded && selectedBranch && (
              <div className="relative" ref={branchRef}>
                <button
                  onClick={() => setBranchOpen(v => !v)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all",
                    branchOpen
                      ? "bg-gold-500/15 border-gold-500/40 text-gold-300"
                      : "bg-surface-elevated/80 border-border text-muted-foreground hover:border-gold-500/30 hover:text-foreground"
                  )}
                >
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="max-w-[120px] truncate">{selectedBranch.name}</span>
                  <ChevronDown className={cn("w-3 h-3 transition-transform", branchOpen && "rotate-180")} />
                </button>

                {branchOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-surface-elevated border border-border rounded-2xl shadow-2xl overflow-hidden z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Switch Branch</p>
                    </div>
                    {siteConfig.branches.map((branch) => (
                      <button
                        key={branch.id}
                        onClick={() => handleSwitchBranch(branch.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-surface-base transition-colors",
                          branch.id === selectedBranchId && "bg-gold-500/5"
                        )}
                      >
                        <MapPin className="w-3.5 h-3.5 text-gold-400 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className={cn("text-sm font-medium leading-tight", branch.id === selectedBranchId ? "text-gold-400" : "text-foreground")}>
                            {branch.name}
                            {branch.id === selectedBranchId && <span className="ml-1.5 text-[9px] bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded-full">Current</span>}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{branch.address}</p>
                          {branch.label && (
                            <span className={cn(
                              "inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full font-medium",
                              branch.id === siteConfig.branchIds.madinaTown
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-gold-500/15 text-gold-400"
                            )}>
                              {branch.label}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                    <div className="border-t border-border">
                      <button
                        onClick={handleShowModal}
                        className="w-full flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-base transition-colors"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        Compare both branches
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <a href={`tel:${siteConfig.phoneE164}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold-400 transition-colors">
              <Phone className="w-3.5 h-3.5" />
              <span className="font-mono">{siteConfig.phone}</span>
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
            className="md:hidden p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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

              {/* Mobile branch switcher */}
              {isLoaded && selectedBranch && (
                <div className="pt-2 border-t border-border mt-2 px-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold px-2 mb-2">Current Branch</p>
                  {siteConfig.branches.map((branch) => (
                    <button
                      key={branch.id}
                      onClick={() => handleSwitchBranch(branch.id)}
                      className={cn(
                        "w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors",
                        branch.id === selectedBranchId ? "bg-gold-500/10 text-gold-400" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{branch.name}</p>
                        <p className="text-xs opacity-70">{branch.address}</p>
                      </div>
                      {branch.id === selectedBranchId && <span className="ml-auto text-[9px] bg-gold-500/20 text-gold-400 px-1.5 py-0.5 rounded-full">Active</span>}
                    </button>
                  ))}
                  <button
                    onClick={handleShowModal}
                    className="w-full flex items-center gap-2 px-3 py-2.5 mt-1 rounded-xl text-xs text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    Compare branches
                  </button>
                </div>
              )}

              <div className="pt-2 pb-1 border-t border-border mt-2">
                <a href={`tel:${siteConfig.phoneE164}`} className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {siteConfig.phone}
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
