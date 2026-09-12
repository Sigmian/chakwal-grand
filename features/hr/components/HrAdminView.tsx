"use client";

// ============================================================
// features/hr/components/HrAdminView.tsx
// Admin HR configuration UI: attendance rules, shift management
// and per-staff shift assignment.
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  SlidersHorizontal, Clock, Users, Save, Loader2, Plus, Check, X,
  Moon, Power, Pencil,
} from "lucide-react";
import {
  updateHrSettings, createShift, updateShift, toggleShiftActive, assignShift,
} from "@/server/actions/hr-admin";
import { cn } from "@/utils";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

interface Settings {
  payrollDivisor: number; paidLeavesPerMonth: number; weeklyOffDays: string[];
  graceMinutes: number; autoAbsentAfterMinutes: number; minHalfDayMinutes: number;
  earlyCheckoutMinutes: number; lateWarnAfterCount: number;
  lateToHalfDayCount: number | null; lateToDayCount: number | null;
  halfDayDeductsHalf: boolean; earlyCheckoutPenalty: "NONE" | "HALF_DAY";
  requireSelfie: boolean; requireGeo: boolean;
  geoLat: number | null; geoLng: number | null; geoRadiusMeters: number;
}
interface Shift {
  id: string; name: string; startTime: string; endTime: string;
  crossesMidnight: boolean; graceMinutes: number | null; isActive: boolean;
}
interface Assignment {
  id: string; name: string; branch: string;
  assignedShiftId: string | null; assignedShiftName: string | null;
}

type Tab = "rules" | "shifts" | "assign";

export function HrAdminView({
  settings, shifts, assignments,
}: { settings: Settings; shifts: Shift[]; assignments: Assignment[] }) {
  const [tab, setTab] = useState<Tab>("rules");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {[
          { key: "rules",  label: "Attendance Rules", icon: SlidersHorizontal },
          { key: "shifts", label: "Shifts",           icon: Clock },
          { key: "assign", label: "Shift Assignment", icon: Users },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all",
              tab === key
                ? "border-gold-500/40 bg-gold-500/15 text-gold-300"
                : "border-border bg-surface-elevated text-muted-foreground hover:text-foreground hover:border-gold-500/30",
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "rules"  && <RulesForm initial={settings} />}
      {tab === "shifts" && <ShiftsPanel shifts={shifts} />}
      {tab === "assign" && <AssignPanel assignments={assignments} shifts={shifts} />}
    </div>
  );
}

