"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Plus, Trash2, ToggleLeft, ToggleRight, Clock, CheckCircle, XCircle, Pencil, X } from "lucide-react";
import { createAnnouncement, toggleAnnouncement, deleteAnnouncement, updateAnnouncement } from "@/server/actions/settings";
import { toast } from "sonner";

interface Announcement {
  id:        string;
  title:     string;
  body:      string;
  isActive:  boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

interface Props {
  announcements: Announcement[];
  canManage:     boolean;
}

const emptyForm = { title: "", body: "", isActive: true, expiresAt: "" };

export function AnnouncementsClient({ announcements: initial, canManage }: Props) {
  const router = useRouter();
  const [items, setItems]            = useState(initial);
  const [showForm, setShowForm]      = useState(false);
  const [editingId, setEditingId]    = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [form, setForm]     = useState(emptyForm);
  const [editForm, setEditForm] = useState(emptyForm);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, target: "create" | "edit") {
    if (target === "create") setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    else                     setEditForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function startEdit(a: Announcement) {
    setEditingId(a.id);
    setEditForm({
      title:     a.title,
      body:      a.body,
      isActive:  a.isActive,
      expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : "",
    });
  }

  function handleCreate() {
    if (!form.title.trim() || !form.body.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    startTransition(async () => {
      const res = await createAnnouncement({
        title:     form.title,
        body:      form.body,
        isActive:  form.isActive,
        expiresAt: form.expiresAt || null,
      });
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Announcement created.");
      setShowForm(false);
      setForm(emptyForm);
      router.refresh();
    });
  }

  function handleUpdate(id: string) {
    if (!editForm.title.trim() || !editForm.body.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    startTransition(async () => {
      const res = await updateAnnouncement(id, {
        title:     editForm.title,
        body:      editForm.body,
        isActive:  editForm.isActive,
        expiresAt: editForm.expiresAt || null,
      });
      if (!res.success) { toast.error(res.error); return; }
      toast.success("Announcement updated.");
      setEditingId(null);
      setItems(prev => prev.map(a => a.id === id
        ? { ...a, title: editForm.title, body: editForm.body, isActive: editForm.isActive,
            expiresAt: editForm.expiresAt ? new Date(editForm.expiresAt) : null }
        : a
      ));
    });
  }

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const res = await toggleAnnouncement(id, isActive);
      if (!res.success) { toast.error(res.error); return; }
      setItems(prev => prev.map(a => a.id === id ? { ...a, isActive: !isActive } : a));
      toast.success(isActive ? "Announcement deactivated." : "Announcement activated.");
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this announcement? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteAnnouncement(id);
      if (!res.success) { toast.error(res.error); return; }
      setItems(prev => prev.filter(a => a.id !== id));
      toast.success("Announcement deleted.");
    });
  }

  const isExpired = (a: Announcement) =>
    a.expiresAt != null && new Date(a.expiresAt) < new Date();

