"use client";

// ============================================================
// features/hr/components/StaffPortal.tsx
// The staff attendance app. Two taps to mark attendance; a clear
// monthly summary; leave & correction requests. Mobile-first.
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LogIn, LogOut, Clock, CalendarDays, Loader2, Check, X,
  CalendarPlus, PencilLine, Megaphone, LogOut as SignOutIcon, Moon,
  FileText, Image as ImageIcon, ExternalLink,
} from "lucide-react";
import { checkIn, checkOut, requestLeave, requestCorrection, acknowledgeAnnouncement } from "@/server/actions/attendance";
import { formatDuration } from "@/lib/hr/attendance";
import { cn, formatPKR } from "@/utils";
import { AttendanceCaptureSheet, type PresencePayload } from "./AttendanceCaptureSheet";

// ─── types (mirror getMyDashboard) ────────────────────────────
interface DashboardData {
  staff: { name: string; branch: string; designation: string | null; salary: number;
    shift: { name: string; startTime: string; endTime: string; crossesMidnight: boolean } | null };
  today: { workDate: string; status: string | null; checkInAt: string | null; checkOutAt: string | null;
    workedMinutes: number; lateMinutes: number; earlyMinutes: number };
  month: { label: string; presentDays: number; absentDays: number; halfDays: number; lateCount: number;
    earlyCount: number; monthlySalary: number; earnedToDate: number; totalDeductions: number; advance: number; netPayable: number };
  paidLeave: { used: number; allowance: number; remaining: number };
  require: { selfie: boolean; geo: boolean };
  announcements: { id: string; title: string; body: string; createdAt: string; acknowledged: boolean }[];
  pendingLeaves: { id: string; from: string; to: string; reason: string }[];
  pendingCorrections: number;
  documents: { id: string; type: string; title: string; fileUrl: string; fileKind: string | null; expiresAt: string | null; createdAt: string }[];
}

const STATUS_TONE: Record<string, string> = {
  PRESENT: "text-green-300 bg-green-500/15 border-green-500/25",
  LATE: "text-amber-300 bg-amber-500/15 border-amber-500/25",
  HALF_DAY: "text-orange-300 bg-orange-500/15 border-orange-500/25",
  EARLY_CHECKOUT: "text-orange-300 bg-orange-500/15 border-orange-500/25",
  APPROVED_LEAVE: "text-blue-300 bg-blue-500/15 border-blue-500/25",
  ABSENT: "text-red-300 bg-red-500/15 border-red-500/25",
  MISSING: "text-white/60 bg-white/10 border-white/15",
};
const STATUS_LABEL: Record<string, string> = {
  PRESENT: "Present", LATE: "Late", HALF_DAY: "Half day", EARLY_CHECKOUT: "Early checkout",
  APPROVED_LEAVE: "On leave", ABSENT: "Absent", MISSING: "Not marked",
  HOLIDAY: "Holiday", WEEKLY_OFF: "Weekly off",
};

const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }) : "—";

