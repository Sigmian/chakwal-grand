"use client";

// ============================================================
// features/hr/components/StaffOpsSection.tsx
// Staff-portal extras: my tasks, my warnings (acknowledge),
// and shift handover (create + receive). Mobile-first.
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ListTodo, ShieldAlert, ThumbsUp, ArrowLeftRight, Check, Loader2,
  PlayCircle, CheckCircle2, Plus, X,
} from "lucide-react";
import { setTaskStatus, acknowledgeWarning, acknowledgeHandover, createHandover } from "@/server/actions/hr-ops";
import { TaskThread } from "@/features/hr/components/TaskThread";
import { cn, formatPKR } from "@/utils";

type Priority = "URGENT" | "HIGH" | "NORMAL" | "LOW";
interface Task { id: string; title: string; description: string | null; status: string; priority: Priority; commentCount: number; seen: boolean; dueAt: string | null }

const PRIORITY_TONE: Record<Priority, { label: string; cls: string }> = {
  URGENT: { label: "Urgent", cls: "bg-red-500/20 text-red-300 border-red-500/40" },
  HIGH:   { label: "High",   cls: "bg-orange-500/20 text-orange-300 border-orange-500/40" },
  NORMAL: { label: "Normal", cls: "bg-blue-500/20 text-blue-300 border-blue-500/40" },
  LOW:    { label: "Low",    cls: "bg-white/10 text-white/60 border-white/20" },
};
interface Warning { id: string; type: string; title: string; description: string | null; acknowledged: boolean; createdAt: string | null }
interface Handover { id: string; from: string; cashInHand: number | null; pendingBookings: string | null; complaints: string | null; roomsToClean: string | null; pendingPayments: string | null; maintenance: string | null; notes: string | null; createdAt: string | null }

const WARN_TONE: Record<string, string> = {
  VERBAL: "text-amber-300", WRITTEN: "text-orange-300", FINAL: "text-red-300", APPRECIATION: "text-green-300",
};
const WARN_LABEL: Record<string, string> = { VERBAL: "Verbal warning", WRITTEN: "Written warning", FINAL: "Final warning", APPRECIATION: "Appreciation" };

export function StaffOpsSection({ tasks, warnings, openHandovers }: { tasks: Task[]; warnings: Warning[]; openHandovers: Handover[] }) {
  const [handoverOpen, setHandoverOpen] = useState(false);

  return (
    <div className="space-y-5">
      {/* incoming handovers to receive */}
      {openHandovers.length > 0 && (
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/[0.06] p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
            <ArrowLeftRight className="h-3.5 w-3.5" /> Shift handover to receive
          </p>
          {openHandovers.map((h) => <IncomingHandover key={h.id} h={h} />)}
        </div>
      )}

      {/* my tasks */}
      {tasks.length > 0 && (
        <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
            <ListTodo className="h-3.5 w-3.5 text-gold-400" /> My tasks
          </p>
          <div className="space-y-2">{tasks.map((t) => <TaskRow key={t.id} t={t} />)}</div>
        </div>
      )}

      {/* my warnings */}
      {warnings.length > 0 && (
        <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
            <ShieldAlert className="h-3.5 w-3.5 text-gold-400" /> Notices
          </p>
          <div className="space-y-2">{warnings.map((w) => <WarningRow key={w.id} w={w} />)}</div>
        </div>
      )}

      {/* create handover */}
      <button onClick={() => setHandoverOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] py-3.5 text-sm font-semibold hover:border-gold-400/40">
        <ArrowLeftRight className="h-4 w-4 text-gold-400" /> Shift Handover
      </button>

      {handoverOpen && <HandoverModal onClose={() => setHandoverOpen(false)} />}
    </div>
  );
}

function TaskRow({ t }: { t: Task }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = t.status === "PENDING" ? "IN_PROGRESS" : "COMPLETED";
  const nextLabel = t.status === "PENDING" ? "Start" : "Done";
  const NextIcon = t.status === "PENDING" ? PlayCircle : CheckCircle2;
  const pr = PRIORITY_TONE[t.priority] ?? PRIORITY_TONE.NORMAL;

  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide", pr.cls)}>{pr.label}</span>
            <p className="text-sm font-medium text-white truncate">{t.title}</p>
          </div>
          {t.description && <p className="text-xs text-white/55 mt-0.5">{t.description}</p>}
          {t.dueAt && <p className="text-[10px] text-white/40 mt-0.5">Due {t.dueAt.slice(0, 10)}</p>}
        </div>
        <button disabled={pending}
          onClick={() => start(async () => { await setTaskStatus({ id: t.id, status: next }); router.refresh(); })}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-gold-500/15 border border-gold-500/30 px-3 py-1.5 text-xs font-semibold text-gold-300 disabled:opacity-60">
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <NextIcon className="h-3.5 w-3.5" />} {nextLabel}
        </button>
      </div>
      <TaskThread taskId={t.id} count={t.commentCount} tone="portal" />
    </div>
  );
}

