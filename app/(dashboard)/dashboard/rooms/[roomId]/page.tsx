import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BedDouble, MapPin, Users, Wifi, Snowflake, Tv, Bath,
  ChevronLeft, Edit, Calendar, CheckCircle2, Clock,
} from "lucide-react";
import { getRoom } from "@/server/actions/rooms";
import { hasPermission } from "@/lib/auth/permissions";
import { getSession } from "@/lib/auth/session";
import { formatPKR } from "@/utils";
import { RoomCalendar } from "@/features/rooms/components/RoomCalendar";
import { MaintenancePanel } from "@/features/rooms/components/MaintenancePanel";
import { RoomImageManager } from "@/features/rooms/components/RoomImageManager";

const STATUS_STYLE: Record<string, string> = {
  AVAILABLE:   "bg-green-500/15 text-green-400 border-green-500/30",
  OCCUPIED:    "bg-blue-500/15 text-blue-400 border-blue-500/30",
  MAINTENANCE: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  CLEANING:    "bg-purple-500/15 text-purple-400 border-purple-500/30",
  BLOCKED:     "bg-red-500/15 text-red-400 border-red-500/30",
};

export default async function RoomDetailPage({ params }: { params: { roomId: string } }) {
  const [room, user] = await Promise.all([
    getRoom(params.roomId),
    getSession(),
  ]);

  if (!room || !user) notFound();

  const canEdit = hasPermission(user.role, "rooms:update");

  return (
    <div className="space-y-6">
      {/* Breadcrumb & actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/rooms"
            className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold font-serif text-foreground">{room.name}</h1>
            <p className="text-sm text-muted-foreground">Room {room.number} · {room.branch.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${STATUS_STYLE[room.status] ?? ""}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {room.status}
          </div>
          {canEdit && (
            <Link href={`/dashboard/rooms/${room.id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all">
              <Edit className="w-4 h-4" /> Edit Room
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — room info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Overview card */}
          <div className="card-luxury rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-4">Room Overview</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: BedDouble, label: "Type",       value: room.type },
                { icon: Users,     label: "Capacity",   value: `${room.maxAdults} adults${room.maxChildren ? ` + ${room.maxChildren} children` : ""}` },
                { icon: MapPin,    label: "Branch",     value: `${room.branch.name}` },
                { icon: Calendar,  label: "Rate",       value: formatPKR(Number(room.pricePerNight)) + "/night" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-accent/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            {room.description && (
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{room.description}</p>
            )}

            {/* Amenities */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {room.amenities.map(a => (
                  <span key={a} className="text-xs px-2.5 py-1 bg-surface-elevated border border-border rounded-lg text-muted-foreground">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming bookings */}
          <div className="card-luxury rounded-2xl p-6">
            <h2 className="font-bold text-foreground mb-4">Upcoming Bookings</h2>
            {room.bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-sm">No upcoming bookings — room is free to book</p>
              </div>
            ) : (
              <div className="space-y-3">
                {room.bookings.map(b => (
                  <div key={b.id} className="flex items-center gap-4 p-3 bg-accent/50 rounded-xl">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">{b.customer?.name}</p>
                      <p className="text-xs text-muted-foreground">{b.customer?.phone}</p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{new Date(b.checkInDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</p>
                      <p>→ {new Date(b.checkOutDate).toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance */}
          {canEdit && (
            <MaintenancePanel
              roomId={room.id}
              maintenanceLogs={room.maintenanceLogs as never}
              currentStatus={room.status as never}
            />
          )}
        </div>

        {/* Right — calendar */}
        <div className="space-y-5">
          <div className="card-luxury rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gold-400" /> Availability Calendar
            </h2>
            <RoomCalendar roomId={room.id} bookings={room.bookings as never} />
          </div>

          {/* Quick stats */}
          <div className="card-luxury rounded-2xl p-5">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold-400" /> Room Details
            </h2>
            <div className="space-y-3 text-sm">
              {[
                ["Floor",         room.floor?.toString() ?? "—"],
                ["Bed Type",      room.bedType ?? "—"],
                ["Bed Count",     room.bedCount?.toString() ?? "—"],
                ["Size",          room.size ? `${room.size} sq ft` : "—"],
                ["Weekend Rate",  room.weekendPrice ? formatPKR(Number(room.weekendPrice)) : "Same as base"],
                ["Last Cleaned",  room.lastCleaned ? new Date(room.lastCleaned).toLocaleDateString("en-PK") : "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-foreground text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Room Images */}
      {hasPermission(user.role, "rooms:upload_images") && (
        <div className="card-luxury rounded-2xl p-5">
          <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            Room Photos
            <span className="ml-auto text-xs text-muted-foreground font-normal">{room.images.length} photo{room.images.length !== 1 ? "s" : ""}</span>
          </h2>
          <RoomImageManager roomId={room.id} images={room.images} />
        </div>
      )}
    </div>
  );
}
