"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2">Error</p>
        <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          This page failed to load. Try refreshing, or go back to the dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gold-gradient text-background font-bold rounded-xl text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-border text-foreground font-semibold rounded-xl hover:bg-accent transition-colors text-sm"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 mt-5 font-mono">ref: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
