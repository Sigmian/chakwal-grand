// ============================================================
// server/actions/branches.ts
// Branch CRUD + per-branch statistics
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import prisma from "@/lib/db/prisma";
import { assertBranchAccess, assertCompanyAccess, requireSuperAdmin, requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { createBranchSchema, updateBranchSchema } from "@/lib/validation/schemas";
import type { CreateBranchInput, UpdateBranchInput } from "@/lib/validation/schemas";
import { slugify } from "@/utils";
import { BookingStatus, RoomStatus } from "@/types";

// ─── GET ALL BRANCHES ─────────────────────────────────────────
export async function getBranches() {
  const user = await requirePermission("branches:read");

  if (user.role === "SUPER_ADMIN") {
    return prisma.branch.findMany({
      where:   { deletedAt: null },
      include: {
        _count: {
          select: { rooms: true, bookings: true, staff: true },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  // Non-super-admin: only their branch
  return prisma.branch.findMany({
    where:   { id: user.branchId, deletedAt: null },
    include: { _count: { select: { rooms: true, bookings: true, staff: true } } },
  });
}

// ─── GET BRANCH WITH LIVE STATS ───────────────────────────────
export async function getBranchWithStats(branchId: string) {
  const user = await requirePermission("branches:read");
  assertBranchAccess(user, branchId);

  const [branch, roomStats, activeBookings, monthRevenue] = await Promise.all([
    prisma.branch.findUnique({
      where:   { id: branchId },
      include: { _count: { select: { rooms: true, staff: true } } },
    }),

    prisma.room.groupBy({
      by:    ["status"],
      where: { branchId, isActive: true },
      _count: { id: true },
    }),

    prisma.booking.count({
      where: {
        branchId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
      },
    }),

    prisma.booking.aggregate({
      where: {
        branchId,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
        checkInDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { totalAmount: true },
    }),
  ]);

  if (!branch) return null;

  const statusMap      = Object.fromEntries(roomStats.map((r) => [r.status, r._count.id]));
  const totalRooms     = Object.values(statusMap).reduce((a, b) => a + b, 0);
  const availableRooms = statusMap[RoomStatus.AVAILABLE]  ?? 0;
  const occupiedRooms  = statusMap[RoomStatus.OCCUPIED]   ?? 0;

  return {
    ...branch,
    stats: {
      totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate:    totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      revenueThisMonth: Number(monthRevenue._sum.totalAmount ?? 0),
      activeBookings,
    },
  };
}

// ─── CREATE BRANCH ───────────────────────────────────────────
export async function createBranch(rawInput: CreateBranchInput) {
  const user = await requireSuperAdmin();

  const result = createBranchSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }
  const input = result.data;

  try {
    // Generate unique slug
    let slug    = slugify(input.name);
    const taken = await prisma.branch.findUnique({ where: { slug } });
    if (taken) slug = `${slug}-${Date.now()}`;

    const branch = await prisma.branch.create({
      data: {
        companyId:    user.companyId,
        name:         input.name,
        slug,
        city:         input.city,
        address:      input.address,
        phone:        input.phone,
        email:        input.email    || null,
        whatsapp:     input.whatsapp || null,
        latitude:     input.latitude,
        longitude:    input.longitude,
        googleMapsUrl: input.googleMapsUrl || null,
        description:  input.description   || null,
        facilities:   input.facilities ?? [],
      },
    });

    await prisma.activityLog.create({
      data: {
        userId:      user.id,
        action:      "BRANCH_CREATED",
        entity:      "Branch",
        entityId:    branch.id,
        description: `New branch created: ${branch.name} in ${branch.city}`,
      },
    });

    revalidatePath("/branches");
    return { success: true, data: branch };
  } catch (error) {
    console.error("[createBranch]", error);
    return { success: false, error: "Failed to create branch" };
  }
}

// ─── UPDATE BRANCH ───────────────────────────────────────────
export async function updateBranch(branchId: string, rawInput: UpdateBranchInput) {
  const user = await requirePermission("branches:update");
  assertBranchAccess(user, branchId);

  const result = updateBranchSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  try {
    const branch = await prisma.branch.update({
      where: { id: branchId },
      data:  result.data,
    });

    revalidatePath("/branches");
    revalidatePath(`/branches/${branchId}`);

    return { success: true, data: branch };
  } catch (error) {
    console.error("[updateBranch]", error);
    return { success: false, error: "Failed to update branch" };
  }
}

// ─── SOFT DELETE BRANCH ───────────────────────────────────────
export async function deleteBranch(branchId: string) {
  await requireSuperAdmin();

  const hasActiveBookings = await prisma.booking.count({
    where: {
      branchId,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
    },
  });
  if (hasActiveBookings > 0) {
    return {
      success: false,
      error: `Cannot delete branch with ${hasActiveBookings} active booking(s). Complete or transfer them first.`,
    };
  }

  await prisma.branch.update({
    where: { id: branchId },
    data:  { isActive: false, deletedAt: new Date() },
  });

  revalidatePath("/branches");
  return { success: true };
}

// ============================================================
// server/actions/customers.ts
// Customer profile management
// ============================================================

export async function getCustomers(params?: {
  search?:  string;
  tier?:    string;
  page?:    number;
  pageSize?: number;
}) {
  const user = await requirePermission("customers:read");

  const page  = params?.page     ?? 1;
  const limit = params?.pageSize ?? 25;
  const skip  = (page - 1) * limit;

  const where = {
    companyId: user.companyId,
    ...(params?.search
      ? {
          OR: [
            { name:  { contains: params.search, mode: "insensitive" as const } },
            { phone: { contains: params.search } },
            { email: { contains: params.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
    ...(params?.tier ? { loyaltyTier: params.tier as never } : {}),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take:    limit,
      orderBy: { totalVisits: "desc" },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    data: customers,
    total,
    page,
    pageSize: limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getCustomerProfile(customerId: string) {
  const user = await requirePermission("customers:read");

  const owner = await prisma.customer.findUnique({ where: { id: customerId }, select: { companyId: true } });
  if (!owner) return null;
  assertCompanyAccess(user, owner.companyId);

  const [customer, bookings, reviews] = await Promise.all([
    prisma.customer.findUnique({ where: { id: customerId } }),

    prisma.booking.findMany({
      where:   { customerId },
      include: {
        room:   { select: { number: true, name: true, type: true } },
        branch: { select: { name: true } },
      },
      orderBy: { checkInDate: "desc" },
      take:    20,
    }),

    prisma.review.findMany({
      where:   { customerId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!customer) return null;
  return { ...customer, bookings, reviews };
}

export async function updateCustomerLoyaltyTier(customerId: string) {
  // Guard: this is a "use server" export, so it's a public POST endpoint —
  // require an authenticated staffer with customer-write permission.
  const user = await requirePermission("customers:update");

  // Auto-calculate loyalty tier based on total visits
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return;
  assertCompanyAccess(user, customer.companyId);

  let tier: "BRONZE" | "SILVER" | "GOLD" | "VIP";
  if      (customer.totalVisits >= 25) tier = "VIP";
  else if (customer.totalVisits >= 10) tier = "GOLD";
  else if (customer.totalVisits >= 4)  tier = "SILVER";
  else                                  tier = "BRONZE";

  await prisma.customer.update({
    where: { id: customerId },
    data:  { loyaltyTier: tier },
  });
}

export async function blacklistCustomer(
  customerId: string,
  reason: string
) {
  const user = await requirePermission("customers:blacklist");

  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { companyId: true } });
  if (!customer) return;
  assertCompanyAccess(user, customer.companyId);

  await prisma.customer.update({
    where: { id: customerId },
    data:  { isBlacklisted: true, blacklistReason: reason },
  });

  await prisma.activityLog.create({
    data: {
      userId:      user.id,
      action:      "CUSTOMER_BLACKLISTED",
      entity:      "Customer",
      entityId:    customerId,
      description: `Customer blacklisted: ${reason}`,
    },
  });

  revalidatePath(`/customers/${customerId}`);
  return { success: true };
}
