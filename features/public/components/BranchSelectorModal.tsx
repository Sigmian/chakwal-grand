"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Wifi, Car, Zap, Star, CheckCircle2, X } from "lucide-react";
import { useBranchContext } from "@/components/providers/BranchProvider";
import { siteConfig } from "@/config/site";
import { cn } from "@/utils";

interface Props {
  grandOpeningActive:  boolean;
  minPriceMain:        number | null;
  minPriceMadina:      number | null;
  minPriceMadinaOff:   number | null;
}

const BRANCHES = [
  {
    id:          siteConfig.branchIds.main,
    name:        "Main Branch",
    subtitle:    "Flagship Location",
    address:     "Near District Courts, Talagang Road",
    city:        "Chakwal",
    description: "Our Main Branch near District Courts on Talagang Road. Review its current room listings and arrival details.",
    tag:         "Flagship",
    tagColor:    "bg-gold-500/20 text-gold-300 border-gold-500/30",
    facilities:  ["Current room listings", "Branch details", "Call for facilities"],
    badge:       null,
    gradient:    "from-stone-800 via-stone-700 to-stone-900",
    accentColor: "gold",
  },
  {
    id:          siteConfig.branchIds.madinaTown,
    name:        "Madina Town Branch",
    subtitle:    "New Location",
    address:     "Madina Town",
    city:        "Chakwal",
    description: "Brand new branch with spacious apartment, private lawn, garage, and modern standard rooms.",
    tag:         "New",
    tagColor:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    facilities:  ["Free WiFi", "AC Rooms", "Private Lawn"],
    badge:       "grandOpening",
    gradient:    "from-emerald-900 via-teal-900 to-emerald-950",
    accentColor: "emerald",
  },
] as const;

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export function BranchSelectorModal({ grandOpeningActive, minPriceMain, minPriceMadina, minPriceMadinaOff }: Props) {
  const { selectedBranchId, setSelectedBranch, isLoaded } = useBranchContext();
  const [remember, setRemember] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Show modal only when loaded and no branch selected yet
  useEffect(() => {
    if (isLoaded && !selectedBranchId) {
      const t = setTimeout(() => setVisible(true), 300);
      return () => clearTimeout(t);
    }
  }, [isLoaded, selectedBranchId]);

  // Global ESC + focus-trap handler
  useEffect(() => {
    if (!visible) return;

    // Move focus into modal on open
    const firstFocusable = modalRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { handleDismiss(); return; }

      // Focus trap: cycle Tab/Shift+Tab within modal
      if (e.key === "Tab" && modalRef.current) {
        const focusable = Array.from(modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (!focusable.length) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last.focus(); }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleSelect = (branchId: string) => {
    setSelectedBranch(branchId as typeof siteConfig.branchIds[keyof typeof siteConfig.branchIds], remember);
    setVisible(false);
  };

  // ESC / X dismiss — defaults to Main Branch but does NOT force-remember
  const handleDismiss = () => {
    setSelectedBranch(siteConfig.branchIds.main, false);
    setVisible(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleDismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="branch-modal-title"
          aria-describedby="branch-modal-desc"
        >
          {/* Backdrop — clicking here closes the modal */}
          <motion.div
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            className="relative w-full max-w-3xl bg-surface-elevated/95 backdrop-blur-2xl border border-gold-500/20 rounded-3xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Gold top border glow */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />

            {/* Header */}
            <div className="relative px-6 pt-8 pb-6 text-center">
              {/* Logo mark */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-gradient shadow-gold-md mb-4">
                <span className="text-background font-bold text-xl font-serif">CGH</span>
              </div>

              <h2 id="branch-modal-title" className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-1">
                Choose Your Branch
              </h2>
              <p id="branch-modal-desc" className="text-muted-foreground text-sm">
                Chakwal Guest House · Two locations, one exceptional experience
              </p>

              {/* Dismiss to Main Branch (without remembering) */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-base/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close — defaults to Main Branch"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Branch Cards */}
            <div className="px-6 pb-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BRANCHES.map((branch) => {
                const isHovered = hoveredId === branch.id;
                const showGrandOpening = branch.badge === "grandOpening" && grandOpeningActive;

                return (
                  <motion.button
                    key={branch.id}
                    onClick={() => handleSelect(branch.id)}
                    onMouseEnter={() => setHoveredId(branch.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={cn(
                      "relative text-left rounded-2xl overflow-hidden border transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400",
                      isHovered
                        ? "border-gold-500/60 shadow-gold-lg"
                        : "border-border hover:border-gold-500/40",
                    )}
                  >
                    {/* Card gradient background */}
                    <div className={cn("absolute inset-0 bg-gradient-to-br opacity-60", branch.gradient)} />
                    <div className="absolute inset-0 bg-surface-elevated/70" />

                    {/* Grand Opening ribbon */}
                    {showGrandOpening && (
                      <div className="absolute top-0 right-0 overflow-hidden w-24 h-24 pointer-events-none">
                        <div className="absolute top-4 right-[-20px] w-28 bg-emerald-500 text-white text-[9px] font-bold py-1 text-center rotate-45 shadow-lg tracking-wider">
                          50% OFF
                        </div>
                      </div>
                    )}

                    <div className="relative p-5">
                      {/* Tag + badge */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", branch.tagColor)}>
                          {branch.tag}
                        </span>
                        {showGrandOpening && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                            🔥 Grand Opening
                          </span>
                        )}
                      </div>

                      {/* Branch name */}
                      <h3 className="font-serif text-lg font-bold text-foreground leading-tight mb-1">
                        {branch.name}
                      </h3>

                      {/* Location */}
                      <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-3">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span>{branch.address}, {branch.city}</span>
                      </div>

                      {/* Description */}
                      <p className="text-muted-foreground text-xs leading-relaxed mb-4">
                        {branch.description}
                      </p>

                      {/* Pricing */}
                      {branch.id === siteConfig.branchIds.main && minPriceMain && (
                        <div className="mb-4 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-gold-300 font-bold text-sm">
                              PKR {minPriceMain.toLocaleString("en-PK")}/night
                            </span>
                            <span className="text-muted-foreground text-xs">· Starting from</span>
                          </div>
                          <p className="text-gold-300/60 text-[10px] mt-0.5">Best price guaranteed</p>
                        </div>
                      )}

                      {branch.id === siteConfig.branchIds.madinaTown && showGrandOpening && minPriceMadina && minPriceMadinaOff && (
                        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-muted-foreground text-xs line-through">
                              PKR {minPriceMadina.toLocaleString("en-PK")}/night
                            </span>
                            <span className="text-emerald-400 font-bold text-sm">
                              PKR {minPriceMadinaOff.toLocaleString("en-PK")}/night
                            </span>
                            <span className="text-emerald-400 text-xs">· Valid till 31 July</span>
                          </div>
                          <p className="text-emerald-300/80 text-[10px] mt-0.5">50% discount applied automatically at checkout</p>
                        </div>
                      )}

                      {branch.id === siteConfig.branchIds.madinaTown && !showGrandOpening && minPriceMadina && (
                        <div className="mb-4 p-3 rounded-xl bg-gold-500/10 border border-gold-500/20">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-gold-300 font-bold text-sm">
                              PKR {minPriceMadina.toLocaleString("en-PK")}/night
                            </span>
                            <span className="text-muted-foreground text-xs">· Starting from</span>
                          </div>
                        </div>
                      )}

                      {/* Facilities */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {branch.facilities.map((f) => (
                          <span key={f} className="flex items-center gap-1 text-[10px] text-muted-foreground bg-surface-base/80 border border-border rounded-full px-2 py-0.5">
                            {f === "Free WiFi"    && <Wifi className="w-2.5 h-2.5" />}
                            {f === "Call for facilities" && <Car  className="w-2.5 h-2.5" />}
                            {f === "AC Rooms"     && <Zap  className="w-2.5 h-2.5" />}
                            {f === "Private Lawn" && <Star className="w-2.5 h-2.5" />}
                            {f}
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className={cn(
                        "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                        isHovered
                          ? "bg-gold-gradient text-background shadow-gold-sm"
                          : "bg-surface-base border border-border text-muted-foreground",
                      )}>
                        {isHovered && <CheckCircle2 className="w-4 h-4" />}
                        Select This Branch
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/50">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-gold-500 cursor-pointer"
                />
                <span className="text-xs text-muted-foreground">Remember my choice</span>
              </label>
              <p className="text-[11px] text-muted-foreground/60 text-center sm:text-right">
                You can switch branches anytime from the navigation menu
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
