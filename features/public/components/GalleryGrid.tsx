"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/utils";

interface GalleryImage {
  id:       string;
  url:      string;
  altText:  string;
  roomName: string;
  roomType: string;
  isCover:  boolean;
}

const TYPE_LABELS: Record<string, string> = {
  STANDARD: "Classic Room", DELUXE: "Executive Room",
  SUITE: "Suite", FAMILY: "Family Room", VIP: "VIP Room",
};

interface Props { images: GalleryImage[] }

export function GalleryGrid({ images }: Props) {
  const [activeType, setActiveType] = useState<string>("ALL");
  const [lightbox, setLightbox]     = useState<number | null>(null);

  const types    = ["ALL", ...Array.from(new Set(images.map(i => i.roomType)))];
  const filtered = activeType === "ALL" ? images : images.filter(i => i.roomType === activeType);

  const openLightbox  = (idx: number) => setLightbox(idx);
  const closeLightbox = () => setLightbox(null);
  const prev = useCallback(() => setLightbox(i => i !== null ? (i - 1 + filtered.length) % filtered.length : null), [filtered.length]);
  const next = useCallback(() => setLightbox(i => i !== null ? (i + 1) % filtered.length : null), [filtered.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     closeLightbox();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, prev, next]);

  if (images.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">No photos yet — check back soon!</p>
      </div>
    );
  }

  return (
    <>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {types.map(t => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
              activeType === t
                ? "bg-gold-gradient text-background border-transparent shadow-gold"
                : "border-border text-muted-foreground hover:text-foreground hover:border-gold-500/30"
            )}
          >
            {t === "ALL" ? "All Photos" : TYPE_LABELS[t] ?? t}
          </button>
        ))}
      </div>

      {/* Masonry-style grid */}
      <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
        {filtered.map((img, idx) => (
          <div
            key={img.id}
            className="break-inside-avoid relative group cursor-pointer rounded-xl overflow-hidden bg-accent"
            onClick={() => openLightbox(idx)}
          >
            <img
              src={img.url}
              alt={img.altText}
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-8 h-8 text-white drop-shadow" />
              </div>
            </div>
            {/* Room label */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-xs font-semibold">{img.roomName}</p>
              <p className="text-white/70 text-[10px]">{TYPE_LABELS[img.roomType] ?? img.roomType}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
            onClick={closeLightbox}
          >
            <X className="w-5 h-5" />
          </button>

          {/* Prev */}
          {filtered.length > 1 && (
            <button
              className="absolute left-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
              onClick={e => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Image */}
          <div
            className="max-w-5xl max-h-[90vh] mx-auto px-16"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={filtered[lightbox].url}
              alt={filtered[lightbox].altText}
              className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
            <div className="text-center mt-3">
              <p className="text-white font-semibold">{filtered[lightbox].roomName}</p>
              <p className="text-white/60 text-sm">{lightbox + 1} / {filtered.length}</p>
            </div>
          </div>

          {/* Next */}
          {filtered.length > 1 && (
            <button
              className="absolute right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors z-10"
              onClick={e => { e.stopPropagation(); next(); }}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      )}
    </>
  );
}
