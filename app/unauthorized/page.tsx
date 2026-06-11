// app/unauthorized/page.tsx
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-foreground font-serif mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-sm mb-6">
          You don't have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gold-gradient text-background font-semibold text-sm rounded-xl hover:shadow-gold-sm transition-all"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
