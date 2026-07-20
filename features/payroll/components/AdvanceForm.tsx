"use client";

import { useState, useTransition } from "react";
import { SignatureCanvas } from "./SignatureCanvas";
import { recordAdvance } from "@/server/actions/payroll";
import { formatPKR } from "@/utils";
import { Banknote, Loader2, CheckCircle2 } from "lucide-react";

interface AdvanceFormProps {
  staffMemberId: string;
  staffName: string;
  onSuccess?: () => void;
}

export function AdvanceForm({ staffMemberId, staffName, onSuccess }: AdvanceFormProps) {
  const [amount, setAmount]       = useState(0);
  const [reason, setReason]       = useState("");
  const [notes, setNotes]         = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || amount <= 0) { setError("Enter a valid amount."); return; }
    if (!signature) { setError("Staff signature is required."); return; }
    setError("");
    startTransition(async () => {
      try {
        await recordAdvance({ staffMemberId, amount, reason, notes, signature });
        setDone(true);
        onSuccess?.();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to record advance.");
      }
    });
  }

  if (done) return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <CheckCircle2 className="w-10 h-10 text-green-400" />
      <p className="font-bold text-foreground">Advance Recorded!</p>
      <p className="text-sm text-muted-foreground">{formatPKR(amount)} advance logged for {staffName}.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount (PKR)</label>
        <input
          type="number"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value))}
          min={1}
          placeholder="0"
          required
          className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-accent/30 text-foreground focus:outline-none focus:border-gold-500/50"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason</label>
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Medical emergency, personal need…"
          className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-accent/30 text-foreground focus:outline-none focus:border-gold-500/50"
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Additional notes…"
          className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-accent/30 text-foreground focus:outline-none focus:border-gold-500/50 resize-none"
        />
      </div>

      <SignatureCanvas onChange={setSignature} label="Staff Signature (Required)" />

      {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold rounded-xl hover:bg-amber-500/30 transition-all disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Banknote className="w-4 h-4" />}
        {isPending ? "Recording…" : `Record Advance${amount > 0 ? ` — ${formatPKR(amount)}` : ""}`}
      </button>
    </form>
  );
}
