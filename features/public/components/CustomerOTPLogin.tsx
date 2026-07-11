"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, KeyRound } from "lucide-react";

export function CustomerOTPLogin() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const sendOtp = async () => {
    setError(null);
    setInfo(null);
    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to send OTP.");
        return;
      }
      setInfo("Code sent to your WhatsApp.");
      setStep("otp");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError(null);
    setInfo(null);
    if (otp.trim().length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/customer/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Invalid code.");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-surface-elevated border border-border rounded-2xl shadow-card p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 mb-4">
            <KeyRound className="w-6 h-6 text-gold-400" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-foreground">My Account</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "phone"
              ? "Enter your registered phone number to sign in."
              : "We sent a 6-digit code to your WhatsApp."}
          </p>
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Phone number
              </span>
              <div className="mt-1.5 relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="03XX-XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-surface-base border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30"
                />
              </div>
            </label>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={sendOtp}
              disabled={loading}
              className="w-full py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send OTP
            </button>
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                6-digit code
              </span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="mt-1.5 w-full px-3 py-2.5 bg-surface-base border border-border rounded-xl text-foreground text-center text-lg font-mono tracking-[0.5em] placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/30"
              />
            </label>

            {info && !error && (
              <p className="text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
                {info}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={verifyOtp}
              disabled={loading}
              className="w-full py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Verify
            </button>

            <button
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError(null);
                setInfo(null);
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Use a different number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
