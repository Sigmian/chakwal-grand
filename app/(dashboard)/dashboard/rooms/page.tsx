// ============================================================
// app/(dashboard)/rooms/page.tsx
// Room management — filterable grid with status tabs
// ============================================================

import Link from "next/link";
import { Plus, BedDouble } from "lucide-react";
import { requirePermission, getSession } from "@/lib/auth/session";
import { getRooms } from "@/server/actions/rooms";
import { PageHeader, EmptyState, Badge } from "@/components/shared";
import { RoomCard } from "@/features/rooms/components/RoomCard";
import { RoomStatus, RoomType } from "@/types";
import { ROOM_STATUS_CONFIG, ROOM_TYPE_CONFIG } from "@/utils";
import { hasPermission } from "@/lib/auth/permissions";
import { cn } from "@/utils";

interface PageProps {
  searchParams: { status?: string; type?: string; branch?: string };
}

export const metadata = { title: "Rooms" };

const STATUS_TABS = [
  { value: "",                       label: "All Rooms"   },
  { value: RoomStatus.AVAILABLE,     label: "Available"   },
  { value: RoomStatus.OCCUPIED,      label: "Occupied"    },
  { value: RoomStatus.CLEANING,      label: "Cleaning"    },
  { value: RoomStatus.MAINTENANCE,   label: "Maintenance" },
  { value: RoomStatus.BLOCKED,       label: "Blocked"     },
];

export default async function RoomsPage({ searchParams }: PageProps) {
  const user = await requirePermission("rooms:read");

  const rooms = await getRooms({
    status:   searchParams.status  as RoomStatus | undefined,
    type:     searchParams.type    as RoomType   | undefined,
    branchId: searchParams.branch,
  });

  // Count by status for tab badges
  const allRooms = await getRooms({});
  const statusCounts = Object.values(RoomStatus).reduce((acc, s) => ({
    ...acc,
    [s]: allRooms.filter((r) => r.status === s).length,
  }), {} as Record<string, number>);

  const canCreate = hasPermission(user.role, "rooms:create");
  const canEdit   = hasPermission(user.role, "rooms:update");
  const activeStatus = searchParams.status ?? "";

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rooms"
        subtitle={`${allRooms.length} room${allRooms.length !== 1 ? "s" : ""} across all branches`}
        actions={
          canCreate ? (
            <Link
              href="/dashboard/rooms/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Add Room
            </Link>
          ) : undefined
        }
      />

      {/* Status summary bar */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {Object.values(RoomStatus).map((s) => {
          const cfg   = ROOM_STATUS_CONFIG[s];
          const count = statusCounts[s] ?? 0;
          const total = allRooms.length;
          const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <Link
              key={s}
              href={`/dashboard/rooms?status=${s}`}
              className={cn(
                "card-luxury p-3 text-center hover:border-border transition-all",
                activeStatus === s && "border-gold-500/40"
              )}
            >
              <div className={cn("text-xl font-bold font-serif", cfg.color)}>{count}</div>
              <div className="text-2xs text-muted-foreground mt-0.5">{cfg.label}</div>
              <div className="mt-1.5 h-1 bg-accent rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", {
                    "bg-status-available":   s === RoomStatus.AVAILABLE,
                    "bg-status-occupied":    s === RoomStatus.OCCUPIED,
                    "bg-status-cleaning":    s === RoomStatus.CLEANING,
                    "bg-status-maintenance": s === RoomStatus.MAINTENANCE,
                    "bg-status-blocked":     s === RoomStatus.BLOCKED,
                  })}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/dashboard/rooms?status=${tab.value}` : "/dashboard/rooms"}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
              activeStatus === tab.value
                ? "bg-gold-500/15 text-gold-400 border border-gold-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent"
            )}
          >
            {tab.label}
            {tab.value && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-md font-semibold",
                activeStatus === tab.value
                  ? "bg-gold-500/20 text-gold-400"
                  : "bg-accent text-muted-foreground"
              )}>
                {statusCounts[tab.value] ?? 0}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Room grid */}
      {rooms.length === 0 ? (
        <EmptyState
          icon={<BedDouble className="w-8 h-8" />}
          title="No rooms found"
          body={activeStatus
            ? `No ${ROOM_STATUS_CONFIG[activeStatus as RoomStatus]?.label.toLowerCase()} rooms right now.`
            : "Add your first room to get started."}
          action={
            canCreate ? (
              <Link
                href="/dashboard/rooms/new"
                className="px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl"
              >
                Add Room
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              id={room.id}
              number={room.number}
              name={room.name}
              type={room.type as RoomType}
              status={room.status as RoomStatus}
              floor={room.floor}
              pricePerNight={Number(room.pricePerNight)}
              maxAdults={room.maxAdults}
              bedCount={room.bedCount}
              branchName={room.branch?.name}
              amenities={room.amenities}
              coverImage={room.images.find((i: any) => i.isCover)?.url ?? room.images[0]?.url}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
