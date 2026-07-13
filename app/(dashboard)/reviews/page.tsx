// ============================================================
// app/(dashboard)/reviews/page.tsx
// Review moderation — approve, feature, delete guest reviews
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader, EmptyState, Badge } from "@/components/shared";
import { ReviewModerationCard } from "@/features/reviews/components/ReviewModerationCard";
import { Star } from "lucide-react";
import prisma from "@/lib/db/prisma";
import { getScopedBranchId } from "@/lib/auth/session";
import { cn } from "@/utils";

export const metadata = { title: "Reviews" };

export default async function ReviewsPage() {
  const user      = await requirePermission("reviews:read");
  const canApprove = hasPermission(user.role, "reviews:approve");
  const branchId   = getScopedBranchId(user);

  const branchScope = branchId
    ? { branchId }
    : { branch: { companyId: user.companyId } };

  const [pending, approved] = await Promise.all([
    prisma.review.findMany({
      where: { isApproved: false, ...branchScope },
      include: { customer: { select: { name: true, loyaltyTier: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.review.findMany({
      where: { isApproved: true, ...branchScope },
      include: { customer: { select: { name: true, loyaltyTier: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const avgRating = approved.length > 0
    ? approved.reduce((s, r) => s + r.rating, 0) / approved.length
    : 0;

  const ratingDist = [5,4,3,2,1].map((star) => ({
    star,
    count: approved.filter((r) => r.rating === star).length,
    pct: approved.length > 0
      ? Math.round((approved.filter((r) => r.rating === star).length / approved.length) * 100)
      : 0,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reviews"
        subtitle="Guest feedback & reputation management"
      />

      {/* Rating overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Average rating */}
        <div className="card-luxury p-6 flex items-center gap-5">
          <div className="text-center">
            <p className="text-5xl font-bold text-gold-400 font-serif">{avgRating.toFixed(1)}</p>
            <div className="flex items-center gap-0.5 justify-center mt-2">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={cn(
                  "w-4 h-4",
                  s <= Math.round(avgRating) ? "fill-gold-400 text-gold-400" : "text-border"
                )} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{approved.length} reviews</p>
          </div>
          <div className="flex-1 space-y-1.5">
            {ratingDist.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{star}</span>
                <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden">
                  <div className="h-full bg-gold-gradient rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-5 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending count */}
        <div className="card-luxury p-6 flex flex-col items-center justify-center gap-2">
          <p className="text-4xl font-bold text-amber-400 font-serif">{pending.length}</p>
          <p className="text-sm font-semibold text-foreground">Awaiting Approval</p>
          <p className="text-xs text-muted-foreground">Reviews pending moderation</p>
        </div>

        {/* Featured count */}
        <div className="card-luxury p-6 flex flex-col items-center justify-center gap-2">
          <p className="text-4xl font-bold text-gold-400 font-serif">
            {approved.filter((r) => r.isFeatured).length}
          </p>
          <p className="text-sm font-semibold text-foreground">Featured Reviews</p>
          <p className="text-xs text-muted-foreground">Shown on public website</p>
        </div>
      </div>

      {/* Pending reviews */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-5 bg-amber-400 rounded-full" />
            <h2 className="font-bold text-foreground">Pending Approval ({pending.length})</h2>
          </div>
          <div className="space-y-3">
            {pending.map((review) => (
              <ReviewModerationCard
                key={review.id}
                review={review as any}
                canModerate={canApprove}
              />
            ))}
          </div>
        </div>
      )}

      {/* Approved reviews */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-gold-gradient rounded-full" />
          <h2 className="font-bold text-foreground">Approved Reviews ({approved.length})</h2>
        </div>
        {approved.length === 0 ? (
          <EmptyState
            icon={<Star className="w-8 h-8" />}
            title="No approved reviews yet"
            body="Approved reviews will appear here and on your public website."
          />
        ) : (
          <div className="space-y-3">
            {approved.map((review) => (
              <ReviewModerationCard
                key={review.id}
                review={review as any}
                canModerate={canApprove}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
