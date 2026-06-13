"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BedDouble, Users, Wifi, Snowflake, Tv, Coffee, SlidersHorizontal, X } from "lucide-react";
import { formatPKR, cn } from "@/utils";
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
  const [guestFilter, setGuestFilter] = useState(0);
  const [branchFilter, setBranchFilter] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price_asc" | "price_desc">("default");
  const [showFilters, setShowFilters] = useState(false);

  const branches = useMemo(() => {
    const seen = new Set<string>();
    return rooms.filter(r => { if (seen.has(r.branch.id)) return false; seen.add(r.branch.id); return true; }).map(r => r.branch);
  }, [rooms]);

  const filtered = useMemo(() => {
    let list = rooms.filter(r => {
      if (guestFilter > 0 && r.maxAdults < guestFilter) return false;
      if (branchFilter && r.branch.id !== branchFilter) return false;
      return true;
    });
    if (sortBy === "price_asc")  list = [...list].sort((a, b) => Number(a.pricePerNight) - Number(b.pricePerNight));
    if (sortBy === "price_desc") list = [...list].sort((a, b) => Number(b.pricePerNight) - Number(a.pricePerNight));
    return list;
  }, [rooms, guestFilter, branchFilter, sortBy]);

  const grouped = TYPE_ORDER.reduce((acc, type) => {
    const list = filtered.filter((r) => r.type === type);
    if (list.length > 0) acc[type] = list;
    return acc;
  }, {} as Record<string, Room[]>);

  const activeFilters = (guestFilter > 0 ? 1 : 0) + (branchFilter ? 1 : 0) + (sortBy !== "default" ? 1 : 0);

  const clearFilters = () => { setGuestFilter(0); setBranchFilter(""); setSortBy("default"); };

  return (
    <>
      <RoomCompare rooms={rooms} />

      {/* Filter bar */}
      <div className="mb-8">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
              showFilters ? "bg-gold-500/10 border-gold-500/30 text-gold-400" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilters > 0 && (
              <span className="w-5 h-5 rounded-full bg-gold-gradient text-background text-[10px] font-bold flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>

          {activeFilters > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          )}

          <p className="text-sm text-muted-foreground ml-auto">
            {filtered.length} room{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {showFilters && (
          <div className="mt-3 p-4 bg-surface-elevated border border-border rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Guests */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Min. Adults</label>
              <select
                value={guestFilter}
                onChange={e => setGuestFilter(Number(e.target.value))}
                className="w-full bg-surface-base border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold-500/50"
              >
                <option value={0}>Any</option>
                <option value={1}>1+</option>
                <option value={2}>2+</option>
                <option value={3}>3+</option>
                <option value={4}>4+</option>
              </select>
            </div>

            {/* Branch */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Location</label>
              <select
                value={branchFilter}
                onChange={e => setBranchFilter(e.target.value)}
                className="w-full bg-surface-base border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold-500/50"
              >
                <option value="">All Locations</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name} — {b.city}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Sort By</label>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="w-full bg-surface-base border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold-500/50"
              >
                <option value="default">Default</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">No rooms match your filters</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your guest count or location</p>
          <button onClick={clearFilters} className="px-5 py-2.5 bg-gold-gradient text-background text-sm font-bold rounded-xl">
            Clear Filters
          </button>
        </div>
      ) : (
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
                {typeRooms.map((room) => (
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
                        href={`/book?branchId=${room.branchId}&roomId=${room.id}`}
                        className="flex-1 py-2.5 text-center bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all hover:-translate-y-0.5"
                      >
                        Book →
                      </Link>
                      <CompareCheckbox roomId={room.id} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
