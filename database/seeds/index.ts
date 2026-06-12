// ============================================================
// database/seeds/index.ts
// Database seed — creates demo data for development.
// Run with: npm run db:seed
// ============================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Chakwal Grand database...\n");

  // ─── 1. Company ───────────────────────────────────────────
  const company = await prisma.company.upsert({
    where:  { id: "company-001" },
    update: {
      phone:    "0334-7742767",
      whatsapp: "923347742767",
      address:  "Near District Courts, Talagang Road, Chakwal",
    },
    create: {
      id:       "company-001",
      name:     "Chakwal Grand Guest House",
      tagline:  "Experience Comfort & Peace in the Heart of Punjab",
      email:    "info@chakwalgrand.pk",
      phone:    "0334-7742767",
      whatsapp: "923347742767",
      address:  "Near District Courts, Talagang Road, Chakwal",
      city:     "Chakwal",
      country:  "Pakistan",
      currency: "PKR",
      timezone: "Asia/Karachi",
    },
  });
  console.log(`✅ Company: ${company.name}`);

  // ─── 2. Branches ─────────────────────────────────────────
  const branches = await Promise.all([
    prisma.branch.upsert({
      where:  { slug: "chakwal" },
      update: {
        address:  "Near District Courts, Talagang Road, Chakwal",
        phone:    "0334-7742767",
        whatsapp: "923347742767",
      },
      create: {
        id:          "branch-chakwal",
        companyId:   company.id,
        name:        "Chakwal",
        slug:        "chakwal",
        city:        "Chakwal",
        address:     "Near District Courts, Talagang Road, Chakwal",
        phone:       "0334-7742767",
        email:       "chakwal@chakwalgrand.pk",
        whatsapp:    "923347742767",
        latitude:    32.9318,
        longitude:   72.8560,
        facilities:  ["WiFi", "Generator", "Parking", "CCTV", "AC", "Hot Water", "Room Service"],
        description: "Our flagship branch in the heart of Chakwal city.",
        isActive:    true,
      },
    }),
    prisma.branch.upsert({
      where:  { slug: "kallar-kahar" },
      update: {
        phone:    "0334-7742767",
        address:  "Lake View Road, Near Salt Mine, Kallar Kahar, Chakwal",
      },
      create: {
        id:          "branch-kk",
        companyId:   company.id,
        name:        "Kallar Kahar",
        slug:        "kallar-kahar",
        city:        "Kallar Kahar",
        address:     "Lake View Road, Near Salt Mine, Kallar Kahar, Chakwal",
        phone:       "0334-7742767",
        facilities:  ["WiFi", "Generator", "Parking", "Lake View", "AC", "Hot Water"],
        description: "Stunning lake view rooms at Kallar Kahar.",
        isActive:    true,
      },
    }),
    prisma.branch.upsert({
      where:  { slug: "sargodha" },
      update: {
        phone:   "0334-7742767",
        address: "University Road, Near Peoples Colony, Sargodha",
      },
      create: {
        id:          "branch-sgd",
        companyId:   company.id,
        name:        "Sargodha",
        slug:        "sargodha",
        city:        "Sargodha",
        address:     "University Road, Near Peoples Colony, Sargodha",
        phone:       "0334-7742767",
        facilities:  ["WiFi", "Generator", "Parking", "AC", "Hot Water", "Conference Room"],
        description: "Business-focused branch in Sargodha.",
        isActive:    true,
      },
    }),
  ]);
  console.log(`✅ Branches: ${branches.map((b) => b.name).join(", ")}`);

  // ─── 3. Users ────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin@1234", 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where:  { email: "owner@chakwalgrand.pk" },
      update: {},
      create: {
        companyId:    company.id,
        email:        "owner@chakwalgrand.pk",
        name:         "Hassan Ali",
        passwordHash,
        role:         "SUPER_ADMIN",
        isActive:     true,
      },
    }),
    prisma.user.upsert({
      where:  { email: "manager@chakwalgrand.pk" },
      update: {},
      create: {
        companyId:    company.id,
        email:        "manager@chakwalgrand.pk",
        name:         "M. Bilal",
        passwordHash,
        role:         "BRANCH_MANAGER",
        isActive:     true,
      },
    }),
    prisma.user.upsert({
      where:  { email: "reception@chakwalgrand.pk" },
      update: {},
      create: {
        companyId:    company.id,
        email:        "reception@chakwalgrand.pk",
        name:         "Aisha Noor",
        passwordHash,
        role:         "RECEPTIONIST",
        isActive:     true,
      },
    }),
    prisma.user.upsert({
      where:  { email: "cleaning@chakwalgrand.pk" },
      update: {},
      create: {
        companyId:    company.id,
        email:        "cleaning@chakwalgrand.pk",
        name:         "Khalid Mehmood",
        passwordHash,
        role:         "HOUSEKEEPING",
        isActive:     true,
      },
    }),
  ]);
  console.log(`✅ Users: ${users.map((u) => u.name).join(", ")}`);

  // Link manager + receptionist + cleaning to Chakwal branch
  const [, manager, receptionist, cleaning] = users;
  await Promise.all([
    prisma.staffMember.upsert({
      where:  { userId: manager.id },
      update: {},
      create: { userId: manager.id, branchId: branches[0].id, designation: "Branch Manager", shiftStart: "09:00", shiftEnd: "18:00" },
    }),
    prisma.staffMember.upsert({
      where:  { userId: receptionist.id },
      update: {},
      create: { userId: receptionist.id, branchId: branches[0].id, designation: "Receptionist", shiftStart: "08:00", shiftEnd: "17:00" },
    }),
    prisma.staffMember.upsert({
      where:  { userId: cleaning.id },
      update: {},
      create: { userId: cleaning.id, branchId: branches[0].id, designation: "Housekeeping", shiftStart: "07:00", shiftEnd: "15:00" },
    }),
  ]);

  // ─── 4. Rooms ─────────────────────────────────────────────
  // Actual layout of Chakwal Grand Guest House:
  //   Ground (floor 0): G01 — Apartment (AC optional, staff applies extra charge)
  //   Floor 1 (floor 1): 101 — Executive Non-AC (left) | 102 — Executive AC (left) | 103 — Executive AC (right)
  //   Floor 2 (floor 2): 201 — Family Room (left)     | 202 — Family (right)        | 203 — Classic (right)
  //
  // STANDARD=Classic | FAMILY=Family | DELUXE=Executive | SUITE=Apartment

  // Delete stale rooms from old seed that no longer exist
  await prisma.room.deleteMany({
    where: {
      branchId: branches[0].id,
      number:   { in: ["301", "401"] },
    },
  });

  const roomDefs = [
    // ── Ground floor ──────────────────────────────────────────────────────
    {
      number: "G01", name: "Apartment",
      floor: 0, type: "SUITE", price: 3200,
      maxAdults: 4, maxChildren: 2, beds: 2, bedType: "Double + Single",
      hasKitchenette: true,
      description:
        "Spacious self-contained apartment on the ground floor with a private living area, kitchenette, and attached bathroom. " +
        "Rs. 3,200/night without AC · Rs. 4,500/night with AC — just tick 'AC Preference' when booking and our team will arrange it.",
      amenities: ["WiFi", "Smart TV", "Hot Water", "Kitchenette", "Living Area", "Attached Bathroom"],
    },

    // ── First floor ───────────────────────────────────────────────────────
    {
      number: "101", name: "Executive Room (Non-AC)",
      floor: 1, type: "DELUXE", price: 3000,
      maxAdults: 2, maxChildren: 0, beds: 1, bedType: "Double",
      description:
        "Comfortable executive room on the first floor (left wing). Tastefully furnished with a double bed, " +
        "work desk, and attached bathroom. No air conditioning — ideal for cooler seasons.",
      amenities: ["WiFi", "TV", "Hot Water", "Work Desk", "Attached Bathroom"],
    },
    {
      number: "102", name: "Executive Room (AC)",
      floor: 1, type: "DELUXE", price: 4000,
      maxAdults: 2, maxChildren: 0, beds: 1, bedType: "Double",
      description:
        "Premium executive room on the first floor (left wing) with full air conditioning. " +
        "Double bed, work desk, sofa chair, and attached bathroom. Perfect for summer stays.",
      amenities: ["AC", "WiFi", "TV", "Hot Water", "Work Desk", "Sofa", "Attached Bathroom"],
    },
    {
      number: "103", name: "Executive Room",
      floor: 1, type: "DELUXE", price: 3000,
      maxAdults: 2, maxChildren: 0, beds: 1, bedType: "Double",
      description:
        "Well-appointed executive room on the first floor (right wing). Features a double bed, " +
        "TV, and attached bathroom with hot water. A great-value option for business or leisure.",
      amenities: ["WiFi", "TV", "Hot Water", "Attached Bathroom"],
    },

    // ── Second floor ──────────────────────────────────────────────────────
    {
      number: "201", name: "Family Room",
      floor: 2, type: "FAMILY", price: 2500,
      maxAdults: 4, maxChildren: 2, beds: 2, bedType: "Double + Single",
      description:
        "Spacious family room on the second floor (left wing) with extra bedding, sitting area, " +
        "and plenty of space for the whole family. Ideal for family trips to Chakwal.",
      amenities: ["AC", "WiFi", "TV", "Hot Water", "Sitting Area", "Extra Bedding", "Attached Bathroom"],
    },
    {
      number: "202", name: "Family Room",
      floor: 2, type: "FAMILY", price: 2500,
      maxAdults: 4, maxChildren: 1, beds: 2, bedType: "Double + Single",
      description:
        "Comfortable family room on the second floor (right wing). Two beds, TV, and attached " +
        "bathroom — a practical choice for small families visiting Chakwal.",
      amenities: ["AC", "WiFi", "TV", "Hot Water", "Attached Bathroom"],
    },
    {
      number: "203", name: "Classic Room",
      floor: 2, type: "STANDARD", price: 1999,
      maxAdults: 2, maxChildren: 0, beds: 1, bedType: "Single",
      description:
        "Clean and cosy classic room on the second floor (right wing). Single bed, TV, and " +
        "attached bathroom with hot water. Our most affordable option for solo travellers.",
      amenities: ["WiFi", "TV", "Hot Water", "Attached Bathroom"],
    },
  ];

  for (const r of roomDefs) {
    await prisma.room.upsert({
      where:  { branchId_number: { branchId: branches[0].id, number: r.number } },
      update: {
        name:           r.name,
        type:           r.type as never,
        floor:          r.floor,
        pricePerNight:  r.price,
        maxAdults:      r.maxAdults,
        maxChildren:    r.maxChildren,
        bedCount:       r.beds,
        bedType:        r.bedType,
        amenities:      r.amenities,
        description:    r.description,
        hasKitchenette: r.hasKitchenette ?? false,
      },
      create: {
        branchId:       branches[0].id,
        number:         r.number,
        name:           r.name,
        type:           r.type as never,
        floor:          r.floor,
        pricePerNight:  r.price,
        maxAdults:      r.maxAdults,
        maxChildren:    r.maxChildren,
        bedCount:       r.beds,
        bedType:        r.bedType,
        amenities:      r.amenities,
        description:    r.description,
        hasKitchenette: r.hasKitchenette ?? false,
        status:         "AVAILABLE",
        isActive:       true,
      },
    });
  }
  console.log(`✅ Rooms: ${roomDefs.length} rooms seeded for Chakwal branch (Ground + Floor 1 + Floor 2)`);

  // ─── 5. Product Categories & Products ────────────────────
  const categories = await Promise.all([
    prisma.productCategory.upsert({ where: { id: "cat-drinks"    }, update: {}, create: { id: "cat-drinks",    name: "Drinks",    icon: "🥤", sortOrder: 1 } }),
    prisma.productCategory.upsert({ where: { id: "cat-snacks"    }, update: {}, create: { id: "cat-snacks",    name: "Snacks",    icon: "🍪", sortOrder: 2 } }),
    prisma.productCategory.upsert({ where: { id: "cat-toiletries"}, update: {}, create: { id: "cat-toiletries",name: "Toiletries",icon: "🧴", sortOrder: 3 } }),
  ]);

  const products = await Promise.all([
    prisma.product.upsert({ where: { sku: "WAT-1L" }, update: {}, create: { categoryId: categories[0].id, name: "Mineral Water 1L", brand: "Nestle",  sku: "WAT-1L",   unit: "bottle" } }),
    prisma.product.upsert({ where: { sku: "PEP-500" }, update: {}, create: { categoryId: categories[0].id, name: "Pepsi 500ml",     brand: "Pepsi",   sku: "PEP-500",  unit: "bottle" } }),
    prisma.product.upsert({ where: { sku: "7UP-500" }, update: {}, create: { categoryId: categories[0].id, name: "7-Up 500ml",      brand: "PepsiCo", sku: "7UP-500",  unit: "bottle" } }),
    prisma.product.upsert({ where: { sku: "OREO-PK" }, update: {}, create: { categoryId: categories[1].id, name: "Oreo Cookies",    brand: "Oreo",    sku: "OREO-PK",  unit: "pack"   } }),
    prisma.product.upsert({ where: { sku: "CHIP-LAY"}, update: {}, create: { categoryId: categories[1].id, name: "Lays Chips",      brand: "Lays",    sku: "CHIP-LAY", unit: "pack"   } }),
    prisma.product.upsert({ where: { sku: "TOOTH-KT"}, update: {}, create: { categoryId: categories[2].id, name: "Toothbrush Kit",  brand: "Generic", sku: "TOOTH-KT", unit: "piece"  } }),
    prisma.product.upsert({ where: { sku: "SHMP-SAC"}, update: {}, create: { categoryId: categories[2].id, name: "Shampoo Sachet",  brand: "Pantene", sku: "SHMP-SAC", unit: "sachet" } }),
  ]);

  // Add inventory for Chakwal branch
  const inventoryDefs = [
    { productIdx: 0, purchase:  50, selling: 100, stock: 200 },
    { productIdx: 1, purchase:  70, selling: 150, stock:   8 },  // Low stock!
    { productIdx: 2, purchase:  65, selling: 140, stock:  95 },
    { productIdx: 3, purchase:  80, selling: 180, stock:  60 },
    { productIdx: 4, purchase:  60, selling: 150, stock:  45 },
    { productIdx: 5, purchase:  80, selling: 200, stock:  55 },
    { productIdx: 6, purchase:  30, selling:  80, stock: 120 },
  ];

  for (const inv of inventoryDefs) {
    await prisma.inventoryItem.upsert({
      where: {
        productId_branchId: { productId: products[inv.productIdx].id, branchId: branches[0].id },
      },
      update: {},
      create: {
        productId:     products[inv.productIdx].id,
        branchId:      branches[0].id,
        purchasePrice: inv.purchase,
        sellingPrice:  inv.selling,
        currentStock:  inv.stock,
        minStockLevel: 20,
        lastRestockedAt: new Date(),
      },
    });
  }
  console.log(`✅ Inventory: ${inventoryDefs.length} items seeded`);

  // ─── 6. Demo Customers ────────────────────────────────────
  const customers = await Promise.all([
    prisma.customer.upsert({
      where:  { phone: "+92-300-1234567" },
      update: {},
      create: { companyId: company.id, name: "Ahmad Ali Khan",    phone: "+92-300-1234567", city: "Islamabad", totalVisits: 8,  loyaltyTier: "GOLD",   totalSpending: 140000 },
    }),
    prisma.customer.upsert({
      where:  { phone: "+92-321-7654321" },
      update: {},
      create: { companyId: company.id, name: "Fatima Malik",      phone: "+92-321-7654321", city: "Lahore",    totalVisits: 3,  loyaltyTier: "BRONZE", totalSpending:  55000 },
    }),
    prisma.customer.upsert({
      where:  { phone: "+92-333-9876543" },
      update: {},
      create: { companyId: company.id, name: "Zubair Hassan",     phone: "+92-333-9876543", city: "Chakwal",   totalVisits: 12, loyaltyTier: "GOLD",   totalSpending: 200000 },
    }),
    prisma.customer.upsert({
      where:  { phone: "+92-345-1122334" },
      update: {},
      create: { companyId: company.id, name: "Sara Qureshi",      phone: "+92-345-1122334", city: "Rawalpindi",totalVisits: 2,  loyaltyTier: "BRONZE", totalSpending:  35000 },
    }),
    prisma.customer.upsert({
      where:  { phone: "+92-300-5566778" },
      update: {},
      create: { companyId: company.id, name: "Overseas Pakistani",phone: "+92-300-5566778", city: "Chakwal",   totalVisits: 30, loyaltyTier: "VIP",    totalSpending: 520000, isVIP: true },
    }),
  ]);
  console.log(`✅ Customers: ${customers.length} demo customers created`);

  // ─── 7. Sample Reviews ────────────────────────────────────
  await Promise.all([
    prisma.review.create({ data: { customerId: customers[0].id, branchId: branches[0].id, rating: 5, body: "Absolutely phenomenal stay! The staff were incredibly professional.", isApproved: true, isFeatured: true } }),
    prisma.review.create({ data: { customerId: customers[1].id, branchId: branches[0].id, rating: 5, body: "Best guest house in Chakwal by far. Clean rooms, warm hospitality.", isApproved: true, isFeatured: true } }),
    prisma.review.create({ data: { customerId: customers[4].id, branchId: branches[0].id, rating: 5, body: "Coming from abroad, this was more than I expected — truly premium.", isApproved: true, isFeatured: true } }),
  ]);
  console.log(`✅ Reviews: 3 featured reviews created`);

  console.log("\n✨ Seed complete!\n");
  console.log("Login credentials:");
  console.log("  Super Admin:  owner@chakwalgrand.pk    / Admin@1234");
  console.log("  Manager:      manager@chakwalgrand.pk  / Admin@1234");
  console.log("  Reception:    reception@chakwalgrand.pk/ Admin@1234");
  console.log("  Housekeeping: cleaning@chakwalgrand.pk / Admin@1234\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
