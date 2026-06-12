"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import {
  Building2, CalendarDays, Users, Loader2, ChevronRight,
  BedDouble, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { getRoomsForPicker } from "@/server/actions/public";
import { cn, formatPKR } from "@/utils";

interface Branch { id: string; name: string; city: string }

type Room = Awaited<ReturnType<typeof getRoomsForPicker>>[number];

const today    = new Date().toISOString().split("T")[0];
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];

const TYPE_LABEL: Record<string, string> = {
  STANDARD: "Classic", DELUXE: "Executive", SUITE: "Suite",
  FAMILY: "Family", VIP: "VIP",
};

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE:   "bg-emerald-500",
  OCCUPIED:    "bg-red-500",
  CLEANING:    "bg-violet-500",
  MAINTENANCE: "bg-amber-500",
  BLOCKED:     "bg-slate-500",
};

interface Props {
  branches:    Branch[];
  preselected: { branchId?: string; checkIn?: string; checkOut?: string; adults?: number };
}

export function RoomPicker({ branches, preselected }: Props) {
  const router = useRouter();
  const [isPending, start] = useTransition();

  const [form, setForm] = useState({
    branchId: preselected.branchId || branches[0]?.id || "",
    checkIn:  preselected.checkIn  || today,
    checkOut: preselected.checkOut || tomorrow,
    adults:   preselected.adults   || 2,
    children: 0,
  });

  const [rooms,        setRooms]        = useState<Room[] | null>(null);
  const [activeFloor,  setActiveFloor]  = useState<number | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const nights = Math.max(1,
    Math.ceil((new Date(form.checkOut).getTime() - new Date(form.checkIn).getTime()) / 86_400_000)
  );

  const setF = (k: string, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const search = () => {
    if (!form.branchId || !form.checkIn || !form.checkOut) {
      toast.error("Please fill all search fields"); return;
    }
    if (new Date(form.checkIn) >= new Date(form.checkOut)) {
      toast.error("Check-out must be after check-in"); return;
    }
    start(async () => {
      const result = await getRoomsForPicker(form.branchId, form.checkIn, form.checkOut);
      setRooms(result);
      const floors = [...new Set(result.map((r) => r.floor ?? 0))].sort((a, b) => a - b);
      setActiveFloor(floors[0] ?? 0);
      setSelectedRoom(null);
    });
  };

  const proceed = () => {
    if (!selectedRoom) { toast.error("Please select a room"); return; }
    if (!selectedRoom.isAvailable) { toast.error("This room is not available for your dates"); return; }
    const params = new URLSearchParams({
      roomId:   selectedRoom.id,
      branchId: form.branchId,
      checkIn:  form.checkIn,
      checkOut: form.checkOut,
      adults:   String(form.adults),
      children: String(form.children),
    });
    router.push(`/book?${params.toString()}`);
  };

  // Group by floor
  const floors = rooms
    ? [...new Set(rooms.map((r) => r.floor ?? 0))].sort((a, b) => a - b)
    : [];
  const floorRooms = rooms?.filter((r) => (r.floor ?? 0) === activeFloor) ?? [];

  const inputCls = "w-full bg-surface-base border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/20 transition-all";
  const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* ── Search Panel ── */}
      <div className="card-luxury rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold font-serif text-foreground mb-6">Select Your Dates</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <label className={labelCls}>Branch</label>
            <select value={form.branchId} onChange={(e) => setF("branchId", e.target.value)} className={inputCls}>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Check-In</label>
            <input type="date" value={form.checkIn} min={today}
              onChange={(e) => setF("checkIn", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Check-Out</label>
            <input type="date" value={form.checkOut} min={form.checkIn || today}
              onChange={(e) => setF("checkOut", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Adults</label>
            <select value={form.adults} onChange={(e) => setF("adults", Number(e.target.value))} className={inputCls}>
              {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n} Adult{n > 1 ? "s" : ""}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-6">
          {form.checkIn && form.checkOut && new Date(form.checkOut) > new Date(form.checkIn) && (
            <p className="text-sm text-muted-foreground">
              <span className="text-gold-400 font-semibold">{nights} night{nights > 1 ? "s" : ""}</span>
              {" "}· {branches.find((b) => b.id === form.branchId)?.name}
            </p>
          )}
          <button
            onClick={search}
            disabled={isPending}
            className="ml-auto flex items-center gap-2 px-8 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-70"
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
              : <><Building2 className="w-4 h-4" /> Show Rooms</>}
          </button>
        </div>
      </div>

      {/* ── Room Grid ── */}
      {rooms !== null && (
        <div className="animate-fade-in">
          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mb-5 px-1">
            {[
              { color: "bg-emerald-500", label: "Available" },
              { color: "bg-red-500",     label: "Booked" },
              { color: "bg-violet-500",  label: "Cleaning" },
              { color: "bg-amber-500",   label: "Maintenance" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={cn("w-2.5 h-2.5 rounded-full", color)} />
                {label}
              </div>
            ))}
            <p className="ml-auto text-xs text-muted-foreground">
              {rooms.filter((r) => r.isAvailable).length} of {rooms.length} rooms available
            </p>
          </div>

          {/* Floor tabs */}
          {floors.length > 1 && (
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {floors.map((floor) => {
                const count = rooms.filter((r) => (r.floor ?? 0) === floor && r.isAvailable).length;
                return (
                  <button
                    key={floor}
                    onClick={() => setActiveFloor(floor)}
                    className={cn(
                      "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
                      activeFloor === floor
                        ? "bg-gold-500/20 border-gold-500/40 text-gold-400"
                        : "bg-surface-elevated border-border text-muted-foreground hover:border-gold-500/20"
                    )}
                  >
                    {floor === 0 ? "Ground" : `Floor ${floor}`}
                    <span className={cn(
                      "ml-2 text-xs px-1.5 py-0.5 rounded-full",
                      count > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/10 text-red-400"
                    )}>
                      {count} free
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Room tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {floorRooms.map((room) => {
              const cover = room.images.find((i) => i.isCover) ?? room.images[0] ?? null;
              const isSelected = selectedRoom?.id === room.id;
              const dotColor = room.isAvailable
                ? STATUS_COLOR["AVAILABLE"]
                : STATUS_COLOR[room.status] ?? "bg-slate-500";

              return (
                <button
                  key={room.id}
                  onClick={() => {
                    if (!room.isAvailable) { toast.error("This room is not available for your dates"); return; }
                    setSelectedRoom(isSelected ? null : room);
                  }}
                  className={cn(
                    "text-left card-luxury rounded-2xl overflow-hidden border-2 transition-all group",
                    !room.isAvailable && "opacity-60 cursor-not-allowed",
                    isSelected
                      ? "border-gold-500/70 shadow-gold-md"
                      : room.isAvailable
                        ? "border-transparent hover:border-gold-500/30 hover:-translate-y-0.5"
                        : "border-transparent"
                  )}
                >
                  {/* Photo */}
                  <div className="relative h-28 w-full bg-accent overflow-hidden">
                    {cover ? (
                      <Image
                        src={cover.url}
                        alt={cover.altText ?? room.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BedDouble className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}

                    {/* Status dot */}
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <div className={cn("w-2 h-2 rounded-full", dotColor)} />
                      <span className="text-[10px] font-semibold text-foreground">
                        {room.isAvailable ? "Free" : room.status === "OCCUPIED" ? "Booked" : room.status.charAt(0) + room.status.slice(1).toLowerCase()}
                      </span>
                    </div>

                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-gold-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-10 h-10 text-gold-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <p className="text-xs font-bold text-foreground truncate">{room.name}</p>
                        <p className="text-[10px] text-muted-foreground">Room {room.number}</p>
                      </div>
                      <p className="text-xs font-bold text-gold-400 flex-shrink-0">
                        {formatPKR(Number(room.pricePerNight))}
                        <span className="text-[9px] font-normal text-muted-foreground">/nt</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {room.maxAdults} adults{room.maxChildren > 0 ? ` + ${room.maxChildren} kids` : ""}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {TYPE_LABEL[room.type] ?? room.type}
                      {room.amenities.includes("AC") && " · AC"}
                    </p>
                  </div>
                </button>
              );
            })}

            {floorRooms.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground text-sm">
                No rooms on this floor.
              </div>
            )}
          </div>

          {/* Selected room summary + proceed */}
          {selectedRoom && (
            <div className="mt-6 card-luxury rounded-2xl p-5 border border-gold-500/20 animate-fade-in">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Selected Room</p>
                  <p className="font-bold text-foreground">{selectedRoom.name} — Room {selectedRoom.number}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatPKR(Number(selectedRoom.pricePerNight))} / night ·{" "}
                    <span className="text-gold-400 font-semibold">
                      Total: {formatPKR(Number(selectedRoom.pricePerNight) * nights)}
                    </span>
                    {" "}for {nights} night{nights > 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={proceed}
                  className="flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all flex-shrink-0"
                >
                  Book This Room <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
