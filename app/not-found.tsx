import Link from "next/link";
import { Home, Phone, Search } from "lucide-react";
import { siteConfig } from "@/config/site";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mx-auto mb-6">
          <Search className="w-10 h-10 text-gold-400" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Page Not Found</p>
        <h1 className="text-5xl font-bold font-serif text-foreground mb-4">404</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved.
          Let us help you find what you need.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-lg transition-all text-sm"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/rooms"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground font-semibold rounded-xl hover:bg-accent transition-colors text-sm"
          >
            Browse Rooms
          </Link>
          <a
            href={`tel:${siteConfig.phoneE164}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10 transition-colors text-sm"
          >
            <Phone className="w-4 h-4" />
            Call Us
          </a>
        </div>
        <p className="text-xs text-muted-foreground mt-8">
          Need help? Call us at{" "}
          <a href={`tel:${siteConfig.phoneE164}`} className="text-gold-400 hover:underline font-mono">
            {siteConfig.phone}
          </a>
        </p>
      </div>
    </div>
  );
}
