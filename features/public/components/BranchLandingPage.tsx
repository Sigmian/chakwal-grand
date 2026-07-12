import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, MapPin, Navigation, Phone } from "lucide-react";
import { siteConfig } from "@/config/site";
import { getPublicRooms } from "@/server/actions/public";

type Branch = (typeof siteConfig.branches)[number];

export async function BranchLandingPage({
  branch,
  eyebrow,
  heading,
  introduction,
  publishLocalBusinessSchema = false,
}: {
  branch: Branch;
  eyebrow: string;
  heading: string;
  introduction: string;
  publishLocalBusinessSchema?: boolean;
}) {
  const allRooms = await getPublicRooms();
  const rooms = allRooms.filter((room) => room.branchId === branch.id);
  const schema = publishLocalBusinessSchema ? {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${siteConfig.url}${branch.pageUrl}#lodging-business`,
    name: `${siteConfig.name} — ${branch.name}`,
    url: `${siteConfig.url}${branch.pageUrl}`,
    telephone: siteConfig.phoneE164,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Near District Courts, Talagang Road",
      addressLocality: "Chakwal",
      addressRegion: "Punjab",
      addressCountry: "PK",
    },
    hasMap: branch.mapUrl,
  } : null;

  return (
    <>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />}
      <section className="pt-16 pb-14 bg-surface-elevated border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4">{eyebrow}</p>
          <h1 className="text-4xl sm:text-5xl font-bold font-serif text-foreground mb-6">{heading}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">{introduction}</p>
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.25fr_.75fr] gap-8">
          <div className="relative min-h-[340px] rounded-3xl overflow-hidden border border-gold-500/20">
            <Image
              src="/images/rooms/air-conditioned-room-chakwal-grand-guest-house.jpg"
              alt={`Room shown by ${siteConfig.name}; confirm the room and branch during booking`}
              fill
              sizes="(max-width: 1024px) 100vw, 65vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <p className="absolute bottom-4 left-4 right-4 text-xs text-white/80">
              Room image from the website gallery. Confirm the exact room and branch shown in your booking.
            </p>
          </div>

          <div className="card-luxury rounded-3xl p-7 border border-gold-500/20">
            <h2 className="text-2xl font-bold font-serif text-foreground mb-6">Branch details</h2>
            <div className="flex gap-3 mb-5">
              <MapPin className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">{branch.address}</p>
                <p className="text-sm text-muted-foreground mt-1">{branch.addressNote}</p>
              </div>
            </div>
            <div className="space-y-3">
              <a href={branch.mapUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-gold-gradient text-background font-bold rounded-xl">
                <Navigation className="w-4 h-4" /> Open in Google Maps
              </a>
              <a href={`tel:${siteConfig.phoneE164}`} className="flex items-center justify-center gap-2 w-full px-5 py-3 border border-gold-500/30 text-gold-400 font-semibold rounded-xl hover:bg-gold-500/10">
                <Phone className="w-4 h-4" /> Call {siteConfig.phone}
              </a>
              <Link href={`/book?branch=${branch.id}`} className="flex items-center justify-center gap-2 w-full px-5 py-3 border border-border text-foreground font-semibold rounded-xl hover:bg-accent">
                <CalendarCheck className="w-4 h-4" /> Check this branch
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-surface-elevated">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Current inventory</p>
            <h2 className="text-3xl font-bold font-serif text-foreground">Rooms listed for {branch.name}</h2>
            <p className="text-muted-foreground mt-3">Prices and availability can change. Open a room to verify its occupancy and listed facilities.</p>
          </div>
          {rooms.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => {
                const cover = room.images.find((image) => image.isCover) ?? room.images[0];
                return (
                  <Link key={room.id} href={`/rooms/${room.id}`} className="card-luxury rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform">
                    <div className="relative h-48 bg-surface-base">
                      {cover ? <Image src={cover.url} alt={cover.altText || `${room.name} at ${branch.name}`} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover" /> : null}
                    </div>
                    <div className="p-5">
                      <p className="text-xs text-gold-400 mb-1">{branch.name}</p>
                      <h3 className="font-bold text-foreground">{room.name}</h3>
                      <p className="text-sm text-muted-foreground mt-2">Up to {room.maxAdults} adult{room.maxAdults === 1 ? "" : "s"}{room.maxChildren ? ` and ${room.maxChildren} child${room.maxChildren === 1 ? "" : "ren"}` : ""}</p>
                      <p className="font-bold text-gold-400 mt-3">PKR {Number(room.pricePerNight).toLocaleString("en-PK")} / night</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="card-luxury rounded-2xl p-8 text-center">
              <p className="text-muted-foreground">No rooms are currently listed for this branch. Call or WhatsApp to ask about current availability.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-14">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold font-serif text-foreground mb-3">Before you travel</h2>
          <p className="text-muted-foreground mb-7">Save the branch name, current map result and phone number. Confirm check-in time, payment and cancellation terms, parking or accessibility needs directly when they matter to your stay.</p>
          <Link href="/location" className="text-gold-400 font-semibold hover:underline">Compare both Chakwal locations</Link>
        </div>
      </section>
    </>
  );
}
