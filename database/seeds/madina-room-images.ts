// ============================================================
// database/seeds/madina-room-images.ts
// Seeds placeholder images for all 5 Madina Town rooms.
// Run with: npx tsx database/seeds/madina-room-images.ts
//
// These are high-quality Unsplash placeholder images.
// Replace them with real photos via Admin → Gallery once
// Hassan photographs the actual Madina Town rooms.
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Each entry: { roomId, images: [{ url, altText, isCover }] }
const ROOM_IMAGES = [
  // ─── Room 301 — Apartment (SUITE, Ground Floor) ──────────
  {
    roomId: "room-madina-301",
    images: [
      {
        url:     "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80",
        altText: "Spacious apartment living area — Chakwal Guest House Madina Town",
        isCover: true,
        sortOrder: 1,
      },
      {
        url:     "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
        altText: "Apartment kitchen — Chakwal Guest House Madina Town",
        isCover: false,
        sortOrder: 2,
      },
      {
        url:     "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80",
        altText: "Apartment bedroom — Chakwal Guest House Madina Town",
        isCover: false,
        sortOrder: 3,
      },
      {
        url:     "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
        altText: "Private lawn and outdoor area — Chakwal Guest House Madina Town",
        isCover: false,
        sortOrder: 4,
      },
    ],
  },

  // ─── Room 302 — Standard Room (Ground Floor) ─────────────
  {
    roomId: "room-madina-302",
    images: [
      {
        url:     "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=1200&q=80",
        altText: "Standard room — Chakwal Guest House Madina Town",
        isCover: true,
        sortOrder: 1,
      },
      {
        url:     "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80",
        altText: "Standard room attached bathroom — Chakwal Guest House Madina Town",
        isCover: false,
        sortOrder: 2,
      },
    ],
  },

  // ─── Room 401 — Standard Room (First Floor) ──────────────
  {
    roomId: "room-madina-401",
    images: [
      {
        url:     "https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200&q=80",
        altText: "Standard room first floor — Chakwal Guest House Madina Town",
        isCover: true,
        sortOrder: 1,
      },
      {
        url:     "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80",
        altText: "Standard room bathroom — Chakwal Guest House Madina Town",
        isCover: false,
        sortOrder: 2,
      },
    ],
  },

  // ─── Room 402 — Standard Room (First Floor) ──────────────
  {
    roomId: "room-madina-402",
    images: [
      {
        url:     "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=1200&q=80",
        altText: "Standard room first floor — Chakwal Guest House Madina Town",
        isCover: true,
        sortOrder: 1,
      },
      {
        url:     "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80",
        altText: "Standard room bathroom — Chakwal Guest House Madina Town",
        isCover: false,
        sortOrder: 2,
      },
    ],
  },

  // ─── Room 403 — Standard Room (First Floor) ──────────────
  {
    roomId: "room-madina-403",
    images: [
      {
        url:     "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&q=80",
        altText: "Standard room first floor — Chakwal Guest House Madina Town",
        isCover: true,
        sortOrder: 1,
      },
      {
        url:     "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&q=80",
        altText: "Standard room bathroom — Chakwal Guest House Madina Town",
        isCover: false,
        sortOrder: 2,
      },
    ],
  },
];

async function main() {
  console.log("🖼️  Seeding Madina Town room images...\n");

  for (const { roomId, images } of ROOM_IMAGES) {
    // Verify room exists
    const room = await prisma.room.findUnique({
      where:  { id: roomId },
      select: { id: true, number: true, name: true },
    });

    if (!room) {
      console.warn(`  ⚠️  Room ${roomId} not found — skipping`);
      continue;
    }

    // Remove any existing placeholder images (safe to re-run)
    await prisma.roomImage.deleteMany({ where: { roomId } });

    // Insert new images
    await prisma.roomImage.createMany({
      data: images.map(img => ({
        roomId,
        url:       img.url,
        altText:   img.altText,
        isCover:   img.isCover,
        sortOrder: img.sortOrder,
      })),
    });

    console.log(`  ✅ Room ${room.number} — ${room.name} (${images.length} photo${images.length > 1 ? "s" : ""})`);
  }

  const total = ROOM_IMAGES.reduce((s, r) => s + r.images.length, 0);
  console.log(`\n🎉 Done — ${total} placeholder photos seeded across ${ROOM_IMAGES.length} rooms`);
  console.log(`\n📸 Next step: Go to Admin → Gallery → filter by Madina Town`);
  console.log(`   Upload real room photos and delete these placeholders.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