// ─── Rules ────────────────────────────────────────────────────
function RulesForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState<Settings>(initial);

  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value === "" ? 0 : Number(e.target.value) }));
  const nullableNum = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value === "" ? null : Number(e.target.value) }));

  function save() {
    setErr(null); setMsg(null);
    start(async () => {
      try {
        await updateHrSettings({
          ...f,
          weeklyOffDays: f.weeklyOffDays as ("SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT")[],
        });
        setMsg("Saved");
        router.refresh();
      } catch (e) { setErr(e instanceof Error ? e.message : "Failed to save"); }
    });
  }

  const field = "input-luxury w-full";
  const label = "block text-xs text-muted-foreground mb-1";

  return (
    <div className="space-y-5">
      <Section title="Salary & Leave">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className={label}>Payroll divisor</label>
            <input type="number" className={field} value={f.payrollDivisor} onChange={num("payrollDivisor")} />
            <p className="text-[10px] text-muted-foreground mt-1">Daily salary = monthly ÷ this</p>
          </div>
          <div>
            <label className={label}>Paid leaves / month</label>
            <input type="number" className={field} value={f.paidLeavesPerMonth} onChange={num("paidLeavesPerMonth")} />
          </div>
        </div>
        <div className="mt-3">
          <label className={label}>Weekly off days</label>
          <div className="flex flex-wrap gap-1.5">
            {DAYS.map((d) => {
              const on = f.weeklyOffDays.includes(d);
              return (
                <button key={d} type="button"
                  onClick={() => setF((s) => ({ ...s, weeklyOffDays: on ? s.weeklyOffDays.filter((x) => x !== d) : [...s.weeklyOffDays, d] }))}
                  className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    on ? "bg-gold-500/20 text-gold-400 border-gold-500/40" : "bg-accent text-muted-foreground border-border/50 hover:border-gold-500/30")}>
                  {d}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">Paid rest days. Leave empty for a 7-day operation.</p>
        </div>
      </Section>

      <Section title="Timing">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Num label="Grace (min)" hint="On-time window" value={f.graceMinutes} onChange={num("graceMinutes")} />
          <Num label="Auto-absent after (min)" hint="Past shift start" value={f.autoAbsentAfterMinutes} onChange={num("autoAbsentAfterMinutes")} />
          <Num label="Half-day under (min)" hint="Worked less = half day" value={f.minHalfDayMinutes} onChange={num("minHalfDayMinutes")} />
          <Num label="Early checkout (min)" hint="Left this early = flag" value={f.earlyCheckoutMinutes} onChange={num("earlyCheckoutMinutes")} />
        </div>
      </Section>

      <Section title="Penalties (optional — leave blank to disable)">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Num label="Lates before warning" value={f.lateWarnAfterCount} onChange={num("lateWarnAfterCount")} />
          <div>
            <label className={label}>Lates → half-day deduction</label>
            <input type="number" className={field} placeholder="off" value={f.lateToHalfDayCount ?? ""} onChange={nullableNum("lateToHalfDayCount")} />
          </div>
          <div>
            <label className={label}>Lates → full-day deduction</label>
            <input type="number" className={field} placeholder="off" value={f.lateToDayCount ?? ""} onChange={nullableNum("lateToDayCount")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <Toggle label="Half-day deducts half salary" on={f.halfDayDeductsHalf} onChange={(v) => setF((s) => ({ ...s, halfDayDeductsHalf: v }))} />
          <div>
            <label className={label}>Early checkout penalty</label>
            <select className={field} value={f.earlyCheckoutPenalty} onChange={(e) => setF((s) => ({ ...s, earlyCheckoutPenalty: e.target.value as "NONE" | "HALF_DAY" }))}>
              <option value="NONE">No penalty</option>
              <option value="HALF_DAY">Half-day deduction</option>
            </select>
          </div>
        </div>
      </Section>

      <Section title="Verification (optional)">
        <div className="grid grid-cols-2 gap-4">
          <Toggle label="Require attendance selfie" on={f.requireSelfie} onChange={(v) => setF((s) => ({ ...s, requireSelfie: v }))} />
          <Toggle label="Require location (GPS)" on={f.requireGeo} onChange={(v) => setF((s) => ({ ...s, requireGeo: v }))} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Selfie and GPS capture are wired in a later phase; enabling here prepares the rule.</p>
      </Section>

      {err && <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">{err}</div>}
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={pending}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-60">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Rules
        </button>
        {msg && <span className="flex items-center gap-1 text-sm text-green-400"><Check className="w-4 h-4" />{msg}</span>}
      </div>
    </div>
  );
}

// ─── Shifts ───────────────────────────────────────────────────
const EMPTY_SHIFT: Omit<Shift, "id"> = {
  name: "", startTime: "09:00", endTime: "18:00", crossesMidnight: false, graceMinutes: null, isActive: true,
};

function ShiftsPanel({ shifts }: { shifts: Shift[] }) {
  const [editing, setEditing] = useState<Shift | Omit<Shift, "id"> | null>(null);
  const isNew = editing !== null && !("id" in editing);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{shifts.length} shift{shifts.length !== 1 ? "s" : ""}</p>
        <button onClick={() => setEditing({ ...EMPTY_SHIFT })}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gold-500/30 text-gold-400 text-sm font-semibold hover:bg-gold-500/10 transition-all">
          <Plus className="w-4 h-4" /> New Shift
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {shifts.map((s) => (
          <div key={s.id} className={cn("card-luxury p-4", !s.isActive && "opacity-60")}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-foreground">{s.name}</h3>
                  {s.crossesMidnight && <span className="flex items-center gap-1 text-[10px] text-blue-300"><Moon className="w-3 h-3" />overnight</span>}
                </div>
                <p className="text-sm text-gold-400 font-mono mt-0.5">{s.startTime} → {s.endTime}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Grace: {s.graceMinutes ?? "default"}{typeof s.graceMinutes === "number" ? " min" : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <IconBtn title="Edit" onClick={() => setEditing(s)}><Pencil className="w-3.5 h-3.5" /></IconBtn>
                <ToggleActive id={s.id} active={s.isActive} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && <ShiftEditor shift={editing} isNew={isNew} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ToggleActive({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <IconBtn title={active ? "Deactivate" : "Activate"}
      onClick={() => start(async () => { await toggleShiftActive(id); router.refresh(); })}>
      {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className={cn("w-3.5 h-3.5", active ? "text-green-400" : "text-muted-foreground")} />}
    </IconBtn>
  );
}

function ShiftEditor({ shift, isNew, onClose }: { shift: Shift | Omit<Shift, "id">; isNew: boolean; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ ...shift });

  function save() {
    setErr(null);
    start(async () => {
      try {
        const payload = {
          name: f.name, startTime: f.startTime, endTime: f.endTime,
          crossesMidnight: f.crossesMidnight, graceMinutes: f.graceMinutes, isActive: f.isActive,
        };
        if (isNew) await createShift(payload);
        else await updateShift((shift as Shift).id, payload);
        onClose(); router.refresh();
      } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    });
  }

  const field = "input-luxury w-full";
  const label = "block text-xs text-muted-foreground mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-elevated border border-border rounded-2xl w-full max-w-md p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">{isNew ? "New Shift" : "Edit Shift"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <div>
          <label className={label}>Name</label>
          <input className={field} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Day Shift" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Start (HH:MM)</label><input className={field + " font-mono"} value={f.startTime} onChange={(e) => setF({ ...f, startTime: e.target.value })} placeholder="08:00" /></div>
          <div><label className={label}>End (HH:MM)</label><input className={field + " font-mono"} value={f.endTime} onChange={(e) => setF({ ...f, endTime: e.target.value })} placeholder="20:00" /></div>
        </div>
        <Toggle label="Crosses midnight (night shift)" on={f.crossesMidnight} onChange={(v) => setF({ ...f, crossesMidnight: v })} />
        <div>
          <label className={label}>Grace override (min, blank = use default)</label>
          <input type="number" className={field} value={f.graceMinutes ?? ""} placeholder="default"
            onChange={(e) => setF({ ...f, graceMinutes: e.target.value === "" ? null : Number(e.target.value) })} />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-border text-muted-foreground hover:text-foreground">Cancel</button>
          <button onClick={save} disabled={pending} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl disabled:opacity-60">
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assignment ───────────────────────────────────────────────
function AssignPanel({ assignments, shifts }: { assignments: Assignment[]; shifts: Shift[] }) {
  const activeShifts = shifts.filter((s) => s.isActive);
  return (
    <div className="card-luxury overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <thead><tr><th>Staff</th><th>Branch</th><th>Assigned Shift</th></tr></thead>
          <tbody>
            {assignments.map((a) => <AssignRow key={a.id} a={a} shifts={activeShifts} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssignRow({ a, shifts }: { a: Assignment; shifts: Shift[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [value, setValue] = useState(a.assignedShiftId ?? "");

  function change(next: string) {
    setValue(next);
    start(async () => {
      try { await assignShift(a.id, next || null); router.refresh(); }
      catch { setValue(a.assignedShiftId ?? ""); }
    });
  }

  return (
    <tr>
      <td className="font-medium text-foreground whitespace-nowrap">{a.name}</td>
      <td className="text-muted-foreground text-xs">{a.branch}</td>
      <td>
        <div className="flex items-center gap-2">
          <select value={value} onChange={(e) => change(e.target.value)} className="input-luxury py-1.5 text-sm min-w-[150px]">
            <option value="">— none —</option>
            {shifts.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {pending && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
      </td>
    </tr>
  );
}

// ─── small shared bits ────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-luxury p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Num({ label, hint, value, onChange }: { label: string; hint?: string; value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div>
      <label className="block text-xs text-muted-foreground mb-1">{label}</label>
      <input type="number" className="input-luxury w-full" value={value} onChange={onChange} />
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}
function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-accent/40 px-3 py-2.5 text-left transition-colors hover:border-gold-500/30 w-full">
      <span className="text-sm text-foreground">{label}</span>
      <span className={cn("relative h-5 w-9 rounded-full transition-colors flex-shrink-0", on ? "bg-gold-500" : "bg-border")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all", on ? "left-[18px]" : "left-0.5")} />
      </span>
    </button>
  );
}
function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-gold-500/30 transition-all">
      {children}
    </button>
  );
}