export function StaffPortal({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [modal, setModal] = useState<"leave" | "correction" | null>(null);
  const [capture, setCapture] = useState<"in" | "out" | null>(null);

  const checkedIn = !!data.today.checkInAt;
  const checkedOut = !!data.today.checkOutAt;
  const needsCapture = data.require.selfie || data.require.geo;

  // Run the actual check-in/out with a (possibly empty) presence payload.
  function submitCheck(kind: "in" | "out", presence: PresencePayload) {
    setToast(null);
    start(async () => {
      try {
        const res = kind === "in" ? await checkIn(presence) : await checkOut(presence);
        const late = kind === "in" && "lateMinutes" in res && res.lateMinutes ? ` (late by ${res.lateMinutes} min)` : "";
        setToast({ kind: "ok", msg: kind === "in" ? `Checked in${late}` : "Checked out — have a good rest!" });
        setCapture(null);
        router.refresh();
      } catch (e) {
        setToast({ kind: "err", msg: e instanceof Error ? e.message : "Something went wrong" });
        setCapture(null);
      }
    });
  }

  // With selfie/geo required, walk the user through capture first; otherwise
  // it's a single tap.
  function doCheck(kind: "in" | "out") {
    setToast(null);
    if (needsCapture) setCapture(kind);
    else submitCheck(kind, {});
  }

  return (
    <div className="space-y-5">

      {/* header */}
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-gold-400/80">My Attendance</p>
          <h1 className="mt-0.5 font-serif text-2xl font-bold">{data.staff.name}</h1>
          <p className="text-xs text-white/55">
            {data.staff.designation ?? "Staff"} · {data.staff.branch}
          </p>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-xl border border-white/15 p-2.5 text-white/60 transition-colors hover:text-white">
          <SignOutIcon className="h-4 w-4" />
        </button>
      </header>

      {/* today / shift */}
      <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Clock className="h-4 w-4 text-gold-400" />
            {data.staff.shift ? (
              <span>{data.staff.shift.name} · {data.staff.shift.startTime}–{data.staff.shift.endTime}
                {data.staff.shift.crossesMidnight && <Moon className="ml-1 inline h-3 w-3 text-blue-300" />}</span>
            ) : <span className="text-amber-300">No shift assigned</span>}
          </div>
          {data.today.status && (
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", STATUS_TONE[data.today.status] ?? STATUS_TONE.MISSING)}>
              {STATUS_LABEL[data.today.status] ?? data.today.status}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl bg-white/5 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-white/45">Check-in</p>
            <p className="mt-0.5 font-mono text-lg font-bold">{fmtTime(data.today.checkInAt)}</p>
          </div>
          <div className="rounded-xl bg-white/5 p-2.5">
            <p className="text-[10px] uppercase tracking-wider text-white/45">Check-out</p>
            <p className="mt-0.5 font-mono text-lg font-bold">{fmtTime(data.today.checkOutAt)}</p>
          </div>
        </div>
        {data.today.workedMinutes > 0 && (
          <p className="mt-2 text-center text-xs text-white/55">Worked {formatDuration(data.today.workedMinutes)}</p>
        )}

        {/* THE big button */}
        <div className="mt-4">
          {!checkedIn ? (
            <BigButton pending={pending} onClick={() => doCheck("in")} tone="in" label="Check In"
              hint={(data.require.geo ? "Uses your location" : "") + (data.require.selfie ? (data.require.geo ? " + selfie" : "Takes a selfie") : "")} />
          ) : !checkedOut ? (
            <BigButton pending={pending} onClick={() => doCheck("out")} tone="out" label="Check Out" hint="Ends your shift for today" />
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-green-500/25 bg-green-500/10 py-4 text-sm font-semibold text-green-300">
              <Check className="h-5 w-5" /> Attendance complete for today
            </div>
          )}
        </div>

        {toast && (
          <div className={cn("mt-3 rounded-xl px-3 py-2 text-sm", toast.kind === "ok" ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300")}>
            {toast.msg}
          </div>
        )}
      </div>

      {/* monthly summary */}
      <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4 text-gold-400" /> {data.month.label}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Stat label="Present" value={data.month.presentDays} tone="text-green-300" />
          <Stat label={`Paid leave`} value={`${data.paidLeave.used}/${data.paidLeave.allowance}`} tone="text-blue-300" />
          <Stat label="Absent" value={data.month.absentDays} tone={data.month.absentDays ? "text-red-300" : "text-white/70"} />
          <Stat label="Late" value={data.month.lateCount} tone={data.month.lateCount ? "text-amber-300" : "text-white/70"} />
          <Stat label="Half days" value={data.month.halfDays} tone="text-orange-300" />
          <Stat label="Early out" value={data.month.earlyCount} tone="text-orange-300" />
        </div>

        <div className="mt-4 space-y-1.5 rounded-xl bg-white/5 p-3 text-sm">
          <Row label="Monthly salary" value={formatPKR(data.month.monthlySalary)} />
          <Row label="Earned so far" value={formatPKR(data.month.earnedToDate)} valueClass="text-green-300" />
          <Row label="Deductions" value={data.month.totalDeductions ? `− ${formatPKR(data.month.totalDeductions)}` : "—"} valueClass={data.month.totalDeductions ? "text-red-300" : "text-white/50"} />
          {data.month.advance > 0 && <Row label="Advance taken" value={`− ${formatPKR(data.month.advance)}`} valueClass="text-amber-300" />}
          <div className="mt-1 border-t border-white/10 pt-1.5">
            <Row label="Estimated net" value={formatPKR(data.month.netPayable)} labelClass="font-semibold text-white" valueClass="font-bold text-gold-300" />
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setModal("leave")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] py-3.5 text-sm font-semibold hover:border-gold-400/40">
          <CalendarPlus className="h-4 w-4 text-gold-400" /> Request Leave
        </button>
        <button onClick={() => setModal("correction")}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] py-3.5 text-sm font-semibold hover:border-gold-400/40">
          <PencilLine className="h-4 w-4 text-gold-400" /> Fix Attendance
        </button>
      </div>

      {(data.pendingLeaves.length > 0 || data.pendingCorrections > 0) && (
        <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">Awaiting approval</p>
          {data.pendingLeaves.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-1 text-white/70">
              <span>Leave · {l.from}{l.to !== l.from ? ` → ${l.to}` : ""}</span>
              <span className="text-[11px] text-amber-300">Pending</span>
            </div>
          ))}
          {data.pendingCorrections > 0 && (
            <div className="flex items-center justify-between py-1 text-white/70">
              <span>{data.pendingCorrections} attendance correction{data.pendingCorrections !== 1 ? "s" : ""}</span>
              <span className="text-[11px] text-amber-300">Pending</span>
            </div>
          )}
        </div>
      )}

      {/* announcements */}
      {data.announcements.length > 0 && (
        <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
            <Megaphone className="h-3.5 w-3.5 text-gold-400" /> Announcements
          </p>
          <div className="space-y-3">
            {data.announcements.map((a) => (
              <AnnouncementRow key={a.id} a={a} onAck={() => router.refresh()} />
            ))}
          </div>
        </div>
      )}

      {/* my documents */}
      {data.documents.length > 0 && (
        <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
            <FileText className="h-3.5 w-3.5 text-gold-400" /> My documents
          </p>
          <div className="space-y-2">
            {data.documents.map((d) => (
              <a key={d.id} href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5 hover:bg-white/[0.08]">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
                  {d.fileKind === "pdf" ? <FileText className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-white">{d.title}</span>
                  {d.expiresAt && <span className="block text-[11px] text-white/45">Expires {d.expiresAt.slice(0, 10)}</span>}
                </span>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-white/40" />
              </a>
            ))}
          </div>
        </div>
      )}

      {modal === "leave" && <LeaveModal onClose={() => setModal(null)} onDone={() => { setModal(null); router.refresh(); }} />}
      {modal === "correction" && <CorrectionModal onClose={() => setModal(null)} onDone={() => { setModal(null); router.refresh(); }} />}

      {capture && (
        <AttendanceCaptureSheet
          mode={capture}
          require={data.require}
          pending={pending}
          onCancel={() => setCapture(null)}
          onSubmit={(payload) => submitCheck(capture, payload)}
        />
      )}
    </div>
  );
}

// ─── pieces ───────────────────────────────────────────────────
function BigButton({ pending, onClick, tone, label, hint }: {
  pending: boolean; onClick: () => void; tone: "in" | "out"; label: string; hint?: string;
}) {
  return (
    <button onClick={onClick} disabled={pending}
      className={cn(
        "flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-lg font-bold transition-all active:scale-[0.98] disabled:opacity-70",
        tone === "in" ? "bg-gold-gradient text-background hover:shadow-gold-lg" : "border border-white/20 bg-white/10 text-white hover:bg-white/15",
      )}>
      {pending ? <Loader2 className="h-6 w-6 animate-spin" /> : tone === "in" ? <LogIn className="h-6 w-6" /> : <LogOut className="h-6 w-6" />}
      <span className="flex flex-col items-start leading-tight">
        {label}
        {hint && <span className="text-[11px] font-normal opacity-70">{hint}</span>}
      </span>
    </button>
  );
}
function AnnouncementRow({ a, onAck }: {
  a: { id: string; title: string; body: string; acknowledged: boolean };
  onAck: () => void;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="text-sm font-semibold text-white">{a.title}</p>
      <p className="mt-0.5 text-xs text-white/60">{a.body}</p>
      <div className="mt-2 flex justify-end">
        {a.acknowledged ? (
          <span className="flex items-center gap-1 text-[11px] text-green-300"><Check className="h-3 w-3" /> Acknowledged</span>
        ) : (
          <button disabled={pending}
            onClick={() => start(async () => { await acknowledgeAnnouncement(a.id); onAck(); })}
            className="rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-1 text-[11px] font-semibold text-gold-300 disabled:opacity-60">
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Got it"}
          </button>
        )}
      </div>
    </div>
  );
}
function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="rounded-xl bg-white/5 p-2.5">
      <p className={cn("font-serif text-xl font-bold", tone)}>{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-white/45">{label}</p>
    </div>
  );
}
function Row({ label, value, labelClass, valueClass }: { label: string; value: string; labelClass?: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn("text-white/60", labelClass)}>{label}</span>
      <span className={cn("text-white/85", valueClass)}>{value}</span>
    </div>
  );
}

