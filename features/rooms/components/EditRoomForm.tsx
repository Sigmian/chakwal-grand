"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { BedDouble, DollarSign, Ruler, Users, Save, Loader2, Plus, X } from "lucide-react";
import { updateRoom } from "@/server/actions/rooms";
import { RoomType } from "@/types";
import { cn } from "@/utils";

interface Props {
  room: {
    id:             string;
    number:         string;
    name:           string;
    type:           string;
    floor:          number | null;
    description:    string | null;
    maxAdults:      number;
    maxChildren:    number;
    bedCount:       number;
    bedType:        string | null;
    size:           number | null;
    pricePerNight:  any;
    weekendPrice:   any;
    seasonalPrice:  any;
    amenities:      string[];
    hasBalcony:     boolean;
    hasKitchenette: boolean;
    hasJacuzzi:     boolean;
  };
}

const ROOM_TYPES = [
  { value: RoomType.STANDARD, label: "Standard", icon: "🛏️" },
  { value: RoomType.DELUXE,   label: "Deluxe",   icon: "🌟" },
  { value: RoomType.SUITE,    label: "Suite",     icon: "💎" },
  { value: RoomType.FAMILY,   label: "Family",    icon: "👨‍👩‍👧" },
  { value: RoomType.VIP,      label: "VIP",       icon: "👑" },
];
const BED_TYPES = ["Single", "Double", "Queen", "King", "Twin", "Double + Single", "Bunk Beds", "Sofa Bed"];
const COMMON_AMENITIES = [
  "AC", "WiFi", "TV", "Smart TV", "Geyser", "Hot Water", "Attached Bathroom",
  "Mini Fridge", "Room Service", "Iron", "Hair Dryer",
  "Safe", "Work Desk", "Sofa", "Wardrobe", "Sitting Area", "Living Area",
  "Kitchenette", "Extra Bedding", "City View",
];

const inputCls = "w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
  <div className="card-luxury p-6 space-y-5">
    <h2 className="flex items-center gap-2.5 text-sm font-bold text-foreground">
      <div className="w-7 h-7 rounded-lg bg-gold-500/15 flex items-center justify-center">
        <Icon className="w-4 h-4 text-gold-400" />
      </div>
      {title}
    </h2>
    {children}
  </div>
);

