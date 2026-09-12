"use server";

// ============================================================
// server/actions/attendance.ts
// Staff-facing attendance: self check-in / check-out, leave and
// correction requests, and the portal dashboard. All writes are
// server-derived — a staffer can never set their own status,
// time, or salary.
// ============================================================

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { getHrConfig } from "@/lib/hr/config";
import { deriveAttendance } from "@/lib/hr/attendance";
import { resolveWorkDate, pktDateStr, type ShiftLike } from "@/lib/hr/time";
import { getStaffPayroll, getPaidLeaveUsage } from "@/server/actions/hr";

// Distance between two lat/lng points in metres (haversine).
function metersBetween(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** The current staff member for the signed-in user, with shift + company. */
async function requireStaffSelf() {
  const user = await requireAuth();
  const staff = await prisma.staffMember.findUnique({
    where: { userId: user.id },
    include: {
      assignedShift: true,
      branch: { select: { id: true, companyId: true, name: true } },
    },
  });
  if (!staff) throw new Error("Your account is not linked to a staff profile.");
  return { user, staff };
}

const dbDate = (dateStr: string) => new Date(`${dateStr}T00:00:00.000Z`);

export interface CheckPayload {
  lat?: number;
  lng?: number;
  selfie?: string; // base64 data URL
}

const checkSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
  selfie: z.string().max(2_000_000).optional(), // ~2MB cap
});

// Shared guard: enforce selfie/geo settings before writing.
async function verifyPresence(companyId: string, p: CheckPayload) {
  const cfg = await prisma.hrSettings.findUnique({ where: { companyId } });
  if (!cfg) return;
  if (cfg.requireSelfie && !p.selfie) {
    throw new Error("A live attendance photo is required. Please allow the camera and try again.");
  }
  if (cfg.requireGeo) {
    if (p.lat === undefined || p.lng === undefined) {
      throw new Error("Location is required to mark attendance. Please allow location access.");
    }
    if (cfg.geoLat != null && cfg.geoLng != null) {
      const d = metersBetween(cfg.geoLat, cfg.geoLng, p.lat, p.lng);
      if (d > cfg.geoRadiusMeters) {
        throw new Error("You appear to be away from the guest house. Attendance can only be marked on-site.");
      }
    }
  }
}

export async function checkIn(raw: CheckPayload = {}) {
  const p = checkSchema.parse(raw);
  const { staff } = await requireStaffSelf();
  if (!staff.assignedShift) throw new Error("No shift is assigned to you. Please contact your manager.");

  await verifyPresence(staff.branch.companyId, p);

  const shift = staff.assignedShift as ShiftLike;
  const cfg = await getHrConfig(staff.branch.companyId);
  const now = new Date();
  const workDate = resolveWorkDate(now, shift);

  const existing = await prisma.attendance.findUnique({
    where: { staffMemberId_workDate: { staffMemberId: staff.id, workDate: dbDate(workDate) } },
  });
  if (existing?.checkInAt) throw new Error("You have already checked in for this shift.");
  if (existing?.isLocked) throw new Error("This day is locked. Contact your manager.");

  const d = deriveAttendance(workDate, shift, cfg, now, null, staff.assignedShift.graceMinutes);

  const data = {
    staffMemberId: staff.id,
    branchId: staff.branchId,
    shiftId: staff.assignedShift.id,
    workDate: dbDate(workDate),
    checkInAt: now,
    status: d.status as never,
    lateMinutes: d.lateMinutes,
    source: "SELF" as never,
    selfieUrl: p.selfie ?? null,
    geoLat: p.lat ?? null,
    geoLng: p.lng ?? null,
  };

  if (existing) {
    await prisma.attendance.update({ where: { id: existing.id }, data });
  } else {
    await prisma.attendance.create({ data });
  }

  revalidatePath("/portal");
  return { success: true, status: d.status, lateMinutes: d.lateMinutes };
}

