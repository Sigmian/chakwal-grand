"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";
import { cn } from "@/utils";

interface RoomImage {
  url:     string;
  altText?: string | null;
  isCover: boolean;
}

interface Props {
  images:   RoomImage[];
  roomName: string;
}

export function RoomGallery({ images, roomName }: Props) {
  const [open,  setOpen]  = useState(false);
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  const cover = images.find((i) => i.isCover) ?? images[0];
  const prev  = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next  = () => setIndex((i) => (i + 1) % images.length);

  const openAt = (i: number) => { setIndex(i); setOpen(true); };

  return (
    <>
      {/* Cover photo with gallery trigger */}
      <button
        onClick={() => openAt(images.indexOf(cover))}
        className="relative h-48 w-full overflow-hidden block group"
        aria-label={`View ${roomName} gallery`}
      >
        <Image
          src={cover.url}
          alt={cover.altText ?? roomName}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2.5 py-1 text-xs font-semibold text-foreground">
            <Images className="w-3 h-3" />
            {images.length} photos
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
            View Gallery
          </span>
        </div>
      </button>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
            onClick={() => setOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 z-10 text-white/70 text-sm font-mono">
            {index + 1} / {images.length}
          </div>

          {/* Room name */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white/90 text-sm font-semibold">
            {roomName}
          </div>

          {/* Prev */}
          {images.length > 1 && (
            <button
              className="absolute left-4 z-10 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
              onClick={(e) => { e.stopPropagation(); prev(); }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Main image */}
          <div
            className="relative w-full max-w-4xl max-h-[80vh] mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={images[index].url}
              alt={images[index].altText ?? roomName}
              width={1200}
              height={800}
              className="object-contain max-h-[80vh] w-full rounded-xl"
              priority
            />
            {images[index].altText && (
              <p className="text-center text-white/50 text-xs mt-3">{images[index].altText}</p>
            )}
          </div>

          {/* Next */}
          {images.length > 1 && (
            <button
              className="absolute right-4 z-10 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white"
              onClick={(e) => { e.stopPropagation(); next(); }}
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Thumbnails strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 overflow-x-auto">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                  className={cn(
                    "relative flex-shrink-0 w-14 h-10 rounded-lg overflow-hidden border-2 transition-all",
                    i === index ? "border-gold-400 opacity-100" : "border-white/20 opacity-50 hover:opacity-80"
                  )}
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
