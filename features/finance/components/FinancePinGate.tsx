"use client";

// ============================================================
// features/finance/components/FinancePinGate.tsx
// 4-digit keypad shown in place of the Finance section until
// the PIN is entered. The PIN never reaches this component —
// it is verified server-side.
// ============================================================

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Lock, Delete, Loader2, ShieldCheck } from "lucide-react";
import { unlockFinance } from "@/server/actions/finance-pin";
import { cn } from "@/utils";

const PIN_LENGTH = 4;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export function FinancePinGate({ minutes }: { minutes: number }) {
  const router = useRouter();
  const [pin, setPin]     = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const submittedFor = useRef<string | null>(null);

  function press(key: string) {
    if (pending) return;
    setError(null);
    if (key === "back") { setPin((p) => p.slice(0, -1)); return; }
    if (!key) return;
    setPin((p) => (p.length >= PIN_LENGTH ? p : p + key));
  }

  // Physical keyboard support — this is a desk tool, not just a phone.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") press("back");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Auto-submit once the 4th digit lands.
  useEffect(() => {
    if (pin.length !== PIN_LENGTH || pending) return;
    if (submittedFor.current === pin) return;
    submittedFor.current = pin;

    startTransition(async () => {
      const res = await unlockFinance(pin);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error ?? "Incorrect PIN.");
        setPin("");
        submittedFor.current = null;
      }
    });
  }, [pin, pending, router]);

  return (
    <div className="flex items-center justify-center py-10 animate-fade-in">
      <div className="card-luxury w-full max-w-sm p-7 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-gold-400" />
        </div>

        <h1 className="text-xl font-bold font-serif text-foreground">Finance Locked</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the 4-digit PIN to view financial records
        </p>

        {/* Dots */}
        <div className="flex justify-center gap-3 my-7" aria-hidden="true">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-3.5 h-3.5 rounded-full border transition-all",
                i < pin.length
                  ? "bg-gold-400 border-gold-400 scale-110"
                  : "bg-transparent border-border",
              )}
            />
          ))}
        </div>

        <p aria-live="polite" className="sr-only">
          {pin.length} of {PIN_LENGTH} digits entered
        </p>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
            {error}
          </div>
        )}

        {pending && (
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking…
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {KEYS.map((k, i) =>
            k === "" ? (
              <div key={i} />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => press(k)}
                disabled={pending}
                aria-label={k === "back" ? "Delete last digit" : `Digit ${k}`}
                className={cn(
                  "h-14 rounded-xl border text-lg font-semibold transition-all disabled:opacity-50",
                  k === "back"
                    ? "border-border text-muted-foreground hover:text-foreground hover:border-gold-500/30"
                    : "border-border bg-surface-elevated text-foreground hover:border-gold-500/40 hover:bg-gold-500/10 active:scale-95",
                )}
              >
                {k === "back" ? <Delete className="w-5 h-5 mx-auto" /> : k}
              </button>
            ),
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 text-gold-500/60" />
          Stays unlocked for {minutes} minutes
        </p>
      </div>
    </div>
  );
}
