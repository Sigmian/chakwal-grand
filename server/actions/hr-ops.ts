"use server";

// ============================================================
// server/actions/hr-ops.ts
// Phase 4 operations: task assignment, warnings / appreciation,
// and shift handover. Admin actions gated by hr:manage; staff
// actions limited to their own records.
// ============================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { requireAuth, requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";

// Priority ordering for sorting (highest first). Enum can't be ordered by the DB.
const PRIORITY_RANK: Record<string, number> = { URGENT: 0, HIGH: 1, NORMAL: 2, LOW: 3 };

async function requireStaffSelf() {
  const user = await requireAuth();
  const staff = await prisma.staffMember.findUnique({
    where: { userId: user.id },
    include: { branch: { select: { companyId: true } } },
  });
  if (!staff) throw new Error("Your account is not linked to a staff profile.");
  return { user, staff };
}

function branchScope(user: { companyId: string; role: string; branchId?: string | null }) {
  const scoped = getScopedBranchId(user as never);
  return scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } };
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);

// ══════════════════════════════════════════════════════════════
// TASKS
// ══════════════════════════════════════════════════════════════
const PRIORITY_VALUES = ["URGENT", "HIGH", "NORMAL", "LOW"] as const;
type TaskPriorityValue = (typeof PRIORITY_VALUES)[number];

const taskSchema = z.object({
  title:        z.string().min(2).max(120),
  description:  z.string().max(500).optional(),
  assignedToId: z.string().nullable(),
  priority:     z.enum(PRIORITY_VALUES).default("NORMAL"),
  dueAt:        z.string().optional(), // YYYY-MM-DD or ISO
});

export async function createTask(raw: z.input<typeof taskSchema>) {
  const user = await requirePermission("hr:manage");
  const input = taskSchema.parse(raw);

  // Determine branch from the assignee, or the manager's own branch.
  let branchId = getScopedBranchId(user);
  if (input.assignedToId) {
    const staff = await prisma.staffMember.findUnique({
      where: { id: input.assignedToId },
      select: { branchId: true, branch: { select: { companyId: true } } },
    });
    if (!staff || staff.branch.companyId !== user.companyId) throw new Error("Staff member not found");
    if (branchId && staff.branchId !== branchId) throw new Error("Access denied");
    branchId = staff.branchId;
  }
  if (!branchId) {
    // Company-level admin with an unassigned task: attach to first branch.
    const b = await prisma.branch.findFirst({ where: { companyId: user.companyId }, select: { id: true } });
    branchId = b?.id;
  }
  if (!branchId) throw new Error("No branch available");

  const task = await prisma.staffTask.create({
    data: {
      branchId,
      assignedToId: input.assignedToId,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      dueAt: input.dueAt ? new Date(input.dueAt.length === 10 ? `${input.dueAt}T23:59:59+05:00` : input.dueAt) : null,
      assignedById: user.id,
      status: "PENDING",
      seenAt: null, // unseen → pops up for the assignee
    },
  });
  revalidatePath("/staff/ops");
  revalidatePath("/portal");
  return { success: true, id: task.id };
}