export async function checkOut(raw: CheckPayload = {}) {
  const p = checkSchema.parse(raw);
  const { staff } = await requireStaffSelf();
  if (!staff.assignedShift) throw new Error("No shift is assigned to you.");

  await verifyPresence(staff.branch.companyId, p);

  const shift = staff.assignedShift as ShiftLike;
  const cfg = await getHrConfig(staff.branch.companyId);
  const now = new Date();
  const workDate = resolveWorkDate(now, shift);

  const att = await prisma.attendance.findUnique({
    where: { staffMemberId_workDate: { staffMemberId: staff.id, workDate: dbDate(workDate) } },
  });
  if (!att?.checkInAt) throw new Error("Please check in first.");
  if (att.checkOutAt) throw new Error("You have already checked out.");
  if (att.isLocked) throw new Error("This day is locked. Contact your manager.");

  const d = deriveAttendance(workDate, shift, cfg, att.checkInAt, now, staff.assignedShift.graceMinutes);

  await prisma.attendance.update({
    where: { id: att.id },
    data: {
      checkOutAt: now,
      status: d.status as never,
      workedMinutes: d.workedMinutes,
      earlyMinutes: d.earlyMinutes,
    },
  });

  revalidatePath("/portal");
  return { success: true, status: d.status, workedMinutes: d.workedMinutes, earlyMinutes: d.earlyMinutes };
}

// ─── Leave request (staff) ────────────────────────────────────
const leaveSchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason:   z.string().min(3).max(300),
  notes:    z.string().max(500).optional(),
});

export async function requestLeave(raw: z.input<typeof leaveSchema>) {
  const input = leaveSchema.parse(raw);
  const { staff } = await requireStaffSelf();
  if (input.toDate < input.fromDate) throw new Error("End date is before start date.");

  await prisma.leaveRequest.create({
    data: {
      staffMemberId: staff.id,
      branchId: staff.branchId,
      fromDate: dbDate(input.fromDate),
      toDate: dbDate(input.toDate),
      reason: input.reason,
      notes: input.notes ?? null,
      status: "PENDING",
    },
  });
  revalidatePath("/portal");
  return { success: true };
}

// ─── Attendance correction request (staff) ────────────────────
const correctionSchema = z.object({
  workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkIn:  z.string().optional(),  // "HH:MM"
  checkOut: z.string().optional(),
  reason:   z.string().min(3).max(300),
});

export async function requestCorrection(raw: z.input<typeof correctionSchema>) {
  const input = correctionSchema.parse(raw);
  const { staff } = await requireStaffSelf();

  const toInstant = (hm?: string) =>
    hm && /^\d{2}:\d{2}$/.test(hm) ? new Date(`${input.workDate}T${hm}:00+05:00`) : null;

  await prisma.attendanceCorrectionRequest.create({
    data: {
      staffMemberId: staff.id,
      branchId: staff.branchId,
      workDate: dbDate(input.workDate),
      requestedCheckIn: toInstant(input.checkIn),
      requestedCheckOut: toInstant(input.checkOut),
      reason: input.reason,
      status: "PENDING",
    },
  });
  revalidatePath("/portal");
  return { success: true };
}

// ─── Announcement acknowledgement (staff) ─────────────────────
export async function acknowledgeAnnouncement(announcementId: string) {
  const { staff } = await requireStaffSelf();
  const ann = await prisma.announcement.findUnique({ where: { id: announcementId }, select: { id: true } });
  if (!ann) throw new Error("Announcement not found.");

  await prisma.announcementAck.upsert({
    where: { announcementId_staffMemberId: { announcementId, staffMemberId: staff.id } },
    update: {},
    create: { announcementId, staffMemberId: staff.id },
  });
  revalidatePath("/portal");
  return { success: true };
}

