"use client";

// ============================================================
// features/hr/components/AttendanceAdminView.tsx
// Admin HR hub UI: Today overview, Approvals (leave + attendance
// corrections), and the Payroll dashboard with salary ledger.
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users, ClipboardCheck, Wallet, Check, X, Loader2, AlertTriangle,
  CalendarDays, Moon, TriangleAlert, Lock, RotateCcw,
} from "lucide-react";
import {
  decideLeave, decideCorrection, getPayrollView, finalizePayroll, markPayrollPaid, reopenPayroll,
} from "@/server/actions/hr-approvals";
import { cn, formatPKR } from "@/utils";

// ── types ──
interface Overview {
  total: number; present: number; onDuty: number; nightTonight: number;
  notCheckedInCount: number; alerts: string[];
  rows: { id: string; name: string; branch: string; shift: string | null; night: boolean; status: string; checkedIn: boolean; onDuty: boolean }[];
}
interface LeaveItem { id: string; staffId: string; name: string; branch: string; from: string; to: string; reason: string; notes: string | null; paidUsed: number }
interface CorrItem { id: string; staffId: string; name: string; workDate: string; requestedCheckIn: string | null; requestedCheckOut: string | null; reason: string }
interface Approvals { allowance: number; leaves: LeaveItem[]; corrections: CorrItem[] }
interface StaffLite { id: string; name: string; branch: string }

type Tab = "today" | "approvals" | "payroll";

const STATUS_TONE: Record<string, string> = {
  PRESENT: "text-green-400", LATE: "text-amber-400", HALF_DAY: "text-orange-400",
  EARLY_CHECKOUT: "text-orange-400", APPROVED_LEAVE: "text-blue-400",
  ABSENT: "text-red-400", MISSING: "text-muted-foreground",
};
const STATUS_LABEL: Record<string, string> = {
  PRESENT: "Present", LATE: "Late", HALF_DAY: "Half day", EARLY_CHECKOUT: "Early out",
  APPROVED_LEAVE: "On leave", ABSENT: "Absent", MISSING: "Not marked", HOLIDAY: "Holiday", WEEKLY_OFF: "Weekly off",
};

export function AttendanceAdminView({
  overview, approvals, staff, canFinalize, defaultMonth, defaultYear,
}: {
  overview: Overview; approvals: Approvals; staff: StaffLite[];
  canFinalize: boolean; defaultMonth: number; defaultYear: number;
}) {
  const pendingCount = approvals.leaves.length + approvals.corrections.length;
  const [tab, setTab] = useState<Tab>(overview.notCheckedInCount > 0 || pendingCount === 0 ? "today" : "approvals");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {[
          { key: "today", label: "Today", icon: Users },
          { key: "approvals", label: `Approvals${pendingCount ? ` (${pendingCount})` : ""}`, icon: ClipboardCheck },
          { key: "payroll", label: "Payroll", icon: Wallet },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={cn("flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all",
              tab === key ? "border-gold-500/40 bg-gold-500/15 text-gold-300"
                : "border-border bg-surface-elevated text-muted-foreground hover:text-foreground hover:border-gold-500/30")}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "today" && <TodayPanel o={overview} />}
      {tab === "approvals" && <ApprovalsPanel a={approvals} />}
      {tab === "payroll" && <PayrollPanel staff={staff} canFinalize={canFinalize} month={defaultMonth} year={defaultYear} />}
    </div>
  );
}

