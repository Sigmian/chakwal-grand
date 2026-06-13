"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">Something Went Wrong</p>
        <h1 className="text-3xl font-bold font-serif text-foreground mb-4">Unexpected Error</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          We encountered an unexpected issue. Please try again, or contact us if the problem persists.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground font-semibold rounded-xl hover:bg-accent transition-colors text-sm"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground/50 mt-6 font-mono">
            Error ref: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
