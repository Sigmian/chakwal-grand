"use server";

// ============================================================
// server/actions/hr-documents.ts
// Staff HR documents — CNIC scans, signed agreements, certificates.
// Managers add/remove (branch-scoped); a staffer can list their own.
// Files are uploaded client-side (Cloudinary); we only store the URL.
// ============================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { requireAuth, requirePermission, getScopedBranchId } from "@/lib/auth/session";

const DOC_TYPES = ["CNIC_FRONT", "CNIC_BACK", "AGREEMENT", "CONTRACT", "CERTIFICATE", "OTHER"] as const;

export interface StaffDoc {
  id: string;
  type: (typeof DOC_TYPES)[number];
  title: string;
  fileUrl: string;
  fileKind: string | null;
  expiresAt: string | null;
  createdAt: string;
}

// Resolve a staff member and enforce that the viewer may touch its branch.
async function staffInScope(staffMemberId: string, needManage: boolean) {
  const viewer = needManage ? await requirePermission("hr:manage") : await requireAuth();
  const staff = await prisma.staffMember.findUnique({
    where: { id: staffMemberId },
    include: { branch: { select: { companyId: true } } },
  });
  if (!staff) throw new Error("Staff member not found");

  const isSelf = staff.userId === viewer.id;
  if (!isSelf) {
    if (!needManage) await requirePermission("hr:manage"); // a non-self read still needs manage
    if (staff.branch.companyId !== viewer.companyId) throw new Error("Access denied");
    const scoped = getScopedBranchId(viewer);
    if (scoped && staff.branchId !== scoped) throw new Error("Access denied");
  }
  return { viewer, staff, isSelf };
}

const serialize = (d: {
  id: string; type: string; title: string; fileUrl: string; fileKind: string | null;
  expiresAt: Date | null; createdAt: Date;
}): StaffDoc => ({
  id: d.id, type: d.type as StaffDoc["type"], title: d.title, fileUrl: d.fileUrl,
  fileKind: d.fileKind, expiresAt: d.expiresAt ? d.expiresAt.toISOString() : null,
  createdAt: d.createdAt.toISOString(),
});

export async function listStaffDocuments(staffMemberId: string): Promise<StaffDoc[]> {
  await staffInScope(staffMemberId, false);
  const docs = await prisma.staffDocument.findMany({
    where: { staffMemberId },
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, title: true, fileUrl: true, fileKind: true, expiresAt: true, createdAt: true },
  });
  return docs.map(serialize);
}

const addSchema = z.object({
  staffMemberId: z.string().min(1),
  type: z.enum(DOC_TYPES),
  title: z.string().min(1).max(120),
  fileUrl: z.string().url().max(2000),
  fileKind: z.string().max(20).optional(),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});

export async function addStaffDocument(raw: z.input<typeof addSchema>) {
  const input = addSchema.parse(raw);
  const { viewer } = await staffInScope(input.staffMemberId, true);

  await prisma.staffDocument.create({
    data: {
      staffMemberId: input.staffMemberId,
      type: input.type,
      title: input.title.trim(),
      fileUrl: input.fileUrl,
      fileKind: input.fileKind ?? null,
      expiresAt: input.expiresAt ? new Date(`${input.expiresAt}T00:00:00.000Z`) : null,
      uploadedById: viewer.id,
    },
  });
  revalidatePath(`/staff/${input.staffMemberId}`);
  revalidatePath("/portal");
  return { success: true };
}

export async function deleteStaffDocument(id: string) {
  const doc = await prisma.staffDocument.findUnique({
    where: { id },
    select: { staffMemberId: true },
  });
  if (!doc) throw new Error("Document not found");
  await staffInScope(doc.staffMemberId, true);

  await prisma.staffDocument.delete({ where: { id } });
  revalidatePath(`/staff/${doc.staffMemberId}`);
  revalidatePath("/portal");
  return { success: true };
}
