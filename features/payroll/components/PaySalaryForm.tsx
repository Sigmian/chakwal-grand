"use client";

import { useState, useTransition } from "react";
import { SignatureCanvas } from "./SignatureCanvas";
import { paySalary } from "@/server/actions/payroll";
import { formatPKR } from "@/utils";
import { DollarSign, Loader2, CheckCircle2 } from "lucide-react";

interface Advance {
  id: string;
  amount: number | string;
  reason: string | null;
  givenAt: Date | string;
}

interface PaySalaryFormProps {
  staffMemberId: string;
  staffName: string;
  defaultSalary: number;
  pendingAdvances: Advance[];
  onSuccess?: () => void;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function PaySalaryForm({ staffMemberId, staffName, defaultSalary, pendingAdvances, onSuccess }: PaySalaryFormProps) {
  const now = new Date();
  const [month, setMonth]         = useState(now.getMonth() + 1);
  const [year, setYear]           = useState(now.getFullYear());
  const [gross, setGross]         = useState(defaultSalary);
  const [selectedAdv, setSelAdv]  = useState<string[]>([]);
  const [notes, setNotes]         = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError]         = useState("");
  const [done, setDone]           = useState(false);
  const [isPending, startTransition] = useTransition();

  const deducted = pendingAdvances
    .filter((a) => selectedAdv.includes(a.id))
    .reduce((s, a) => s + Number(a.amount), 0);
  const net = Math.max(0, gross - deducted);

  function toggleAdv(id: string) {
    setSelAdv((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!signature) { setError("Staff signature is required."); return; }
    setError("");
    startTransition(async () => {
      try {
        await paySalary({ staffMemberId, month, year, grossAmount: gross, advanceIds: selectedAdv, notes, signature });
        setDone(true);
        onSuccess?.();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to record payment.");
      }
    });
  }

  if (done) return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <CheckCircle2 className="w-10 h-10 text-green-400" />
      <p className="font-bold text-foreground">Salary Paid!</p>
      <p className="text-sm text-muted-foreground">Net {formatPKR(net)} recorded for {staffName}.</p>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Period */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-accent/30 text-foreground focus:outline-none focus:border-gold-500/50"
          >
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            min={2024}
            max={2030}
            className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-accent/30 text-foreground focus:outline-none focus:border-gold-500/50"
          />
        </div>
      </div>

      {/* Gross salary */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gross Salary (PKR)</label>
        <input
          type="number"
          value={gross}
          onChange={(e) => setGross(Number(e.target.value))}
          min={0}
          required
          className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-accent/30 text-foreground focus:outline-none focus:border-gold-500/50"
        />
      </div>

      {/* Pending advances */}
      {pendingAdvances.length > 0 && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Deduct Advances</label>
          <div className="mt-1.5 space-y-1.5">
            {pendingAdvances.map((adv) => (
              <label key={adv.id} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border bg-accent/20 cursor-pointer hover:border-gold-500/30 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedAdv.includes(adv.id)}
                  onChange={() => toggleAdv(adv.id)}
                  className="accent-yellow-500 w-4 h-4"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{formatPKR(Number(adv.amount))}</p>
                  {adv.reason && <p className="text-xs text-muted-foreground truncate">{adv.reason}</p>}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {new Date(adv.givenAt).toLocaleDateString("en-PK")}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-xl border border-border bg-surface-elevated p-3 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Gross</span>
          <span className="font-semibold text-foreground">{formatPKR(gross)}</span>
        </div>
        {deducted > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Advances Deducted</span>
            <span className="font-semibold text-red-400">− {formatPKR(deducted)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm border-t border-border/50 pt-1.5 mt-1.5">
          <span className="font-bold text-foreground">Net Payable</span>
          <span className="font-bold text-gold-400 text-base">{formatPKR(net)}</span>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Any notes for this payment…"
          className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-border bg-accent/30 text-foreground focus:outline-none focus:border-gold-500/50 resize-none"
        />
      </div>

      {/* Signature */}
      <SignatureCanvas onChange={setSignature} label="Staff Signature (Required)" />

      {error && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-60"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
        {isPending ? "Recording…" : `Pay ${formatPKR(net)}`}
      </button>
    </form>
  );
}
