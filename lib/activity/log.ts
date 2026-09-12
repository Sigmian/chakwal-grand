// ============================================================
// lib/activity/log.ts
// Shared staff activity / audit logger. Every important staff
// action is recorded here for accountability. Logging never
// throws into the caller — an audit failure must not break the
// underlying operation.
// ============================================================

import prisma from "@/lib/db/prisma";

export interface ActivityInput {
  userId:      string;
  action:      string;        // e.g. "LOGIN", "STOCK_OUT", "CHECK_IN"
  entity:      string;        // e.g. "Auth", "Inventory", "Attendance"
  description: string;
  entityId?:   string | null;
  branchId?:   string | null;
  staffId?:    string | null;
  metadata?:   Record<string, unknown>;
  ipAddress?:  string | null;
}

export async function logActivity(input: ActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId:      input.userId,
        action:      input.action,
        entity:      input.entity,
        entityId:    input.entityId ?? null,
        description: input.description,
        branchId:    input.branchId ?? null,
        staffId:     input.staffId ?? null,
        metadata:    (input.metadata ?? undefined) as never,
        ipAddress:   input.ipAddress ?? null,
      },
    });
  } catch (err) {
    // Never let audit logging break the real action.
    console.error("[logActivity]", input.action, err);
  }
}
