"use client";

import { useState } from "react";
import { X, Megaphone } from "lucide-react";

interface Props {
  title: string;
  body: string;
}

export function AnnouncementBanner({ title, body }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gold-500/10 border-b border-gold-500/30 text-gold-400">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <Megaphone className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1 text-sm">
          {title && <span className="font-bold mr-2">{title}:</span>}
          <span className="text-gold-400/90">{body}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 p-1 rounded hover:bg-gold-500/20 transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
