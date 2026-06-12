import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Users, BedDouble, MapPin, Snowflake, Wifi, Tv, Coffee,
  ChevronLeft, CheckCircle2,
} from "lucide-react";
import { getPublicRoom, getRoomBookedDates } from "@/server/actions/public";
import { RoomGallery }           from "@/features/public/components/RoomGallery";
import { AvailabilityCalendar }  from "@/features/public/components/AvailabilityCalendar";
import { formatPKR }             from "@/utils";
import type { Metadata } from "next";

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const room = await getPublicRoom(params.id);
  if (!room) return { title: "Room Not Found" };
  return {
    title:       `${room.name} — Chakwal Grand`,
    description: room.description ?? `Book ${room.name} at Chakwal Grand Guest House from ${formatPKR(Number(room.pricePerNight))}/night.`,
  };
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi":      <Wifi className="w-4 h-4" />,
  "AC":        <Snowflake className="w-4 h-4" />,
  "TV":        <Tv className="w-4 h-4" />,
  "Smart TV":  <Tv className="w-4 h-4" />,
  "Hot Water": <Coffee className="w-4 h-4" />,
};

const TYPE_LABEL: Record<string, string> = {
  STANDARD: "Classic", DELUXE: "Executive", SUITE: "Suite", FAMILY: "Family", VIP: "VIP",
};

export default async function RoomDetailPage({ params }: Props) {
  const [room, bookedDates] = await Promise.all([
    getPublicRoom(params.id),
    getRoomBookedDates(params.id),
  ]);

  if (!room) notFound();

  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Back link */}
        <Link href="/rooms" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> All Rooms
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: photos + details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            {room.images.length > 0 && (
              <div className="rounded-2xl overflow-hidden">
                <RoomGallery images={room.images} roomName={room.name} />
              </div>
            )}

            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold font-serif text-foreground">{room.name}</h1>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-gold-400" />
                    Room {room.number} · {room.branch.name}, {room.branch.city}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-3xl font-bold text-gold-400 font-serif">{formatPKR(Number(room.pricePerNight))}</p>
                  <p className="text-sm text-muted-foreground">per night</p>
                </div>
              </div>

              {room.description && (
                <p className="text-muted-foreground mt-4 leading-relaxed">{room.description}</p>
              )}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: <Users className="w-5 h-5 text-gold-400" />, label: "Adults",    value: String(room.maxAdults) },
                { icon: <Users className="w-5 h-5 text-gold-400" />, label: "Children",  value: String(room.maxChildren) },
                { icon: <BedDouble className="w-5 h-5 text-gold-400" />, label: "Beds",  value: `${room.bedCount} ${room.bedType ?? "bed"}` },
                { icon: <CheckCircle2 className="w-5 h-5 text-gold-400" />, label: "Type", value: TYPE_LABEL[room.type] ?? room.type },
              ].map(({ icon, label, value }) => (
                <div key={label} className="card-luxury rounded-xl p-4 text-center">
                  <div className="flex justify-center mb-1">{icon}</div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-lg font-bold font-serif text-foreground mb-3">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {room.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 p-3 bg-accent rounded-xl border border-border">
                    <span className="text-gold-400">{AMENITY_ICONS[a] ?? <BedDouble className="w-4 h-4" />}</span>
                    <span className="text-sm text-foreground">{a}</span>
                  </div>
                ))}
                {room.hasBalcony    && <div className="flex items-center gap-2 p-3 bg-accent rounded-xl border border-border"><span>🌅</span><span className="text-sm text-foreground">Balcony</span></div>}
                {room.hasKitchenette && <div className="flex items-center gap-2 p-3 bg-accent rounded-xl border border-border"><span>🍳</span><span className="text-sm text-foreground">Kitchenette</span></div>}
                {room.hasJacuzzi   && <div className="flex items-center gap-2 p-3 bg-accent rounded-xl border border-border"><span>🛁</span><span className="text-sm text-foreground">Jacuzzi</span></div>}
              </div>
            </div>
          </div>

          {/* Right: calendar + book */}
          <div className="space-y-5">
            <AvailabilityCalendar
              roomId={room.id}
              branchId={room.branchId}
              bookedDates={bookedDates}
            />

            <Link
              href={`/book?branchId=${room.branchId}`}
              className="block text-center py-3 border border-border text-sm text-muted-foreground rounded-xl hover:bg-accent hover:border-gold-500/20 transition-all"
            >
              Book without selecting dates →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
