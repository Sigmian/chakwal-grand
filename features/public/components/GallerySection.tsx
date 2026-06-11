"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

const GALLERY = [
  {
    src:   "/gallery/room1.jpg.jpeg",
    alt:   "Romantic Suite with Premium Decor — Chakwal Grand Guest House",
    label: "Romantic Suite",
    tag:   "Couples Special",
  },
  {
    src:   "/gallery/corridor.jpeg",
    alt:   "Premium Corridor with Golden LED Lighting — Chakwal Grand",
    label: "Premium Corridor",
    tag:   "Interior",
  },
  {
    src:   "/gallery/ac-room.jpeg",
    alt:   "Air Conditioned Room with Gree T3 AC — Chakwal Grand Guest House",
    label: "AC Deluxe Room",
    tag:   "Comfort",
  },
  {
    src:   "/gallery/locker.jpeg",
    alt:   "Secure Locker Facility — Your Belongings Safe at Chakwal Grand",
    label: "Secure Storage",
    tag:   "Amenity",
  },
  {
    src:   "/gallery/bedroom.jpeg",
    alt:   "Standard King Bedroom — Clean, Spacious Stay at Chakwal Grand",
    label: "King Bedroom",
    tag:   "Standard",
  },
  {
    src:   "/gallery/room4.jpeg",
    alt:   "Deluxe Room — Chakwal Grand Guest House",
    label: "Deluxe Room",
    tag:   "Deluxe",
  },
  {
    src:   "/gallery/room5.jpeg",
    alt:   "Premium Room — Chakwal Grand Guest House",
    label: "Premium Room",
    tag:   "Premium",
  },
];

export function GallerySection() {
  const [active, setActive] = useState<number | null>(null);

  const prev = () => setActive(i => (i! - 1 + GALLERY.length) % GALLERY.length);
  const next = () => setActive(i => (i! + 1) % GALLERY.length);

  return (
    <section className="py-24 bg-surface-base" id="gallery">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Our Space</p>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-4">
            Experience the <span className="text-transparent bg-clip-text bg-gold-gradient">Ambiance</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Every corner of Chakwal Grand is designed with comfort, elegance, and your well-being in mind.
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Large featured image */}
          <div
            className="col-span-2 lg:col-span-2 relative h-72 sm:h-96 lg:h-[400px] rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => setActive(0)}
          >
            <Image src={GALLERY[0].src} alt={GALLERY[0].alt} fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 66vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-4 left-4 right-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold-400 bg-gold-500/20 border border-gold-500/30 px-2.5 py-1 rounded-full">{GALLERY[0].tag}</span>
              <p className="text-white font-bold font-serif text-lg mt-1">{GALLERY[0].label}</p>
            </div>
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* All remaining images */}
          {GALLERY.slice(1).map((img, i) => (
            <div
              key={img.src}
              className="relative h-36 sm:h-44 lg:h-[190px] rounded-2xl overflow-hidden cursor-pointer group"
              onClick={() => setActive(i + 1)}
            >
              <Image src={img.src} alt={img.alt} fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-3 left-3 right-3 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gold-400 bg-gold-500/20 border border-gold-500/30 px-2 py-0.5 rounded-full">{img.tag}</span>
                <p className="text-white font-semibold text-xs mt-0.5">{img.label}</p>
              </div>
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-3 h-3 text-white" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {active !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={() => setActive(null)}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>

          <div
            className="relative max-w-4xl w-full max-h-[85vh] rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={GALLERY[active].src}
              alt={GALLERY[active].alt}
              width={1200}
              height={800}
              className="w-full h-auto object-contain max-h-[85vh]"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold-400 bg-gold-500/20 border border-gold-500/30 px-2.5 py-1 rounded-full">
                {GALLERY[active].tag}
              </span>
              <p className="text-white font-bold font-serif text-xl mt-2">{GALLERY[active].label}</p>
            </div>
          </div>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {GALLERY.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setActive(i); }}
                className={`w-2 h-2 rounded-full transition-all ${i === active ? "bg-gold-400 w-6" : "bg-white/40"}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
