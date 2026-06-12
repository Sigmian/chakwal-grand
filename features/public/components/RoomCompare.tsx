"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  X, BarChart3, CheckCircle2, XCircle, BedDouble,
  Users, Snowflake, Wifi, Tv, Coffee, ChevronDown,
} from "lucide-react";
import { cn, formatPKR } from "@/utils";

interface Room {
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
  images:        { url: string; altText?: string | null; isCover: boolean }[];
  branch:        { name: string; city: string };
}

interface Props { rooms: Room[] }

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi":      <Wifi className="w-3.5 h-3.5" />,
  "AC":        <Snowflake className="w-3.5 h-3.5" />,
  "TV":        <Tv className="w-3.5 h-3.5" />,
  "Smart TV":  <Tv className="w-3.5 h-3.5" />,
  "Hot Water": <Coffee className="w-3.5 h-3.5" />,
};

const TYPE_LABEL: Record<string, string> = {
  STANDARD: "Classic", DELUXE: "Executive", SUITE: "Suite", FAMILY: "Family", VIP: "VIP",
};

export function RoomCompare({ rooms }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectedRooms = rooms.filter((r) => selected.has(r.id));

  const allAmenities = [...new Set(selectedRooms.flatMap((r) => r.amenities))].sort();

  const extras = [
    { key: "hasBalcony",     label: "Balcony" },
    { key: "hasKitchenette", label: "Kitchenette" },
    { key: "hasJacuzzi",     label: "Jacuzzi" },
  ] as const;

  return (
    <>
      {/* Checkboxes are injected into room cards via data-compare attribute —
          this component renders the floating bar + modal */}

      {/* Floating compare bar */}
      {selected.size >= 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-3 bg-surface-elevated border border-gold-500/30 rounded-2xl shadow-card-lg px-5 py-3">
            <BarChart3 className="w-5 h-5 text-gold-400 flex-shrink-0" />
            <p className="text-sm font-semibold text-foreground">
              {selected.size} room{selected.size > 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-1.5">
              {selectedRooms.map((r) => (
                <span key={r.id} className="flex items-center gap-1 text-xs bg-gold-500/15 text-gold-400 px-2 py-0.5 rounded-lg">
                  {r.number}
                  <button onClick={() => toggle(r.id)} className="hover:text-red-400 transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            {selected.size >= 2 && (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all"
              >
                Compare <ChevronDown className="w-3.5 h-3.5 rotate-[-90deg]" />
              </button>
            )}
            <button onClick={() => setSelected(new Set())} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Compare checkboxes rendered inside each room card */}
      <style>{`
        [data-room-id] .compare-checkbox { display: flex; }
      `}</style>

      {/* Render checkboxes — this is done by RoomCardCompareCheckbox below */}

      {/* Comparison modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm pt-10 px-4 pb-4 overflow-y-auto">
          <div className="w-full max-w-5xl animate-fade-in">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold font-serif text-foreground">Room Comparison</h2>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-accent transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <td className="w-40 p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground"></td>
                    {selectedRooms.map((room) => {
                      const cover = room.images.find((i) => i.isCover) ?? room.images[0];
                      return (
                        <td key={room.id} className="p-3 card-luxury rounded-2xl text-center align-top min-w-[180px]">
                          {cover && (
                            <div className="relative h-32 w-full rounded-xl overflow-hidden mb-3">
                              <Image src={cover.url} alt={cover.altText ?? room.name} fill className="object-cover" />
                            </div>
                          )}
                          <p className="font-bold text-foreground">{room.name}</p>
                          <p className="text-xs text-muted-foreground mb-1">Room {room.number} · {room.branch.name}</p>
                          <p className="text-lg font-bold text-gold-400 font-serif">{formatPKR(Number(room.pricePerNight))}</p>
                          <p className="text-xs text-muted-foreground">/night</p>
                          <Link
                            href={`/book?branchId=${room.branchId}`}
                            className="block mt-3 py-2 bg-gold-gradient text-background text-xs font-bold rounded-xl hover:shadow-gold-sm transition-all"
                          >
                            Book →
                          </Link>
                        </td>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Type */}
                  <tr className="border-t border-border/50">
                    <td className="p-3 text-xs font-semibold text-muted-foreground">Room Type</td>
                    {selectedRooms.map((r) => (
                      <td key={r.id} className="p-3 text-sm text-center text-foreground">{TYPE_LABEL[r.type] ?? r.type}</td>
                    ))}
                  </tr>
                  {/* Price */}
                  <tr className="border-t border-border/50 bg-gold-500/5">
                    <td className="p-3 text-xs font-semibold text-muted-foreground">Price / Night</td>
                    {selectedRooms.map((r) => (
                      <td key={r.id} className="p-3 text-sm text-center font-bold text-gold-400">{formatPKR(Number(r.pricePerNight))}</td>
                    ))}
                  </tr>
                  {/* Capacity */}
                  <tr className="border-t border-border/50">
                    <td className="p-3 text-xs font-semibold text-muted-foreground">Adults</td>
                    {selectedRooms.map((r) => (
                      <td key={r.id} className="p-3 text-sm text-center text-foreground">{r.maxAdults}</td>
                    ))}
                  </tr>
                  <tr className="border-t border-border/50">
                    <td className="p-3 text-xs font-semibold text-muted-foreground">Children</td>
                    {selectedRooms.map((r) => (
                      <td key={r.id} className="p-3 text-sm text-center text-foreground">{r.maxChildren}</td>
                    ))}
                  </tr>
                  {/* Bed */}
                  <tr className="border-t border-border/50">
                    <td className="p-3 text-xs font-semibold text-muted-foreground">Bed</td>
                    {selectedRooms.map((r) => (
                      <td key={r.id} className="p-3 text-sm text-center text-foreground">
                        {r.bedCount} {r.bedType ?? "bed"}{r.bedCount > 1 ? "s" : ""}
                      </td>
                    ))}
                  </tr>
                  {/* Size */}
                  {selectedRooms.some((r) => r.size) && (
                    <tr className="border-t border-border/50">
                      <td className="p-3 text-xs font-semibold text-muted-foreground">Size</td>
                      {selectedRooms.map((r) => (
                        <td key={r.id} className="p-3 text-sm text-center text-foreground">
                          {r.size ? `${r.size} sq ft` : "—"}
                        </td>
                      ))}
                    </tr>
                  )}
                  {/* Amenities */}
                  {allAmenities.map((amenity) => (
                    <tr key={amenity} className="border-t border-border/50">
                      <td className="p-3 text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          {AMENITY_ICONS[amenity] ?? <BedDouble className="w-3.5 h-3.5" />}
                          {amenity}
                        </span>
                      </td>
                      {selectedRooms.map((r) => (
                        <td key={r.id} className="p-3 text-center">
                          {r.amenities.includes(amenity)
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                            : <XCircle      className="w-5 h-5 text-muted-foreground/30 mx-auto" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Extras */}
                  {extras.map(({ key, label }) =>
                    selectedRooms.some((r) => r[key]) ? (
                      <tr key={key} className="border-t border-border/50">
                        <td className="p-3 text-xs font-semibold text-muted-foreground">{label}</td>
                        {selectedRooms.map((r) => (
                          <td key={r.id} className="p-3 text-center">
                            {r[key]
                              ? <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />
                              : <XCircle      className="w-5 h-5 text-muted-foreground/30 mx-auto" />}
                          </td>
                        ))}
                      </tr>
                    ) : null
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Expose toggle function to room cards via custom event */}
      <CompareEventBridge onToggle={toggle} selected={selected} />
    </>
  );
}

// Bridge: listens for custom events from room card checkboxes
function CompareEventBridge({
  onToggle, selected,
}: { onToggle: (id: string) => void; selected: Set<string> }) {
  if (typeof window !== "undefined") {
    (window as any).__compareToggle   = onToggle;
    (window as any).__compareSelected = selected;
  }
  return null;
}

// Standalone checkbox injected into each room card
export function CompareCheckbox({ roomId }: { roomId: string }) {
  const [checked, setChecked] = useState(false);

  const toggle = () => {
    const fn = (window as any).__compareToggle as ((id: string) => void) | undefined;
    if (fn) fn(roomId);
    setChecked((v) => !v);
  };

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      className={cn(
        "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all",
        checked
          ? "bg-gold-500/20 border-gold-500/40 text-gold-400"
          : "bg-surface-base border-border text-muted-foreground hover:border-gold-500/20"
      )}
    >
      <BarChart3 className="w-3 h-3" />
      {checked ? "Added" : "Compare"}
    </button>
  );
}
