"use client";

// ============================================================
// features/hr/components/ReportsView.tsx
// Monthly attendance/payroll report: insights, a summary table
// with CSV export, and a per-staff attendance calendar.
// ============================================================

import { useState, useTransition } from "react";
import {
  CalendarDays, Download, Loader2, TriangleAlert, Info, CalendarRange, X,
} from "lucide-react";
import { getMonthlyAttendanceReport, type MonthlyReport, type ReportRow, type Insight } from "@/server/actions/hr-reports";
import { cn, formatPKR } from "@/utils";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function ReportsView({ initialReport, insights, month, year }: {
  initialReport: MonthlyReport; insights: Insight[]; month: number; year: number;
}) {
  const [report, setReport] = useState(initialReport);
  const [m, setM] = useState(month);
  const [y, setY] = useState(year);
  const [loading, start] = useTransition();
  const [calStaff, setCalStaff] = useState<ReportRow | null>(null);

  function reload(mm = m, yy = y) {
    start(async () => setReport(await getMonthlyAttendanceReport(mm, yy)));
  }

  function exportCsv() {
    const cell = (v: unknown) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const rowCsv = (a: unknown[]) => a.map(cell).join(",");
    const out: string[] = [];
    out.push(rowCsv([`CHAKWAL GUEST HOUSE — ATTENDANCE & PAYROLL REPORT`]));
    out.push(rowCsv([report.label]));
    out.push("");
    out.push(rowCsv(["Staff","Branch","Monthly Salary","Present","Paid Leave","Unpaid Leave","Absent","Half Days","Late","Early Out","Weekly Off","Deductions","Additions","Advance","Net Payable"]));
    for (const r of report.rows) {
      out.push(rowCsv([r.name, r.branch, r.monthlySalary.toFixed(0), r.presentDays, r.paidLeaveDays, r.unpaidLeaveDays, r.absentDays, r.halfDays, r.lateCount, r.earlyCount, r.weeklyOffDays, r.totalDeductions.toFixed(0), r.additions.toFixed(0), r.advance.toFixed(0), r.netPayable.toFixed(0)]));
    }
    out.push(rowCsv(["TOTAL","","","","","","","","","","",report.totals.deductions.toFixed(0),"","",report.totals.net.toFixed(0)]));
    const blob = new Blob(["﻿" + out.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `CGH-attendance-${report.year}-${String(report.month).padStart(2, "0")}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  const years = [year, year - 1, year - 2];

  return (
    <div className="space-y-5">
      {/* controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Month</label>
          <select className="input-luxury" value={m} onChange={(e) => { const v = Number(e.target.value); setM(v); reload(v, y); }}>
            {MONTHS.map((mn, i) => <option key={mn} value={i + 1}>{mn}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Year</label>
          <select className="input-luxury" value={y} onChange={(e) => { const v = Number(e.target.value); setY(v); reload(m, v); }}>
            {years.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
        <div className="flex-1" />
        <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* insights */}
      {insights.length > 0 && (
        <div className="card-luxury p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Management insights</p>
          <div className="space-y-1.5">
            {insights.map((ins, i) => (
              <div key={i} className={cn("flex items-center gap-2 text-sm", ins.level === "warn" ? "text-amber-300" : "text-muted-foreground")}>
                {ins.level === "warn" ? <TriangleAlert className="w-3.5 h-3.5 flex-shrink-0" /> : <Info className="w-3.5 h-3.5 flex-shrink-0" />}
                {ins.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* summary table */}
      <div className="card-luxury overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-gold-400" /> {report.label}</h3>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Staff</th><th className="text-center">Present</th><th className="text-center">Paid Lv</th>
                <th className="text-center">Absent</th><th className="text-center">Half</th><th className="text-center">Late</th>
                <th className="text-right">Deductions</th><th className="text-right">Net</th><th></th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((r) => (
                <tr key={r.staffId}>
                  <td className="font-medium text-foreground whitespace-nowrap">{r.name}</td>
                  <td className="text-center text-green-400">{r.presentDays}</td>
                  <td className="text-center text-blue-400">{r.paidLeaveDays}/{report.allowance}</td>
                  <td className={cn("text-center", r.absentDays ? "text-red-400" : "text-muted-foreground")}>{r.absentDays}</td>
                  <td className="text-center text-orange-400">{r.halfDays}</td>
                  <td className={cn("text-center", r.lateCount ? "text-amber-400" : "text-muted-foreground")}>{r.lateCount}</td>
                  <td className="text-right text-red-400">{r.totalDeductions ? formatPKR(r.totalDeductions) : "—"}</td>
                  <td className="text-right font-semibold text-gold-400">{formatPKR(r.netPayable)}</td>
                  <td>
                    <button onClick={() => setCalStaff(r)} title="Calendar"
                      className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-gold-500/30">
                      <CalendarRange className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-border">
                <td className="font-bold text-foreground">TOTAL</td>
                <td colSpan={5}></td>
                <td className="text-right font-bold text-red-400">{formatPKR(report.totals.deductions)}</td>
                <td className="text-right font-bold text-gold-400">{formatPKR(report.totals.net)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {calStaff && <CalendarModal staff={calStaff} month={report.month} year={report.year} onClose={() => setCalStaff(null)} />}
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────
const LABEL_TONE: { test: RegExp; cls: string; short: string }[] = [
  { test: /paid leave/i, cls: "bg-blue-500/25 text-blue-200 border-blue-500/40", short: "L" },
  { test: /unpaid leave/i, cls: "bg-blue-900/40 text-blue-300 border-blue-500/30", short: "U" },
  { test: /half/i, cls: "bg-orange-500/25 text-orange-200 border-orange-500/40", short: "½" },
  { test: /late/i, cls: "bg-amber-500/25 text-amber-200 border-amber-500/40", short: "P" },
  { test: /early/i, cls: "bg-orange-500/20 text-orange-200 border-orange-500/30", short: "P" },
  { test: /present/i, cls: "bg-green-500/25 text-green-200 border-green-500/40", short: "P" },
  { test: /weekly off/i, cls: "bg-white/10 text-white/50 border-white/15", short: "·" },
  { test: /holiday/i, cls: "bg-violet-500/25 text-violet-200 border-violet-500/40", short: "H" },
  { test: /missing/i, cls: "bg-white/5 text-white/40 border-dashed border-white/20", short: "?" },
  { test: /absent/i, cls: "bg-red-500/25 text-red-200 border-red-500/40", short: "A" },
];
function toneFor(label: string) {
  return LABEL_TONE.find((t) => t.test.test(label)) ?? { cls: "bg-white/5 text-white/40 border-white/10", short: "" };
}

function CalendarModal({ staff, month, year, onClose }: { staff: ReportRow; month: number; year: number; onClose: () => void }) {
  const [openLine, setOpenLine] = useState<{ date: string; label: string } | null>(null);
  const ledger = staff.ledger;

  const byDay = new Map(ledger.map((l) => [Number(l.date.slice(8, 10)), l]));
  const dim = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=Sun
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-elevated border border-border rounded-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-foreground">{staff.name}</h3>
            <p className="text-xs text-muted-foreground">{MONTHS[month - 1]} {year}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
              {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="text-[10px] text-muted-foreground">{d}</div>)}
              {cells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const line = byDay.get(day);
                const tone = line ? toneFor(line.label) : { cls: "bg-white/[0.03] text-white/30 border-white/10", short: "" };
                return (
                  <button key={i} disabled={!line} onClick={() => line && setOpenLine(line)}
                    className={cn("aspect-square rounded-lg border text-xs font-semibold flex flex-col items-center justify-center", tone.cls, !line && "cursor-default")}>
                    <span className="text-[9px] opacity-60">{day}</span>
                    <span>{tone.short}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
              <Legend cls="bg-green-500/25" label="Present" />
              <Legend cls="bg-amber-500/25" label="Late" />
              <Legend cls="bg-orange-500/25" label="Half" />
              <Legend cls="bg-blue-500/25" label="Leave" />
              <Legend cls="bg-red-500/25" label="Absent" />
              <Legend cls="bg-white/10" label="Off" />
            </div>

            {openLine && (
              <div className="mt-3 rounded-xl border border-border bg-accent/40 p-3 text-sm">
                <p className="font-semibold text-foreground">{openLine.date}</p>
                <p className="text-muted-foreground">{openLine.label}</p>
              </div>
            )}
      </div>
    </div>
  );
}
function Legend({ cls, label }: { cls: string; label: string }) {
  return <span className="flex items-center gap-1"><span className={cn("w-2.5 h-2.5 rounded-sm", cls)} /> {label}</span>;
}
