// ============================================================
// app/(dashboard)/branches/[branchId]/page.tsx
// Branch management detail — stats, rooms, staff overview
// ============================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, Globe,
  BedDouble, Users, TrendingUp, ChevronRight, Edit,
  DollarSign, Flame, Tag, ToggleRight, ToggleLeft, Calendar,
} from "lucide-react";
import { requireSuperAdmin } from "@/lib/auth/session";
import { getDashboardOverview, getRevenueChartData } from "@/server/actions/analytics";
import {
  PageHeader, Badge, SectionHeader, GoldDivider, ProgressBar,
} from "@/components/shared";
import { RevenueAreaChart } from "@/components/charts/RevenueChart";
import { RoomCard } from "@/features/rooms/components/RoomCard";
import {
  cn, formatPKR, formatPKRShort, USER_ROLE_CONFIG, getInitials,
  ROOM_STATUS_CONFIG,
} from "@/utils";
import { RoomStatus, UserRole } from "@/types";
import prisma from "@/lib/db/prisma";

interface Props { params: { branchId: string } }

export async function generateMetadata({ params }: Props) {
  const branch = await prisma.branch.findUnique({
    where:  { id: params.branchId },
    select: { name: true },
  });
  return { title: branch?.name ?? "Branch" };
}

export default async function BranchDetailPage({ params }: Props) {
  await requireSuperAdmin();

  const [branch, rooms, staff, overview, chartData, offers] = await Promise.all([
    prisma.branch.findUnique({ where: { id: params.branchId } }),
    prisma.room.findMany({
      where:   { branchId: params.branchId, isActive: true },
      include: { images: { where: { isCover: true }, take: 1 } },
      orderBy: { number: "asc" },
    }),
    prisma.staffMember.findMany({
      where:   { branchId: params.branchId },
      include: { user: { select: { name: true, email: true, role: true, isActive: true } } },
      orderBy: { user: { name: "asc" } },
    }),
    getDashboardOverview(params.branchId),
    getRevenueChartData(params.branchId),
    prisma.offer.findMany({
      where:    { branchId: params.branchId },
      orderBy:  { createdAt: "desc" },
    }),
  ]);

  if (!branch) notFound();

  const roomStatusGroups = Object.values(RoomStatus).map(s => ({
    status: s,
    count:  rooms.filter(r => r.status === s).length,
    config: ROOM_STATUS_CONFIG[s],
  })).filter(g => g.count > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/branches" className="flex items-center gap-1 hover:text-gold-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Branches
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">{branch.name}</span>
      </div>

      {/* Branch header */}
      <div className="card-luxury overflow-hidden">
        <div className="relative h-40"
          style={{ background: "linear-gradient(135deg, #111118 0%, #1c1c2a 50%, #12121e 100%)" }}
        >
          {(branch as any).coverImage && (
            <img src={(branch as any).coverImage} alt={branch.name} className="w-full h-full object-cover absolute inset-0" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-base/95" />

          <Link
            href={`/branches/${branch.id}/edit`}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-surface-base/70 backdrop-blur-sm border border-border rounded-xl text-xs font-semibold text-foreground hover:border-gold-500/50 hover:text-gold-400 transition-all"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </Link>

          <div className="absolute bottom-4 left-6">
            <h1 className="text-2xl font-bold font-serif text-foreground">{branch.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                {branch.city}
                {(branch as any).address ? `, ${(branch as any).address}` : ""}
              </span>
              <Badge variant={branch.isActive ? "green" : "red"}>
                {branch.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact row */}
        <div className="px-6 py-4 flex flex-wrap gap-5 items-center border-b border-border/50">
          {branch.phone && (
            <a href={`tel:${branch.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Phone className="w-3.5 h-3.5 text-gold-500/60" />
              {branch.phone}
            </a>
          )}
          {(branch as any).email && (
            <a href={`mailto:${(branch as any).email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="w-3.5 h-3.5 text-gold-500/60" />
              {(branch as any).email}
            </a>
          )}
          {(branch as any).website && (
            <a href={(branch as any).website} target="_blank" rel="noopener" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-gold-400 transition-colors">
              <Globe className="w-3.5 h-3.5 text-gold-500/60" />
              {(branch as any).website.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Rooms",   value: overview.totalRooms,              icon: BedDouble,  color: "text-foreground", bg: "bg-accent"       },
          { label: "Occupancy",     value: `${overview.occupancyRate}%`,     icon: TrendingUp, color: "text-gold-400",   bg: "bg-gold-500/15"  },
          { label: "Revenue (MTD)", value: formatPKRShort(overview.revenueThisMonth), icon: DollarSign, color: "text-green-400", bg: "bg-green-500/15" },
          { label: "Staff",         value: staff.length,                     icon: Users,      color: "text-blue-400",   bg: "bg-blue-500/15"  },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card-luxury p-5 flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className={cn("text-xl font-bold font-serif mt-0.5", color)}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts + room status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-luxury p-6">
          <SectionHeader title="Revenue — Last 6 Months" />
          <RevenueAreaChart data={chartData} />
        </div>

        <div className="card-luxury p-6">
          <SectionHeader title="Room Status" />
          <div className="space-y-3 mb-5">
            {roomStatusGroups.map(({ status, count, config }) => (
              <div key={status}>
                <ProgressBar
                  value={count}
                  max={rooms.length}
                  label={config.label}
                  color={status === RoomStatus.AVAILABLE ? "green" : status === RoomStatus.OCCUPIED ? "red" : "gold"}
                />
                <p className="text-xs text-muted-foreground mt-0.5 text-right">{count} room{count !== 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>

          <GoldDivider />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-ins today</span>
              <span className="font-semibold text-green-400">{overview.checkInsToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Check-outs today</span>
              <span className="font-semibold text-red-400">{overview.checkOutsToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pending</span>
              <span className="font-semibold text-amber-400">{overview.pendingBookings}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms grid */}
      <div>
        <SectionHeader
          title={`Rooms (${rooms.length})`}
          actions={
            <Link href={`/rooms?branch=${branch.id}`} className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
              Manage rooms <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.slice(0, 8).map((room) => (
            <RoomCard
              key={room.id}
              id={room.id}
              number={room.number}
              name={room.name}
              type={room.type as any}
              status={room.status as RoomStatus}
              floor={room.floor}
              pricePerNight={Number(room.pricePerNight)}
              maxAdults={room.maxAdults}
              bedCount={room.bedCount}
              amenities={room.amenities}
              coverImage={room.images[0]?.url}
              canEdit={false}
            />
          ))}
        </div>
        {rooms.length > 8 && (
          <div className="mt-4 text-center">
            <Link href={`/rooms?branch=${branch.id}`} className="text-sm text-gold-400 hover:text-gold-300">
              View all {rooms.length} rooms →
            </Link>
          </div>
        )}
      </div>

      {/* Active Offers / Promotions */}
      {offers.length > 0 && (
        <div>
          <SectionHeader
            title={`Offers & Promotions (${offers.length})`}
            actions={
              <Link href="/offers" className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
                Manage offers <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map(offer => {
              const now       = new Date();
              const expiry    = new Date(offer.expiresAt);
              const expired   = expiry < now;
              const daysLeft  = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              const isGrand   = offer.code === "AUTO_GRANDOPEN50";
              const savings   = isGrand
                ? Math.round((Number(offer.discountValue) / 100) * rooms.reduce((s, r) => s + Number(r.pricePerNight), 0) / Math.max(rooms.length, 1) * offer.usedCount)
                : 0;

              return (
                <div key={offer.id} className={`card-luxury p-5 rounded-2xl border ${isGrand && offer.isActive && !expired ? "border-emerald-500/30 bg-emerald-500/5" : ""}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {isGrand
                        ? <Flame className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        : <Tag   className="w-4 h-4 text-gold-400 flex-shrink-0"    />
                      }
                      <p className="text-sm font-bold text-foreground">{offer.name}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0 ${
                      expired          ? "bg-surface-base text-muted-foreground"
                      : offer.isActive ? "bg-emerald-500/10 text-emerald-400"
                                       : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {expired ? "Expired" : offer.isActive ? "Active" : "Paused"}
                    </span>
                  </div>

                  {offer.code && (
                    <p className="font-mono text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded-md inline-block mb-3">
                      {offer.code}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-center mb-3">
                    <div className="bg-surface-highlight rounded-xl p-2">
                      <p className={`text-lg font-bold font-serif ${isGrand ? "text-emerald-400" : "text-gold-400"}`}>
                        {offer.discountType === "PERCENTAGE" ? `${offer.discountValue}%` : formatPKR(Number(offer.discountValue))}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Discount</p>
                    </div>
                    <div className="bg-surface-highlight rounded-xl p-2">
                      <p className="text-lg font-bold font-serif text-foreground">{offer.usedCount}</p>
                      <p className="text-[10px] text-muted-foreground">Times used</p>
                    </div>
                    {isGrand && savings > 0 && (
                      <div className="col-span-2 bg-surface-highlight rounded-xl p-2">
                        <p className="text-sm font-bold text-emerald-400">{formatPKR(savings)}</p>
                        <p className="text-[10px] text-muted-foreground">Est. savings given to guests</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {expired
                      ? `Expired ${expiry.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}`
                      : daysLeft <= 7
                      ? <span className="text-amber-400 font-semibold">{daysLeft} day{daysLeft !== 1 ? "s" : ""} remaining</span>
                      : `Ends ${expiry.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}`
                    }
                    {offer.maxUses && (
                      <span className="ml-auto">{offer.usedCount}/{offer.maxUses} uses</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bookings quick-link */}
      <div className="card-luxury p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-foreground">Bookings for this branch</p>
          <p className="text-sm text-muted-foreground mt-0.5">View and manage all reservations at {branch.name}</p>
        </div>
        <Link
          href={`/bookings?branch=${branch.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all hover:-translate-y-0.5 flex-shrink-0"
        >
          View Bookings <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Staff list */}
      <div>
        <SectionHeader
          title={`Staff (${staff.length})`}
          actions={
            <Link href="/staff" className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1">
              Manage staff <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => {
            const roleCfg = USER_ROLE_CONFIG[member.user.role as UserRole];
            return (
              <Link
                key={member.id}
                href={`/staff/${member.id}`}
                className="card-luxury p-4 flex items-center gap-4 hover:-translate-y-0.5 hover:border-border/80 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center text-background font-bold flex-shrink-0">
                  {getInitials(member.user.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{member.user.name}</p>
                  <p className="text-xs text-muted-foreground">{(member as any).designation ?? roleCfg.label}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
