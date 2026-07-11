// ============================================================
// database/seeds/staff.ts
// Creates real staff accounts for both branches.
// Safe to re-run — all upserts by email.
// Run: npx tsx database/seeds/staff.ts
// ============================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) throw new Error("Company not found — run main seed first");

  const chakwalBranch = await prisma.branch.findUnique({ where: { id: "branch-chakwal" } });
  const madinaBranch  = await prisma.branch.findUnique({ where: { id: "branch-madina"  } });

  if (!chakwalBranch) throw new Error("branch-chakwal not found");
  if (!madinaBranch)  throw new Error("branch-madina not found — run madina-branch seed first");

  // Temp password — staff should change on first login
  const passwordHash = await bcrypt.hash("CGH@Staff2025", 12);

  console.log("🌱 Creating staff accounts...\n");

  // ── Managers ──────────────────────────────────────────────
  const nayab = await prisma.user.upsert({
    where:  { email: "nayab@chakwalgrand.pk" },
    update: { name: "Nayab", isActive: true },
    create: {
      companyId:    company.id,
      email:        "nayab@chakwalgrand.pk",
      name:         "Nayab",
      passwordHash,
      role:         "BRANCH_MANAGER",
      isActive:     true,
    },
  });
  await prisma.staffMember.upsert({
    where:  { userId: nayab.id },
    update: { branchId: chakwalBranch.id, designation: "Branch Manager" },
    create: {
      userId:      nayab.id,
      branchId:    chakwalBranch.id,
      designation: "Branch Manager",
      shiftStart:  "09:00",
      shiftEnd:    "18:00",
    },
  });
  console.log(`✅ Manager (Main Branch):         Nayab  <nayab@chakwalgrand.pk>`);

  const faizan = await prisma.user.upsert({
    where:  { email: "faizan@chakwalgrand.pk" },
    update: { name: "Faizan", isActive: true },
    create: {
      companyId:    company.id,
      email:        "faizan@chakwalgrand.pk",
      name:         "Faizan",
      passwordHash,
      role:         "BRANCH_MANAGER",
      isActive:     true,
    },
  });
  await prisma.staffMember.upsert({
    where:  { userId: faizan.id },
    update: { branchId: madinaBranch.id, designation: "Branch Manager" },
    create: {
      userId:      faizan.id,
      branchId:    madinaBranch.id,
      designation: "Branch Manager",
      shiftStart:  "09:00",
      shiftEnd:    "18:00",
    },
  });
  console.log(`✅ Manager (Madina Town Branch):   Faizan <faizan@chakwalgrand.pk>`);

  // ── Receptionists ─────────────────────────────────────────
  const bilal = await prisma.user.upsert({
    where:  { email: "bilal@chakwalgrand.pk" },
    update: { name: "Bilal", isActive: true },
    create: {
      companyId:    company.id,
      email:        "bilal@chakwalgrand.pk",
      name:         "Bilal",
      passwordHash,
      role:         "RECEPTIONIST",
      isActive:     true,
    },
  });
  await prisma.staffMember.upsert({
    where:  { userId: bilal.id },
    update: { branchId: chakwalBranch.id, designation: "Receptionist" },
    create: {
      userId:      bilal.id,
      branchId:    chakwalBranch.id,
      designation: "Receptionist",
      shiftStart:  "08:00",
      shiftEnd:    "20:00",
    },
  });
  console.log(`✅ Receptionist (Main Branch):     Bilal  <bilal@chakwalgrand.pk>`);

  const babu = await prisma.user.upsert({
    where:  { email: "babu@chakwalgrand.pk" },
    update: { name: "Babu", isActive: true },
    create: {
      companyId:    company.id,
      email:        "babu@chakwalgrand.pk",
      name:         "Babu",
      passwordHash,
      role:         "RECEPTIONIST",
      isActive:     true,
    },
  });
  await prisma.staffMember.upsert({
    where:  { userId: babu.id },
    update: { branchId: madinaBranch.id, designation: "Receptionist" },
    create: {
      userId:      babu.id,
      branchId:    madinaBranch.id,
      designation: "Receptionist",
      shiftStart:  "08:00",
      shiftEnd:    "20:00",
    },
  });
  console.log(`✅ Receptionist (Madina Town):     Babu   <babu@chakwalgrand.pk>`);

  console.log("\n🔑 Temporary password for all: CGH@Staff2025");
  console.log("   Ask them to change it after first login.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
