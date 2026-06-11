// ============================================================
// features/reviews/components/ReviewModerationCard.tsx
// Individual review card with approve / feature / delete actions
// ============================================================

"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Star, Check, Trash2, Sparkles } from "lucide-react";
import { cn, formatDate } from "@/utils";
import { Badge } from "@/components/shared";
import { approveReview, toggleFeatured, deleteReview } from "@/server/actions/reviews";

interface Review {
  id:          string;
  rating:      number;
  title?:      string | null;
  body:        string;
  isApproved:  boolean;
  isFeatured:  boolean;
  createdAt:   Date;
  customer:    { name: string; loyaltyTier: string };
}

interface Props {
  review:      Review;
  canModerate: boolean;
}

export function ReviewModerationCard({ review, canModerate }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await approveReview(review.id);
      toast.success("Review approved");
    });
  };

  const handleFeature = () => {
    startTransition(async () => {
      await toggleFeatured(review.id, review.isFeatured);
      toast.success(review.isFeatured ? "Removed from featured" : "Added to featured");
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    startTransition(async () => {
      await deleteReview(review.id);
      toast.success("Review deleted");
    });
  };

  return (
    <div className={cn(
      "card-luxury p-5 transition-all",
      !review.isApproved && "border-amber-500/20 bg-amber-500/5",
      review.isFeatured && "border-gold-500/20",
      isPending && "opacity-60"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Reviewer + meta */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-background text-xs font-bold flex-shrink-0">
              {review.customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{review.customer.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {formatDate(review.createdAt)}
              </div>
            </div>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} className={cn(
                "w-4 h-4",
                s <= review.rating ? "fill-gold-400 text-gold-400" : "text-border"
              )} />
            ))}
          </div>

          {/* Title + body */}
          {review.title && (
            <p className="text-sm font-semibold text-foreground mb-1">{review.title}</p>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
        </div>

        {/* Badges + actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex gap-2">
            {!review.isApproved && <Badge variant="amber">Pending</Badge>}
            {review.isFeatured && <Badge variant="gold">⭐ Featured</Badge>}
          </div>

          {canModerate && (
            <div className="flex items-center gap-1.5 mt-2">
              {!review.isApproved && (
                <button
                  onClick={handleApprove}
                  disabled={isPending}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-green-400 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve
                </button>
              )}
              {review.isApproved && (
                <button
                  onClick={handleFeature}
                  disabled={isPending}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                    review.isFeatured
                      ? "text-gold-400 bg-gold-500/10 border-gold-500/20 hover:bg-gold-500/20"
                      : "text-muted-foreground bg-accent border-border hover:text-foreground"
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {review.isFeatured ? "Unfeature" : "Feature"}
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
