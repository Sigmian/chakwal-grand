"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { cn } from "@/utils";
import { Suspense } from "react";

function getPKTToday() {
  const pkt = new Date(Date.now() + 5 * 60 * 60 * 1000);
  return pkt.toISOString().slice(0, 10);
}

function getPKTDate(daysAgo: number) {
  const pkt = new Date(Date.now() + 5 * 60 * 60 * 1000 - daysAgo * 86400000);
  return pkt.toISOString().slice(0, 10);
}

function DateRangeFilterInner() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const today      = getPKTToday();
  const currentFrom = searchParams.get("from") ?? "";
  const currentTo   = searchParams.get("to")   ?? "";

  const presets = [
    { label: "Today",       from: today,         to: today         },
    { label: "Yesterday",   from: getPKTDate(1), to: getPKTDate(1) },
    { label: "Last 2 Days", from: getPKTDate(2), to: today         },
    { label: "This Week",   from: getPKTDate(6), to: today         },
    { label: "This Month",  from: "",            to: ""            },
  ];

  const isThisMonth = !currentFrom && !currentTo;
  const activeLabel = isThisMonth
    ? "This Month"
    : presets.find((p) => p.from === currentFrom && p.to === currentTo)?.label ?? null;

  function makeHref(from: string, to: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (from) params.set("from", from); else params.delete("from");
    if (to)   params.set("to",   to);   else params.delete("to");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        <CalendarDays className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Period</span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <Link
            key={p.label}
            href={makeHref(p.from, p.to)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border",
              activeLabel === p.label
                ? "bg-gold-500/15 text-gold-400 border-gold-500/30"
                : "bg-accent/30 text-muted-foreground border-border hover:text-foreground hover:border-border/80"
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* Custom date inputs — still client-side but only for manual picks */}
      <div className="flex items-center gap-1.5 ml-auto">
        <input
          type="date"
          defaultValue={currentFrom}
          max={currentTo || today}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            if (e.target.value) params.set("from", e.target.value); else params.delete("from");
            window.location.href = `${pathname}?${params.toString()}`;
          }}
          className="px-2 py-1 text-xs rounded-lg border border-border bg-accent/30 text-foreground focus:outline-none focus:border-gold-500/50 [color-scheme:dark]"
        />
        <span className="text-xs text-muted-foreground">to</span>
        <input
          type="date"
          defaultValue={currentTo}
          min={currentFrom}
          max={today}
          onChange={(e) => {
            const params = new URLSearchParams(searchParams.toString());
            if (e.target.value) params.set("to", e.target.value); else params.delete("to");
            window.location.href = `${pathname}?${params.toString()}`;
          }}
          className="px-2 py-1 text-xs rounded-lg border border-border bg-accent/30 text-foreground focus:outline-none focus:border-gold-500/50 [color-scheme:dark]"
        />
      </div>
    </div>
  );
}

export function DateRangeFilter() {
  return (
    <Suspense fallback={
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-accent animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-7 w-20 rounded-lg bg-accent animate-pulse" />
        ))}
      </div>
    }>
      <DateRangeFilterInner />
    </Suspense>
  );
}
