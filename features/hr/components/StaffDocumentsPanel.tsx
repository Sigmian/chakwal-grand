"use client";

// ============================================================
// features/hr/components/StaffDocumentsPanel.tsx
// Manager-facing HR document manager on the staff detail page:
// upload (image/PDF via Cloudinary), list, and delete.
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Image as ImageIcon, Upload, Trash2, Plus, X, Loader2,
  ExternalLink, ShieldAlert, Check,
} from "lucide-react";
import { addStaffDocument, deleteStaffDocument, type StaffDoc } from "@/server/actions/hr-documents";
import { useFileUpload, type FileKind } from "@/features/shared/hooks/useFileUpload";
import { cn } from "@/utils";

const TYPE_LABEL: Record<StaffDoc["type"], string> = {
  CNIC_FRONT: "CNIC — front", CNIC_BACK: "CNIC — back", AGREEMENT: "Agreement",
  CONTRACT: "Contract", CERTIFICATE: "Certificate", OTHER: "Other",
};
const TYPE_OPTIONS = Object.keys(TYPE_LABEL) as StaffDoc["type"][];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}
function isExpired(iso: string | null) {
  return !!iso && new Date(iso).getTime() < Date.now();
}

export function StaffDocumentsPanel({
  staffId, initialDocs, canManage,
}: { staffId: string; initialDocs: StaffDoc[]; canManage: boolean }) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="card-luxury p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-gold-400" /> Documents
        </h2>
        {canManage && !adding && (
          <button onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gold-500/30 bg-gold-500/10 px-3 py-1.5 text-xs font-semibold text-gold-300 hover:bg-gold-500/20">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        )}
      </div>

      {canManage && adding && <AddForm staffId={staffId} onClose={() => setAdding(false)} />}

      {initialDocs.length === 0 && !adding ? (
        <p className="text-sm text-muted-foreground text-center py-6">No documents on file.</p>
      ) : (
        <div className="space-y-2">
          {initialDocs.map((d) => <DocRow key={d.id} d={d} canManage={canManage} />)}
        </div>
      )}
    </div>
  );
}

function DocRow({ d, canManage }: { d: StaffDoc; canManage: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const expired = isExpired(d.expiresAt);
  const Icon = d.fileKind === "pdf" ? FileText : ImageIcon;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-accent/30 p-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{d.title}</p>
        <p className="text-xs text-muted-foreground">
          {TYPE_LABEL[d.type]}
          {d.expiresAt && (
            <span className={cn("ml-1.5", expired ? "text-red-400 font-semibold" : "text-muted-foreground")}>
              · {expired ? "Expired" : "Expires"} {fmtDate(d.expiresAt)}
            </span>
          )}
        </p>
      </div>
      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
        className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-gold-500/30">
        View <ExternalLink className="h-3 w-3" />
      </a>
      {canManage && (
        confirm ? (
          <button disabled={pending} onClick={() => start(async () => { await deleteStaffDocument(d.id); router.refresh(); })}
            className="flex-shrink-0 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-300 disabled:opacity-60">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm"}
          </button>
        ) : (
          <button onClick={() => setConfirm(true)}
            className="flex-shrink-0 rounded-lg border border-border p-1.5 text-muted-foreground hover:text-red-300 hover:border-red-500/30">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )
      )}
    </div>
  );
}

function AddForm({ staffId, onClose }: { staffId: string; onClose: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [f, setF] = useState<{ type: StaffDoc["type"]; title: string; expiresAt: string }>({
    type: "CNIC_FRONT", title: "", expiresAt: "",
  });
  const [file, setFile] = useState<{ url: string; kind: FileKind } | null>(null);

  const { uploading, pickFile, handleInputChange, inputRef, isConfigured } = useFileUpload({
    onUploaded: (url, kind) => {
      setFile({ url, kind });
      setF((s) => ({ ...s, title: s.title || TYPE_LABEL[s.type] }));
    },
  });

  const field = "input-luxury w-full";
  const label = "block text-xs text-muted-foreground mb-1";

  function submit() {
    setErr(null);
    if (!file) { setErr("Upload a file first."); return; }
    start(async () => {
      try {
        await addStaffDocument({
          staffMemberId: staffId, type: f.type, title: f.title.trim() || TYPE_LABEL[f.type],
          fileUrl: file.url, fileKind: file.kind, expiresAt: f.expiresAt || null,
        });
        onClose(); router.refresh();
      } catch (e) { setErr(e instanceof Error ? e.message : "Failed to save"); }
    });
  }

  return (
    <div className="mb-4 rounded-xl border border-border bg-accent/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">Add document</p>
        <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>

      {!isConfigured && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" /> File uploads need Cloudinary keys configured.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={label}>Type</label>
          <select className={field} value={f.type} onChange={(e) => setF((s) => ({ ...s, type: e.target.value as StaffDoc["type"] }))}>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Expiry (optional)</label>
          <input type="date" className={field} value={f.expiresAt} onChange={(e) => setF((s) => ({ ...s, expiresAt: e.target.value }))} />
        </div>
      </div>
      <div className="mt-3">
        <label className={label}>Title</label>
        <input className={field} value={f.title} placeholder={TYPE_LABEL[f.type]} onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))} />
      </div>

      <div className="mt-3">
        <input ref={inputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleInputChange} />
        {file ? (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-sm text-green-300">
            <Check className="h-4 w-4" /> File attached ({file.kind})
            <button onClick={pickFile} className="ml-auto text-xs underline">Replace</button>
          </div>
        ) : (
          <button onClick={pickFile} disabled={uploading || !isConfigured}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-gold-500/30 hover:text-foreground disabled:opacity-60">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Uploading…" : "Upload image or PDF"}
          </button>
        )}
      </div>

      {err && <p className="mt-2 text-sm text-red-300">{err}</p>}
      <button onClick={submit} disabled={pending || !file}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-2.5 text-sm font-bold text-background disabled:opacity-60">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Save Document
      </button>
    </div>
  );
}