  return (
    <div className="space-y-4">
      {/* Header actions */}
      {canManage && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && canManage && (
        <div className="card-luxury p-6 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-gold-400" />
            New Announcement
          </h3>
          <AnnouncementForm
            form={form}
            onChange={e => handleChange(e, "create")}
            onCheck={v => setForm(f => ({ ...f, isActive: v }))}
            onSubmit={handleCreate}
            onCancel={() => { setShowForm(false); setForm(emptyForm); }}
            isPending={isPending}
            submitLabel="Create Announcement"
          />
        </div>
      )}

      {/* Announcements list */}
      {items.length === 0 ? (
        <div className="card-luxury p-12 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-4">
            <Megaphone className="w-7 h-7 text-gold-400" />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">No announcements yet</p>
          <p className="text-xs text-muted-foreground">Create one to display a banner on the public website.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(a => {
            const expired = isExpired(a);
            const live    = a.isActive && !expired;
            const editing = editingId === a.id;
            return (
              <div
                key={a.id}
                className={`card-luxury p-5 transition-all ${live ? "border-gold-500/30" : "opacity-70"}`}
              >
                {editing ? (
                  /* ── Inline edit form ── */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5 text-gold-400" />
                        Edit Announcement
                      </h3>
                      <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <AnnouncementForm
                      form={editForm}
                      onChange={e => handleChange(e, "edit")}
                      onCheck={v => setEditForm(f => ({ ...f, isActive: v }))}
                      onSubmit={() => handleUpdate(a.id)}
                      onCancel={() => setEditingId(null)}
                      isPending={isPending}
                      submitLabel="Save Changes"
                    />
                  </div>
                ) : (
                  /* ── Normal row ── */
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${live ? "bg-gold-500/15" : "bg-surface-highlight"}`}>
                      <Megaphone className={`w-4 h-4 ${live ? "text-gold-400" : "text-muted-foreground"}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-foreground">{a.title}</p>
                        {live && (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-2.5 h-2.5" /> Live
                          </span>
                        )}
                        {!a.isActive && !expired && (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-surface-highlight px-2 py-0.5 rounded-full">
                            <XCircle className="w-2.5 h-2.5" /> Paused
                          </span>
                        )}
                        {expired && (
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                            <Clock className="w-2.5 h-2.5" /> Expired
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{a.body}</p>
                      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground/70">
                        <span>Created {new Date(a.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</span>
                        {a.expiresAt && (
                          <span>· Expires {new Date(a.expiresAt).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        )}
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEdit(a)}
                          disabled={isPending}
                          title="Edit"
                          className="w-8 h-8 rounded-lg flex items-center justify-center border border-border hover:border-gold-500/50 hover:text-gold-400 transition-colors disabled:opacity-40"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggle(a.id, a.isActive)}
                          disabled={isPending || expired}
                          title={a.isActive ? "Deactivate" : "Activate"}
                          className="w-8 h-8 rounded-lg flex items-center justify-center border border-border hover:border-gold-500/50 hover:text-gold-400 transition-colors disabled:opacity-40"
                        >
                          {a.isActive
                            ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                            : <ToggleLeft  className="w-4 h-4 text-muted-foreground" />
                          }
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          disabled={isPending}
                          title="Delete"
                          className="w-8 h-8 rounded-lg flex items-center justify-center border border-border hover:border-red-500/50 hover:text-red-400 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Live preview */}
      {items.some(a => a.isActive && !isExpired(a)) && (
        <div className="mt-6">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Live Preview</p>
          {items.filter(a => a.isActive && !isExpired(a)).slice(0, 1).map(a => (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3 bg-gold-500/10 border border-gold-500/30 rounded-xl text-sm">
              <Megaphone className="w-4 h-4 text-gold-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gold-400">{a.title}: </span>
                <span className="text-foreground/80">{a.body}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared form fields ────────────────────────────────────────────
function AnnouncementForm({
  form, onChange, onCheck, onSubmit, onCancel, isPending, submitLabel,
}: {
  form:        { title: string; body: string; isActive: boolean; expiresAt: string };
  onChange:    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onCheck:     (v: boolean) => void;
  onSubmit:    () => void;
  onCancel:    () => void;
  isPending:   boolean;
  submitLabel: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Title *</label>
        <input
          name="title"
          value={form.title}
          onChange={onChange}
          placeholder="e.g. Eid Special Offer"
          className="w-full px-3 py-2 text-sm bg-surface-highlight border border-border rounded-xl focus:outline-none focus:border-gold-500/50 text-foreground placeholder:text-muted-foreground/50"
          maxLength={120}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Message *</label>
        <textarea
          name="body"
          value={form.body}
          onChange={onChange}
          rows={3}
          placeholder="e.g. Get 20% off all rooms this Eid weekend! Use code EID24."
          className="w-full px-3 py-2 text-sm bg-surface-highlight border border-border rounded-xl focus:outline-none focus:border-gold-500/50 text-foreground placeholder:text-muted-foreground/50 resize-none"
          maxLength={300}
        />
        <p className="text-[10px] text-muted-foreground mt-1 text-right">{form.body.length}/300</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Expires At <span className="text-muted-foreground/60">(optional)</span>
          </label>
          <input
            type="datetime-local"
            name="expiresAt"
            value={form.expiresAt}
            onChange={onChange}
            className="w-full px-3 py-2 text-sm bg-surface-highlight border border-border rounded-xl focus:outline-none focus:border-gold-500/50 text-foreground"
          />
        </div>

        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => onCheck(e.target.checked)}
              className="w-4 h-4 rounded border-border accent-gold-500"
            />
            <span className="text-sm text-foreground">Active / Live</span>
          </label>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={onSubmit}
          disabled={isPending}
          className="px-5 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl disabled:opacity-60 hover:shadow-gold-sm transition-all"
        >
          {isPending ? "Saving…" : submitLabel}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-xl hover:border-border/80 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
