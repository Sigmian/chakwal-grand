// ============================================================
// database/seeds/madina-branch.ts
// Targeted seed — adds Madina Town branch, 5 rooms, and
// Grand Opening 50% offer. Safe to run on production.
// Run with: npx tsx database/seeds/madina-branch.ts
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Madina Town branch...\n");

  // ─── 1. Madina Town Branch ────────────────────────────────
  const branch = await prisma.branch.upsert({
    where:  { slug: "madina-town" },
    update: {
      name:    "Chakwal Guest House – Madina Town Branch",
      address: "Madina Town, Chakwal",
      phone:   "0334-7742767",
    },
    create: {
      id:          "branch-madina",
      companyId:   "company-001",
      name:        "Chakwal Guest House – Madina Town Branch",
      slug:        "madina-town",
      city:        "Chakwal",
      address:     "Madina Town, Chakwal",
      phone:       "0334-7742767",
      email:       "madinatown@chakwalgrand.pk",
      whatsapp:    "923347742767",
      facilities:  ["WiFi", "Generator", "Parking", "AC", "Hot Water", "Room Service", "Lawn", "Garage"],
      description: "Our brand new Madina Town branch — spacious rooms, apartment with lawn and garage, ideal for families and extended stays.",
      isActive:    true,
    },
  });
  console.log(`✅ Branch: ${branch.name}`);

  // ─── 2. Rooms ─────────────────────────────────────────────
  const roomDefs = [
    // Ground Floor
    {
      id:           "room-madina-301",
      number:       "301",
      name:         "Apartment",
      type:         "SUITE" as const,
      floor:        0,
      pricePerNight: 4500,
      maxAdults:    4,
      maxChildren:  2,
      bedCount:     2,
      bedType:      "Double + Single",
      hasKitchenette: true,
      amenities:    ["Drawing Area", "Kitchen", "Attached Bathroom", "Hall", "Lawn", "Garage", "WiFi", "AC", "Hot Water", "TV"],
      description:  "Spacious ground floor apartment with drawing area, fully equipped kitchen, attached bathroom, hall, private lawn and garage. Ideal for families.",
    },
    {
      id:           "room-madina-302",
      number:       "302",
      name:         "Standard Room",
      type:         "STANDARD" as const,
      floor:        0,
      pricePerNight: 3500,
      maxAdults:    2,
      maxChildren:  1,
      bedCount:     1,
      bedType:      "Double",
      amenities:    ["Attached Bathroom", "Daily Amenities", "WiFi", "AC", "Hot Water", "TV"],
      description:  "Comfortable ground floor standard room with attached bathroom and all daily amenities.",
    },
    // First Floor
    {
      id:           "room-madina-401",
      number:       "401",
      name:         "Standard Room",
      type:         "STANDARD" as const,
      floor:        1,
      pricePerNight: 3500,
      maxAdults:    2,
      maxChildren:  1,
      bedCount:     1,
      bedType:      "Double",
      amenities:    ["Attached Bathroom", "Daily Amenities", "WiFi", "AC", "Hot Water", "TV"],
      description:  "First floor standard room with attached bathroom and all daily amenities.",
    },
    {
      id:           "room-madina-402",
      number:       "402",
      name:         "Standard Room",
      type:         "STANDARD" as const,
      floor:        1,
      pricePerNight: 3500,
      maxAdults:    2,
      maxChildren:  1,
      bedCount:     1,
      bedType:      "Double",
      amenities:    ["Attached Bathroom", "Daily Amenities", "WiFi", "AC", "Hot Water", "TV"],
      description:  "First floor standard room with attached bathroom and all daily amenities.",
    },
    {
      id:           "room-madina-403",
      number:       "403",
      name:         "Standard Room",
      type:         "STANDARD" as const,
      floor:        1,
      pricePerNight: 3500,
      maxAdults:    2,
      maxChildren:  1,
      bedCount:     1,
      bedType:      "Double",
      amenities:    ["Attached Bathroom", "Daily Amenities", "WiFi", "AC", "Hot Water", "TV"],
      description:  "First floor standard room with attached bathroom and all daily amenities.",
    },
  ];

  for (const def of roomDefs) {
    const { id, ...rest } = def;
    await prisma.room.upsert({
      where:  { id },
      update: { ...rest },
      create: { id, branchId: branch.id, status: "AVAILABLE", isActive: true, ...rest },
    });
    console.log(`  ✅ Room ${def.number} — ${def.name} (PKR ${def.pricePerNight.toLocaleString()}/night)`);
  }

  // ─── 3. Grand Opening Offer — 50% OFF (auto-applied) ──────
  const expiresAt = new Date("2026-07-31T23:59:59+05:00");

  await prisma.offer.upsert({
    where:  { code: "AUTO_GRANDOPEN50" },
    update: { isActive: true, expiresAt },
    create: {
      id:            "offer-grand-opening",
      branchId:      branch.id,
      name:          "🔥 Grand Opening — 50% OFF",
      description:   "Celebrate our Madina Town branch opening with 50% off all rooms. Limited time offer.",
      code:          "AUTO_GRANDOPEN50",
      discountType:  "PERCENTAGE",
      discountValue: 50,
      minNights:     1,
      maxUses:       9999,
      usedCount:     0,
      firstTimeOnly: false,
      startsAt:      new Date(),
      expiresAt,
      isActive:      true,
    },
  });
  console.log(`\n✅ Grand Opening offer created — 50% OFF until 31 July 2026`);

  console.log("\n🎉 Madina Town seed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
