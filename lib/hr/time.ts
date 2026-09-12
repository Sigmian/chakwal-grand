// ============================================================
// lib/hr/time.ts
// Pakistan-time (Asia/Karachi, UTC+5, no DST) helpers for
// attendance. All business dates are computed in PKT so a night
// shift never lands on the wrong calendar day.
// ============================================================

export const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** "08:00" -> minutes past midnight (480). */
export function parseHM(hm: string): number {
  const [h, m] = hm.split(":").map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}

/** A `YYYY-MM-DD` string for the PKT calendar day of an instant. */
export function pktDateStr(d: Date): string {
  return new Date(d.getTime() + PKT_OFFSET_MS).toISOString().slice(0, 10);
}

/** UTC instant for midnight (00:00 PKT) of a `YYYY-MM-DD` business date. */
export function pktMidnight(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+05:00`);
}

/** UTC instant for a `HH:MM` wall-clock time on a PKT business date. */
export function pktInstant(dateStr: string, hm: string): Date {
  return new Date(`${dateStr}T${hm.padStart(5, "0")}:00+05:00`);
}

export function minutesBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 60000);
}

export interface ShiftLike {
  startTime: string;      // "08:00"
  endTime: string;        // "20:00" (or "08:30" for a night shift)
  crossesMidnight: boolean;
}

/** Scheduled start/end instants for a shift on a given business date. */
export function shiftWindow(dateStr: string, shift: ShiftLike): { start: Date; end: Date } {
  const start = pktInstant(dateStr, shift.startTime);
  let end = pktInstant(dateStr, shift.endTime);
  if (shift.crossesMidnight || parseHM(shift.endTime) <= parseHM(shift.startTime)) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000); // ends next calendar day
  }
  return { start, end };
}

/**
 * The business date a check-in belongs to.
 *
 * For a day shift this is simply the PKT date of the check-in. For a shift
 * that crosses midnight, an early-morning check-in (before the shift's end
 * hour) belongs to the *previous* day's shift, so the whole overnight stint
 * stays one attendance record.
 */
export function resolveWorkDate(checkIn: Date, shift: ShiftLike): string {
  const today = pktDateStr(checkIn);
  if (!shift.crossesMidnight && parseHM(shift.endTime) > parseHM(shift.startTime)) {
    return today;
  }
  // Overnight shift: is this check-in before the start time (i.e. the small
  // hours of the morning)? Then it belongs to yesterday's shift.
  const localMin = minutesBetween(pktMidnight(today), checkIn);
  if (localMin < parseHM(shift.startTime)) {
    const prev = new Date(pktMidnight(today).getTime() - 12 * 60 * 60 * 1000);
    return pktDateStr(prev);
  }
  return today;
}

/** Days in a month (1-indexed month). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Weekday code (SUN..SAT) for a business date in the month. */
export function weekdayOf(year: number, month: number, day: number): string {
  const codes = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return codes[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}
