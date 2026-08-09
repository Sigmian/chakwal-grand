"use client";

// ============================================================
// features/experience/components/ExperienceShell.tsx
//
// Orchestrates the journey: intro → branch → floor → room → book.
// Owns stage state, history, dates and the DOM overlay; the 3D
// scene is loaded lazily so the page is usable before WebGL is.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Sun, Moon, X, Check, Users, BedDouble,
  Maximize2, Loader2, ChevronRight, ListFilter,
} from "lucide-react";
import type { ExperienceBranch, ExperienceRoom } from "@/server/actions/experience";
import { getExperienceData } from "@/server/actions/experience";
import type { Detail } from "../lib/buildings";
import type { Stage } from "./types";
import { cn, formatPKR } from "@/utils";

const Scene = dynamic(() => import("./Scene").then((m) => m.Scene), {
  ssr: false,
  loading: () => null,
});

const INTRO_KEY = "cgh_3d_intro_seen";

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Available",
  BOOKED: "Not available for your dates",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Under maintenance",
  UNAVAILABLE: "Unavailable",
};

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Picks a quality tier from the device rather than guessing from width alone. */
function detectDetail(): Detail {
  if (typeof navigator === "undefined") return "high";
  const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const coarse = window.matchMedia?.("(pointer: coarse)").matches;
  if (mem <= 4 || cores <= 4 || (coarse && window.innerWidth < 820)) return "optimized";
  return "high";
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

interface Props {
  initialBranches: ExperienceBranch[];
}

export function ExperienceShell({ initialBranches }: Props) {
  const router = useRouter();

  const [branches, setBranches] = useState(initialBranches);
  const [stage, setStage] = useState<Stage>("intro");
  const [branchId, setBranchId] = useState<string | null>(null);
  const [floorIndex, setFloorIndex] = useState<number | null>(null);
  const [room, setRoom] = useState<ExperienceRoom | null>(null);

  const [checkIn, setCheckIn] = useState(todayISO());
  const [checkOut, setCheckOut] = useState(todayISO(1));
  const [adults, setAdults] = useState(2);
  const [refreshing, setRefreshing] = useState(false);

  const [night, setNight] = useState(false);
  const [detail, setDetail] = useState<Detail>("high");
  const [supported, setSupported] = useState<boolean | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === branchId) ?? null,
    [branches, branchId],
  );
  const selectedFloor = useMemo(
    () => selectedBranch?.floors.find((f) => f.index === floorIndex) ?? null,
    [selectedBranch, floorIndex],
  );

  // ── capability + preference detection ──
  useEffect(() => {
    setSupported(webglAvailable());
    setDetail(detectDetail());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  // ── intro: short for returning visitors, skipped entirely if motion is reduced ──
  useEffect(() => {
    if (supported === null) return;
    let seen = false;
    try { seen = sessionStorage.getItem(INTRO_KEY) === "1"; } catch {}
    const hold = reducedMotion ? 0 : seen ? 700 : 2400;
    const t = setTimeout(() => {
      setStage("branch");
      try { sessionStorage.setItem(INTRO_KEY, "1"); } catch {}
    }, hold);
    return () => clearTimeout(t);
  }, [supported, reducedMotion]);

  // ── availability follows the chosen dates ──
  const reload = useCallback(async (ci: string, co: string) => {
    setRefreshing(true);
    try {
      const next = await getExperienceData(ci, co);
      setBranches(next);
      setRoom((prev) => {
        if (!prev) return prev;
        const fresh = next
          .flatMap((b) => b.floors)
          .flatMap((f) => f.rooms)
          .find((r) => r.id === prev.id);
        return fresh ?? prev;
      });
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (new Date(checkIn) >= new Date(checkOut)) return;
    const t = setTimeout(() => { void reload(checkIn, checkOut); }, 350);
    return () => clearTimeout(t);
  }, [checkIn, checkOut, reload]);

  // ── browser history: back should step through the journey ──
  const suppressPop = useRef(false);
  const pushStage = useCallback((s: Stage) => {
    suppressPop.current = true;
    window.history.pushState({ cghStage: s }, "");
    suppressPop.current = false;
  }, []);

  useEffect(() => {
    const onPop = () => {
      if (suppressPop.current) return;
      setStage((prev) => {
        if (prev === "room") { setRoom(null); return "floor"; }
        if (prev === "floor") { setFloorIndex(null); return "branch"; }
        if (prev === "branch") { setBranchId(null); return "branch"; }
        return prev;
      });
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ── navigation ──
  const chooseBranch = (b: ExperienceBranch) => {
    setBranchId(b.id);
    // Share the choice with the rest of the site (BranchProvider reads this
    // key) so the booking page does not ask for the branch a second time.
    try { localStorage.setItem("cgh_branch", b.id); } catch {}
    setStage("floor");
    pushStage("floor");
  };
  const chooseFloor = (i: number) => {
    setFloorIndex(i);
    setStage("room");
    pushStage("room");
  };
  const chooseRoom = (r: ExperienceRoom) => setRoom(r);

  const backToBranches = () => { setBranchId(null); setFloorIndex(null); setRoom(null); setStage("branch"); };
  const backToFloors   = () => { setFloorIndex(null); setRoom(null); setStage("floor"); };

  const bookRoom = (r: ExperienceRoom) => {
    const q = new URLSearchParams({
      roomId: r.id,
      branchId: selectedBranch?.id ?? "",
      checkIn, checkOut,
      adults: String(adults),
    });
    router.push(`/book?${q.toString()}`);
  };

  // ── fallback: no WebGL → send them to the normal listing ──
  if (supported === false) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <Building2 className="mb-4 h-10 w-10 text-gold-400" />
        <h1 className="font-serif text-2xl font-bold text-foreground">3D tour unavailable on this device</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your browser does not support 3D graphics — but every room is still bookable.
        </p>
        <Link href="/rooms" className="mt-6 rounded-xl bg-gold-gradient px-6 py-3 text-sm font-semibold text-background">
          View All Rooms
        </Link>
      </div>
    );
  }

  const stageTitle =
    stage === "branch" ? "Choose Your Preferred Stay"
    : stage === "floor" ? "Select Your Floor"
    : stage === "room" ? "Select Your Room"
    : "";

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0b0d10]">
      {/* ── 3D canvas ── */}
      <div className="absolute inset-0">
        {supported && (
          <Scene
            branches={branches}
            stage={stage}
            selectedBranch={selectedBranch}
            selectedFloor={floorIndex}
            selectedRoomId={room?.id ?? null}
            detail={detail}
            night={night}
            reducedMotion={reducedMotion}
            onSelectBranch={chooseBranch}
            onSelectRoom={chooseRoom}
          />
        )}
      </div>

      {/* ── atmospheric vignette (never blocks pointer) ── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.72)_100%)]" />

      {/* ── intro ── */}
      {stage === "intro" && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-[#0b0d10] px-6 text-center">
          <div className="animate-fade-in">
            <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-gold-400/80">Welcome to</p>
            <h1 className="mt-3 font-serif text-4xl font-bold text-white sm:text-5xl">Chakwal Guest House</h1>
            <div className="mx-auto mt-5 h-px w-24 bg-gradient-to-r from-transparent via-gold-500/70 to-transparent" />
            <p className="mt-5 text-sm text-white/60">Preparing your experience…</p>
            <Loader2 className="mx-auto mt-4 h-4 w-4 animate-spin text-gold-400/70" />
          </div>
        </div>
      )}

      {/* ── top bar ── */}
      {stage !== "intro" && (
        <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-3 p-4 sm:p-6">
          <div className="pointer-events-auto flex items-center gap-2">
            {stage !== "branch" && (
              <button
                onClick={stage === "room" ? backToFloors : backToBranches}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs font-medium text-white/85 backdrop-blur-md transition-colors hover:border-gold-400/50 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {stage === "room" ? "Floors" : "Branches"}
              </button>
            )}
            <Link
              href="/"
              className="rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs font-medium text-white/70 backdrop-blur-md transition-colors hover:text-white"
            >
              Home
            </Link>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => setNight((n) => !n)}
              aria-label={night ? "Switch to daytime lighting" : "Switch to evening lighting"}
              className="rounded-xl border border-white/15 bg-black/45 p-2 text-white/80 backdrop-blur-md transition-colors hover:border-gold-400/50 hover:text-white"
            >
              {night ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <Link
              href="/rooms"
              className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs font-medium text-white/80 backdrop-blur-md transition-colors hover:border-gold-400/50 hover:text-white"
            >
              <ListFilter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Skip 3D &amp; View Rooms</span>
              <span className="sm:hidden">Skip</span>
            </Link>
          </div>
        </header>
      )}

      {/* ── stage heading ── */}
      {stage !== "intro" && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-20 text-center sm:top-24">
          <h2 className="font-serif text-lg font-bold text-white/95 drop-shadow-lg sm:text-2xl">
            {stageTitle}
          </h2>
          {selectedBranch && stage !== "branch" && (
            <p className="mt-1 text-[11px] text-white/60 sm:text-xs">
              {selectedBranch.name}
              {selectedFloor && <> · {selectedFloor.label}</>}
            </p>
          )}
        </div>
      )}

      {/* ── dates ── */}
      {stage !== "intro" && !room && (
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 p-4 sm:p-6">
          <div className="mx-auto flex max-w-3xl flex-wrap items-end justify-center gap-3 rounded-2xl border border-white/12 bg-black/55 p-3 backdrop-blur-xl">
            <label className="flex-1 min-w-[120px]">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/50">Check-in</span>
              <input
                type="date" value={checkIn} min={todayISO()}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-gold-400/60"
              />
            </label>
            <label className="flex-1 min-w-[120px]">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/50">Check-out</span>
              <input
                type="date" value={checkOut} min={checkIn}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-gold-400/60"
              />
            </label>
            <label className="w-24">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/50">Adults</span>
              <select
                value={adults} onChange={(e) => setAdults(Number(e.target.value))}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs text-white outline-none focus:border-gold-400/60"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n} className="bg-[#12151a]">{n}</option>
                ))}
              </select>
            </label>
            {refreshing && (
              <span className="flex items-center gap-1.5 pb-2 text-[11px] text-white/50">
                <Loader2 className="h-3 w-3 animate-spin" /> Updating
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── floor selector ── */}
      {stage === "floor" && selectedBranch && (
        <aside className="pointer-events-auto absolute right-4 top-1/2 z-20 w-[236px] -translate-y-1/2 space-y-2 sm:right-6">
          {[...selectedBranch.floors].reverse().map((f) => {
            const full = f.availableCount === 0;
            return (
              <button
                key={f.index}
                onClick={() => !full && chooseFloor(f.index)}
                disabled={full}
                aria-disabled={full}
                className={cn(
                  "w-full rounded-2xl border p-3.5 text-left backdrop-blur-xl transition-all",
                  full
                    ? "cursor-not-allowed border-white/8 bg-black/35 opacity-60"
                    : "border-white/15 bg-black/55 hover:-translate-x-1 hover:border-gold-400/60 hover:bg-black/75",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-serif text-sm font-bold text-white">{f.label}</span>
                  {full ? (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/70">
                      Fully Booked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-300">
                      <Check className="h-3 w-3" />{f.availableCount} free
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-white/55">
                  {f.totalCount} room{f.totalCount !== 1 ? "s" : ""}
                  {f.startingFrom !== null && <> · from ₨{f.startingFrom.toLocaleString("en-PK")}</>}
                </p>
              </button>
            );
          })}
        </aside>
      )}

      {/* ── room list (accessible equivalent of the 3D hotspots) ── */}
      {stage === "room" && selectedFloor && !room && (
        <aside className="pointer-events-auto absolute right-4 top-1/2 z-20 max-h-[58vh] w-[240px] -translate-y-1/2 space-y-2 overflow-y-auto sm:right-6">
          {selectedFloor.rooms.map((r) => {
            const free = r.availability === "AVAILABLE";
            return (
              <button
                key={r.id}
                onClick={() => chooseRoom(r)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left backdrop-blur-xl transition-all",
                  free
                    ? "border-white/15 bg-black/55 hover:-translate-x-1 hover:border-gold-400/60"
                    : "border-white/8 bg-black/35 opacity-70",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-white">Room {r.number}</span>
                  <span className="text-xs font-semibold text-gold-300">{formatPKR(r.pricePerNight)}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-white/60">{r.name}</p>
                <p className={cn("mt-1 text-[10px] font-medium", free ? "text-emerald-300" : "text-white/50")}>
                  {STATUS_LABEL[r.availability]}
                </p>
              </button>
            );
          })}
        </aside>
      )}

      {/* ── room detail ── */}
      {room && (
        <div className="pointer-events-auto absolute inset-0 z-40 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={() => setRoom(null)} />
          <div className="relative z-10 max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/12 bg-[#12151a]/95 p-5 backdrop-blur-2xl sm:rounded-3xl">
            <button
              onClick={() => setRoom(null)}
              aria-label="Close room details"
              className="absolute right-4 top-4 rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400/85">
              {selectedBranch?.name} · {selectedFloor?.label}
            </p>
            <h3 className="mt-1 font-serif text-2xl font-bold text-white">
              Room {room.number}
            </h3>
            <p className="text-sm text-white/65">{room.name}</p>

            {room.images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {room.images.slice(0, 4).map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img.url}
                    alt={img.altText ?? `Room ${room.number} photo ${i + 1}`}
                    loading="lazy"
                    className={cn(
                      "w-full rounded-xl border border-white/10 object-cover",
                      i === 0 ? "col-span-2 h-40" : "h-24",
                    )}
                  />
                ))}
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Users, label: `${room.maxAdults} adults` },
                { icon: BedDouble, label: `${room.bedCount} ${room.bedType ?? "bed"}` },
                { icon: Maximize2, label: room.size ? `${room.size} sq ft` : room.type },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                  <Icon className="mx-auto h-4 w-4 text-gold-400/80" />
                  <p className="mt-1 text-[10px] text-white/70">{label}</p>
                </div>
              ))}
            </div>

            {room.amenities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {room.amenities.slice(0, 8).map((a) => (
                  <span key={a} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/70">
                    {a}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 flex items-end justify-between rounded-2xl border border-white/10 bg-white/5 p-3.5">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/50">Per night</p>
                <p className="font-serif text-2xl font-bold text-gold-300">{formatPKR(room.pricePerNight)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/50">{checkIn} → {checkOut}</p>
                <p className={cn(
                  "text-xs font-semibold",
                  room.availability === "AVAILABLE" ? "text-emerald-300" : "text-red-300",
                )}>
                  {STATUS_LABEL[room.availability]}
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2.5">
              <button
                onClick={() => setRoom(null)}
                className="rounded-xl border border-white/15 px-4 py-3 text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                Back to Floor
              </button>
              <button
                onClick={() => bookRoom(room)}
                disabled={room.availability !== "AVAILABLE"}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold-gradient px-4 py-3 text-sm font-bold text-background transition-all hover:shadow-gold-md disabled:cursor-not-allowed disabled:opacity-45"
              >
                {room.availability === "AVAILABLE" ? "Book This Room" : "Not Available"}
                {room.availability === "AVAILABLE" && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
