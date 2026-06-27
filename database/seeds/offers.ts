// ============================================================
// database/seeds/offers.ts
// Seeds the standard discount offers + WELCOME15 first-time coupon.
// Safe to run multiple times (upsert by code).
//
// Run with:  npx tsx database/seeds/offers.ts
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FAR_FUTURE = new Date("2030-12-31T23:59:59Z");
const NOW        = new Date();

const OFFERS = [
  {
    id:            "offer-weekly14",
    name:          "Weekly Stay Discount",
    description:   "14% off for stays of 7 nights or more",
    code:          "WEEKLY14",
    discountType:  "PERCENTAGE",
    discountValue: 14,
    minNights:     7,
    maxUses:       null,
    firstTimeOnly: false,
    roomTypes:     [],
    startsAt:      NOW,
    expiresAt:     FAR_FUTURE,
    isActive:      true,
    branchId:      null,
  },
  {
    id:            "offer-monthly40",
    name:          "Monthly Stay Discount",
    description:   "40% off for stays of 30 nights or more",
    code:          "MONTHLY40",
    discountType:  "PERCENTAGE",
    discountValue: 40,
    minNights:     30,
    maxUses:       null,
    firstTimeOnly: false,
    roomTypes:     [],
    startsAt:      NOW,
    expiresAt:     FAR_FUTURE,
    isActive:      true,
    branchId:      null,
  },
  {
    id:            "offer-welcome15",
    name:          "First Visit Welcome Discount",
    description:   "15% off for first-time guests — single use only",
    code:          "WELCOME15",
    discountType:  "PERCENTAGE",
    discountValue: 15,
    minNights:     1,
    maxUses:       null,      // no global cap — enforced per-customer in code
    firstTimeOnly: true,      // validated by checking customer booking history
    roomTypes:     [],
    startsAt:      NOW,
    expiresAt:     FAR_FUTURE,
    isActive:      true,
    branchId:      null,
  },
];

async function main() {
  console.log("🎟  Seeding offers...\n");

  for (const o of OFFERS) {
    await prisma.offer.upsert({
      where:  { id: o.id },
      update: {
        name:          o.name,
        description:   o.description,
        discountType:  o.discountType,
        discountValue: o.discountValue,
        minNights:     o.minNights,
        maxUses:       o.maxUses,
        firstTimeOnly: o.firstTimeOnly,
        isActive:      o.isActive,
        expiresAt:     o.expiresAt,
      },
      create: {
        id:            o.id,
        name:          o.name,
        description:   o.description,
        code:          o.code,
        discountType:  o.discountType,
        discountValue: o.discountValue,
        minNights:     o.minNights,
        maxUses:       o.maxUses,
        firstTimeOnly: o.firstTimeOnly,
        roomTypes:     o.roomTypes,
        startsAt:      o.startsAt,
        expiresAt:     o.expiresAt,
        isActive:      o.isActive,
        branchId:      o.branchId,
      },
    });
    console.log(`  ✅ ${o.code} — ${o.name}`);
  }

  console.log("\n✅ Offers seeded.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
