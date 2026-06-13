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
import { siteConfig } from "@/config/site";

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const room = await getPublicRoom(params.id);
  if (!room) return { title: "Room Not Found" };
  const coverImage = room.images.find(i => i.isCover) ?? room.images[0];
  return {
    title:       `${room.name} | ${siteConfig.name}`,
    description: room.description ?? `Book ${room.name} at Chakwal Grand Guest House from ${formatPKR(Number(room.pricePerNight))}/night. Free WiFi, AC, 24/7 service.`,
    alternates:  { canonical: `${siteConfig.url}/rooms/${params.id}` },
    openGraph: {
      title:       `${room.name} | Chakwal Grand Guest House`,
      description: room.description ?? `Book from ${formatPKR(Number(room.pricePerNight))}/night.`,
      url:         `${siteConfig.url}/rooms/${params.id}`,
      images:      coverImage ? [{ url: coverImage.url, width: 1200, height: 630, alt: room.name }] : undefined,
    },
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

  const today    = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const bookUrl  = `/book?branchId=${room.branchId}&roomId=${room.id}&checkIn=${today}&checkOut=${tomorrow}`;

  const roomSchema = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    "name": room.name,
    "description": room.description ?? `${room.name} at Chakwal Grand Guest House`,
    "url": `${siteConfig.url}/rooms/${room.id}`,
    "occupancy": { "@type": "QuantitativeValue", "maxValue": room.maxAdults },
    "amenityFeature": room.amenities.map((a: string) => ({
      "@type": "LocationFeatureSpecification",
      "name": a,
      "value": true,
    })),
    "offers": {
      "@type": "Offer",
      "price": Number(room.pricePerNight),
      "priceCurrency": "PKR",
      "availability": "https://schema.org/InStock",
      "url": `${siteConfig.url}/book?branchId=${room.branchId}&roomId=${room.id}`,
    },
  };

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(roomSchema) }} />
    {/* Mobile sticky bottom bar */}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-elevated/95 backdrop-blur-sm border-t border-border px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{room.name}</p>
        <p className="text-sm font-bold text-gold-400">{formatPKR(Number(room.pricePerNight))} <span className="text-xs font-normal text-muted-foreground">/night</span></p>
      </div>
      <Link
        href={bookUrl}
        className="px-6 py-2.5 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all flex-shrink-0"
      >
        Book Now
      </Link>
    </div>
    <div className="pt-28 pb-28 lg:pb-20 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Back link */}
        <Link href="/rooms" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ChevronLeft className="w-4 h-4" /> All Rooms
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: photos + details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery */}
            {room.images.length > 0 ? (
              <div className="rounded-2xl overflow-hidden">
                <RoomGallery images={room.images} roomName={room.name} />
              </div>
            ) : (
              <div className="rounded-2xl overflow-hidden h-64 bg-surface-elevated border border-border flex flex-col items-center justify-center gap-3">
                <BedDouble className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Room photos coming soon</p>
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
              href={bookUrl}
              className="block text-center py-3.5 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-lg transition-all"
            >
              Book This Room
            </Link>
            <Link
              href={`/book?branchId=${room.branchId}`}
              className="block text-center py-3 border border-border text-sm text-muted-foreground rounded-xl hover:bg-accent hover:border-gold-500/20 transition-all"
            >
              Browse other rooms →
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
