"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { assertBranchAccess, requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { z } from "zod";

// ─── Types ───────────────────────────────────────────────────────────────────

const createStaffSchema = z.object({
  name:        z.string().min(2),
  email:       z.string().email(),
  role:        z.enum(["BRANCH_MANAGER", "RECEPTIONIST", "HOUSEKEEPING", "INVENTORY_STAFF"]),
  branchId:    z.string().cuid(),
  phone:       z.string().optional(),
  cnic:        z.string().optional(),
  designation: z.string().optional(),
  salary:      z.number().positive().optional(),
  shiftStart:  z.string().optional(),
  shiftEnd:    z.string().optional(),
  workingDays: z.array(z.string()).optional(),
  notes:       z.string().optional(),
  joinedAt:    z.string().optional(),
});

const updateStaffSchema = createStaffSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getStaffMembers(params?: {
  branchId?: string;
  search?: string;
  role?: string;
}) {
  const user     = await requirePermission("staff:view");
  const scopedId = getScopedBranchId(user);
  const branchId = scopedId ?? params?.branchId;

  const staffMembers = await prisma.staffMember.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      user: {
        ...(params?.search
          ? {
              OR: [
                { name: { contains: params.search, mode: "insensitive" } },
                { email: { contains: params.search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(params?.role ? { role: params.role as any } : {}),
      },
    },
    include: {
      user:   { select: { id: true, name: true, email: true, role: true, isActive: true } },
      branch: { select: { id: true, name: true, city: true } },
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true, action: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return staffMembers;
}

export async function getStaffMember(staffId: string) {
  const user     = await requirePermission("staff:view");
  const scopedId = getScopedBranchId(user);

  const staff = await prisma.staffMember.findUnique({
    where: { id: staffId },
    include: {
      user:   true,
      branch: true,
      activityLogs: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!staff) throw new Error("Staff member not found");
  if (scopedId && staff.branchId !== scopedId) throw new Error("Access denied");

  // Fetch recent bookings for this staff member's branch
  const bookings = await prisma.booking.findMany({
    where: { branchId: staff.branchId },
    include: {
      customer: { select: { name: true } },
      room:     { select: { number: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return { staff, bookings };
}

export async function getStaffStats(branchId?: string) {
  const user     = await requirePermission("staff:view");
  const scopedId = getScopedBranchId(user);
  const targetId = scopedId ?? branchId;

  const where = targetId ? { branchId: targetId } : {};

  const [total, byRole, recentActivity] = await Promise.all([
    prisma.staffMember.count({ where }),
    prisma.user.groupBy({
      by: ["role"],
      where: {
        isActive: true,
        ...(targetId ? { staffMember: { branchId: targetId } } : {}),
      },
      _count: true,
    }),
    prisma.activityLog.findMany({
      where: targetId ? { staff: { branchId: targetId } } : {},
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        user:  { select: { name: true, role: true } },
        staff: { select: { id: true } },
      },
    }),
  ]);

  return { total, byRole, recentActivity };
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createStaffMember(rawInput: CreateStaffInput) {
  const user  = await requirePermission("staff:manage");
  const input = createStaffSchema.parse(rawInput);
  assertBranchAccess(user, input.branchId);

  // Create auth user + staff profile atomically
  const staff = await prisma.$transaction(async (tx) => {
    // Create the User
    const newUser = await tx.user.create({
      data: {
        name:         input.name,
        email:        input.email,
        role:         input.role,
        passwordHash: "$2b$12$placeholder", // force password reset on first login
        isActive:     true,
        companyId:    user.companyId,
      },
    });

    // Create the StaffMember profile
    const staffMember = await tx.staffMember.create({
      data: {
        userId:      newUser.id,
        branchId:    input.branchId,
        phone:       input.phone,
        cnic:        input.cnic,
        designation: input.designation,
        salary:      input.salary,
        shiftStart:  input.shiftStart,
        shiftEnd:    input.shiftEnd,
        workingDays: input.workingDays ?? [],
        notes:       input.notes,
        joinedAt:    input.joinedAt ? new Date(input.joinedAt) : new Date(),
      },
    });

    return staffMember;
  });

  revalidatePath("/staff");
  return { success: true, staffId: staff.id };
}

export async function updateStaffMember(staffId: string, rawInput: UpdateStaffInput) {
  const user     = await requirePermission("staff:manage");
  const scopedId = getScopedBranchId(user);
  const input    = updateStaffSchema.parse(rawInput);

  const existing = await prisma.staffMember.findUnique({
    where: { id: staffId },
    select: { branchId: true, userId: true },
  });
  if (!existing) throw new Error("Staff member not found");
  if (scopedId && existing.branchId !== scopedId) throw new Error("Access denied");

  await prisma.$transaction(async (tx) => {
    // Update User fields
    if (input.name || input.email || input.role || input.isActive !== undefined) {
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          ...(input.name     ? { name: input.name }         : {}),
          ...(input.email    ? { email: input.email }        : {}),
          ...(input.role     ? { role: input.role as any }   : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      });
    }

    // Update StaffMember profile
    await tx.staffMember.update({
      where: { id: staffId },
      data: {
        ...(input.phone       !== undefined ? { phone: input.phone }             : {}),
        ...(input.cnic        !== undefined ? { cnic: input.cnic }               : {}),
        ...(input.designation !== undefined ? { designation: input.designation } : {}),
        ...(input.salary      !== undefined ? { salary: input.salary }           : {}),
        ...(input.shiftStart  !== undefined ? { shiftStart: input.shiftStart }   : {}),
        ...(input.shiftEnd    !== undefined ? { shiftEnd: input.shiftEnd }       : {}),
        ...(input.workingDays !== undefined ? { workingDays: input.workingDays } : {}),
        ...(input.notes       !== undefined ? { notes: input.notes }             : {}),
        ...(input.branchId    !== undefined ? { branchId: input.branchId }       : {}),
      },
    });
  });

  revalidatePath("/staff");
  revalidatePath(`/staff/${staffId}`);
  return { success: true };
}

export async function toggleStaffActive(staffId: string) {
  const user     = await requirePermission("staff:manage");
  const scopedId = getScopedBranchId(user);

  const staff = await prisma.staffMember.findUnique({
    where: { id: staffId },
    include: { user: true },
  });
  if (!staff) throw new Error("Staff member not found");
  if (scopedId && staff.branchId !== scopedId) throw new Error("Access denied");

  await prisma.user.update({
    where: { id: staff.userId },
    data: { isActive: !staff.user.isActive },
  });

  revalidatePath("/staff");
  return { success: true, isActive: !staff.user.isActive };
}

export async function getStaffPerformance(staffId: string) {
  const user = await requirePermission("staff:view");

  const staff = await prisma.staffMember.findUnique({
    where: { id: staffId },
    select: { userId: true, branchId: true },
  });
  if (!staff) throw new Error("Not found");
  assertBranchAccess(user, staff.branchId);

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [bookingsHandled, checkIns, checkOuts, activityCount] = await Promise.all([
    prisma.booking.count({
      where: { branchId: staff.branchId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.booking.count({
      where: {
        branchId: staff.branchId,
        status: "CHECKED_IN",
        checkInDate: { gte: thirtyDaysAgo },
      },
    }),
    prisma.booking.count({
      where: {
        branchId: staff.branchId,
        status: "CHECKED_OUT",
        checkOutDate: { gte: thirtyDaysAgo },
      },
    }),
    prisma.activityLog.count({
      where: {
        userId: staff.userId,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  return { bookingsHandled, checkIns, checkOuts, activityCount };
}
