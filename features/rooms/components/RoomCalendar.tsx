// ============================================================
// features/rooms/components/RoomCalendar.tsx
// Monthly availability calendar for a single room
// ============================================================

"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, isAfter, isSameDay, getDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils";

interface Booking {
  id:          string;
  bookingRef:  string;
  checkInDate: Date | string;
  checkOutDate:Date | string;
  status:      string;
  customer?:   { name: string };
}

interface Props {
  roomId:   string;
  bookings: Booking[];
}

const BOOKING_STATUS_BG: Record<string, string> = {
  CONFIRMED:  "bg-blue-500/20 border-blue-500/30 text-blue-400",
  CHECKED_IN: "bg-green-500/20 border-green-500/30 text-green-400",
  PENDING:    "bg-amber-500/20 border-amber-500/30 text-amber-400",
  CANCELLED:  "bg-red-500/20 border-red-500/30 text-red-400",
};

export function RoomCalendar({ roomId, bookings }: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd   = endOfMonth(currentMonth);
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay   = getDay(monthStart);

  const getBookingForDay = (day: Date) =>
    bookings.find((b) => {
      const ci = new Date(b.checkInDate);
      const co = new Date(b.checkOutDate);
      return (isAfter(day, ci) || isSameDay(day, ci)) &&
             (isBefore(day, co) || isSameDay(day, co));
    });

  const [tooltip, setTooltip] = useState<{ booking: Booking; x: number; y: number } | null>(null);

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} className="text-center text-2xs font-semibold uppercase tracking-wider text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Leading empty cells */}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const booking = getBookingForDay(day);
          const past    = isBefore(day, new Date()) && !isToday(day);
          const today   = isToday(day);
          const isCheckIn  = booking && isSameDay(day, new Date(booking.checkInDate));
          const isCheckOut = booking && isSameDay(day, new Date(booking.checkOutDate));

          return (
            <div
              key={day.toISOString()}
              onMouseEnter={(e) => booking && setTooltip({ booking, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
              className={cn(
                "relative h-9 rounded-lg flex items-center justify-center cursor-default text-sm transition-all",
                today && "ring-2 ring-gold-500 ring-offset-1 ring-offset-surface-base",
                booking
                  ? BOOKING_STATUS_BG[booking.status] ?? "bg-blue-500/20"
                  : past
                  ? "text-muted-foreground/40"
                  : "text-foreground hover:bg-accent",
                (isCheckIn || isCheckOut) && "font-bold"
              )}
            >
              <span className="text-xs font-medium">{format(day, "d")}</span>
              {isCheckIn && (
                <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-green-400" title="Check-in" />
              )}
              {isCheckOut && (
                <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-red-400" title="Check-out" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/50">
        {[
          { label: "Confirmed",  color: "bg-blue-500/40"  },
          { label: "Checked In", color: "bg-green-500/40" },
          { label: "Pending",    color: "bg-amber-500/40" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className={cn("w-3 h-3 rounded", color)} />
            {label}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-3 py-2 bg-surface-overlay border border-border rounded-xl shadow-card-lg text-xs pointer-events-none"
          style={{ left: tooltip.x + 12, top: tooltip.y - 40 }}
        >
          <p className="font-semibold text-foreground">{tooltip.booking.bookingRef}</p>
          {tooltip.booking.customer && (
            <p className="text-muted-foreground">{tooltip.booking.customer.name}</p>
          )}
          <p className="text-muted-foreground mt-0.5">
            {format(new Date(tooltip.booking.checkInDate), "dd MMM")} →{" "}
            {format(new Date(tooltip.booking.checkOutDate), "dd MMM")}
          </p>
        </div>
      )}
    </div>
  );
}
