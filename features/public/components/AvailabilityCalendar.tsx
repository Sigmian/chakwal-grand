"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react";
import { cn } from "@/utils";

interface Props {
  roomId:      string;
  branchId:    string;
  bookedDates: { checkIn: string; checkOut: string }[];
}

const DAYS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function isBooked(date: Date, ranges: { checkIn: string; checkOut: string }[]) {
  const d = date.toISOString().split("T")[0];
  return ranges.some((r) => d >= r.checkIn && d < r.checkOut);
}

function isPast(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function AvailabilityCalendar({ roomId, branchId, bookedDates }: Props) {
  const router = useRouter();
  const now    = new Date();

  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [checkIn,  setCheckIn]  = useState<string | null>(null);
  const [checkOut, setCheckOut] = useState<string | null>(null);
  const [phase, setPhase] = useState<"checkIn" | "checkOut">("checkIn");

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // Build calendar grid
  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const handleDateClick = (date: Date) => {
    const iso = date.toISOString().split("T")[0];
    if (isPast(date) || isBooked(date, bookedDates)) return;

    if (phase === "checkIn") {
      setCheckIn(iso);
      setCheckOut(null);
      setPhase("checkOut");
    } else {
      if (checkIn && iso <= checkIn) {
        // Re-select check-in
        setCheckIn(iso);
        setCheckOut(null);
        return;
      }
      // Validate no booked date in range
      if (checkIn) {
        const ci  = new Date(checkIn);
        const co  = new Date(iso);
        let   cur = new Date(ci);
        cur.setDate(cur.getDate() + 1);
        let valid = true;
        while (cur < co) {
          if (isBooked(cur, bookedDates)) { valid = false; break; }
          cur.setDate(cur.getDate() + 1);
        }
        if (!valid) {
          // reset
          setCheckIn(iso);
          setCheckOut(null);
          return;
        }
      }
      setCheckOut(iso);
      setPhase("checkIn");
    }
  };

  const isInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false;
    const iso = date.toISOString().split("T")[0];
    return iso > checkIn && iso < checkOut;
  };

  const isSelected = (date: Date) => {
    const iso = date.toISOString().split("T")[0];
    return iso === checkIn || iso === checkOut;
  };

  const proceed = () => {
    if (!checkIn || !checkOut) return;
    const params = new URLSearchParams({ roomId, branchId, checkIn, checkOut, adults: "2" });
    router.push(`/book?${params.toString()}`);
  };

  const nights = checkIn && checkOut
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000)
    : 0;

  return (
    <div className="card-luxury rounded-2xl p-6">
      <h3 className="font-bold text-foreground mb-1 flex items-center gap-2">
        <CalendarCheck className="w-5 h-5 text-gold-400" />
        Check Availability
      </h3>
      <p className="text-xs text-muted-foreground mb-5">
        {phase === "checkIn" ? "Click a date to set check-in" : "Now click your check-out date"}
      </p>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {MONTHS[month]} {year}
        </span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const booked   = isBooked(date, bookedDates);
          const past     = isPast(date);
          const sel      = isSelected(date);
          const inRange  = isInRange(date);
          const disabled = booked || past;

          return (
            <button
              key={i}
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={cn(
                "text-xs py-2 rounded-lg transition-all font-medium",
                disabled && "opacity-30 cursor-not-allowed line-through",
                booked && "bg-red-500/10 text-red-400",
                !disabled && !sel && !inRange && "hover:bg-accent text-foreground",
                inRange && "bg-gold-500/15 text-gold-400 rounded-none",
                sel && "bg-gold-500 text-background font-bold shadow-gold-sm",
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500/20" /> Booked</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gold-500" /> Selected</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gold-500/15" /> Your stay</span>
      </div>

      {/* Proceed button */}
      {checkIn && checkOut && (
        <div className="mt-5 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            <span className="text-foreground font-semibold">{nights} night{nights > 1 ? "s" : ""}</span>
            {" "}·{" "}
            {new Date(checkIn).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
            {" — "}
            {new Date(checkOut).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
          </p>
          <button
            onClick={proceed}
            className="w-full py-2.5 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all"
          >
            Book These Dates →
          </button>
        </div>
      )}
    </div>
  );
}
