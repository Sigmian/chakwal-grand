// ============================================================
// features/hr/components/StaffTodayWidget.tsx
// Compact "who's on duty today" card for the main dashboard.
// Presentational — data comes from getTodayOverview (hr:manage).
// ============================================================

import Link from "next/link";
import { Users, ArrowRight, UserCheck, Moon, UserX, DoorOpen } from "lucide-react";
import { cn } from "@/utils";

export interface TodayOverview {
  total: number;
  present: number;
  onDuty: number;
  nightTonight: number;
  notCheckedInCount: number;
  alerts: string[];
  rows: {
    id: string;
    name: string;
    branch: string;
    shift: string | null;
    night: boolean;
    status: string;
    checkedIn: boolean;
    onDuty: boolean;
  }[];
}

const STATUS_TONE: Record<string, { label: string; cls: string }> = {
  PRESENT:        { label: "Present",  cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" },
  LATE:           { label: "Late",     cls: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
  HALF_DAY:       { label: "Half day", cls: "bg-orange-500/15 text-orange-300 border-orange-500/25" },
  EARLY_CHECKOUT: { label: "Left early", cls: "bg-orange-500/15 text-orange-300 border-orange-500/25" },
  MISSING:        { label: "Not in",   cls: "bg-white/5 text-white/45 border-white/10" },
};

function toneFor(status: string) {
  return STATUS_TONE[status] ?? STATUS_TONE.MISSING;
}

export function StaffTodayWidget({ overview }: { overview: TodayOverview }) {
  const stats = [
    { label: "Present",  value: `${overview.present}/${overview.total}`, Icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-500/15" },
    { label: "On duty",  value: overview.onDuty,        Icon: DoorOpen, color: "text-blue-400",  bg: "bg-blue-500/15" },
    { label: "Night",    value: overview.nightTonight,  Icon: Moon,     color: "text-violet-400", bg: "bg-violet-500/15" },
    { label: "Not in",   value: overview.notCheckedInCount, Icon: UserX, color: "text-amber-400", bg: "bg-amber-500/15" },
  ];

  return (
    <div className="card-luxury p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gold-500/15 flex items-center justify-center">
            <Users className="w-4 h-4 text-gold-400" />
          </div>
          <h2 className="font-bold text-foreground">Staff Today</h2>
        </div>
        <Link href="/staff/attendance" className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
          Attendance <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {overview.total === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No active staff to show.</p>
      ) : (
        <>
          {/* stat row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {stats.map(({ label, value, Icon, color, bg }) => (
              <div key={label} className="flex items-center gap-2.5 p-3 bg-surface-highlight rounded-xl">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", bg)}>
                  <Icon className={cn("w-4 h-4", color)} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-lg font-bold font-serif leading-none", color)}>{value}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* roster */}
          <div className="space-y-1.5">
            {overview.rows.map((r) => {
              const tone = toneFor(r.status);
              return (
                <div key={r.id} className="flex items-center gap-3 py-2 px-1 border-b border-border/30 last:border-0">
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    r.onDuty ? "bg-emerald-400 animate-pulse" : r.checkedIn ? "bg-white/40" : "bg-white/15",
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                    <p className="text-2xs text-muted-foreground truncate">
                      {r.branch}{r.shift ? ` · ${r.shift}` : ""}{r.night ? " · night" : ""}
                    </p>
                  </div>
                  {r.onDuty && (
                    <span className="text-2xs font-semibold text-emerald-300 flex-shrink-0">On duty</span>
                  )}
                  <span className={cn("text-2xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0", tone.cls)}>
                    {tone.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