// ─── Today ────────────────────────────────────────────────────
function TodayPanel({ o }: { o: Overview }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total staff", value: o.total, tone: "text-foreground" },
          { label: "Present", value: o.present, tone: "text-green-400" },
          { label: "On duty now", value: o.onDuty, tone: "text-gold-400" },
          { label: "Night tonight", value: o.nightTonight, tone: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="card-luxury p-4 text-center">
            <p className={cn("font-serif text-2xl font-bold", s.tone)}>{s.value}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {o.alerts.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-amber-300 mb-1"><TriangleAlert className="w-3.5 h-3.5" /> Alerts</p>
          {o.alerts.map((a, i) => <p key={i} className="text-sm text-amber-200/90">• {a}</p>)}
        </div>
      )}

      <div className="card-luxury overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead><tr><th>Staff</th><th>Branch</th><th>Shift</th><th>Status</th></tr></thead>
            <tbody>
              {o.rows.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-foreground whitespace-nowrap">{r.name}</td>
                  <td className="text-muted-foreground text-xs">{r.branch}</td>
                  <td className="text-xs">{r.shift ?? "—"}{r.night && <Moon className="ml-1 inline w-3 h-3 text-blue-400" />}</td>
                  <td>
                    <span className={cn("text-sm font-semibold", STATUS_TONE[r.status] ?? "text-muted-foreground")}>
                      {STATUS_LABEL[r.status] ?? r.status}{r.onDuty && " · on duty"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Approvals ────────────────────────────────────────────────
function ApprovalsPanel({ a }: { a: Approvals }) {
  if (a.leaves.length === 0 && a.corrections.length === 0) {
    return <div className="card-luxury p-10 text-center text-sm text-muted-foreground">Nothing awaiting approval.</div>;
  }
  return (
    <div className="space-y-5">
      {a.leaves.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Leave requests</h3>
          <div className="space-y-2">{a.leaves.map((l) => <LeaveRow key={l.id} l={l} allowance={a.allowance} />)}</div>
        </div>
      )}
      {a.corrections.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Attendance corrections</h3>
          <div className="space-y-2">{a.corrections.map((c) => <CorrectionRow key={c.id} c={c} />)}</div>
        </div>
      )}
    </div>
  );
}

function LeaveRow({ l, allowance }: { l: LeaveItem; allowance: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const exhausted = l.paidUsed >= allowance;

  function act(decision: "APPROVE" | "REJECT", paidOverride = false) {
    setErr(null);
    start(async () => {
      try { await decideLeave({ id: l.id, decision, paidOverride, overrideReason }); router.refresh(); }
      catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    });
  }

  return (
    <div className="card-luxury p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{l.name} <span className="text-xs text-muted-foreground">· {l.branch}</span></p>
          <p className="text-sm text-muted-foreground mt-0.5">
            <CalendarDays className="inline w-3.5 h-3.5 mr-1 text-gold-500/60" />
            {l.from}{l.to !== l.from ? ` → ${l.to}` : ""} · {l.reason}
          </p>
          {l.notes && <p className="text-xs text-muted-foreground mt-0.5">{l.notes}</p>}
          <p className={cn("text-[11px] mt-1", exhausted ? "text-amber-400" : "text-muted-foreground")}>
            Paid leaves used this month: {l.paidUsed}/{allowance}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => (exhausted ? setOverrideOpen((v) => !v) : act("APPROVE"))} disabled={pending}
            className="flex items-center gap-1.5 rounded-lg bg-green-500/15 border border-green-500/30 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/25 disabled:opacity-60">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
          </button>
          <button onClick={() => act("REJECT")} disabled={pending}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-red-400 hover:border-red-500/30 disabled:opacity-60">
            <X className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      </div>

      {exhausted && overrideOpen && (
        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3">
          <p className="flex items-center gap-1.5 text-xs text-amber-300 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Both paid leaves are used. Approving is <b>unpaid</b> (salary deducted) unless you override.
          </p>
          <input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Override reason (to pay anyway)"
            className="input-luxury w-full text-sm mb-2" />
          <div className="flex gap-2">
            <button onClick={() => act("APPROVE", false)} disabled={pending}
              className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
              Approve as unpaid
            </button>
            <button onClick={() => act("APPROVE", true)} disabled={pending || overrideReason.trim().length < 3}
              className="flex-1 rounded-lg bg-gold-gradient px-3 py-1.5 text-xs font-bold text-background disabled:opacity-50">
              Override → pay it
            </button>
          </div>
        </div>
      )}
      {err && <p className="text-sm text-red-400 mt-2">{err}</p>}
    </div>
  );
}

function CorrectionRow({ c }: { c: CorrItem }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const t = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }) : "—";

  function act(decision: "APPROVE" | "REJECT") {
    setErr(null);
    start(async () => {
      try { await decideCorrection({ id: c.id, decision }); router.refresh(); }
      catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    });
  }
  return (
    <div className="card-luxury p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-foreground">{c.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            {c.workDate} · in {t(c.requestedCheckIn)} / out {t(c.requestedCheckOut)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{c.reason}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => act("APPROVE")} disabled={pending}
            className="flex items-center gap-1.5 rounded-lg bg-green-500/15 border border-green-500/30 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/25 disabled:opacity-60">
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
          </button>
          <button onClick={() => act("REJECT")} disabled={pending}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-red-400 hover:border-red-500/30 disabled:opacity-60">
            <X className="w-3.5 h-3.5" /> Reject
          </button>
        </div>
      </div>
      {err && <p className="text-sm text-red-400 mt-2">{err}</p>}
    </div>
  );
}

