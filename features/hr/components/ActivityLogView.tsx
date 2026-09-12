"use client";

// ============================================================
// features/hr/components/ActivityLogView.tsx
// Filterable staff activity log (staff / branch / action / date).
// ============================================================

import { useState, useTransition } from "react";
import { Activity, Download, Loader2 } from "lucide-react";
import { getActivityLog, type ActivityRow } from "@/server/actions/activity";
import { cn } from "@/utils";

// Colour a badge by the family of the action.
function actionTone(action: string) {
  if (action.startsWith("LOGIN") || action.startsWith("LOGOUT")) return "border-blue-500/25 bg-blue-500/10 text-blue-300";
  if (action.startsWith("CHECK")) return "border-emerald-500/25 bg-emerald-500/10 text-emerald-300";
  if (action.startsWith("STOCK") || action.startsWith("PRODUCT")) return "border-amber-500/25 bg-amber-500/10 text-amber-300";
  if (action.startsWith("BOOKING") || action.startsWith("PAYMENT")) return "border-violet-500/25 bg-violet-500/10 text-violet-300";
  if (action.startsWith("ROOM")) return "border-cyan-500/25 bg-cyan-500/10 text-cyan-300";
  return "border-white/15 bg-white/5 text-white/60";
}
const pretty = (a: string) => a.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

interface Filters {
  staff: { id: string; name: string }[];
  branches: { id: string; name: string }[];
  actions: string[];
}

export function ActivityLogView({ initialRows, filters }: { initialRows: ActivityRow[]; filters: Filters }) {
  const [rows, setRows] = useState(initialRows);
  const [loading, start] = useTransition();
  const [f, setF] = useState({ userId: "", branchId: "", action: "", from: "", to: "" });

  function reload(next = f) {
    start(async () => {
      setRows(await getActivityLog({
        userId: next.userId || undefined, branchId: next.branchId || undefined,
        action: next.action || undefined, from: next.from || undefined, to: next.to || undefined, limit: 300,
      }));
    });
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const next = { ...f, [k]: e.target.value }; setF(next); reload(next);
  };

  function exportCsv() {
    const esc = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const head = ["Date", "Time", "Staff", "Role", "Action", "Description", "Branch"];
    const lines = rows.map((r) => {
      const d = new Date(r.createdAt);
      return [d.toLocaleDateString("en-PK"), d.toLocaleTimeString("en-PK"), r.staffName, r.role ?? "", pretty(r.action), r.description, r.branch ?? ""].map(esc).join(",");
    });
    const blob = new Blob(["﻿" + [head.map(esc).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `CGH-activity-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  const sel = "input-luxury text-sm";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Staff</label>
          <select className={sel} value={f.userId} onChange={set("userId")}>
            <option value="">All staff</option>
            {filters.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        {filters.branches.length > 0 && (
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Branch</label>
            <select className={sel} value={f.branchId} onChange={set("branchId")}>
              <option value="">All branches</option>
              {filters.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Action</label>
          <select className={sel} value={f.action} onChange={set("action")}>
            <option value="">All actions</option>
            {filters.actions.map((a) => <option key={a} value={a}>{pretty(a)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">From</label>
          <input type="date" className={sel} value={f.from} onChange={set("from")} />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">To</label>
          <input type="date" className={sel} value={f.to} onChange={set("to")} />
        </div>
        <div className="flex-1" />
        <button onClick={exportCsv} disabled={rows.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl disabled:opacity-50">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="card-luxury overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-gold-400" /> {rows.length} event{rows.length !== 1 ? "s" : ""}
          </h3>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No activity matches these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr><th>When</th><th>Staff</th><th>Action</th><th>Details</th><th>Branch</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const d = new Date(r.createdAt);
                  return (
                    <tr key={r.id}>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">
                        {d.toLocaleDateString("en-PK", { day: "numeric", month: "short" })}<br />
                        {d.toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" })}
                      </td>
                      <td className="whitespace-nowrap">
                        <span className="font-medium text-foreground">{r.staffName}</span>
                        {r.role && <span className="block text-[11px] text-muted-foreground">{r.role.replace(/_/g, " ").toLowerCase()}</span>}
                      </td>
                      <td>
                        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", actionTone(r.action))}>
                          {pretty(r.action)}
                        </span>
                      </td>
                      <td className="text-sm text-muted-foreground max-w-[360px]">{r.description}</td>
                      <td className="text-xs text-muted-foreground whitespace-nowrap">{r.branch ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
