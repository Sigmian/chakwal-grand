import type { Metadata } from "next";
import Link from "next/link";
import { BedDouble, Users, Wifi, Snowflake, Tv, Coffee, CheckCircle2 } from "lucide-react";
import { getPublicRooms, getPublicBranches } from "@/server/actions/public";
import { formatPKR } from "@/utils";

export const metadata: Metadata = {
  title: "Our Rooms",
  description: "Browse all available room types at Chakwal Grand Guest House. From classic rooms at ₨2,000 to luxury apartments at ₨4,500/night.",
};

export const revalidate = 60;

const TYPE_ORDER = ["STANDARD", "FAMILY", "DELUXE", "SUITE", "VIP"];
const TYPE_LABEL: Record<string, string> = {
  STANDARD: "Classic", DELUXE: "Executive", SUITE: "Apartment / Suite",
  FAMILY: "Family", VIP: "VIP Suite",
};
const TYPE_ICON: Record<string, string> = {
  STANDARD: "🛏️", DELUXE: "⭐", SUITE: "🏠", FAMILY: "👨‍👩‍👧", VIP: "👑",
};
const TYPE_COLOR: Record<string, string> = {
  STANDARD: "from-slate-500/20 to-slate-600/10 border-slate-500/20",
  FAMILY:   "from-blue-500/20 to-blue-600/10 border-blue-500/20",
  DELUXE:   "from-purple-500/20 to-purple-600/10 border-purple-500/20",
  SUITE:    "from-gold-500/20 to-amber-600/10 border-gold-500/20",
  VIP:      "from-red-500/20 to-red-600/10 border-red-500/20",
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  "WiFi":             <Wifi className="w-3.5 h-3.5" />,
  "AC":               <Snowflake className="w-3.5 h-3.5" />,
  "TV":               <Tv className="w-3.5 h-3.5" />,
  "Smart TV":         <Tv className="w-3.5 h-3.5" />,
  "Hot Water":        <Coffee className="w-3.5 h-3.5" />,
};

export default async function RoomsPage() {
  const [rooms, branches] = await Promise.all([getPublicRooms(), getPublicBranches()]);

  const grouped = TYPE_ORDER.reduce((acc, type) => {
    const list = rooms.filter(r => r.type === type);
    if (list.length > 0) acc[type] = list;
    return acc;
  }, {} as Record<string, typeof rooms>);

  return (
    <div className="pt-28 pb-20">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Our Accommodations</p>
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mb-4">
          Find Your Perfect Room
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          From cozy classic rooms to spacious family suites — all with complimentary WiFi, hot water, and 24/7 service.
        </p>
      </div>

      {/* Rooms by category */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {Object.entries(grouped).map(([type, typeRooms]) => (
          <section key={type}>
            <div className="flex items-center gap-4 mb-7">
              <div className="text-3xl">{TYPE_ICON[type]}</div>
              <div>
                <h2 className="text-2xl font-bold font-serif text-foreground">{TYPE_LABEL[type]} Rooms</h2>
                <p className="text-sm text-muted-foreground">
                  {typeRooms.length} room{typeRooms.length > 1 ? "s" : ""} available ·
                  from {formatPKR(Math.min(...typeRooms.map(r => Number(r.pricePerNight))))} / night
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {typeRooms.map(room => (
                <div key={room.id} className={`card-luxury rounded-2xl overflow-hidden border bg-gradient-to-br ${TYPE_COLOR[room.type] ?? ""} transition-all hover:-translate-y-1 hover:shadow-card-lg`}>
                  {/* Room header */}
                  <div className="p-6 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-foreground">{room.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Room {room.number} · {room.branch.name}, {room.branch.city}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-gold-400 font-serif">{formatPKR(Number(room.pricePerNight))}</p>
                        <p className="text-xs text-muted-foreground">/ night</p>
                      </div>
                    </div>

                    {room.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{room.description}</p>
                    )}

                    {/* Capacity */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                      <Users className="w-3.5 h-3.5 text-gold-400" />
                      <span>
                        {room.maxAdults} adult{room.maxAdults > 1 ? "s" : ""}
                        {room.maxChildren > 0 ? ` + ${room.maxChildren} child${room.maxChildren > 1 ? "ren" : ""}` : ""}
                      </span>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-1.5">
                      {room.amenities.map(a => (
                        <span key={a} className="flex items-center gap-1 text-[11px] px-2 py-1 bg-background/50 border border-border/60 rounded-lg text-muted-foreground">
                          {AMENITY_ICONS[a] ?? <BedDouble className="w-3 h-3" />}
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Book button */}
                  <div className="px-6 pb-6 pt-2">
                    <Link
                      href={`/book?branchId=${room.branchId}`}
                      className="block w-full py-2.5 text-center bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all hover:-translate-y-0.5"
                    >
                      Book This Room →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="card-luxury rounded-3xl p-8 sm:p-12 text-center border border-gold-500/20 bg-gradient-to-br from-gold-500/5 to-transparent">
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-foreground mb-4">
            Ready to Book Your Stay?
          </h2>
          <p className="text-muted-foreground mb-8">
            Check availability for your dates and confirm your room in minutes. No payment required online — pay on arrival.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/book"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-md transition-all">
              Check Availability
            </Link>
            <a href="tel:+923347742767"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-border text-foreground font-semibold rounded-xl hover:bg-accent transition-colors">
              Call 0334-7742767
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
