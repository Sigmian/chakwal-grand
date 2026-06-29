"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface Props {
  checkInDate: string; // ISO string
}

function getTimeLeft(targetIso: string) {
  const now    = Date.now();
  const target = new Date(targetIso).setHours(0, 0, 0, 0); // flexible check-in — count to start of day
  const diff   = target - now;

  if (diff <= 0) return null;

  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
}

export function BookingCountdown({ checkInDate }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(checkInDate));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft(checkInDate)), 1000);
    return () => clearInterval(id);
  }, [checkInDate]);

  if (!timeLeft) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-semibold">
        <Clock className="w-4 h-4" />
        Check-in time has arrived — welcome!
      </div>
    );
  }

  const pads = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="bg-gold-500/5 border border-gold-500/15 rounded-2xl p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 text-center">
        Time until check-in
      </p>
      <div className="flex items-center justify-center gap-3">
        {[
          { value: timeLeft.days,    label: "Days"    },
          { value: timeLeft.hours,   label: "Hours"   },
          { value: timeLeft.minutes, label: "Minutes" },
          { value: timeLeft.seconds, label: "Seconds" },
        ].map(({ value, label }, idx) => (
          <div key={label} className="flex items-center gap-3">
            {idx > 0 && <span className="text-gold-500/40 text-2xl font-light mb-4">:</span>}
            <div className="text-center">
              <div className="w-16 h-16 bg-surface-elevated border border-border rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold font-serif text-gold-400">{pads(value)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
