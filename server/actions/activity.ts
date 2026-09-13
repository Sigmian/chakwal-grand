"use server";

// ============================================================
// server/actions/activity.ts
// Company-wide staff activity / audit log for admins, with
// filters by staff, branch, action type and date.
// ============================================================

import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";

export interface ActivityRow {
  id: string; action: string; entity: string; description: string;
  staffName: string; role: string | null; branch: string | null;
  createdAt: string;
}

export async function getActivityLog(opts?: {
  userId?: string; branchId?: string; action?: string; from?: string; to?: string; limit?: number;
}): Promise<ActivityRow[]> {
  const viewer = await requirePermission("staff:manage");
  const scoped = getScopedBranchId(viewer, opts?.branchId);

  const where: Prisma.ActivityLogWhereInput = { user: { companyId: viewer.companyId } };
  if (opts?.userId) where.userId = opts.userId;
  if (opts?.action) where.action = opts.action;
  if (scoped)       where.branchId = scoped;          // branch managers: their branch only
  if (opts?.from || opts?.to) {
    // PKT calendar days (Asia/Karachi, UTC+5) — a UTC server would otherwise
    // bucket early-morning events into the previous day.
    where.createdAt = {
      ...(opts.from ? { gte: new Date(`${opts.from}T00:00:00+05:00`) } : {}),
      ...(opts.to   ? { lte: new Date(`${opts.to}T23:59:59+05:00`) } : {}),
    };
  }

  const rows = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: Math.min(opts?.limit ?? 200, 500),
    include: {
      user:  { select: { name: true, role: true } },
      staff: { select: { branch: { select: { name: true } } } },
    },
  });

  // Resolve branch names for rows that carry a branchId but no staff relation.
  const branchIds = [...new Set(rows.map((r) => r.branchId).filter(Boolean))] as string[];
  const branches = branchIds.length
    ? await prisma.branch.findMany({ where: { id: { in: branchIds } }, select: { id: true, name: true } })
    : [];
  const branchById = new Map(branches.map((b) => [b.id, b.name] as const));

  return rows.map((r) => ({
    id:          r.id,
    action:      r.action,
    entity:      r.entity,
    description: r.description,
    staffName:   r.user.name,
    role:        r.user.role,
    branch:      r.staff?.branch?.name ?? (r.branchId ? branchById.get(r.branchId) ?? null : null),
    createdAt:   r.createdAt.toISOString(),
  }));
}

// Dropdown data for the filters.
export async function getActivityFilterData() {
  const viewer = await requirePermission("staff:manage");
  const scoped = getScopedBranchId(viewer);

  const [staff, branches, actions] = await Promise.all([
    prisma.user.findMany({
      where: { companyId: viewer.companyId, staffMember: scoped ? { branchId: scoped } : { isNot: null } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    scoped
      ? prisma.branch.findMany({ where: { id: scoped }, select: { id: true, name: true } })
      : prisma.branch.findMany({ where: { companyId: viewer.companyId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.activityLog.findMany({
      where: { user: { companyId: viewer.companyId }, ...(scoped ? { branchId: scoped } : {}) },
      select: { action: true }, distinct: ["action"], orderBy: { action: "asc" }, take: 100,
    }),
  ]);

  return { staff, branches: scoped ? [] : branches, actions: actions.map((a) => a.action) };
}
