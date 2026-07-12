// ============================================================
// features/public/components/ReviewsCarousel.tsx
// Auto-scrolling guest testimonials marquee — pauses on hover,
// falls back to a static grid when there are too few reviews.
// ============================================================

"use client";

import { Star, Quote } from "lucide-react";
import { cn } from "@/utils";

export interface PublicReviewCard {
  id:         string;
  rating:     number;
  body:       string;
  isFeatured: boolean;
  name:       string;
  city:       string | null;
}

function ReviewCard({ review, fixedWidth }: { review: PublicReviewCard; fixedWidth?: boolean }) {
  return (
    <figure
      className={cn(
        "card-luxury rounded-2xl p-6 relative flex flex-col",
        fixedWidth && "w-[300px] sm:w-[360px] flex-shrink-0",
        review.isFeatured && "border-gold-500/25"
      )}
    >
      <Quote className="absolute top-5 right-5 w-8 h-8 text-gold-500/10" aria-hidden />

      <div className="flex items-center gap-1 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn("w-4 h-4", i < review.rating ? "text-gold-400 fill-gold-400" : "text-border")}
          />
        ))}
      </div>

      <blockquote className="text-sm text-foreground leading-relaxed mb-5 line-clamp-4 flex-1">
        &ldquo;{review.body}&rdquo;
      </blockquote>

      <figcaption className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-xs font-bold text-gold-400 flex-shrink-0">
          {review.name[0]?.toUpperCase() ?? "G"}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{review.name}</p>
          {review.city && <p className="text-[10px] text-muted-foreground truncate">{review.city}</p>}
        </div>
        {review.isFeatured && (
          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
            Featured
          </span>
        )}
      </figcaption>
    </figure>
  );
}

export function ReviewsCarousel({ reviews }: { reviews: PublicReviewCard[] }) {
  if (reviews.length === 0) return null;

  // Too few reviews to loop smoothly — simple centered grid instead
  if (reviews.length < 3) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
      </div>
    );
  }

  // Marquee speed scales with content so it never races or crawls
  const duration = Math.max(30, reviews.length * 9);

  return (
    <div className="relative overflow-hidden group reviews-marquee scrollbar-hide" aria-label="Guest reviews">
      {/* Edge fades so cards dissolve at the boundaries */}
      <div className="absolute inset-y-0 left-0 w-12 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div
        className="flex w-max animate-marquee group-hover:[animation-play-state:paused]"
        style={{ animationDuration: `${duration}s` }}
      >
        {/* Two identical copies make the -50% translate loop seamless */}
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className={cn("flex gap-6 pr-6 items-stretch", copy === 1 && "marquee-clone")}
            aria-hidden={copy === 1}
          >
            {reviews.map((r) => <ReviewCard key={`${copy}-${r.id}`} review={r} fixedWidth />)}
          </div>
        ))}
      </div>

      <p className="text-center text-[10px] text-muted-foreground/50 mt-6 sm:hidden">
        Touch and hold to pause
      </p>
    </div>
  );
}
