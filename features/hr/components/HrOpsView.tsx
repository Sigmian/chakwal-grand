"use client";

// ============================================================
// features/hr/components/HrOpsView.tsx
// Admin: task assignment, warnings/appreciation, shift handovers.
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ListTodo, ShieldAlert, ArrowLeftRight, Plus, Loader2, Check, X,
  Clock, CheckCircle2, PlayCircle, ThumbsUp, AlertTriangle,
} from "lucide-react";
import { createTask, setTaskStatus, issueWarning } from "@/server/actions/hr-ops";
import { TaskThread } from "@/features/hr/components/TaskThread";
import { cn, formatPKR } from "@/utils";

type Priority = "URGENT" | "HIGH" | "NORMAL" | "LOW";
interface Task { id: string; title: string; description: string | null; status: string; priority: Priority; assignee: string | null; branch: string; commentCount: number; seen: boolean; dueAt: string | null; createdAt: string | null }
interface Warning { id: string; staff: string; type: string; title: string; description: string | null; acknowledged: boolean; createdAt: string | null }
interface Handover { id: string; from: string; branch?: string; to?: string | null; cashInHand: number | null; pendingBookings: string | null; complaints: string | null; roomsToClean: string | null; pendingPayments: string | null; maintenance: string | null; notes: string | null; acknowledged: boolean; createdAt: string | null }
interface StaffLite { id: string; name: string }

type Tab = "tasks" | "warnings" | "handovers";

export function HrOpsView({ tasks, warnings, handovers, staff }: { tasks: Task[]; warnings: Warning[]; handovers: Handover[]; staff: StaffLite[] }) {
  const [tab, setTab] = useState<Tab>("tasks");
  const openTasks = tasks.filter((t) => t.status !== "COMPLETED").length;
  const unack = warnings.filter((w) => !w.acknowledged).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {[
          { key: "tasks", label: `Tasks${openTasks ? ` (${openTasks})` : ""}`, icon: ListTodo },
          { key: "warnings", label: "Warnings", icon: ShieldAlert },
          { key: "handovers", label: "Handovers", icon: ArrowLeftRight },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key as Tab)}
            className={cn("flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all",
              tab === key ? "border-gold-500/40 bg-gold-500/15 text-gold-300" : "border-border bg-surface-elevated text-muted-foreground hover:text-foreground hover:border-gold-500/30")}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "tasks" && <TasksPanel tasks={tasks} staff={staff} />}
      {tab === "warnings" && <WarningsPanel warnings={warnings} staff={staff} unack={unack} />}
      {tab === "handovers" && <HandoversPanel handovers={handovers} />}
    </div>
  );
}

// ─── Tasks ────────────────────────────────────────────────────
const TASK_TONE: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  PENDING:     { label: "Pending",     cls: "text-amber-400",  icon: Clock },
  IN_PROGRESS: { label: "In progress", cls: "text-blue-400",   icon: PlayCircle },
  COMPLETED:   { label: "Completed",   cls: "text-green-400",  icon: CheckCircle2 },
  OVERDUE:     { label: "Overdue",     cls: "text-red-400",    icon: AlertTriangle },
};

