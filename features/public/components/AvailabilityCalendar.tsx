"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, CalendarCheck, Loader2 } from "lucide-react";
import { getRoomAvailability } from "@/server/actions/public";
import { cn } from "@/utils";

interface Props {
  roomId:     string;
  className?: string;
}

type BookedRange = { checkIn: string; checkOut: string };

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Advance month index by `delta`, returning [year, month 0-indexed]. */
function shiftMonth(year: number, month: number, delta: number): [number, number] {
  const d = new Date(year, month + delta, 1);
  return [d.getFullYear(), d.getMonth()];
}

/** Local-timezone date string yyyy-mm-dd (avoids UTC-offset artefacts). */
function localISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayISO(): string {
  return localISO(new Date());
}

function isBooked(iso: string, ranges: BookedRange[]): boolean {
  // checkout day itself is available for new check-in
  return ranges.some((r) => iso >= r.checkIn && iso < r.checkOut);
}

function buildCells(year: number, month: number): (Date | null)[] {
  const firstDay    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return [
    ...Array<null>(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
}

// ─── Single-month grid (pure display, no selection) ───────────────────────────

function MonthGrid({
  year,
  month,
  ranges,
  today,
}: {
  year:   number;
  month:  number;
  ranges: BookedRange[];
  today:  string;
}) {
  const cells = buildCells(year, month);

  return (
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-center text-foreground mb-3">
        {MONTH_NAMES[month]} {year}
      </p>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;

          const iso    = localISO(date);
          const booked = isBooked(iso, ranges);
          const past   = iso < today;
          const isT    = iso === today;

          return (
            <div
              key={i}
              title={booked && !past ? "Booked" : undefined}
              className={cn(
                "text-[11px] py-1.5 rounded-md text-center font-medium select-none",
                // Past (excluding today)
                past && !isT && "opacity-20 text-muted-foreground",
                // Today — gold ring outline
                isT && "border-2 border-gold-500 text-gold-400 font-bold",
                // Booked future
                !past && booked && "bg-red-500/20 text-red-400",
                // Available future
                !past && !booked && !isT && "text-foreground hover:bg-emerald-500/15 hover:text-emerald-400 transition-colors cursor-default",
              )}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Public component ─────────────────────────────────────────────────────────

export function AvailabilityCalendar({ roomId, className }: Props) {
  const now = new Date();

  // First of the two visible months (0-indexed)
  const [firstYear,  setFirstYear]  = useState(now.getFullYear());
  const [firstMonth, setFirstMonth] = useState(now.getMonth());
  const [loading,    setLoading]    = useState(true);

  // Cache: key `"YYYY-M"` (0-indexed month) → BookedRange[]
  const [cache, setCache] = useState<Record<string, BookedRange[]>>({});
  // Tracks keys that are either already fetched or in-flight
  const fetching = useRef(new Set<string>());

  const [secondYear, secondMonth] = shiftMonth(firstYear, firstMonth, 1);
  const today = todayISO();

  // Reset cache + in-flight guard whenever the room changes — otherwise the
  // calendar would show the previous room's bookings.
  useEffect(() => {
    fetching.current = new Set();
    setCache({});
  }, [roomId]);

  // Fetch availability for any months not yet in the cache. Cache keys include
  // roomId so switching rooms never resurrects the previous room's data.
  useEffect(() => {
    const pairs: [number, number][] = [
      [firstYear,  firstMonth],
      [secondYear, secondMonth],
    ];

    const toFetch = pairs.filter(([y, m]) => {
      const k = `${roomId}:${y}-${m}`;
      return !fetching.current.has(k);
    });

    if (toFetch.length === 0) {
      setLoading(false);
      return;
    }

    // Mark as in-flight before the async work starts
    const inFlightKeys = toFetch.map(([y, m]) => `${roomId}:${y}-${m}`);
    for (const k of inFlightKeys) fetching.current.add(k);
    setLoading(true);

    Promise.all(
      // month arg is 1-indexed in the server action
      toFetch.map(([y, m]) =>
        getRoomAvailability(roomId, y, m + 1).then((data) => ({ key: `${roomId}:${y}-${m}`, data }))
      )
    )
      .then((results) => {
        setCache((prev) => {
          const next = { ...prev };
          for (const { key, data } of results) next[key] = data;
          return next;
        });
      })
      .catch((err) => {
        console.error(err);
        // Release the in-flight keys so the user can retry by re-navigating.
        for (const k of inFlightKeys) fetching.current.delete(k);
      })
      .finally(() => setLoading(false));

    // `cache` intentionally excluded — `fetching` ref guards against double-fetches
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstYear, firstMonth, secondYear, secondMonth, roomId]);

  const goToPrev = () => {
    const [y, m] = shiftMonth(firstYear, firstMonth, -1);
    setFirstYear(y);
    setFirstMonth(m);
  };
  const goToNext = () => {
    const [y, m] = shiftMonth(firstYear, firstMonth, 1);
    setFirstYear(y);
    setFirstMonth(m);
  };

  const firstRanges  = cache[`${roomId}:${firstYear}-${firstMonth}`]   ?? [];
  const secondRanges = cache[`${roomId}:${secondYear}-${secondMonth}`] ?? [];

  return (
    <div className={cn("card-luxury rounded-2xl p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-gold-400" />
          Availability
        </h3>
        {loading && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={goToPrev}
          aria-label="Previous month"
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-xs text-muted-foreground">
          {MONTH_NAMES[firstMonth].slice(0, 3)} {firstYear}
          {" – "}
          {MONTH_NAMES[secondMonth].slice(0, 3)} {secondYear}
        </span>
        <button
          onClick={goToNext}
          aria-label="Next month"
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Two-month calendars */}
      <div
        className={cn(
          "flex flex-col sm:flex-row gap-6 transition-opacity duration-200",
          loading && "opacity-50",
        )}
      >
        <MonthGrid
          year={firstYear}
          month={firstMonth}
          ranges={firstRanges}
          today={today}
        />
        <MonthGrid
          year={secondYear}
          month={secondMonth}
          ranges={secondRanges}
          today={today}
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-5 pt-4 border-t border-border text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-emerald-500/15 border border-emerald-500/30" />
          Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-red-500/20 border border-red-500/30" />
          Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded opacity-20 bg-muted-foreground" />
          Past
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded border-2 border-gold-500" />
          Today
        </span>
      </div>
    </div>
  );
}
