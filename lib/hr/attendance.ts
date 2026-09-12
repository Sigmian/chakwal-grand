// ============================================================
// lib/hr/attendance.ts
// Derives an attendance record's status and durations from raw
// check-in / check-out instants and the assigned shift. Pure —
// no database, no clock reads except what is passed in.
// ============================================================

import type { HrConfig } from "./settings";
import { minutesBetween, shiftWindow, type ShiftLike } from "./time";

export type AttendanceStatus =
  | "PRESENT" | "ABSENT" | "APPROVED_LEAVE" | "LATE"
  | "HALF_DAY" | "EARLY_CHECKOUT" | "HOLIDAY" | "WEEKLY_OFF" | "MISSING";

export interface DerivedAttendance {
  status: AttendanceStatus;
  workedMinutes: number;
  lateMinutes: number;   // minutes past scheduled start (only when late)
  earlyMinutes: number;  // minutes left before scheduled end (only when early)
}

/**
 * Classify a work-date's attendance.
 *
 * Precedence: no check-in → MISSING; a short shift → HALF_DAY; a notably
 * early departure → EARLY_CHECKOUT; a late arrival → LATE; otherwise PRESENT.
 * APPROVED_LEAVE / WEEKLY_OFF / HOLIDAY / ABSENT come from other flows, not
 * from a physical check-in, so they are never inferred here.
 */
export function deriveAttendance(
  workDate: string,
  shift: ShiftLike,
  cfg: HrConfig,
  checkInAt: Date | null,
  checkOutAt: Date | null,
  graceOverride?: number | null,
): DerivedAttendance {
  if (!checkInAt) {
    return { status: "MISSING", workedMinutes: 0, lateMinutes: 0, earlyMinutes: 0 };
  }

  const { start, end } = shiftWindow(workDate, shift);
  const grace = graceOverride ?? cfg.graceMinutes;

  const fromStart = minutesBetween(start, checkInAt); // + = after start
  const lateMinutes = fromStart > grace ? fromStart : 0;

  let workedMinutes = 0;
  let earlyMinutes = 0;
  if (checkOutAt) {
    workedMinutes = Math.max(0, minutesBetween(checkInAt, checkOutAt));
    const beforeEnd = minutesBetween(checkOutAt, end); // + = left before end
    earlyMinutes = beforeEnd > cfg.earlyCheckoutMinutes ? beforeEnd : 0;
  }

  let status: AttendanceStatus = "PRESENT";
  if (checkOutAt && workedMinutes > 0 && workedMinutes < cfg.minHalfDayMinutes) {
    status = "HALF_DAY";
  } else if (earlyMinutes > 0) {
    status = "EARLY_CHECKOUT";
  } else if (lateMinutes > 0) {
    status = "LATE";
  }

  return { status, workedMinutes, lateMinutes, earlyMinutes };
}

/** Human "1h 15m" from a minute count. */
export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}