export function EditRoomForm({ room }: Props) {
  const router             = useRouter();
  const [isPending, start] = useTransition();
  const [amenities, setAmenities] = useState<string[]>(room.amenities);
  const [customAmenity, setCustomAmenity] = useState("");

  const [form, setForm] = useState({
    number:        room.number,
    name:          room.name,
    type:          room.type as RoomType,
    floor:         room.floor?.toString() ?? "",
    description:   room.description ?? "",
    maxAdults:     room.maxAdults.toString(),
    maxChildren:   room.maxChildren.toString(),
    bedCount:      room.bedCount.toString(),
    bedType:       room.bedType ?? "Double",
    size:          room.size?.toString() ?? "",
    pricePerNight: Number(room.pricePerNight).toString(),
    weekendPrice:  room.weekendPrice ? Number(room.weekendPrice).toString() : "",
    seasonalPrice: room.seasonalPrice ? Number(room.seasonalPrice).toString() : "",
    hasBalcony:     room.hasBalcony,
    hasKitchenette: room.hasKitchenette,
    hasJacuzzi:     room.hasJacuzzi,
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  const toggle = (k: string) => () => setForm(f => ({ ...f, [k]: !(f as any)[k] }));
  const toggleAmenity = (a: string) =>
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  const addCustom = () => {
    const t = customAmenity.trim();
    if (t && !amenities.includes(t)) { setAmenities(p => [...p, t]); setCustomAmenity(""); }
  };

  const handleSave = () => {
    if (!form.name.trim())   { toast.error("Room name is required"); return; }
    if (!form.pricePerNight) { toast.error("Price per night is required"); return; }

    start(async () => {
      const res = await updateRoom(room.id, {
        name:          form.name,
        type:          form.type,
        floor:         form.floor ? Number(form.floor) : undefined,
        description:   form.description || undefined,
        maxAdults:     Number(form.maxAdults),
        maxChildren:   Number(form.maxChildren),
        bedCount:      Number(form.bedCount),
        bedType:       form.bedType as never,
        size:          form.size ? Number(form.size) : undefined,
        pricePerNight: Number(form.pricePerNight),
        weekendPrice:  form.weekendPrice  ? Number(form.weekendPrice)  : undefined,
        seasonalPrice: form.seasonalPrice ? Number(form.seasonalPrice) : undefined,
        amenities,
        hasBalcony:     form.hasBalcony,
        hasKitchenette: form.hasKitchenette,
        hasJacuzzi:     form.hasJacuzzi,
      });
      if (res.success) {
        toast.success(`Room ${room.number} updated`);
        router.push(`/dashboard/rooms/${room.id}`);
      } else {
        toast.error(res.error ?? "Failed to update room");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Basic details */}
      <Section title="Basic Details" icon={BedDouble}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Room Number</label>
            <input value={form.number} disabled className={inputCls + " opacity-50 cursor-not-allowed"} />
            <p className="text-[10px] text-muted-foreground mt-1">Room number cannot be changed after creation.</p>
          </div>
          <div>
            <label className={labelCls}>Floor</label>
            <input type="number" value={form.floor} onChange={set("floor")} placeholder="0 = Ground" min="0" className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Room Name *</label>
          <input value={form.name} onChange={set("name")} placeholder="e.g. Executive Room (AC)" className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Room Type *</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {ROOM_TYPES.map(rt => (
              <button key={rt.value} type="button"
                onClick={() => setForm(f => ({ ...f, type: rt.value }))}
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all",
                  form.type === rt.value
                    ? "bg-gold-500/15 border-gold-500/40 text-gold-400"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                <span>{rt.icon}</span><span>{rt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea value={form.description} onChange={set("description")} rows={3}
            placeholder="Brief description…" className={inputCls + " resize-none"} />
        </div>
      </Section>

      {/* Capacity */}
      <Section title="Capacity & Beds" icon={Users}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Max Adults *</label>
            <input type="number" value={form.maxAdults} onChange={set("maxAdults")} min="1" max="20" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Max Children</label>
            <input type="number" value={form.maxChildren} onChange={set("maxChildren")} min="0" max="10" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Bed Count *</label>
            <input type="number" value={form.bedCount} onChange={set("bedCount")} min="1" max="10" className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Bed Type</label>
            <select value={form.bedType} onChange={set("bedType")} className={inputCls}>
              {BED_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Room Size (m²)</label>
            <input type="number" value={form.size} onChange={set("size")} placeholder="e.g. 35" className={inputCls} />
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Pricing" icon={DollarSign}>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Rate / Night (₨) *</label>
            <input type="number" value={form.pricePerNight} onChange={set("pricePerNight")} placeholder="0" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Weekend Rate (₨)</label>
            <input type="number" value={form.weekendPrice} onChange={set("weekendPrice")} placeholder="Optional" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Peak Season Rate (₨)</label>
            <input type="number" value={form.seasonalPrice} onChange={set("seasonalPrice")} placeholder="Optional" className={inputCls} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Weekend and peak season rates override the base rate when applicable.</p>
      </Section>

      {/* Amenities */}
      <Section title="Amenities" icon={Ruler}>
        <div className="flex flex-wrap gap-2">
          {COMMON_AMENITIES.map(a => (
            <button key={a} type="button" onClick={() => toggleAmenity(a)}
              className={cn(
                "px-3 py-1.5 rounded-xl border text-sm font-medium transition-all",
                amenities.includes(a)
                  ? "bg-gold-500/15 border-gold-500/40 text-gold-400"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {amenities.includes(a) ? "✓ " : ""}{a}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={customAmenity} onChange={e => setCustomAmenity(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCustom())}
            placeholder="Add custom amenity…" className={inputCls + " flex-1"} />
          <button type="button" onClick={addCustom}
            className="px-4 py-2.5 bg-gold-500/15 text-gold-400 border border-gold-500/30 rounded-xl hover:bg-gold-500/25 transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {amenities.filter(a => !COMMON_AMENITIES.includes(a)).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {amenities.filter(a => !COMMON_AMENITIES.includes(a)).map(a => (
              <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-gold-400 text-sm">
                {a}
                <button onClick={() => toggleAmenity(a)} className="hover:text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </Section>

      {/* Special features */}
      <div className="card-luxury p-6">
        <h2 className="text-sm font-bold text-foreground mb-4">Special Features</h2>
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: "hasBalcony",     label: "Balcony",     icon: "🌿" },
            { key: "hasKitchenette", label: "Kitchenette", icon: "🍳" },
            { key: "hasJacuzzi",     label: "Jacuzzi",     icon: "🛁" },
          ] as const).map(({ key, label, icon }) => (
            <button key={key} type="button" onClick={toggle(key)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                (form as any)[key]
                  ? "bg-gold-500/10 border-gold-500/30 text-gold-400"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs opacity-60">{(form as any)[key] ? "Included" : "Not included"}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Link href={`/dashboard/rooms/${room.id}`}
          className="px-5 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          Cancel
        </Link>
        <button onClick={handleSave} disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-60">
          {isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
            : <><Save className="w-4 h-4" />Save Changes</>
          }
        </button>
      </div>
    </div>
  );
}
