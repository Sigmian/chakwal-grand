// ============================================================
// features/rooms/components/HousekeepingBoard.tsx
// Visual grid of rooms for housekeeping workflow.
// Shows status, last cleaned time, and quick action buttons.
// ============================================================

"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  CheckCircle, Clock, Wrench, BedDouble,
  Sparkles, RefreshCw, Filter,
} from "lucide-react";
import { updateRoomStatus } from "@/server/actions/rooms";
import { cn, formatTime, ROOM_STATUS_CONFIG } from "@/utils";
import { RoomStatus } from "@/types";

interface HousekeepingRoom {
  id:           string;
  number:       string;
  name:         string;
  floor?:       number | null;
  status:       RoomStatus;
  lastCleaned?: Date | string | null;
  currentBooking?: {
    checkOutDate: Date | string;
    customer: { name: string };
  } | null;
  branch: { name: string };
}

interface Props {
  rooms: HousekeepingRoom[];
}

const STATUS_PRIORITY: Record<RoomStatus, number> = {
  [RoomStatus.CLEANING]:    0,
  [RoomStatus.AVAILABLE]:   1,
  [RoomStatus.OCCUPIED]:    2,
  [RoomStatus.MAINTENANCE]: 3,
  [RoomStatus.BLOCKED]:     4,
};

const QUICK_ACTIONS: Partial<Record<RoomStatus, { label: string; next: RoomStatus; icon: React.ElementType; className: string }[]>> = {
  [RoomStatus.CLEANING]: [
    { label: "Mark Clean",      next: RoomStatus.AVAILABLE,   icon: CheckCircle, className: "text-green-400 bg-green-500/10 border-green-500/20 hover:bg-green-500/20" },
    { label: "Maintenance",     next: RoomStatus.MAINTENANCE, icon: Wrench,      className: "text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20" },
  ],
  [RoomStatus.AVAILABLE]: [
    { label: "Start Cleaning",  next: RoomStatus.CLEANING,    icon: Sparkles,    className: "text-violet-400 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20" },
  ],
  [RoomStatus.OCCUPIED]: [
    { label: "Request Clean",   next: RoomStatus.CLEANING,    icon: Sparkles,    className: "text-violet-400 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20" },
  ],
};

function RoomTile({ room }: { room: HousekeepingRoom }) {
  const [isPending, startTransition] = useTransition();
  const statusCfg = ROOM_STATUS_CONFIG[room.status];
  const actions   = QUICK_ACTIONS[room.status] ?? [];

  const handleAction = (next: RoomStatus) => {
    startTransition(async () => {
      const res = await updateRoomStatus(room.id, next);
      if (res.success) {
        toast.success(`Room ${room.number} → ${ROOM_STATUS_CONFIG[next].label}`);
      } else {
        toast.error(res.error ?? "Status update failed");
      }
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "card-luxury p-4 border-l-4 transition-all",
        {
          "border-l-status-available":   room.status === RoomStatus.AVAILABLE,
          "border-l-status-occupied":    room.status === RoomStatus.OCCUPIED,
          "border-l-status-cleaning":    room.status === RoomStatus.CLEANING,
          "border-l-status-maintenance": room.status === RoomStatus.MAINTENANCE,
          "border-l-status-blocked":     room.status === RoomStatus.BLOCKED,
        },
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      {/* Room info */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Room {room.number}
            {room.floor != null ? ` · F${room.floor}` : ""}
          </p>
          <p className="font-bold text-foreground mt-0.5 leading-tight">{room.name}</p>
        </div>
        <span className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-lg text-2xs font-semibold border",
          statusCfg.color, "bg-surface-base/60 border-current/20"
        )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dotClass)} />
          {statusCfg.label}
        </span>
      </div>

      {/* Last cleaned */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
        <Clock className="w-3.5 h-3.5" />
        {room.lastCleaned
          ? <>Last cleaned {formatTime(new Date(room.lastCleaned))}</>
          : "Not yet cleaned"
        }
      </div>

      {/* Current guest (occupied) */}
      {room.currentBooking && (
        <div className="mb-3 px-2.5 py-2 bg-surface-highlight rounded-lg text-xs">
          <p className="font-semibold text-foreground truncate">{room.currentBooking.customer.name}</p>
          <p className="text-muted-foreground mt-0.5">
            Check-out: {new Date(room.currentBooking.checkOutDate).toLocaleDateString("en-PK", { month: "short", day: "numeric" })}
          </p>
        </div>
      )}

      {/* Quick actions */}
      {actions.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {actions.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.next}
                onClick={() => handleAction(action.next)}
                disabled={isPending}
                className={cn(
                  "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
                  action.className
                )}
              >
                {isPending
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <Icon className="w-3.5 h-3.5" />
                }
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export function HousekeepingBoard({ rooms }: Props) {
  const [filter, setFilter] = useState<RoomStatus | "">("");

  const filtered = filter
    ? rooms.filter(r => r.status === filter)
    : [...rooms].sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]);

  // Counts by status
  const counts = Object.values(RoomStatus).reduce((acc, s) => ({
    ...acc, [s]: rooms.filter(r => r.status === s).length,
  }), {} as Record<string, number>);

  return (
    <div>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter("")}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border",
            filter === ""
              ? "bg-gold-500/15 text-gold-400 border-gold-500/30"
              : "text-muted-foreground border-transparent hover:bg-accent hover:text-foreground"
          )}
        >
          <BedDouble className="w-3.5 h-3.5" />
          All Rooms
          <span className="text-xs px-1.5 py-0.5 rounded-md bg-accent text-muted-foreground">{rooms.length}</span>
        </button>

        {Object.values(RoomStatus).map(s => {
          const cfg   = ROOM_STATUS_CONFIG[s];
          const count = counts[s] ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={s}
              onClick={() => setFilter(s === filter ? "" : s)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all border",
                filter === s
                  ? cn("border-current/20 bg-surface-highlight", cfg.color)
                  : "text-muted-foreground border-transparent hover:bg-accent hover:text-foreground"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", cfg.dotClass)} />
              {cfg.label}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-md",
                filter === s ? "bg-surface-base/60" : "bg-accent text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Room grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No rooms match this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(room => <RoomTile key={room.id} room={room} />)}
        </div>
      )}
    </div>
  );
}