function WarningRow({ w }: { w: Warning }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            {w.type === "APPRECIATION" ? <ThumbsUp className="h-3.5 w-3.5 text-green-300" /> : <ShieldAlert className={cn("h-3.5 w-3.5", WARN_TONE[w.type])} />}
            <p className="text-sm font-semibold text-white">{w.title}</p>
          </div>
          <p className={cn("text-[11px]", WARN_TONE[w.type])}>{WARN_LABEL[w.type]}{w.createdAt ? ` · ${w.createdAt.slice(0, 10)}` : ""}</p>
          {w.description && <p className="text-xs text-white/60 mt-0.5">{w.description}</p>}
        </div>
        {w.acknowledged ? (
          <span className="flex items-center gap-1 text-[11px] text-green-300"><Check className="h-3 w-3" /> Seen</span>
        ) : (
          <button disabled={pending} onClick={() => start(async () => { await acknowledgeWarning(w.id); router.refresh(); })}
            className="rounded-lg border border-white/20 px-2.5 py-1 text-[11px] font-semibold text-white/80 disabled:opacity-60">
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Acknowledge"}
          </button>
        )}
      </div>
    </div>
  );
}

function IncomingHandover({ h }: { h: Handover }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const rows: [string, string | number | null][] = [
    ["Cash in hand", h.cashInHand != null ? formatPKR(h.cashInHand) : null],
    ["Pending bookings", h.pendingBookings],
    ["Complaints", h.complaints],
    ["Rooms to clean", h.roomsToClean],
    ["Pending payments", h.pendingPayments],
    ["Maintenance", h.maintenance],
    ["Notes", h.notes],
  ];
  return (
    <div className="rounded-xl bg-white/5 p-3">
      <p className="text-xs text-white/60">From <b className="text-white">{h.from}</b>{h.createdAt ? ` · ${h.createdAt.slice(11, 16)}` : ""}</p>
      <div className="mt-1.5 space-y-0.5 text-sm">
        {rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => (
          <p key={k} className="text-white/80"><span className="text-white/45">{k}: </span>{String(v)}</p>
        ))}
      </div>
      <button disabled={pending} onClick={() => start(async () => { await acknowledgeHandover(h.id); router.refresh(); })}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-500/20 border border-blue-500/30 py-2 text-xs font-semibold text-blue-200 disabled:opacity-60">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Handover Received
      </button>
    </div>
  );
}

function HandoverModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ cashInHand: "", pendingBookings: "", complaints: "", roomsToClean: "", pendingPayments: "", maintenance: "", notes: "" });
  const field = "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold-400/60";

  function submit() {
    setErr(null);
    start(async () => {
      try {
        await createHandover({
          cashInHand: f.cashInHand ? Number(f.cashInHand) : null,
          pendingBookings: f.pendingBookings || undefined, complaints: f.complaints || undefined,
          roomsToClean: f.roomsToClean || undefined, pendingPayments: f.pendingPayments || undefined,
          maintenance: f.maintenance || undefined, notes: f.notes || undefined,
        });
        onClose(); router.refresh();
      } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    });
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-white/12 bg-[#12151a]/95 p-5 sm:rounded-3xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg font-bold">Shift Handover</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/60 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <p className="mb-3 text-[11px] text-white/55">Note anything the next shift needs. The incoming staffer confirms receipt.</p>
        <div className="space-y-2.5">
          <label className="block text-xs text-white/60">Cash in hand (PKR)
            <input type="number" className={field + " mt-1"} value={f.cashInHand} onChange={set("cashInHand")} placeholder="e.g. 12000" />
          </label>
          <label className="block text-xs text-white/60">Pending bookings
            <input className={field + " mt-1"} value={f.pendingBookings} onChange={set("pendingBookings")} /></label>
          <label className="block text-xs text-white/60">Complaints / issues
            <input className={field + " mt-1"} value={f.complaints} onChange={set("complaints")} /></label>
          <label className="block text-xs text-white/60">Rooms to clean
            <input className={field + " mt-1"} value={f.roomsToClean} onChange={set("roomsToClean")} /></label>
          <label className="block text-xs text-white/60">Pending payments
            <input className={field + " mt-1"} value={f.pendingPayments} onChange={set("pendingPayments")} /></label>
          <label className="block text-xs text-white/60">Maintenance
            <input className={field + " mt-1"} value={f.maintenance} onChange={set("maintenance")} /></label>
          <label className="block text-xs text-white/60">Other notes
            <textarea rows={2} className={field + " mt-1 resize-none"} value={f.notes} onChange={set("notes")} /></label>
        </div>
        {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
        <button onClick={submit} disabled={pending}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-3 text-sm font-bold text-background disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Submit Handover
        </button>
      </div>
    </div>
  );
}
