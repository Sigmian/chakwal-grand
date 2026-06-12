"use client";

import Link from "next/link";
import { BedDouble, Users, Wifi, Snowflake, Tv, Coffee } from "lucide-react";
import { formatPKR } from "@/utils";
import { RoomCompare, CompareCheckbox } from "@/features/public/components/RoomCompare";
import { RoomGallery } from "@/features/public/components/RoomGallery";

type Room = {
  id:            string;
  number:        string;
  name:          string;
  type:          string;
  pricePerNight: any;
  maxAdults:     number;
  maxChildren:   number;
  bedCount:      number;
  bedType?:      string | null;
  amenities:     string[];
  description?:  string | null;
  size?:         number | null;
  hasBalcony:    boolean;
  hasKitchenette:boolean;
  hasJacuzzi:    boolean;
  branchId:      string;
  images:        { url: string; altText?: string | null; isCover: boolean; sortOrder: number }[];
  branch:        { id: string; name: string; city: string };
};

const TYPE_ORDER = ["STANDARD", "FAMILY", "DELUXE", "SUITE", "VIP"];
const TYPE_LABEL: Record<string, string> = {
  STANDARD: "Classic", DELUXE: "Executive", SUITE: "Apartment / Suite",
  FAMILY: "Family", VIP: "VIP Suite",
};
const TYPE_ICON: Record<string, string> = {
  STANDARD: "🛏️", DELUXE: "⭐", SUITE: "🏠", FAMILY: "👨‍👩‍👧", VIP: "👑",
};
const TYPE_COLOR: Record<string, string> = {
  STANDARD: "from-slate-500/20 to-slate-600/10 border-slate-500/20",
  FAMILY:   "from-blue-500/20 to-blue-600/10 border-blue-500/20",
  DELUXE:   "from-purple-500/20 to-purple-600/10 border-purple-500/20",
  SUITE:    "from-gold-500/20 to-amber-600/10 border-gold-500/20",
  VIP:      "from-red-500/20 to-red-600/10 border-red-500/20",
};
const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi":      <Wifi className="w-3.5 h-3.5" />,
  "AC":        <Snowflake className="w-3.5 h-3.5" />,
  "TV":        <Tv className="w-3.5 h-3.5" />,
  "Smart TV":  <Tv className="w-3.5 h-3.5" />,
  "Hot Water": <Coffee className="w-3.5 h-3.5" />,
};

export function RoomsClient({ rooms }: { rooms: Room[] }) {
  const grouped = TYPE_ORDER.reduce((acc, type) => {
    const list = rooms.filter((r) => r.type === type);
    if (list.length > 0) acc[type] = list;
    return acc;
  }, {} as Record<string, Room[]>);

  return (
    <>
      <RoomCompare rooms={rooms} />

      <div className="space-y-16">
        {Object.entries(grouped).map(([type, typeRooms]) => (
          <section key={type}>
            <div className="flex items-center gap-4 mb-7">
              <div className="text-3xl">{TYPE_ICON[type]}</div>
              <div>
                <h2 className="text-2xl font-bold font-serif text-foreground">{TYPE_LABEL[type]} Rooms</h2>
                <p className="text-sm text-muted-foreground">
                  {typeRooms.length} room{typeRooms.length > 1 ? "s" : ""} ·
                  from {formatPKR(Math.min(...typeRooms.map((r) => Number(r.pricePerNight))))} / night
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {typeRooms.map((room) => {
                return (
                  <div
                    key={room.id}
                    className={`card-luxury rounded-2xl overflow-hidden border bg-gradient-to-br ${TYPE_COLOR[room.type] ?? ""} transition-all hover:-translate-y-1 hover:shadow-card-lg`}
                  >
                    {/* Room photo gallery */}
                    {room.images.length > 0 && (
                      <RoomGallery images={room.images} roomName={room.name} />
                    )}

                    {/* Room info */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <div>
                          <h3 className="font-bold text-lg text-foreground">{room.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Room {room.number} · {room.branch.name}, {room.branch.city}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-bold text-gold-400 font-serif">{formatPKR(Number(room.pricePerNight))}</p>
                          <p className="text-xs text-muted-foreground">/ night</p>
                        </div>
                      </div>

                      {room.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed mb-4 mt-3">{room.description}</p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                        <Users className="w-3.5 h-3.5 text-gold-400" />
                        <span>
                          {room.maxAdults} adult{room.maxAdults > 1 ? "s" : ""}
                          {room.maxChildren > 0 ? ` + ${room.maxChildren} child${room.maxChildren > 1 ? "ren" : ""}` : ""}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {room.amenities.map((a) => (
                          <span key={a} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-background/50 border border-border/60 rounded-lg text-muted-foreground">
                            {AMENITY_ICONS[a] ?? <BedDouble className="w-3 h-3" />}
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6 pt-2 flex gap-2">
                      <Link
                        href={`/rooms/${room.id}`}
                        className="flex-1 py-2.5 text-center border border-border text-sm text-muted-foreground rounded-xl hover:bg-accent hover:border-gold-500/20 transition-all"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/book?branchId=${room.branchId}`}
                        className="flex-1 py-2.5 text-center bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all hover:-translate-y-0.5"
                      >
                        Book →
                      </Link>
                      <CompareCheckbox roomId={room.id} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
