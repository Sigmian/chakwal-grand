"use client";

// ============================================================
// features/hr/components/TaskThread.tsx
// Collapsible comment thread for a task. Both the assignee and a
// scoped manager can read and post. Loads comments on expand.
// `tone` adapts the palette: "admin" (theme tokens) or "portal"
// (fixed dark shell).
// ============================================================

import { useState, useTransition } from "react";
import { MessageSquare, Send, Loader2, ChevronDown } from "lucide-react";
import { getTaskThread, addTaskComment, type TaskCommentRow } from "@/server/actions/hr-ops";
import { cn } from "@/utils";

type Tone = "admin" | "portal";

const TONES: Record<Tone, {
  trigger: string; box: string; bubbleMine: string; bubbleOther: string;
  meta: string; input: string; empty: string;
}> = {
  admin: {
    trigger: "text-muted-foreground hover:text-foreground",
    box: "border-border bg-surface-highlight/40",
    bubbleMine: "bg-gold-500/15 border-gold-500/25 text-foreground",
    bubbleOther: "bg-accent border-border text-foreground",
    meta: "text-muted-foreground",
    input: "input-luxury",
    empty: "text-muted-foreground",
  },
  portal: {
    trigger: "text-white/55 hover:text-white",
    box: "border-white/12 bg-white/[0.03]",
    bubbleMine: "bg-gold-500/15 border-gold-500/25 text-white",
    bubbleOther: "bg-white/5 border-white/10 text-white",
    meta: "text-white/45",
    input: "w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none focus:border-gold-400/60",
    empty: "text-white/45",
  },
};

export function TaskThread({ taskId, count = 0, tone = "admin" }: { taskId: string; count?: number; tone?: Tone }) {
  const t = TONES[tone];
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [rows, setRows] = useState<TaskCommentRow[]>([]);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const load = () => start(async () => {
    try { setRows(await getTaskThread(taskId)); setLoaded(true); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed to load"); }
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !loaded) load();
  };

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    setErr(null);
    start(async () => {
      try {
        await addTaskComment({ taskId, body: text });
        setBody("");
        setRows(await getTaskThread(taskId));
        setLoaded(true);
      } catch (e) { setErr(e instanceof Error ? e.message : "Failed to send"); }
    });
  };

  const shownCount = loaded ? rows.length : count;

  return (
    <div className="mt-2">
      <button onClick={toggle}
        className={cn("flex items-center gap-1.5 text-xs font-medium transition-colors", t.trigger)}>
        <MessageSquare className="h-3.5 w-3.5" />
        {shownCount > 0 ? `${shownCount} comment${shownCount === 1 ? "" : "s"}` : "Add comment"}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className={cn("mt-2 rounded-xl border p-3", t.box)}>
          {pending && !loaded ? (
            <div className="flex justify-center py-2"><Loader2 className={cn("h-4 w-4 animate-spin", t.meta)} /></div>
          ) : rows.length === 0 ? (
            <p className={cn("py-1 text-xs", t.meta)}>No comments yet. Start the conversation.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((c) => (
                <div key={c.id} className={cn("flex flex-col", c.mine ? "items-end" : "items-start")}>
                  <div className={cn("max-w-[85%] rounded-xl border px-3 py-1.5 text-sm", c.mine ? t.bubbleMine : t.bubbleOther)}>
                    {c.body}
                  </div>
                  <span className={cn("mt-0.5 text-[10px]", t.meta)}>
                    {c.author}{c.isManager ? " · Manager" : ""}{c.createdAt ? ` · ${c.createdAt.slice(5, 16).replace("T", " ")}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-2.5 flex items-center gap-2">
            <input
              className={cn(t.input, "flex-1 text-sm")}
              placeholder="Write a comment…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
            />
            <button onClick={submit} disabled={pending || body.trim().length === 0}
              className="flex flex-shrink-0 items-center justify-center rounded-lg bg-gold-gradient p-2 text-background disabled:opacity-50">
              {pending && loaded ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          {err && <p className="mt-1.5 text-xs text-red-400">{err}</p>}
        </div>
      )}
    </div>
  );
}