// ─── Portal dashboard ─────────────────────────────────────────
export async function getMyDashboard() {
  const { user, staff } = await requireStaffSelf();
  const now = new Date();
  const todayStr = pktDateStr(now);
  const month = Number(todayStr.slice(5, 7));
  const year = Number(todayStr.slice(0, 4));

  const shift = staff.assignedShift as ShiftLike | null;
  const workDate = shift ? resolveWorkDate(now, shift) : todayStr;

  const [today, payroll, leaveUsage, announcements, pendingLeaves, pendingCorrections, hrCfg] = await Promise.all([
    prisma.attendance.findUnique({
      where: { staffMemberId_workDate: { staffMemberId: staff.id, workDate: dbDate(workDate) } },
      select: { status: true, checkInAt: true, checkOutAt: true, workedMinutes: true, lateMinutes: true, earlyMinutes: true },
    }),
    getStaffPayroll(staff.id, month, year),
    getPaidLeaveUsage(staff.id, month, year),
    prisma.announcement.findMany({
      where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      orderBy: { createdAt: "desc" }, take: 5,
      select: { id: true, title: true, body: true, createdAt: true },
    }),
    prisma.leaveRequest.findMany({
      where: { staffMemberId: staff.id, status: "PENDING" },
      orderBy: { createdAt: "desc" }, take: 5,
      select: { id: true, fromDate: true, toDate: true, reason: true, status: true },
    }),
    prisma.attendanceCorrectionRequest.count({ where: { staffMemberId: staff.id, status: "PENDING" } }),
    prisma.hrSettings.findUnique({ where: { companyId: staff.branch.companyId }, select: { requireSelfie: true, requireGeo: true } }),
  ]);

  const documents = await prisma.staffDocument.findMany({
    where: { staffMemberId: staff.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, type: true, title: true, fileUrl: true, fileKind: true, expiresAt: true, createdAt: true },
  });

  // Which of the shown announcements this staffer has already acknowledged.
  const ackedIds = announcements.length
    ? new Set(
        (await prisma.announcementAck.findMany({
          where: { staffMemberId: staff.id, announcementId: { in: announcements.map((a) => a.id) } },
          select: { announcementId: true },
        })).map((a) => a.announcementId),
      )
    : new Set<string>();

  return {
    staff: {
      name: user.name,
      branch: staff.branch.name,
      designation: staff.designation,
      shift: staff.assignedShift
        ? { name: staff.assignedShift.name, startTime: staff.assignedShift.startTime, endTime: staff.assignedShift.endTime, crossesMidnight: staff.assignedShift.crossesMidnight }
        : null,
      salary: Number(staff.salary ?? 0),
    },
    today: {
      workDate,
      status: today?.status ?? null,
      checkInAt: today?.checkInAt?.toISOString() ?? null,
      checkOutAt: today?.checkOutAt?.toISOString() ?? null,
      workedMinutes: today?.workedMinutes ?? 0,
      lateMinutes: today?.lateMinutes ?? 0,
      earlyMinutes: today?.earlyMinutes ?? 0,
    },
    month: {
      label: new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", { month: "long" }) + " " + year,
      presentDays: payroll.presentDays,
      absentDays: payroll.absentDays,
      halfDays: payroll.halfDays,
      lateCount: payroll.lateCount,
      earlyCount: payroll.earlyCount,
      monthlySalary: payroll.monthlySalary,
      earnedToDate: payroll.earnedToDate,
      totalDeductions: payroll.totalDeductions,
      advance: payroll.advance,
      netPayable: payroll.netPayable,
    },
    paidLeave: leaveUsage,
    require: { selfie: hrCfg?.requireSelfie ?? false, geo: hrCfg?.requireGeo ?? false },
    announcements: announcements.map((a) => ({ ...a, createdAt: a.createdAt.toISOString(), acknowledged: ackedIds.has(a.id) })),
    pendingLeaves: pendingLeaves.map((l) => ({
      id: l.id, from: l.fromDate.toISOString().slice(0, 10), to: l.toDate.toISOString().slice(0, 10), reason: l.reason,
    })),
    pendingCorrections,
    documents: documents.map((d) => ({
      id: d.id, type: d.type, title: d.title, fileUrl: d.fileUrl, fileKind: d.fileKind,
      expiresAt: d.expiresAt ? d.expiresAt.toISOString() : null, createdAt: d.createdAt.toISOString(),
    })),
  };
}
