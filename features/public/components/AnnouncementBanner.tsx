"use client";

import { useState } from "react";
import { X, Tag } from "lucide-react";

interface Props {
  title: string;
  body:  string;
}

export function AnnouncementBanner({ title, body }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const text = [title, body].filter(Boolean).join(" — ");
  // Repeat enough times so the loop feels seamless at any screen width
  const repeated = Array(6).fill(text).join("   ✦   ");

  return (
    <div className="relative z-50 bg-gradient-to-r from-gold-600 via-amber-500 to-gold-600 text-background overflow-hidden">
      {/* Scrolling track */}
      <div className="flex items-center py-2 gap-0 overflow-hidden">
        {/* Left icon badge */}
        <div className="flex-shrink-0 flex items-center gap-1.5 pl-4 pr-3 z-10 bg-gradient-to-r from-gold-600 via-gold-600 to-transparent">
          <Tag className="w-3.5 h-3.5 fill-current" />
          <span className="text-xs font-black uppercase tracking-widest whitespace-nowrap">
            Offer
          </span>
        </div>

        {/* Marquee */}
        <div className="flex-1 overflow-hidden relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-amber-500 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-amber-500 to-transparent z-10 pointer-events-none" />

          <div className="marquee-track flex whitespace-nowrap">
            <span className="marquee-content inline-block text-sm font-semibold tracking-wide pr-12">
              {repeated}
            </span>
            {/* Duplicate for seamless loop */}
            <span className="marquee-content inline-block text-sm font-semibold tracking-wide pr-12" aria-hidden>
              {repeated}
            </span>
          </div>
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1.5 mr-2 rounded-full hover:bg-black/20 transition-colors z-10"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <style>{`
        .marquee-track {
          animation: marquee 28s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
