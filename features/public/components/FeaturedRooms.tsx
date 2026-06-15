"use client";

import Link from "next/link";
import Image from "next/image";
import {
  BedDouble, Users, Wifi, Snowflake, Crown, Star, Home, ArrowRight,
} from "lucide-react";
import { formatPKR } from "@/utils";
import { Reveal } from "@/features/public/components/Reveal";

type RoomImage = { url: string; altText?: string | null; isCover: boolean; sortOrder: number };
type Room = {
  id:            string;
  name:          string;
  type:          string;
  pricePerNight: number;
  maxAdults:     number;
  maxChildren:   number;
  description?:  string | null;
  amenities:     string[];
  images:        RoomImage[];
};

const TYPE_LABEL: Record<string, string> = {
  STANDARD: "Classic", DELUXE: "Executive", SUITE: "Suite", FAMILY: "Family", VIP: "VIP",
};
const TYPE_ICON: Record<string, typeof BedDouble> = {
  STANDARD: BedDouble, DELUXE: Star, SUITE: Home, FAMILY: Users, VIP: Crown,
};
// Brand photography fallback per room type (used when a room has no DB image).
const TYPE_FALLBACK_IMG: Record<string, string> = {
  STANDARD: "/images/rooms/classic-room-chakwal-grand-guest-house.jpg",
  DELUXE:   "/images/rooms/executive-room-chakwal-grand-guest-house.jpg",
  SUITE:    "/images/rooms/suite-room-chakwal-grand-guest-house.jpg",
  FAMILY:   "/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg",
  VIP:      "/images/rooms/premium-room-chakwal-grand-guest-house.jpg",
};
const DEFAULT_IMG = "/images/rooms/classic-room-chakwal-grand-guest-house.jpg";

export function FeaturedRooms({ rooms }: { rooms: Room[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {rooms.map((room, i) => {
        const cover  = room.images.find(img => img.isCover) ?? room.images[0];
        const imgSrc = cover?.url ?? TYPE_FALLBACK_IMG[room.type] ?? DEFAULT_IMG;
        const imgAlt = cover?.altText ?? `${TYPE_LABEL[room.type] ?? room.type} room at Chakwal Grand Guest House`;
        const Icon   = TYPE_ICON[room.type] ?? BedDouble;

        return (
          <Reveal key={room.id} delay={i * 0.08} className="h-full">
            <Link
              href={`/rooms/${room.id}`}
              className="group block h-full overflow-hidden rounded-2xl card-luxury border border-transparent hover:border-gold-500/40 hover:shadow-card-lg transition-all duration-300"
            >
              {/* ── Photo ── */}
              <div className="relative aspect-[4/3] overflow-hidden bg-surface-overlay">
                <Image
                  src={imgSrc}
                  alt={imgAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* gradient scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* type pill */}
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 text-[11px] font-semibold text-white">
                  <Icon className="w-3.5 h-3.5 text-gold-400" />
                  {TYPE_LABEL[room.type] ?? room.type}
                </span>

                {/* price */}
                <div className="absolute bottom-3 left-3">
                  <p className="text-lg font-bold font-serif text-gold-300 leading-none drop-shadow">
                    {formatPKR(Number(room.pricePerNight))}
                  </p>
                  <p className="text-[10px] text-white/70 mt-0.5">per night</p>
                </div>
              </div>

              {/* ── Body ── */}
              <div className="p-4">
                <h3 className="font-bold text-foreground group-hover:text-gold-400 transition-colors line-clamp-1">
                  {room.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 mb-3 leading-relaxed line-clamp-2 min-h-[2rem]">
                  {room.description ?? "Comfortable, fully-equipped room with WiFi, hot water and attached bathroom."}
                </p>

                <div className="flex items-center justify-between border-t border-border/60 pt-3">
                  <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-gold-400" />{room.maxAdults}</span>
                    {room.amenities.includes("WiFi") && <Wifi className="w-3.5 h-3.5 text-gold-400" />}
                    {room.amenities.includes("AC")   && <Snowflake className="w-3.5 h-3.5 text-gold-400" />}
                  </div>
                  <span className="flex items-center gap-1 text-xs font-semibold text-gold-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all">
                    View <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}
