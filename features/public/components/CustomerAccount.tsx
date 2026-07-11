"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Award, BedDouble, Calendar, MapPin } from "lucide-react";

type Tier = "Bronze" | "Silver" | "Gold" | "Platinum";

export interface CustomerAccountData {
  name: string;
  phone: string;
  lifetimeNights: number;
  tier: Tier;
  benefits: string;
  nextTier: Tier | null;
  nightsToNextTier: number | null;
  currentTierMin: number;
  nextTierMin: number | null;
  bookings: Array<{
    id: string;
    bookingRef: string;
    roomName: string;
    branchName: string;
    checkInDate: string;
    checkOutDate: string;
    nights: number;
    status: string;
    totalAmount: number;
  }>;
}

const TIER_STYLES: Record<Tier, { badge: string; ring: string; bar: string }> = {
  Bronze:   { badge: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",   ring: "ring-zinc-500/20",  bar: "bg-zinc-400" },
  Silver:   { badge: "bg-slate-500/20 text-slate-200 border-slate-400/40", ring: "ring-slate-400/30", bar: "bg-slate-300" },
  Gold:     { badge: "bg-amber-500/20 text-amber-300 border-amber-500/40", ring: "ring-amber-500/30", bar: "bg-amber-400" },
  Platinum: { badge: "bg-purple-500/20 text-purple-300 border-purple-500/40", ring: "ring-purple-500/30", bar: "bg-purple-400" },
};

const STATUS_STYLES: Record<string, string> = {
  PENDING:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  CONFIRMED:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CHECKED_IN:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  CHECKED_OUT: "bg-surface-elevated text-muted-foreground border-border",
  CANCELLED:   "bg-red-500/10 text-red-400 border-red-500/20",
  NO_SHOW:     "bg-red-500/10 text-red-400 border-red-500/20",
};

function formatPKR(n: number): string {
  return "PKR " + n.toLocaleString("en-PK");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CustomerAccount({ data }: { data: CustomerAccountData }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const tierStyle = TIER_STYLES[data.tier];

  const progressPct = (() => {
    if (data.nextTierMin === null) return 100;
    const span = data.nextTierMin - data.currentTierMin;
    const done = data.lifetimeNights - data.currentTierMin;
    if (span <= 0) return 100;
    return Math.max(0, Math.min(100, Math.round((done / span) * 100)));
  })();

  const signOut = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/customer/logout", { method: "DELETE" });
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground">
            Welcome back, {data.name}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{data.phone}</p>
        </div>
        <button
          onClick={signOut}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-elevated border border-border text-sm text-muted-foreground hover:text-foreground hover:border-gold-500/30 transition-colors disabled:opacity-60"
        >
          {loggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Sign out
        </button>
      </div>

      {/* Loyalty tier card */}
      <div className={`bg-surface-elevated border border-border rounded-2xl p-6 shadow-card ring-1 ${tierStyle.ring}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center">
              <Award className="w-6 h-6 text-gold-400" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Loyalty tier</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierStyle.badge}`}>
                  {data.tier}
                </span>
                <span className="text-sm text-muted-foreground">
                  {data.lifetimeNights} night{data.lifetimeNights === 1 ? "" : "s"} lifetime
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-foreground/90 leading-relaxed">{data.benefits}</p>

        {/* Progress bar */}
        {data.nextTier && data.nightsToNextTier !== null ? (
          <div className="mt-5">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span>{data.tier}</span>
              <span>{data.nightsToNextTier} night{data.nightsToNextTier === 1 ? "" : "s"} to {data.nextTier}</span>
            </div>
            <div className="h-2 bg-surface-base border border-border rounded-full overflow-hidden">
              <div
                className={`h-full ${tierStyle.bar} transition-all`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-5 text-xs text-muted-foreground">
            You&apos;ve reached the top tier. Thank you for choosing CGH!
          </p>
        )}
      </div>

      {/* Booking history */}
      <div>
        <h2 className="text-lg font-serif font-bold text-foreground mb-3">Booking history</h2>

        {data.bookings.length === 0 ? (
          <div className="bg-surface-elevated border border-border rounded-2xl p-8 text-center">
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          </div>
        ) : (
          <>
            {/* Table (md+) */}
            <div className="hidden md:block bg-surface-elevated border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface-base/60 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Ref</th>
                    <th className="text-left px-4 py-3 font-semibold">Room</th>
                    <th className="text-left px-4 py-3 font-semibold">Branch</th>
                    <th className="text-left px-4 py-3 font-semibold">Dates</th>
                    <th className="text-center px-4 py-3 font-semibold">Nights</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                    <th className="text-right px-4 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.bookings.map((b) => (
                    <tr key={b.id} className="border-t border-border">
                      <td className="px-4 py-3 font-mono text-xs text-gold-400">{b.bookingRef}</td>
                      <td className="px-4 py-3 text-foreground">{b.roomName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{b.branchName}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(b.checkInDate)} – {formatDate(b.checkOutDate)}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{b.nights}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[b.status] ?? STATUS_STYLES.PENDING}`}>
                          {b.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">{formatPKR(b.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards (mobile) */}
            <div className="md:hidden space-y-3">
              {data.bookings.map((b) => (
                <div key={b.id} className="bg-surface-elevated border border-border rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-mono text-xs text-gold-400">{b.bookingRef}</p>
                      <p className="text-sm font-semibold text-foreground mt-1 flex items-center gap-1.5">
                        <BedDouble className="w-3.5 h-3.5 text-muted-foreground" />
                        {b.roomName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        {b.branchName}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_STYLES[b.status] ?? STATUS_STYLES.PENDING}`}>
                      {b.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(b.checkInDate)} – {formatDate(b.checkOutDate)} · {b.nights}n
                    </span>
                    <span className="font-semibold text-foreground">{formatPKR(b.totalAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
