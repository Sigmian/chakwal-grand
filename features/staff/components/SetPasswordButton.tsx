"use client";

// ============================================================
// features/staff/components/SetPasswordButton.tsx
// Admin control to set / reset a staff member's login password.
// The admin picks (or generates) a password and shares it with the
// staffer; the old password is never shown.
// ============================================================

import { useState, useTransition } from "react";
import { KeyRound, X, Loader2, Check, Copy, RefreshCw } from "lucide-react";
import { resetStaffPassword } from "@/server/actions/staff";
import { cn } from "@/utils";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  const rand = new Uint32Array(10);
  crypto.getRandomValues(rand);
  for (let i = 0; i < 10; i++) out += chars[rand[i] % chars.length];
  return out;
}

export function SetPasswordButton({ staffId, staffName }: { staffId: string; staffName: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);

  function reset() { setPwd(""); setErr(null); setDone(false); setCopied(false); }
  function close() { setOpen(false); reset(); }

  function submit() {
    setErr(null);
    if (pwd.length < 8) { setErr("Password must be at least 8 characters."); return; }
    start(async () => {
      const res = await resetStaffPassword(staffId, pwd);
      if (!res.success) { setErr(res.error ?? "Failed"); return; }
      setDone(true);
    });
  }

  function copy() {
    navigator.clipboard.writeText(pwd).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-gold-500/30 transition-colors">
        <KeyRound className="w-3.5 h-3.5" /> Set Password
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <div className="relative bg-surface-elevated border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="text-base font-bold text-foreground">Set login password</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{staffName}</p>
              </div>
              <button onClick={close} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-4">
              {done ? (
                <>
                  <div className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/25 px-3 py-3 text-sm text-green-300">
                    <Check className="w-4 h-4 flex-shrink-0" /> Password set. Share it with {staffName.split(" ")[0]} — they sign in with their email and this password.
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-base px-3 py-2.5">
                    <code className="flex-1 font-mono text-sm text-foreground">{pwd}</code>
                    <button onClick={copy} className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300">
                      {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                  </div>
                  <button onClick={close} className="w-full rounded-xl bg-gold-gradient py-2.5 text-sm font-bold text-background">Done</button>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">New password</label>
                    <div className="flex gap-2">
                      <input
                        value={pwd} onChange={(e) => setPwd(e.target.value)} type="text"
                        placeholder="At least 8 characters"
                        className="input-luxury w-full font-mono"
                        onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                      />
                      <button type="button" onClick={() => setPwd(generatePassword())} title="Generate"
                        className="flex items-center gap-1 rounded-xl border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-gold-500/30">
                        <RefreshCw className="w-3.5 h-3.5" /> Generate
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">The staff member can change this later from their portal.</p>
                  </div>
                  {err && <p className="text-sm text-red-300">{err}</p>}
                  <button onClick={submit} disabled={pending || pwd.length < 8}
                    className={cn("flex w-full items-center justify-center gap-2 rounded-xl bg-gold-gradient py-2.5 text-sm font-bold text-background disabled:opacity-60")}>
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />} Set Password
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
