"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Users, Building2, Search } from "lucide-react";

interface Branch { id: string; name: string; city: string }

const today     = new Date().toISOString().split("T")[0];
const tomorrow  = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];

export function BookingWidget({ branches }: { branches: Branch[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    branchId: branches[0]?.id ?? "",
    checkIn:  today,
    checkOut: tomorrow,
    adults:   "2",
    children: "0",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const search = () => {
    const p = new URLSearchParams({
      branchId: form.branchId,
      checkIn:  form.checkIn,
      checkOut: form.checkOut,
      adults:   form.adults,
      children: form.children,
    });
    router.push(`/book?${p.toString()}`);
  };

  const inputCls = "bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/20 transition-all w-full";

  return (
    <div className="bg-surface-elevated/90 backdrop-blur-md border border-border rounded-2xl p-5 shadow-card-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

        {/* Branch */}
        <div className="lg:col-span-1">
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            <Building2 className="w-3 h-3" /> Branch
          </label>
          <select value={form.branchId} onChange={set("branchId")} className={inputCls}>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        {/* Check-in */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            <CalendarDays className="w-3 h-3" /> Check-In
          </label>
          <input type="date" value={form.checkIn} min={today} onChange={set("checkIn")} className={inputCls} />
        </div>

        {/* Check-out */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            <CalendarDays className="w-3 h-3" /> Check-Out
          </label>
          <input type="date" value={form.checkOut} min={form.checkIn || today} onChange={set("checkOut")} className={inputCls} />
        </div>

        {/* Guests */}
        <div>
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            <Users className="w-3 h-3" /> Guests
          </label>
          <select value={form.adults} onChange={set("adults")} className={inputCls}>
            {[1,2,3,4,5,6].map(n => (
              <option key={n} value={n}>{n} Adult{n > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>

        {/* Search button */}
        <div className="flex items-end">
          <button
            onClick={search}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Search className="w-4 h-4" />
            Search Rooms
          </button>
        </div>
      </div>
    </div>
  );
}