const PRIORITY_TONE: Record<Priority, { label: string; cls: string }> = {
  URGENT: { label: "Urgent", cls: "bg-red-500/15 text-red-400 border-red-500/30" },
  HIGH:   { label: "High",   cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  NORMAL: { label: "Normal", cls: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  LOW:    { label: "Low",    cls: "bg-muted text-muted-foreground border-border" },
};
const PRIORITY_OPTIONS: Priority[] = ["URGENT", "HIGH", "NORMAL", "LOW"];

function TasksPanel({ tasks, staff }: { tasks: Task[]; staff: StaffLite[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState<{ title: string; description: string; assignedToId: string; priority: Priority; dueAt: string }>(
    { title: "", description: "", assignedToId: "", priority: "NORMAL", dueAt: "" });

  function add() {
    setErr(null);
    start(async () => {
      try {
        await createTask({ title: f.title, description: f.description || undefined, assignedToId: f.assignedToId || null, priority: f.priority, dueAt: f.dueAt || undefined });
        setF({ title: "", description: "", assignedToId: "", priority: "NORMAL", dueAt: "" });
        router.refresh();
      } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    });
  }

  return (
    <div className="space-y-4">
      <div className="card-luxury p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Assign a task</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="input-luxury sm:col-span-2" placeholder="Task, e.g. Room 102 AC inspection" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <select className="input-luxury" value={f.assignedToId} onChange={(e) => setF({ ...f, assignedToId: e.target.value })}>
            <option value="">Unassigned</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input-luxury" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Priority })}>
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{PRIORITY_TONE[p].label} priority</option>)}
          </select>
          <input type="date" className="input-luxury" value={f.dueAt} onChange={(e) => setF({ ...f, dueAt: e.target.value })} />
          <input className="input-luxury sm:col-span-2" placeholder="Details (optional)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
        {err && <p className="text-sm text-red-400 mt-2">{err}</p>}
        <button onClick={add} disabled={pending || f.title.trim().length < 2}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl disabled:opacity-60">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Task
        </button>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 && <div className="card-luxury p-8 text-center text-sm text-muted-foreground">No tasks yet.</div>}
        {tasks.map((t) => {
          const tone = TASK_TONE[t.status] ?? TASK_TONE.PENDING;
          const Icon = tone.icon;
          const pr = PRIORITY_TONE[t.priority] ?? PRIORITY_TONE.NORMAL;
          return (
            <div key={t.id} className={cn("card-luxury p-4", t.status === "COMPLETED" && "opacity-60")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", pr.cls)}>{pr.label}</span>
                    <p className="font-semibold text-foreground">{t.title}</p>
                    {t.assignee && !t.seen && t.status !== "COMPLETED" && (
                      <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">Unseen</span>
                    )}
                  </div>
                  {t.description && <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {t.assignee ?? "Unassigned"} · {t.branch}{t.dueAt && ` · due ${t.dueAt.slice(0, 10)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("flex items-center gap-1 text-xs font-semibold", tone.cls)}><Icon className="w-3.5 h-3.5" />{tone.label}</span>
                  <TaskStatusSelect id={t.id} status={t.status} />
                </div>
              </div>
              <TaskThread taskId={t.id} count={t.commentCount} tone="admin" />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TaskStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-1">
      <select value={status} disabled={pending}
        onChange={(e) => start(async () => { await setTaskStatus({ id, status: e.target.value as "PENDING" | "IN_PROGRESS" | "COMPLETED" | "OVERDUE" }); router.refresh(); })}
        className="input-luxury py-1 text-xs">
        <option value="PENDING">Pending</option>
        <option value="IN_PROGRESS">In progress</option>
        <option value="COMPLETED">Completed</option>
        <option value="OVERDUE">Overdue</option>
      </select>
      {pending && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}

// ─── Warnings ─────────────────────────────────────────────────
const WARN_TONE: Record<string, string> = {
  VERBAL: "text-amber-400 bg-amber-500/10 border-amber-500/25",
  WRITTEN: "text-orange-400 bg-orange-500/10 border-orange-500/25",
  FINAL: "text-red-400 bg-red-500/10 border-red-500/25",
  APPRECIATION: "text-green-400 bg-green-500/10 border-green-500/25",
};
const WARN_LABEL: Record<string, string> = { VERBAL: "Verbal warning", WRITTEN: "Written warning", FINAL: "Final warning", APPRECIATION: "Appreciation" };

function WarningsPanel({ warnings, staff, unack }: { warnings: Warning[]; staff: StaffLite[]; unack: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState({ staffMemberId: staff[0]?.id ?? "", type: "VERBAL" as "VERBAL" | "WRITTEN" | "FINAL" | "APPRECIATION", title: "", description: "" });

  function submit() {
    setErr(null);
    start(async () => {
      try {
        await issueWarning(f);
        setF({ ...f, title: "", description: "" });
        router.refresh();
      } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    });
  }

  return (
    <div className="space-y-4">
      <div className="card-luxury p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Issue warning / appreciation</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <select className="input-luxury" value={f.staffMemberId} onChange={(e) => setF({ ...f, staffMemberId: e.target.value })}>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select className="input-luxury" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as typeof f.type })}>
            <option value="VERBAL">Verbal warning</option>
            <option value="WRITTEN">Written warning</option>
            <option value="FINAL">Final warning</option>
            <option value="APPRECIATION">Appreciation</option>
          </select>
          <input className="input-luxury sm:col-span-2" placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea rows={2} className="input-luxury sm:col-span-2 resize-none" placeholder="Description (optional)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
        {err && <p className="text-sm text-red-400 mt-2">{err}</p>}
        <button onClick={submit} disabled={pending || f.title.trim().length < 2 || !f.staffMemberId}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl disabled:opacity-60">
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />} Issue
        </button>
      </div>

      {unack > 0 && <p className="text-xs text-amber-400">{unack} awaiting staff acknowledgement</p>}
      <div className="space-y-2">
        {warnings.length === 0 && <div className="card-luxury p-8 text-center text-sm text-muted-foreground">No records yet.</div>}
        {warnings.map((w) => (
          <div key={w.id} className="card-luxury p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  {w.type === "APPRECIATION" ? <ThumbsUp className="w-4 h-4 text-green-400" /> : <ShieldAlert className="w-4 h-4 text-amber-400" />}
                  <p className="font-semibold text-foreground">{w.title}</p>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{w.staff}{w.description ? ` · ${w.description}` : ""}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{w.createdAt?.slice(0, 10)}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", WARN_TONE[w.type])}>{WARN_LABEL[w.type]}</span>
                <span className={cn("text-[10px]", w.acknowledged ? "text-green-400" : "text-muted-foreground")}>
                  {w.acknowledged ? "Acknowledged" : "Not acknowledged"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Handovers ────────────────────────────────────────────────
function HandoversPanel({ handovers }: { handovers: Handover[] }) {
  if (handovers.length === 0) return <div className="card-luxury p-8 text-center text-sm text-muted-foreground">No shift handovers yet.</div>;
  return (
    <div className="space-y-3">
      {handovers.map((h) => (
        <div key={h.id} className="card-luxury p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-foreground">{h.from} <span className="text-xs text-muted-foreground">→ {h.to ?? "next shift"}</span></p>
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", h.acknowledged ? "text-green-400 border-green-500/25 bg-green-500/10" : "text-amber-400 border-amber-500/25 bg-amber-500/10")}>
              {h.acknowledged ? "Received" : "Awaiting"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">{h.branch} · {h.createdAt?.slice(0, 16).replace("T", " ")}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {h.cashInHand != null && <HField label="Cash in hand" value={formatPKR(h.cashInHand)} />}
            {h.pendingBookings && <HField label="Pending bookings" value={h.pendingBookings} />}
            {h.complaints && <HField label="Complaints" value={h.complaints} />}
            {h.roomsToClean && <HField label="Rooms to clean" value={h.roomsToClean} />}
            {h.pendingPayments && <HField label="Pending payments" value={h.pendingPayments} />}
            {h.maintenance && <HField label="Maintenance" value={h.maintenance} />}
            {h.notes && <HField label="Notes" value={h.notes} />}
          </div>
        </div>
      ))}
    </div>
  );
}
function HField({ label, value }: { label: string; value: string }) {
  return <div><span className="text-[10px] uppercase tracking-wider text-muted-foreground block">{label}</span><span className="text-foreground">{value}</span></div>;
}
