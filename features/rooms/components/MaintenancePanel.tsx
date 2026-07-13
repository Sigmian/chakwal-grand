// ============================================================
// features/rooms/components/MaintenancePanel.tsx
// Log and resolve maintenance issues for a room
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Wrench, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { logMaintenance, resolveMaintenance } from "@/server/actions/rooms";
import { cn, formatDate, formatPKR } from "@/utils";
import { RoomStatus } from "@/types";
import { SectionHeader } from "@/components/shared";

interface MaintenanceLog {
  id:          string;
  title:       string;
  description?:string | null;
  cost?:       number | null;
  resolvedAt?: Date | null;
  createdAt:   Date;
}

interface Props {
  roomId:          string;
  maintenanceLogs: MaintenanceLog[];
  currentStatus:   RoomStatus;
}

export function MaintenancePanel({ roomId, maintenanceLogs, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showForm, setShowForm]      = useState(false);
  const [form, setForm] = useState({ title: "", description: "", cost: "" });

  const handleLog = () => {
    if (!form.title.trim()) return toast.error("Issue title is required");
    startTransition(async () => {
      const res = await logMaintenance({
        roomId,
        title:       form.title,
        description: form.description || undefined,
        cost:        form.cost ? Number(form.cost) : undefined,
      });
      if (res.success) {
        toast.success("Maintenance issue logged");
        setForm({ title: "", description: "", cost: "" });
        setShowForm(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to log issue");
      }
    });
  };

  const handleResolve = (logId: string) => {
    startTransition(async () => {
      const res = await resolveMaintenance(logId);
      if (res.success) {
        toast.success("Issue marked as resolved");
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to resolve");
      }
    });
  };

  const openIssues   = maintenanceLogs.filter((l) => !l.resolvedAt);
  const closedIssues = maintenanceLogs.filter((l) => l.resolvedAt);

  return (
    <div className="card-luxury p-5">
      <SectionHeader
        title="Maintenance"
        actions={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gold-500/15 text-gold-400 hover:bg-gold-500/25 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Log Issue
          </button>
        }
      />

      {/* Log form */}
      {showForm && (
        <div className="mb-4 p-4 bg-surface-highlight rounded-xl border border-border/50 space-y-3">
          <input
            placeholder="Issue title *"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-surface-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full bg-surface-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50 resize-none"
          />
          <input
            type="number"
            placeholder="Repair cost (₨) — optional"
            value={form.cost}
            onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
            className="w-full bg-surface-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50"
          />
          <div className="flex gap-2">
            <button
              onClick={handleLog}
              disabled={isPending}
              className="flex-1 py-2 bg-gold-gradient text-background text-xs font-semibold rounded-lg hover:shadow-gold-sm transition-all disabled:opacity-60"
            >
              {isPending ? "Logging..." : "Log Issue"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-2 text-muted-foreground hover:text-foreground text-xs rounded-lg border border-border hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Open issues */}
      {openIssues.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-2xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <AlertCircle className="w-3 h-3" />
            Open Issues ({openIssues.length})
          </p>
          {openIssues.map((log) => (
            <div key={log.id} className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">{log.title}</p>
                  {log.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{log.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-2xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(log.createdAt)}
                    </span>
                    {log.cost && (
                      <span className="text-2xs text-amber-400 font-semibold">
                        {formatPKR(Number(log.cost))}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleResolve(log.id)}
                  disabled={isPending}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-green-400 hover:bg-green-500/10 border border-green-500/20 transition-colors flex-shrink-0"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resolved issues */}
      {closedIssues.length > 0 && (
        <div className="space-y-2">
          <p className="text-2xs font-semibold uppercase tracking-wider text-green-400 flex items-center gap-1.5">
            <CheckCircle className="w-3 h-3" />
            Resolved ({closedIssues.length})
          </p>
          {closedIssues.slice(0, 3).map((log) => (
            <div key={log.id} className="p-3 bg-surface-highlight rounded-xl border border-border/50 opacity-60">
              <p className="text-xs text-muted-foreground line-through">{log.title}</p>
              <p className="text-2xs text-muted-foreground mt-0.5">
                Resolved {formatDate(log.resolvedAt!)}
              </p>
            </div>
          ))}
        </div>
      )}

      {maintenanceLogs.length === 0 && !showForm && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No maintenance issues logged
        </p>
      )}
    </div>
  );
}
