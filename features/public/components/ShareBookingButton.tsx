"use client";

import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

interface Props {
  bookingRef: string;
  shareToken: string;
}

export function ShareBookingButton({ bookingRef, shareToken }: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : "https://www.staychakwal.de"}/booking-confirmation/${bookingRef}?t=${shareToken}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Booking ${bookingRef} — Chakwal Grand Guest House`,
          text: `View my booking confirmation at Chakwal Grand Guest House (Ref: ${bookingRef})`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall through to clipboard copy if share is cancelled/not supported
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Clipboard also failed — show prompt fallback
      window.prompt("Copy this booking link:", shareUrl);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-accent border border-border text-muted-foreground text-sm font-semibold rounded-xl hover:border-gold-500/30 hover:text-foreground transition-all"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-green-400">Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Share Booking
        </>
      )}
    </button>
  );
}
