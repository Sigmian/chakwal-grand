// ============================================================
// app/(dashboard)/branches/page.tsx
// Company branches — cards with live stats, super admin only
// ============================================================

import Link from "next/link";
import { Building2, MapPin, Phone, BedDouble, Plus, TrendingUp } from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/session";
import { getBranches } from "@/server/actions/branches";
import { getDashboardOverview } from "@/server/actions/analytics";
import { PageHeader, EmptyState, Badge } from "@/components/shared";
import { cn, formatPKR } from "@/utils";

export const metadata = { title: "Branches" };

export default async function BranchesPage() {
  await requireSuperAdmin();

  const branches = await getBranches();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Branches"
        subtitle="Manage all guest house locations"
        actions={
          <Link
            href="/branches/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            Add Branch
          </Link>
        }
      />

      {branches.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="No branches yet"
          body="Add your first branch location to start managing rooms and bookings."
          action={
            <Link href="/branches/new" className="px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl">
              Add Branch
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {branches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      )}
    </div>
  );
}

async function BranchCard({ branch }: { branch: any }) {
  // Fetch per-branch overview
  const stats = await getDashboardOverview(branch.id);

  return (
    <div className="card-luxury overflow-hidden group hover:-translate-y-0.5 hover:shadow-gold-sm transition-all">
      {/* Cover / gradient header */}
      <div className="h-28 relative overflow-hidden"
        style={{
          background: branch.coverImage
            ? undefined
            : "linear-gradient(135deg, #111118 0%, #1a1a28 100%)"
        }}
      >
        {branch.coverImage && (
          <img src={branch.coverImage} alt={branch.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-base/90 via-transparent" />

        {/* Status pill */}
        <div className="absolute top-3 right-3">
          <Badge variant={branch.isActive ? "green" : "red"}>
            {branch.isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-bold text-foreground font-serif text-lg leading-tight truncate">
            {branch.name}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3" />
            {branch.city}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2.5 bg-surface-highlight rounded-xl">
            <p className="text-lg font-bold text-foreground font-serif">{stats.totalRooms}</p>
            <p className="text-2xs text-muted-foreground mt-0.5">Rooms</p>
          </div>
          <div className="text-center p-2.5 bg-surface-highlight rounded-xl">
            <p className="text-lg font-bold text-green-400 font-serif">{stats.occupancyRate}%</p>
            <p className="text-2xs text-muted-foreground mt-0.5">Occupied</p>
          </div>
          <div className="text-center p-2.5 bg-surface-highlight rounded-xl">
            <p className="text-lg font-bold text-gold-400 font-serif truncate text-sm">
              {formatPKR(stats.revenueThisMonth).replace("₨", "")}
            </p>
            <p className="text-2xs text-muted-foreground mt-0.5">Revenue</p>
          </div>
        </div>

        {/* Today counters */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>Today: {stats.checkInsToday} check-ins</span>
          <span>{stats.checkOutsToday} check-outs</span>
          {stats.pendingBookings > 0 && (
            <span className="text-amber-400 font-semibold">{stats.pendingBookings} pending</span>
          )}
        </div>

        {/* Occupancy bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Occupancy</span>
            <span className="font-semibold text-foreground">{stats.occupancyRate}%</span>
          </div>
          <div className="h-2 bg-accent rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-gradient rounded-full transition-all duration-700"
              style={{ width: `${stats.occupancyRate}%` }}
            />
          </div>
        </div>

        {/* Contact + actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          {branch.phone && (
            <a
              href={`tel:${branch.phone}`}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              {branch.phone}
            </a>
          )}
          <div className="flex-1" />
          <Link
            href={`/branches/${branch.id}`}
            className="px-3 py-1.5 text-xs font-semibold text-gold-400 hover:text-gold-300 bg-gold-500/10 hover:bg-gold-500/20 rounded-lg transition-colors"
          >
            Manage →
          </Link>
        </div>
      </div>
    </div>
  );
}
