"use client";

// ============================================================
// features/hr/components/TaskAlerts.tsx
// Global pop-up for newly assigned tasks. Polls the assignee's
// unseen tasks and surfaces them as dismissible toasts wherever
// the staffer is in the app (dashboard shell or /portal).
// ============================================================

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ListTodo, X, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import { getMyTaskAlerts, markTasksSeen, type TaskAlert } from "@/server/actions/hr-ops";
import { cn } from "@/utils";

const POLL_MS = 20_000;

const PRIORITY: Record<string, { label: string; cls: string; ring: string }> = {
  URGENT: { label: "Urgent", cls: "bg-red-500/20 text-red-300 border-red-500/40", ring: "border-red-500/40" },
  HIGH:   { label: "High",   cls: "bg-orange-500/20 text-orange-300 border-orange-500/40", ring: "border-orange-500/30" },
  NORMAL: { label: "Normal", cls: "bg-blue-500/20 text-blue-300 border-blue-500/40", ring: "border-white/12" },
  LOW:    { label: "Low",    cls: "bg-white/10 text-white/60 border-white/20", ring: "border-white/12" },
};

export function TaskAlerts({ portalHref = "/portal" }: { portalHref?: string }) {
  const router = useRouter();
  const [alerts, setAlerts] = useState<TaskAlert[]>([]);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = async () => {
    try { setAlerts(await getMyTaskAlerts()); } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
    timer.current = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      if (timer.current) clearInterval(timer.current);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (alerts.length === 0) return null;

  const dismiss = (ids?: string[]) => start(async () => {
    // Optimistic: drop dismissed ones from view immediately.
    setAlerts((prev) => (ids ? prev.filter((a) => !ids.includes(a.id)) : []));
    await markTasksSeen(ids);
    router.refresh();
  });

  const shown = alerts.slice(0, 3);
  const extra = alerts.length - shown.length;

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-gold-300">
          <ListTodo className="h-3.5 w-3.5" /> New task{alerts.length > 1 ? `s (${alerts.length})` : ""}
        </span>
        <button onClick={() => dismiss()} disabled={pending}
          className="text-[11px] text-white/50 hover:text-white/80 disabled:opacity-60">
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Dismiss all"}
        </button>
      </div>

      {shown.map((a) => {
        const p = PRIORITY[a.priority] ?? PRIORITY.NORMAL;
        return (
          <div key={a.id}
            className={cn("rounded-2xl border bg-[#12151a]/95 p-3.5 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2", p.ring)}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", p.cls)}>
                    {a.priority === "URGENT" && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                    {p.label}
                  </span>
                  {a.assignedBy && <span className="truncate text-[11px] text-white/45">from {a.assignedBy}</span>}
                </div>
                <p className="mt-1.5 text-sm font-semibold text-white">{a.title}</p>
              </div>
              <button onClick={() => dismiss([a.id])} disabled={pending}
                className="flex-shrink-0 rounded-lg p-1 text-white/40 hover:text-white/80">
                <X className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => { dismiss([a.id]); router.push(portalHref); }}
              className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold-gradient py-2 text-xs font-bold text-background">
              View task <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}

      {extra > 0 && (
        <button onClick={() => { router.push(portalHref); }}
          className="rounded-xl border border-white/12 bg-[#12151a]/90 py-2 text-center text-xs text-white/60 hover:text-white">
          +{extra} more task{extra > 1 ? "s" : ""} — view all
        </button>
      )}
    </div>
  );
}
