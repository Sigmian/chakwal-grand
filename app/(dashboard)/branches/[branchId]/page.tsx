// ============================================================
// app/(dashboard)/branches/[branchId]/page.tsx
// Branch management detail — stats, rooms, staff overview
// ============================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building2, MapPin, Phone, Mail, Globe,
  BedDouble, Users, TrendingUp, ChevronRight, Edit,
  DollarSign,
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

  const [branch, rooms, staff, overview, chartData] = await Promise.all([
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
