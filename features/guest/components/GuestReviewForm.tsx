"use client";

import { useState, useTransition } from "react";
import { Star, Send, Loader2, CheckCircle2 } from "lucide-react";
import { submitGuestReview } from "@/server/actions/guest";
import { cn } from "@/utils";

export function GuestReviewForm() {
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState(0);
  const [hover, setHover]   = useState(0);
  const [title, setTitle]   = useState("");
  const [body, setBody]     = useState("");
  const [done, setDone]     = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setError("Please select a star rating"); return; }
    if (!body.trim()) { setError("Please write something about your stay"); return; }
    setError("");
    startTransition(async () => {
      const res = await submitGuestReview({ rating, title: title || undefined, body });
      if (res.success) {
        setDone(true);
      } else {
        setError(res.error ?? "Failed to submit review");
      }
    });
  };

  if (done) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
        <p className="font-bold text-foreground mb-1">Thank you for your review!</p>
        <p className="text-sm text-muted-foreground">Your review will be visible after approval.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Stars */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Your Rating</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "w-7 h-7 transition-colors",
                  (hover || rating) >= n ? "text-gold-400 fill-gold-400" : "text-border"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Title (optional)</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. Great stay, will come back!"
          maxLength={100}
          className="w-full bg-surface-base border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold-500/50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Your Review *</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Tell us about your experience — room comfort, service, cleanliness..."
          required
          rows={3}
          maxLength={500}
          className="w-full bg-surface-base border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold-500/50 transition-colors resize-none"
        />
        <p className="text-[10px] text-muted-foreground mt-1 text-right">{body.length}/500</p>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={isPending || !rating || !body.trim()}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold-gradient text-background text-sm font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <><Send className="w-4 h-4" /> Submit Review</>}
      </button>
    </form>
  );
}
