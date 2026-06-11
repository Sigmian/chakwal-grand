// ============================================================
// app/(dashboard)/customers/[customerId]/page.tsx
// Full guest profile — history, loyalty, reviews, blacklist
// ============================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Crown, Phone, Mail, MapPin, ShieldAlert } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getCustomerProfile } from "@/server/actions/branches";
import { BlacklistButton } from "@/features/customers/components/BlacklistButton";
import { SectionHeader, Badge } from "@/components/shared";
import {
  formatPKR, formatPKRShort, formatDate,
  LOYALTY_TIER_CONFIG, BOOKING_STATUS_CONFIG, ROOM_TYPE_CONFIG,
} from "@/utils";
import { LoyaltyTier } from "@/types";

interface PageProps { params: { customerId: string } }

export async function generateMetadata({ params }: PageProps) {
  const profile = await getCustomerProfile(params.customerId);
  return { title: profile?.name ?? "Customer Profile" };
}

export default async function CustomerProfilePage({ params }: PageProps) {
  const user    = await requirePermission("customers:read");
  const profile = await getCustomerProfile(params.customerId);
  if (!profile) notFound();

  const tierCfg = LOYALTY_TIER_CONFIG[profile.loyaltyTier];

  // Progress to next tier
  const nextTierVisits: Record<LoyaltyTier, number | null> = {
    BRONZE: 4, SILVER: 10, GOLD: 25, VIP: null,
  };
  const nextVisits = nextTierVisits[profile.loyaltyTier];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link href="/customers" className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground mt-1 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground font-serif">{profile.name}</h1>
            {profile.isVIP && <Crown className="w-5 h-5 text-gold-400" />}
            {profile.isBlacklisted && (
              <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold">
                ⛔ Blacklisted
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Guest since {formatDate(profile.createdAt)} · {profile.totalVisits} stays
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Profile info */}
        <div className="space-y-5">
          {/* Loyalty card */}
          <div className={`rounded-2xl p-6 relative overflow-hidden ${
            profile.loyaltyTier === LoyaltyTier.VIP   ? "bg-gold-gradient"
            : profile.loyaltyTier === LoyaltyTier.GOLD ? "bg-gradient-to-br from-yellow-900/40 to-amber-900/40 border border-yellow-500/30"
            : "card-luxury border border-border"
          }`}>
            <div className="absolute top-0 right-0 text-8xl opacity-10 font-bold -mt-4 -mr-4">
              {tierCfg.icon}
            </div>
            <div className="relative">
              <p className={`text-xs font-bold uppercase tracking-widest opacity-70 mb-1 ${
                profile.loyaltyTier === LoyaltyTier.VIP ? "text-background" : "text-muted-foreground"
              }`}>
                Loyalty Status
              </p>
              <p className="text-2xl font-bold mb-1">{tierCfg.label} Member</p>
              <p className="text-4xl font-bold font-serif mt-3">{formatPKRShort(Number(profile.totalSpending))}</p>
              <p className="text-sm opacity-70 mt-0.5">Total Lifetime Spending</p>

              {nextVisits && (
                <div className="mt-4">
                  <div className="h-1.5 rounded-full bg-black/20 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/50 transition-all"
                      style={{ width: `${Math.min(100, (profile.totalVisits / nextVisits) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs opacity-70 mt-1.5">
                    {nextVisits - profile.totalVisits} more visit{nextVisits - profile.totalVisits !== 1 ? "s" : ""} to next tier
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Contact info */}
          <div className="card-luxury rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Contact</h3>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-foreground">{profile.phone}</span>
            </div>
            {profile.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{profile.email}</span>
              </div>
            )}
            {profile.city && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground">{profile.city}</span>
              </div>
            )}
            {profile.cnic && (
              <div className="flex items-start gap-3 text-sm">
                <span className="text-muted-foreground text-xs mt-0.5">CNIC</span>
                <span className="text-foreground font-mono">{profile.cnic}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card-luxury rounded-xl p-5">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Stats</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Total Visits",   value: profile.totalVisits.toString()         },
                { label: "Total Spent",    value: formatPKRShort(Number(profile.totalSpending)) },
                { label: "Nationality",    value: profile.nationality                    },
                { label: "Preferred Room", value: profile.preferredRoomType
                    ? ROOM_TYPE_CONFIG[profile.preferredRoomType as keyof typeof ROOM_TYPE_CONFIG]?.label ?? "—"
                    : "No preference"
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Special requests */}
          {profile.specialRequests && (
            <div className="card-luxury rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Special Requests</h3>
              <p className="text-sm text-muted-foreground">{profile.specialRequests}</p>
            </div>
          )}

          {/* Admin notes */}
          {profile.notes && (
            <div className="card-luxury rounded-xl p-5 border border-amber-500/20">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2">Staff Notes</h3>
              <p className="text-sm text-muted-foreground">{profile.notes}</p>
            </div>
          )}

          {/* Blacklist control */}
          {!profile.isBlacklisted && (
            <BlacklistButton customerId={profile.id} customerName={profile.name} />
          )}
        </div>

        {/* Right: Booking history + reviews */}
        <div className="xl:col-span-2 space-y-5">
          {/* Booking history */}
          <div className="card-luxury rounded-xl p-6">
            <SectionHeader
              title="Booking History"
              subtitle={`${profile.bookings.length} total bookings`}
            />
            {profile.bookings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No booking history yet</p>
            ) : (
              <div className="space-y-3">
                {profile.bookings.map((booking) => {
                  const bCfg = BOOKING_STATUS_CONFIG[booking.status];
                  return (
                    <Link
                      key={booking.id}
                      href={`/bookings/${booking.id}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-accent/30 hover:bg-accent/60 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center text-sm font-bold text-gold-400 flex-shrink-0">
                          {booking.room.type.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground group-hover:text-gold-400 transition-colors">
                            {booking.room.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {booking.branch.name} · {formatDate(booking.checkInDate)} – {formatDate(booking.checkOutDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gold-400">{formatPKR(Number(booking.totalAmount))}</p>
                        <span className={`text-xs font-semibold ${bCfg.color}`}>{bCfg.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reviews */}
          {profile.reviews.length > 0 && (
            <div className="card-luxury rounded-xl p-6">
              <SectionHeader title="Guest Reviews" subtitle={`${profile.reviews.length} review${profile.reviews.length !== 1 ? "s" : ""}`} />
              <div className="space-y-4">
                {profile.reviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-xl bg-accent/30 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < review.rating ? "text-gold-400" : "text-border"}>★</span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        {review.isFeatured && (
                          <span className="text-[10px] font-bold text-gold-400 border border-gold-500/20 px-1.5 py-0.5 rounded">FEATURED</span>
                        )}
                        <span className={`text-[10px] font-bold ${review.isApproved ? "text-emerald-400" : "text-amber-400"}`}>
                          {review.isApproved ? "APPROVED" : "PENDING"}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</span>
                      </div>
                    </div>
                    {review.title && <p className="text-sm font-semibold text-foreground mb-1">{review.title}</p>}
                    <p className="text-sm text-muted-foreground">{review.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
