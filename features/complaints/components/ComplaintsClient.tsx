"use client";

import { useState, useTransition } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, MessageSquare, Phone, Trash2, User } from "lucide-react";
import { updateComplaintStatus, deleteComplaint } from "@/server/actions/complaints";
import { toast } from "sonner";
import { cn } from "@/utils";

interface Complaint {
  id:         string;
  bookingRef: string | null;
  guestPhone: string;
  guestName:  string | null;
  text:       string;
  severity:   "LOW" | "MEDIUM" | "HIGH";
  source:     string;
  status:     "OPEN" | "IN_PROGRESS" | "RESOLVED";
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdAt:  Date;
}

interface Props {
  complaints: Complaint[];
  canManage:  boolean;
}

const SEVERITY_STYLES: Record<string, { ring: string; chip: string; icon: typeof AlertTriangle }> = {
  HIGH:   { ring: "border-red-500/40 bg-red-500/5",       chip: "bg-red-500/15 text-red-400 border-red-500/30",       icon: AlertTriangle },
  MEDIUM: { ring: "border-amber-500/40 bg-amber-500/5",   chip: "bg-amber-500/15 text-amber-400 border-amber-500/30", icon: AlertCircle },
  LOW:    { ring: "border-border bg-surface-elevated",    chip: "bg-surface-highlight text-muted-foreground border-border", icon: AlertCircle },
};

const STATUS_STYLES: Record<string, { label: string; chip: string }> = {
  OPEN:        { label: "Open",        chip: "bg-amber-500/15 text-amber-400" },
  IN_PROGRESS: { label: "In Progress", chip: "bg-blue-500/15 text-blue-400" },
  RESOLVED:    { label: "Resolved",    chip: "bg-emerald-500/15 text-emerald-400" },
};

export function ComplaintsClient({ complaints: initial, canManage }: Props) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<"all" | "active" | "resolved" | "HIGH">("active");
  const [isPending, startTransition] = useTransition();

  const filtered = items
    .filter(c => {
      if (filter === "all")      return true;
      if (filter === "active")   return c.status !== "RESOLVED";
      if (filter === "resolved") return c.status === "RESOLVED";
      if (filter === "HIGH")     return c.severity === "HIGH" && c.status !== "RESOLVED";
      return true;
    })
    .sort((a, b) => {
      // High severity OPEN at top
      const aPri = (a.severity === "HIGH" && a.status === "OPEN" ? 0 : 1);
      const bPri = (b.severity === "HIGH" && b.status === "OPEN" ? 0 : 1);
      if (aPri !== bPri) return aPri - bPri;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  function handleStatus(id: string, status: Complaint["status"]) {
    startTransition(async () => {
      const res = await updateComplaintStatus(id, status);
      if (!res.success) { toast.error(res.error); return; }
      setItems(prev => prev.map(c => c.id === id
        ? { ...c, status, resolvedAt: status === "RESOLVED" ? new Date() : null }
        : c
      ));
      toast.success(`Marked ${STATUS_STYLES[status].label.toLowerCase()}`);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this complaint permanently?")) return;
    startTransition(async () => {
      const res = await deleteComplaint(id);
      if (!res.success) { toast.error(res.error); return; }
      setItems(prev => prev.filter(c => c.id !== id));
      toast.success("Complaint deleted.");
    });
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          ["active",  `Active (${items.filter(c => c.status !== "RESOLVED").length})`],
          ["HIGH",    `High Priority (${items.filter(c => c.severity === "HIGH" && c.status !== "RESOLVED").length})`],
          ["resolved", `Resolved (${items.filter(c => c.status === "RESOLVED").length})`],
          ["all",     `All (${items.length})`],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all",
              filter === key
                ? "bg-gold-gradient text-background border-transparent shadow-gold-sm"
                : "border-border text-muted-foreground hover:text-foreground hover:border-gold-500/40"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card-luxury p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 mx-auto">
            <CheckCircle className="w-7 h-7 text-emerald-400" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No complaints to show</p>
          <p className="text-xs text-muted-foreground">All guests are happy in this view.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => {
            const sev   = SEVERITY_STYLES[c.severity] ?? SEVERITY_STYLES.MEDIUM;
            const stat  = STATUS_STYLES[c.status]     ?? STATUS_STYLES.OPEN;
            const SevIcon = sev.icon;

            return (
              <div key={c.id} className={cn("card-luxury p-5 border-2 transition-all", sev.ring)}>
                <div className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", sev.chip)}>
                    <SevIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Chips */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border", sev.chip)}>
                        {c.severity}
                      </span>
                      <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", stat.chip)}>
                        {stat.label}
                      </span>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-surface-highlight px-2 py-0.5 rounded-full flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5" /> {c.source}
                      </span>
                      {c.bookingRef && (
                        <span className="text-[10px] font-mono text-gold-400 bg-gold-500/10 px-2 py-0.5 rounded-full">
                          {c.bookingRef}
                        </span>
                      )}
                    </div>

                    {/* Guest info */}
                    <div className="flex flex-wrap gap-4 mb-2 text-xs text-muted-foreground">
                      {c.guestName && (
                        <span className="flex items-center gap-1.5">
                          <User className="w-3 h-3" /> {c.guestName}
                        </span>
                      )}
                      <a href={`tel:${c.guestPhone}`} className="flex items-center gap-1.5 hover:text-gold-400 transition-colors">
                        <Phone className="w-3 h-3" /> {c.guestPhone}
                      </a>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date(c.createdAt).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Complaint text */}
                    <p className="text-sm text-foreground leading-relaxed bg-surface-base/50 rounded-xl p-3 border border-border/50">
                      “{c.text}”
                    </p>

                    {/* Resolution info */}
                    {c.status === "RESOLVED" && c.resolvedAt && (
                      <p className="text-[10px] text-emerald-400/80 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Resolved {new Date(c.resolvedAt).toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {c.resolvedBy && ` by ${c.resolvedBy}`}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  {canManage && (
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {c.status !== "RESOLVED" && (
                        <>
                          {c.status === "OPEN" && (
                            <button
                              onClick={() => handleStatus(c.id, "IN_PROGRESS")}
                              disabled={isPending}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              Take Action
                            </button>
                          )}
                          <button
                            onClick={() => handleStatus(c.id, "RESOLVED")}
                            disabled={isPending}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            Mark Resolved
                          </button>
                        </>
                      )}
                      {c.status === "RESOLVED" && (
                        <button
                          onClick={() => handleStatus(c.id, "OPEN")}
                          disabled={isPending}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border text-muted-foreground hover:border-amber-500/40 hover:text-amber-400 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          Reopen
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isPending}
                        title="Delete complaint"
                        className="w-full px-2 py-1.5 rounded-lg border border-border text-muted-foreground hover:border-red-500/40 hover:text-red-400 transition-colors disabled:opacity-50 flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
