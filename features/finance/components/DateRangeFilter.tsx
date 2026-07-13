"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/utils";
import { CalendarDays } from "lucide-react";

type Preset = {
  label: string;
  from: string;
  to: string;
};

function getPKTToday() {
  const pkt = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return pkt.toISOString().slice(0, 10);
}

function getPKTDate(daysAgo: number) {
  const pkt = new Date(Date.now() + 5 * 60 * 60 * 1000 - daysAgo * 86400000);
  return pkt.toISOString().slice(0, 10);
}

function getPresets(): Preset[] {
  const today = getPKTToday();
  return [
    { label: "Today",       from: today,             to: today             },
    { label: "Yesterday",   from: getPKTDate(1),     to: getPKTDate(1)     },
    { label: "Last 2 Days", from: getPKTDate(2),     to: today             },
    { label: "This Week",   from: getPKTDate(6),     to: today             },
    { label: "This Month",  from: "",                to: ""                },
  ];
}

export function DateRangeFilter() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentFrom = searchParams.get("from") ?? "";
  const currentTo   = searchParams.get("to")   ?? "";

  const presets = getPresets();
  const activePreset = presets.find(
    (p) => p.from === currentFrom && p.to === currentTo
  ) ?? (currentFrom || currentTo ? null : presets[4]);

  function navigate(from: string, to: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (from) params.set("from", from); else params.delete("from");
    if (to)   params.set("to",   to);   else params.delete("to");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Period</span>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const isActive = activePreset?.label === p.label;
          return (
            <button
              key={p.label}
              onClick={() => navigate(p.from, p.to)}
              disabled={pending}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
                isActive
                  ? "bg-gold-500/15 text-gold-400 border-gold-500/30"
                  : "bg-accent/30 text-muted-foreground border-border hover:text-foreground hover:border-border/80"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Custom date range */}
      <div className="flex items-center gap-1.5 ml-auto">
        <input
          type="date"
          value={currentFrom}
          max={currentTo || getPKTToday()}
          onChange={(e) => navigate(e.target.value, currentTo)}
          className="px-2 py-1 text-xs rounded-lg border border-border bg-accent/30 text-foreground focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 [color-scheme:dark]"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <input
          type="date"
          value={currentTo}
          min={currentFrom}
          max={getPKTToday()}
          onChange={(e) => navigate(currentFrom, e.target.value)}
          className="px-2 py-1 text-xs rounded-lg border border-border bg-accent/30 text-foreground focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 [color-scheme:dark]"
        />
      </div>

      {pending && (
        <div className="w-3 h-3 rounded-full border-2 border-gold-400 border-t-transparent animate-spin" />
      )}
    </div>
  );
}