// ─── modals ───────────────────────────────────────────────────
function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-white/12 bg-[#12151a]/95 p-5 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function todayISO() { return new Date().toISOString().slice(0, 10); }

function LeaveModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ fromDate: todayISO(), toDate: todayISO(), reason: "", notes: "" });
  const field = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold-400/60";

  function submit() {
    setErr(null);
    start(async () => {
      try { await requestLeave(f); onDone(); }
      catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    });
  }
  return (
    <Sheet title="Request Leave" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-white/60">From
            <input type="date" min={todayISO()} className={field + " mt-1"} value={f.fromDate} onChange={(e) => setF({ ...f, fromDate: e.target.value, toDate: e.target.value > f.toDate ? e.target.value : f.toDate })} />
          </label>
          <label className="text-xs text-white/60">To
            <input type="date" min={f.fromDate} className={field + " mt-1"} value={f.toDate} onChange={(e) => setF({ ...f, toDate: e.target.value })} />
          </label>
        </div>
        <label className="text-xs text-white/60">Reason
          <input className={field + " mt-1"} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="e.g. Family function" />
        </label>
        <label className="text-xs text-white/60">Notes (optional)
          <textarea rows={2} className={field + " mt-1 resize-none"} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        </label>
        <p className="text-[11px] text-white/45">Your manager approves leave. The first paid leaves each month don&apos;t reduce your salary.</p>
        {err && <p className="text-sm text-red-300">{err}</p>}
        <button onClick={submit} disabled={pending || f.reason.trim().length < 3}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-3 text-sm font-bold text-background disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Submit Request
        </button>
      </div>
    </Sheet>
  );
}

function CorrectionModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ workDate: todayISO(), checkIn: "", checkOut: "", reason: "" });
  const field = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold-400/60";

  function submit() {
    setErr(null);
    start(async () => {
      try { await requestCorrection(f); onDone(); }
      catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    });
  }
  return (
    <Sheet title="Fix Attendance" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-[11px] text-white/55">Forgot to check in or out? Ask your manager to correct it — you can&apos;t edit attendance directly.</p>
        <label className="text-xs text-white/60">Date
          <input type="date" max={todayISO()} className={field + " mt-1"} value={f.workDate} onChange={(e) => setF({ ...f, workDate: e.target.value })} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-white/60">Correct check-in
            <input type="time" className={field + " mt-1"} value={f.checkIn} onChange={(e) => setF({ ...f, checkIn: e.target.value })} />
          </label>
          <label className="text-xs text-white/60">Correct check-out
            <input type="time" className={field + " mt-1"} value={f.checkOut} onChange={(e) => setF({ ...f, checkOut: e.target.value })} />
          </label>
        </div>
        <label className="text-xs text-white/60">Reason
          <input className={field + " mt-1"} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} placeholder="e.g. Phone was dead" />
        </label>
        {err && <p className="text-sm text-red-300">{err}</p>}
        <button onClick={submit} disabled={pending || f.reason.trim().length < 3}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-3 text-sm font-bold text-background disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Submit Request
        </button>
      </div>
    </Sheet>
  );
}
