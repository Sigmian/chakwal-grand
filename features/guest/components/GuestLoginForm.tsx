"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Hotel, Phone, Hash, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { guestLogin } from "@/server/actions/guest";

export function GuestLoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [ref, setRef]     = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [showPhone, setShowPhone] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await guestLogin(ref, phone);
      if (res.success) {
        router.push("/guest/dashboard");
        router.refresh();
      } else {
        setError(res.error ?? "Login failed.");
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-surface-base">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-gold-gradient flex items-center justify-center shadow-gold-lg mb-4">
          <Hotel className="w-8 h-8 text-background" />
        </div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Chakwal Grand</h1>
        <p className="text-sm text-muted-foreground mt-1">Guest Portal</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-surface-elevated border border-border rounded-2xl shadow-xl p-8">
        <h2 className="text-lg font-bold text-foreground mb-1">Welcome back</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Enter your booking reference and phone number to access your stay.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Booking Ref */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Booking Reference
            </label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={ref}
                onChange={(e) => setRef(e.target.value.toUpperCase())}
                placeholder="e.g. CGH-2024-XXXX"
                required
                className="w-full pl-9 pr-4 py-2.5 bg-surface-base border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/20 transition-all font-mono"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPhone ? "text" : "tel"}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03XX-XXXXXXX"
                required
                className="w-full pl-9 pr-10 py-2.5 bg-surface-base border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPhone((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPhone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isPending || !ref.trim() || !phone.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl shadow-gold hover:shadow-gold-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
            ) : (
              <>Access My Stay <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Need help? Call reception:{" "}
          <a href="tel:+923347742767" className="text-gold-400 hover:underline font-medium">
            0334-7742767
          </a>
        </p>
      </div>

      <p className="text-xs text-muted-foreground mt-8 text-center">
        Your booking reference is on your confirmation email or SMS.
      </p>
    </div>
  );
}