// ─── Payroll ──────────────────────────────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PayrollView = { result: any; record: { status: string; finalizedAt: Date | string | null; paidAt: Date | string | null; paymentMethod: string | null; paymentRef: string | null } | null };

function PayrollPanel({ staff, canFinalize, month, year }: { staff: StaffLite[]; canFinalize: boolean; month: number; year: number }) {
  const router = useRouter();
  const [staffId, setStaffId] = useState(staff[0]?.id ?? "");
  const [m, setM] = useState(month);
  const [y, setY] = useState(year);
  const [data, setData] = useState<PayrollView | null>(null);
  const [loading, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);

  function load(sid = staffId, mm = m, yy = y) {
    if (!sid) return;
    setErr(null);
    start(async () => {
      try { setData(await getPayrollView(sid, mm, yy)); }
      catch (e) { setErr(e instanceof Error ? e.message : "Failed to load"); setData(null); }
    });
  }

  const years = [year, year - 1, year - 2];
  const r = data?.result;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Staff</label>
          <select className="input-luxury min-w-[160px]" value={staffId} onChange={(e) => { setStaffId(e.target.value); }}>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Month</label>
          <select className="input-luxury" value={m} onChange={(e) => setM(Number(e.target.value))}>
            {MONTHS.map((mn, i) => <option key={mn} value={i + 1}>{mn}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Year</label>
          <select className="input-luxury" value={y} onChange={(e) => setY(Number(e.target.value))}>
            {years.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
          </select>
        </div>
        <button onClick={() => load()} disabled={loading || !staffId}
          className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />} Load
        </button>
      </div>

      {err && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{err}</div>}

      {r && (
        <>
          <div className="card-luxury p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">{MONTHS[r.month - 1]} {r.year}</h3>
              <StatusBadge status={data?.record?.status ?? "DRAFT"} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <Metric label="Present" value={r.presentDays} />
              <Metric label="Paid leave" value={r.paidLeaveDays} />
              <Metric label="Unpaid leave" value={r.unpaidLeaveDays} />
              <Metric label="Absent" value={r.absentDays} tone={r.absentDays ? "text-red-400" : undefined} />
              <Metric label="Half days" value={r.halfDays} />
              <Metric label="Late" value={r.lateCount} />
              <Metric label="Early out" value={r.earlyCount} />
              <Metric label="Off/Holiday" value={r.weeklyOffDays + r.holidayDays} />
            </div>
            <div className="space-y-1.5 rounded-xl bg-accent/40 p-4 text-sm">
              <Line label="Gross (monthly salary)" value={formatPKR(r.grossSalary)} />
              <Line label="Deductions" value={r.totalDeductions ? `− ${formatPKR(r.totalDeductions)}` : "—"} tone={r.totalDeductions ? "text-red-400" : "text-muted-foreground"} />
              {r.additions > 0 && <Line label="Additions (bonus/overtime)" value={`+ ${formatPKR(r.additions)}`} tone="text-green-400" />}
              {r.advance > 0 && <Line label="Advance" value={`− ${formatPKR(r.advance)}`} tone="text-amber-400" />}
              <div className="border-t border-border pt-1.5">
                <Line label="Net payable" value={formatPKR(r.netPayable)} labelClass="font-semibold text-foreground" tone="font-bold text-gold-400" />
              </div>
            </div>

            {/* actions */}
            <div className="flex flex-wrap gap-2 mt-4">
              {canFinalize && (data?.record?.status ?? "DRAFT") === "DRAFT" && (
                <ActionBtn onDone={() => load()} icon={Lock} label="Finalize" fn={() => finalizePayroll(staffId, m, y)} />
              )}
              {canFinalize && data?.record?.status === "FINALIZED" && (
                <>
                  <button onClick={() => setPayOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl">
                    <Wallet className="w-4 h-4" /> Mark Paid
                  </button>
                  <ActionBtn onDone={() => load()} icon={RotateCcw} label="Reopen" variant="ghost" fn={() => reopenPayroll(staffId, m, y)} />
                </>
              )}
              {data?.record?.status === "PAID" && (
                <span className="text-sm text-green-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> Paid {data.record.paidAt ? `on ${new Date(data.record.paidAt).toLocaleDateString("en-PK")}` : ""} {data.record.paymentMethod ? `· ${data.record.paymentMethod}` : ""}</span>
              )}
            </div>
          </div>

          {/* ledger */}
          <div className="card-luxury overflow-hidden">
            <div className="p-4 border-b border-border"><h3 className="font-bold text-foreground text-sm">Salary Ledger</h3></div>
            <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
              <table className="data-table w-full">
                <thead><tr><th>Date</th><th>Description</th><th className="text-right">Credit</th><th className="text-right">Deduction</th><th className="text-right">Balance</th></tr></thead>
                <tbody>
                  {r.ledger.map((row: { date: string; label: string; credit: number; deduction: number; balance: number }) => (
                    <tr key={row.date}>
                      <td className="text-xs text-muted-foreground whitespace-nowrap">{row.date.slice(8)} {MONTHS[r.month - 1].slice(0, 3)}</td>
                      <td className="text-sm">{row.label}</td>
                      <td className="text-right text-green-400 text-sm">{row.credit ? `+${formatPKR(row.credit)}` : "—"}</td>
                      <td className="text-right text-red-400 text-sm">{row.deduction ? `−${formatPKR(row.deduction)}` : "—"}</td>
                      <td className="text-right font-medium text-foreground text-sm">{formatPKR(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {payOpen && <MarkPaidModal staffId={staffId} month={m} year={y} onClose={() => setPayOpen(false)} onDone={() => { setPayOpen(false); load(); }} />}
        </>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, fn, onDone, variant }: { icon: React.ElementType; label: string; fn: () => Promise<unknown>; onDone: () => void; variant?: "ghost" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} onClick={() => start(async () => { await fn(); router.refresh(); onDone(); })}
      className={cn("flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl disabled:opacity-60",
        variant === "ghost" ? "border border-border text-muted-foreground hover:text-foreground" : "bg-gold-gradient text-background")}>
      {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />} {label}
    </button>
  );
}

function MarkPaidModal({ staffId, month, year, onClose, onDone }: { staffId: string; month: number; year: number; onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [method, setMethod] = useState<"CASH" | "BANK_TRANSFER" | "EASYPAISA" | "JAZZCASH" | "ONLINE_CARD">("CASH");
  const [reference, setReference] = useState("");
  const [err, setErr] = useState<string | null>(null);
  function submit() {
    setErr(null);
    start(async () => {
      try { await markPayrollPaid({ staffMemberId: staffId, month, year, method, reference: reference || undefined }); onDone(); }
      catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    });
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-elevated border border-border rounded-2xl w-full max-w-sm p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-foreground">Mark Salary Paid</h3>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Method</label>
          <select className="input-luxury w-full" value={method} onChange={(e) => setMethod(e.target.value as typeof method)}>
            <option value="CASH">Cash</option><option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="EASYPAISA">Easypaisa</option><option value="JAZZCASH">JazzCash</option><option value="ONLINE_CARD">Card</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Reference (optional)</label>
          <input className="input-luxury w-full" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Transaction #" />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-border text-muted-foreground">Cancel</button>
          <button onClick={submit} disabled={pending} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl disabled:opacity-60">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── small bits ──
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: "bg-white/10 text-muted-foreground border-border",
    FINALIZED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    PAID: "bg-green-500/15 text-green-400 border-green-500/30",
  };
  return <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", map[status] ?? map.DRAFT)}>{status}</span>;
}
function Metric({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-xl bg-accent/40 p-2.5 text-center">
      <p className={cn("font-serif text-lg font-bold", tone ?? "text-foreground")}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
function Line({ label, value, labelClass, tone }: { label: string; value: string; labelClass?: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-muted-foreground", labelClass)}>{label}</span>
      <span className={cn("text-foreground", tone)}>{value}</span>
    </div>
  );
}
