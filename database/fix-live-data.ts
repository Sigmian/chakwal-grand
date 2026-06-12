// ============================================================
// database/fix-live-data.ts
// One-time script to patch live production database with correct
// phone numbers, addresses, and room prices.
//
// Run with: npx ts-node database/fix-live-data.ts
// OR:       npx tsx database/fix-live-data.ts
// ============================================================

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Patching live database with correct data...\n");

  // ─── 1. Fix company phone & address ──────────────────────
  const company = await prisma.company.updateMany({
    where: { name: "Chakwal Grand Guest House" },
    data: {
      phone:    "0334-7742767",
      whatsapp: "923347742767",
      address:  "Near District Courts, Talagang Road, Chakwal",
    },
  });
  console.log(`✅ Company: updated ${company.count} record(s)`);

  // ─── 2. Fix all branch phone numbers ─────────────────────
  const branches = await prisma.branch.updateMany({
    where: { companyId: "company-001" },
    data: { phone: "0334-7742767" },
  });
  console.log(`✅ Branches: updated phone on ${branches.count} branch(es)`);

  // Fix individual branch addresses
  await prisma.branch.update({
    where: { slug: "chakwal" },
    data: { address: "Near District Courts, Talagang Road, Chakwal", whatsapp: "923347742767" },
  });
  await prisma.branch.update({
    where: { slug: "kallar-kahar" },
    data: { address: "Lake View Road, Near Salt Mine, Kallar Kahar, Chakwal" },
  });
  await prisma.branch.update({
    where: { slug: "sargodha" },
    data: { address: "University Road, Near Peoples Colony, Sargodha" },
  });
  console.log("✅ Branch addresses standardised");

  // ─── 3. Fix room prices to match published pricing ───────
  // These match exactly what is advertised on the website.
  const chakwalBranch = await prisma.branch.findUnique({ where: { slug: "chakwal" } });
  if (!chakwalBranch) throw new Error("Chakwal branch not found");

  const roomFixes = [
    // number → correct name, type, price
    { number: "101", name: "Classic Room",          type: "STANDARD", price: 2000, maxAdults: 2, maxChildren: 0, description: "Comfortable classic room with all essentials. Hot water, WiFi, and attached bathroom." },
    { number: "102", name: "Classic Room (A/C)",    type: "STANDARD", price: 2500, maxAdults: 2, maxChildren: 0, description: "Classic room with air conditioning — ideal for summer stays." },
    { number: "201", name: "Family Room",           type: "FAMILY",   price: 2500, maxAdults: 4, maxChildren: 2, description: "Spacious family room with sitting area. Perfect for family visits to Chakwal." },
    { number: "202", name: "Family Room",           type: "FAMILY",   price: 2500, maxAdults: 4, maxChildren: 2, description: "Spacious family room with sitting area. Perfect for family visits to Chakwal." },
    { number: "301", name: "Executive Room (A/C)",  type: "DELUXE",   price: 4000, maxAdults: 2, maxChildren: 0, description: "Premium executive room with AC, work desk — ideal for business travelers." },
    { number: "401", name: "Apartment Suite (A/C)", type: "SUITE",    price: 4500, maxAdults: 4, maxChildren: 2, description: "Self-contained apartment suite with kitchenette and living area." },
  ];

  let roomsFixed = 0;
  for (const fix of roomFixes) {
    const updated = await prisma.room.updateMany({
      where: { branchId: chakwalBranch.id, number: fix.number },
      data: {
        name:          fix.name,
        type:          fix.type as never,
        pricePerNight: fix.price,
        maxAdults:     fix.maxAdults,
        maxChildren:   fix.maxChildren,
        description:   fix.description,
      },
    });
    if (updated.count > 0) {
      console.log(`  Room ${fix.number}: ${fix.name} → ₨${fix.price}/night`);
      roomsFixed += updated.count;
    }
  }
  console.log(`✅ Rooms: fixed ${roomsFixed} room(s)`);

  // ─── 4. Verify final state ────────────────────────────────
  console.log("\n📋 Verification:");
  const finalRooms = await prisma.room.findMany({
    where: { branchId: chakwalBranch.id },
    select: { number: true, name: true, type: true, pricePerNight: true },
    orderBy: { number: "asc" },
  });
  finalRooms.forEach(r => {
    console.log(`  Room ${r.number}: ${r.name} (${r.type}) — ₨${Number(r.pricePerNight).toLocaleString()}/night`);
  });

  console.log("\n✨ Live database patched successfully!\n");
}

main()
  .catch(e => { console.error("❌ Error:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
