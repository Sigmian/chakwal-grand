"use server";

// ============================================================
// server/actions/hr-admin.ts
// Admin management of HR rules, shifts and per-staff shift
// assignment. All gated by hr:manage and scoped to the company.
// ============================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { ensureHrSettings } from "@/lib/hr/config";

// ─── HR settings ──────────────────────────────────────────────
export async function getHrSettings() {
  const user = await requirePermission("hr:manage");
  return ensureHrSettings(user.companyId);
}

const hmRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const settingsSchema = z.object({
  payrollDivisor:         z.number().int().min(1).max(31),
  paidLeavesPerMonth:     z.number().int().min(0).max(31),
  weeklyOffDays:          z.array(z.enum(["SUN","MON","TUE","WED","THU","FRI","SAT"])),
  holidays:               z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(60).optional(),
  graceMinutes:           z.number().int().min(0).max(240),
  autoAbsentAfterMinutes: z.number().int().min(0).max(1440),
  minHalfDayMinutes:      z.number().int().min(0).max(1440),
  earlyCheckoutMinutes:   z.number().int().min(0).max(1440),
  lateWarnAfterCount:     z.number().int().min(0).max(31),
  lateToHalfDayCount:     z.number().int().min(1).max(31).nullable(),
  lateToDayCount:         z.number().int().min(1).max(31).nullable(),
  halfDayDeductsHalf:     z.boolean(),
  earlyCheckoutPenalty:   z.enum(["NONE","HALF_DAY"]),
  requireSelfie:          z.boolean(),
  requireGeo:             z.boolean(),
  geoLat:                 z.number().nullable(),
  geoLng:                 z.number().nullable(),
  geoRadiusMeters:        z.number().int().min(20).max(5000),
  bookingBonusThreshold:  z.number().int().min(0).max(100000),
  bookingBonusAmount:     z.number().min(0).max(100000000),
});

export async function updateHrSettings(raw: z.input<typeof settingsSchema>) {
  const user = await requirePermission("hr:manage");
  const input = settingsSchema.parse(raw);
  await ensureHrSettings(user.companyId);
  await prisma.hrSettings.update({ where: { companyId: user.companyId }, data: input });
  revalidatePath("/staff/hr");
  return { success: true };
}

// ─── Shifts ───────────────────────────────────────────────────
export async function listShifts() {
  const user = await requirePermission("hr:manage");
  return prisma.shift.findMany({
    where: { companyId: user.companyId },
    orderBy: [{ isActive: "desc" }, { startTime: "asc" }],
  });
}

const shiftSchema = z.object({
  name:            z.string().min(2).max(40),
  startTime:       z.string().regex(hmRegex, "Use HH:MM"),
  endTime:         z.string().regex(hmRegex, "Use HH:MM"),
  crossesMidnight: z.boolean(),
  graceMinutes:    z.number().int().min(0).max(240).nullable(),
  isActive:        z.boolean().default(true),
});

export async function createShift(raw: z.input<typeof shiftSchema>) {
  const user = await requirePermission("hr:manage");
  const input = shiftSchema.parse(raw);
  const shift = await prisma.shift.create({ data: { ...input, companyId: user.companyId } });
  revalidatePath("/staff/hr");
  return { success: true, id: shift.id };
}

export async function updateShift(id: string, raw: z.input<typeof shiftSchema>) {
  const user = await requirePermission("hr:manage");
  const input = shiftSchema.parse(raw);
  const existing = await prisma.shift.findUnique({ where: { id }, select: { companyId: true } });
  if (!existing || existing.companyId !== user.companyId) throw new Error("Shift not found");
  await prisma.shift.update({ where: { id }, data: input });
  revalidatePath("/staff/hr");
  return { success: true };
}

export async function toggleShiftActive(id: string) {
  const user = await requirePermission("hr:manage");
  const shift = await prisma.shift.findUnique({ where: { id }, select: { companyId: true, isActive: true } });
  if (!shift || shift.companyId !== user.companyId) throw new Error("Shift not found");
  await prisma.shift.update({ where: { id }, data: { isActive: !shift.isActive } });
  revalidatePath("/staff/hr");
  return { success: true };
}

// ─── Per-staff shift assignment ───────────────────────────────
export async function getShiftAssignments() {
  const user = await requirePermission("hr:manage");
  const scoped = getScopedBranchId(user);
  return prisma.staffMember.findMany({
    where: {
      ...(scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } }),
    },
    select: {
      id: true,
      assignedShiftId: true,
      user:   { select: { name: true } },
      branch: { select: { name: true } },
      assignedShift: { select: { name: true } },
    },
    orderBy: { user: { name: "asc" } },
  });
}

export async function assignShift(staffMemberId: string, shiftId: string | null) {
  const user = await requirePermission("hr:manage");
  const staff = await prisma.staffMember.findUnique({
    where: { id: staffMemberId },
    select: { branchId: true, branch: { select: { companyId: true } } },
  });
  if (!staff || staff.branch.companyId !== user.companyId) throw new Error("Staff member not found");
  const scoped = getScopedBranchId(user);
  if (scoped && staff.branchId !== scoped) throw new Error("Access denied");

  if (shiftId) {
    const shift = await prisma.shift.findUnique({ where: { id: shiftId }, select: { companyId: true } });
    if (!shift || shift.companyId !== user.companyId) throw new Error("Shift not found");
  }
  await prisma.staffMember.update({ where: { id: staffMemberId }, data: { assignedShiftId: shiftId } });
  revalidatePath("/staff/hr");
  return { success: true };
}
