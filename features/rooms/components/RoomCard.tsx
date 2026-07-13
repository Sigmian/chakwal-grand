// ============================================================
// features/rooms/components/RoomCard.tsx
// Room grid card — status-color coded, actions dropdown
// ============================================================

"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  BedDouble, Users, ArrowUpRight, Wrench, Sparkles,
  MoreHorizontal, Eye, Edit, Lock, Unlock,
} from "lucide-react";
import { cn, formatPKR, ROOM_STATUS_CONFIG, ROOM_TYPE_CONFIG } from "@/utils";
import { RoomStatus, RoomType } from "@/types";
import { updateRoomStatus } from "@/server/actions/rooms";
import { Badge } from "@/components/shared";

interface RoomCardProps {
  id:            string;
  number:        string;
  name:          string;
  type:          RoomType;
  status:        RoomStatus;
  floor?:        number | null;
  pricePerNight: number;
  maxAdults:     number;
  bedCount:      number;
  branchName?:   string;
  amenities?:    string[];
  coverImage?:   string | null;
  canEdit?:      boolean;
}

const STATUS_BORDER: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]:   "border-l-status-available",
  [RoomStatus.OCCUPIED]:    "border-l-status-occupied",
  [RoomStatus.MAINTENANCE]: "border-l-status-maintenance",
  [RoomStatus.BLOCKED]:     "border-l-status-blocked",
  [RoomStatus.CLEANING]:    "border-l-status-cleaning",
};

const STATUS_ACTIONS: Record<RoomStatus, { label: string; next: RoomStatus; icon: React.ElementType }[]> = {
  [RoomStatus.AVAILABLE]:   [{ label: "Mark Blocked",    next: RoomStatus.BLOCKED,  icon: Lock    }],
  [RoomStatus.OCCUPIED]:    [],
  [RoomStatus.MAINTENANCE]: [{ label: "Mark Available",  next: RoomStatus.AVAILABLE, icon: Unlock }],
  [RoomStatus.BLOCKED]:     [{ label: "Mark Available",  next: RoomStatus.AVAILABLE, icon: Unlock }],
  [RoomStatus.CLEANING]:    [{ label: "Mark Available",  next: RoomStatus.AVAILABLE, icon: Unlock },
                             { label: "Mark Maintenance",next: RoomStatus.MAINTENANCE, icon: Wrench }],
};

export function RoomCard({
  id, number, name, type, status, floor, pricePerNight,
  maxAdults, bedCount, branchName, amenities = [], coverImage, canEdit,
}: RoomCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const statusCfg  = ROOM_STATUS_CONFIG[status];
  const typeCfg    = ROOM_TYPE_CONFIG[type];

  const handleStatusChange = (newStatus: RoomStatus) => {
    startTransition(async () => {
      const res = await updateRoomStatus(id, newStatus);
      if (res.success) {
        toast.success(`Room ${number} → ${ROOM_STATUS_CONFIG[newStatus].label}`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to update status");
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "card-luxury border-l-4 group overflow-hidden hover:shadow-gold-sm hover:-translate-y-0.5 transition-all",
        STATUS_BORDER[status],
        isPending && "opacity-60 pointer-events-none"
      )}
    >
      {/* Cover image or placeholder */}
      <div className="relative h-36 bg-surface-highlight overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BedDouble className="w-10 h-10 text-border" />
          </div>
        )}

        {/* Status badge overlay */}
        <div className="absolute top-2.5 left-2.5">
          <span className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm border",
            statusCfg.color,
            "bg-surface-base/70 border-current/20"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", statusCfg.dotClass)} />
            {statusCfg.label}
          </span>
        </div>

        {/* Type badge */}
        <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg bg-surface-base/70 backdrop-blur-sm text-xs font-medium text-foreground border border-border/50">
          {typeCfg.icon} {typeCfg.label}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Room {number}{floor != null ? ` · Floor ${floor}` : ""}
            </p>
            <h3 className="font-bold text-foreground mt-0.5 truncate">{name}</h3>
            {branchName && (
              <p className="text-xs text-muted-foreground mt-0.5">{branchName}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-bold text-gold-400">{formatPKR(pricePerNight)}</p>
            <p className="text-2xs text-muted-foreground">/ night</p>
          </div>
        </div>

        {/* Specs row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {maxAdults} adults
          </span>
          <span className="flex items-center gap-1">
            <BedDouble className="w-3.5 h-3.5" />
            {bedCount} bed{bedCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Amenity pills */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {amenities.slice(0, 3).map((a) => (
              <span key={a} className="px-1.5 py-0.5 bg-accent rounded text-2xs text-muted-foreground">
                {a}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="px-1.5 py-0.5 bg-accent rounded text-2xs text-muted-foreground">
                +{amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          <Link
            href={`/dashboard/rooms/${id}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-accent hover:bg-accent/80 text-foreground transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View
          </Link>

          {canEdit && (
            <>
              <Link
                href={`/dashboard/rooms/${id}/edit`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:border-gold-500/50 hover:text-gold-400 transition-colors"
              >
                <Edit className="w-3.5 h-3.5" />
              </Link>

              {/* Status change actions */}
              {STATUS_ACTIONS[status].map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={action.next}
                    onClick={() => handleStatusChange(action.next)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:border-border hover:bg-accent transition-colors text-muted-foreground"
                    title={action.label}
                  >
                    <ActionIcon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