export async function listTasks() {
  const user = await requirePermission("hr:manage");
  const tasks = await prisma.staffTask.findMany({
    where: branchScope(user),
    include: {
      assignedTo: { include: { user: { select: { name: true } } } },
      branch: { select: { name: true } },
      _count: { select: { comments: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
  return tasks
    .map((t) => ({
      id: t.id, title: t.title, description: t.description, status: t.status,
      priority: t.priority as TaskPriorityValue,
      assignee: t.assignedTo?.user.name ?? null, branch: t.branch.name,
      commentCount: t._count.comments,
      seen: !!t.seenAt,
      dueAt: iso(t.dueAt), createdAt: iso(t.createdAt),
    }))
    // Open tasks first, then by priority, then newest — completed sink to the bottom.
    .sort((a, b) => {
      const ac = a.status === "COMPLETED" ? 1 : 0, bc = b.status === "COMPLETED" ? 1 : 0;
      if (ac !== bc) return ac - bc;
      const pr = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      if (pr !== 0) return pr;
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
}

// ─── Dashboard widget summary (managers) ──────────────────────
export interface TaskSummary {
  open: number;
  urgent: number;
  unseen: number;
  top: { id: string; title: string; priority: TaskPriorityValue; assignee: string | null; status: string }[];
}

export async function getTaskSummary(): Promise<TaskSummary> {
  const user = await requirePermission("hr:manage");
  const tasks = await prisma.staffTask.findMany({
    where: { ...branchScope(user), status: { not: "COMPLETED" } },
    include: { assignedTo: { include: { user: { select: { name: true } } } } },
    take: 200,
  });
  const ranked = tasks.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  return {
    open: tasks.length,
    urgent: tasks.filter((t) => t.priority === "URGENT").length,
    unseen: tasks.filter((t) => t.assignedToId && !t.seenAt).length,
    top: ranked.slice(0, 4).map((t) => ({
      id: t.id, title: t.title, priority: t.priority as TaskPriorityValue,
      assignee: t.assignedTo?.user.name ?? null, status: t.status,
    })),
  };
}

const taskStatusSchema = z.object({ id: z.string(), status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "OVERDUE"]) });

export async function setTaskStatus(raw: z.input<typeof taskStatusSchema>) {
  const { id, status } = taskStatusSchema.parse(raw);
  const user = await requireAuth();
  const task = await prisma.staffTask.findUnique({
    where: { id },
    include: { assignedTo: { select: { userId: true } }, branch: { select: { companyId: true } } },
  });
  if (!task) throw new Error("Task not found");

  const isAssignee = task.assignedTo?.userId === user.id;
  if (!isAssignee) {
    await requirePermission("hr:manage");
    const scoped = getScopedBranchId(user);
    if (scoped && task.branchId !== scoped) throw new Error("Access denied");
    if (task.branch.companyId !== user.companyId) throw new Error("Access denied");
  }

  await prisma.staffTask.update({
    where: { id },
    // The assignee acting on a task also marks it seen (dismisses the pop-up).
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
      ...(isAssignee ? { seenAt: new Date() } : {}),
    },
  });
  revalidatePath("/staff/ops");
  revalidatePath("/portal");
  return { success: true };
}

export async function getMyTasks() {
  const { staff } = await requireStaffSelf();
  const tasks = await prisma.staffTask.findMany({
    where: { assignedToId: staff.id, status: { not: "COMPLETED" } },
    include: { _count: { select: { comments: true } } },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: 30,
  });
  return tasks
    .map((t) => ({
      id: t.id, title: t.title, description: t.description, status: t.status,
      priority: t.priority as TaskPriorityValue,
      commentCount: t._count.comments,
      seen: !!t.seenAt,
      dueAt: iso(t.dueAt),
    }))
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

// ─── Live pop-up feed for the assignee (polled by the client) ──
export interface TaskAlert {
  id: string; title: string; priority: TaskPriorityValue; assignedBy: string | null; createdAt: string | null;
}

/** Unseen open tasks for the signed-in staffer. Safe (returns []) for non-staff. */
export async function getMyTaskAlerts(): Promise<TaskAlert[]> {
  const user = await requireAuth();
  const staff = await prisma.staffMember.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!staff) return [];
  const tasks = await prisma.staffTask.findMany({
    where: { assignedToId: staff.id, seenAt: null, status: { not: "COMPLETED" } },
    orderBy: [{ createdAt: "desc" }],
    take: 10,
  });
  // Resolve who assigned each (userId → name).
  const byIds = [...new Set(tasks.map((t) => t.assignedById))];
  const assigners = byIds.length
    ? await prisma.user.findMany({ where: { id: { in: byIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(assigners.map((u) => [u.id, u.name]));
  return tasks
    .map((t) => ({
      id: t.id, title: t.title, priority: t.priority as TaskPriorityValue,
      assignedBy: nameById.get(t.assignedById) ?? null, createdAt: iso(t.createdAt),
    }))
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
}

/** Mark the given (or all) of my assigned tasks as seen — dismisses the pop-up. */
export async function markTasksSeen(ids?: string[]) {
  const user = await requireAuth();
  const staff = await prisma.staffMember.findUnique({ where: { userId: user.id }, select: { id: true } });
  if (!staff) return { success: true };
  await prisma.staffTask.updateMany({
    where: { assignedToId: staff.id, seenAt: null, ...(ids && ids.length ? { id: { in: ids } } : {}) },
    data: { seenAt: new Date() },
  });
  revalidatePath("/portal");
  return { success: true };
}

// ─── Task comments ────────────────────────────────────────────
export interface TaskCommentRow { id: string; author: string; isManager: boolean; body: string; createdAt: string | null; mine: boolean }

/** The comment thread for a task — visible to its assignee or a scoped manager. */
export async function getTaskThread(taskId: string): Promise<TaskCommentRow[]> {
  const user = await requireAuth();
  const task = await prisma.staffTask.findUnique({
    where: { id: taskId },
    include: { assignedTo: { select: { userId: true } }, branch: { select: { companyId: true } } },
  });
  if (!task) throw new Error("Task not found");

  const isAssignee = task.assignedTo?.userId === user.id;
  if (!isAssignee) {
    await requirePermission("hr:manage");
    const scoped = getScopedBranchId(user);
    if (scoped && task.branchId !== scoped) throw new Error("Access denied");
    if (task.branch.companyId !== user.companyId) throw new Error("Access denied");
  }

  const comments = await prisma.taskComment.findMany({
    where: { taskId }, orderBy: { createdAt: "asc" },
  });
  return comments.map((c) => ({
    id: c.id, author: c.authorName, isManager: c.isManager, body: c.body,
    createdAt: iso(c.createdAt), mine: c.authorId === user.id,
  }));
}

const commentSchema = z.object({ taskId: z.string(), body: z.string().min(1).max(1000) });

export async function addTaskComment(raw: z.input<typeof commentSchema>) {
  const input = commentSchema.parse(raw);
  const user = await requireAuth();
  const task = await prisma.staffTask.findUnique({
    where: { id: input.taskId },
    include: { assignedTo: { select: { userId: true } }, branch: { select: { companyId: true } } },
  });
  if (!task) throw new Error("Task not found");

  const isAssignee = task.assignedTo?.userId === user.id;
  const isManager = hasPermission(user.role, "hr:manage");
  if (!isAssignee) {
    if (!isManager) throw new Error("Access denied");
    const scoped = getScopedBranchId(user);
    if (scoped && task.branchId !== scoped) throw new Error("Access denied");
    if (task.branch.companyId !== user.companyId) throw new Error("Access denied");
  }

  await prisma.taskComment.create({
    data: {
      taskId: input.taskId,
      authorId: user.id,
      authorName: user.name ?? "User",
      isManager: !isAssignee && isManager,
      body: input.body.trim(),
    },
  });
  revalidatePath("/staff/ops");
  revalidatePath("/portal");
  return { success: true };
}

// ══════════════════════════════════════════════════════════════
// WARNINGS / APPRECIATION
// ══════════════════════════════════════════════════════════════
const warningSchema = z.object({
  staffMemberId: z.string(),
  type: z.enum(["VERBAL", "WRITTEN", "FINAL", "APPRECIATION"]),
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional(),
});

export async function issueWarning(raw: z.input<typeof warningSchema>) {
  const user = await requirePermission("hr:manage");
  const input = warningSchema.parse(raw);
  const staff = await prisma.staffMember.findUnique({
    where: { id: input.staffMemberId },
    select: { branchId: true, branch: { select: { companyId: true } } },
  });
  if (!staff || staff.branch.companyId !== user.companyId) throw new Error("Staff member not found");
  const scoped = getScopedBranchId(user);
  if (scoped && staff.branchId !== scoped) throw new Error("Access denied");

  await prisma.staffWarning.create({
    data: {
      staffMemberId: input.staffMemberId, branchId: staff.branchId,
      type: input.type, title: input.title, description: input.description ?? null,
      issuedById: user.id,
    },
  });
  revalidatePath("/staff/ops");
  revalidatePath("/portal");
  return { success: true };
}

export async function listWarnings() {
  const user = await requirePermission("hr:manage");
  const scoped = getScopedBranchId(user);
  const rows = await prisma.staffWarning.findMany({
    where: scoped ? { branchId: scoped } : { branchId: { in: (await prisma.branch.findMany({ where: { companyId: user.companyId }, select: { id: true } })).map((b) => b.id) } },
    include: { staffMember: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return rows.map((w) => ({
    id: w.id, staff: w.staffMember.user.name, type: w.type, title: w.title,
    description: w.description, acknowledged: !!w.acknowledgedAt, createdAt: iso(w.createdAt),
  }));
}

export async function acknowledgeWarning(id: string) {
  const { staff } = await requireStaffSelf();
  const w = await prisma.staffWarning.findUnique({ where: { id }, select: { staffMemberId: true, acknowledgedAt: true } });
  if (!w || w.staffMemberId !== staff.id) throw new Error("Not found");
  if (!w.acknowledgedAt) await prisma.staffWarning.update({ where: { id }, data: { acknowledgedAt: new Date() } });
  revalidatePath("/portal");
  return { success: true };
}

export async function getMyWarnings() {
  const { staff } = await requireStaffSelf();
  const rows = await prisma.staffWarning.findMany({
    where: { staffMemberId: staff.id },
    orderBy: { createdAt: "desc" }, take: 20,
  });
  return rows.map((w) => ({ id: w.id, type: w.type, title: w.title, description: w.description, acknowledged: !!w.acknowledgedAt, createdAt: iso(w.createdAt) }));
}

// ══════════════════════════════════════════════════════════════
// SHIFT HANDOVER
// ══════════════════════════════════════════════════════════════
const handoverSchema = z.object({
  cashInHand: z.number().nullable().optional(),
  pendingBookings: z.string().max(1000).optional(),
  complaints: z.string().max(1000).optional(),
  roomsToClean: z.string().max(1000).optional(),
  pendingPayments: z.string().max(1000).optional(),
  maintenance: z.string().max(1000).optional(),
  notes: z.string().max(1000).optional(),
});

export async function createHandover(raw: z.input<typeof handoverSchema>) {
  const input = handoverSchema.parse(raw);
  const { staff } = await requireStaffSelf();
  await prisma.shiftHandover.create({
    data: {
      branchId: staff.branchId,
      fromStaffId: staff.id,
      cashInHand: input.cashInHand ?? null,
      pendingBookings: input.pendingBookings ?? null,
      complaints: input.complaints ?? null,
      roomsToClean: input.roomsToClean ?? null,
      pendingPayments: input.pendingPayments ?? null,
      maintenance: input.maintenance ?? null,
      notes: input.notes ?? null,
    },
  });
  revalidatePath("/portal");
  revalidatePath("/staff/ops");
  return { success: true };
}

export async function acknowledgeHandover(id: string) {
  const { staff } = await requireStaffSelf();
  const h = await prisma.shiftHandover.findUnique({ where: { id }, select: { branchId: true, fromStaffId: true, acknowledgedAt: true } });
  if (!h) throw new Error("Not found");
  if (h.branchId !== staff.branchId) throw new Error("Access denied");
  if (h.fromStaffId === staff.id) throw new Error("You created this handover.");
  if (h.acknowledgedAt) throw new Error("Already acknowledged.");
  await prisma.shiftHandover.update({ where: { id }, data: { acknowledgedAt: new Date(), toStaffId: staff.id } });
  revalidatePath("/portal");
  revalidatePath("/staff/ops");
  return { success: true };
}

/** Open handovers at the staffer's branch that they didn't create (to receive). */
export async function getOpenHandoversForMe() {
  const { staff } = await requireStaffSelf();
  const rows = await prisma.shiftHandover.findMany({
    where: { branchId: staff.branchId, acknowledgedAt: null, fromStaffId: { not: staff.id } },
    include: { fromStaff: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" }, take: 5,
  });
  return rows.map((h) => serializeHandover(h));
}

export async function listHandovers() {
  const user = await requirePermission("hr:manage");
  const rows = await prisma.shiftHandover.findMany({
    where: branchScope(user),
    include: {
      fromStaff: { include: { user: { select: { name: true } } } },
      toStaff: { include: { user: { select: { name: true } } } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" }, take: 40,
  });
  return rows.map((h) => ({ ...serializeHandover(h), branch: h.branch.name, to: h.toStaff?.user.name ?? null }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeHandover(h: any) {
  return {
    id: h.id, from: h.fromStaff.user.name,
    cashInHand: h.cashInHand != null ? Number(h.cashInHand) : null,
    pendingBookings: h.pendingBookings, complaints: h.complaints, roomsToClean: h.roomsToClean,
    pendingPayments: h.pendingPayments, maintenance: h.maintenance, notes: h.notes,
    acknowledged: !!h.acknowledgedAt, createdAt: iso(h.createdAt),
  };
}
