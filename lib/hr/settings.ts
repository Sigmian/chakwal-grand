// ============================================================
// lib/hr/settings.ts
// HR configuration — the single source of every attendance and
// payroll rule. Nothing here is hard-coded into the engine.
// ============================================================

export interface HrConfig {
  payrollDivisor: number;
  paidLeavesPerMonth: number;
  weeklyOffDays: string[]; // ["SUN"]

  graceMinutes: number;
  autoAbsentAfterMinutes: number;
  minHalfDayMinutes: number;
  earlyCheckoutMinutes: number;

  lateWarnAfterCount: number;
  lateToHalfDayCount: number | null;
  lateToDayCount: number | null;
  halfDayDeductsHalf: boolean;
  earlyCheckoutPenalty: "NONE" | "HALF_DAY";

  // Booking performance bonus (0 threshold disables it).
  bookingBonusThreshold: number;
  bookingBonusAmount: number;
}

export const DEFAULT_HR_CONFIG: HrConfig = {
  payrollDivisor: 30,
  paidLeavesPerMonth: 2,
  weeklyOffDays: [],
  graceMinutes: 15,
  autoAbsentAfterMinutes: 240,
  minHalfDayMinutes: 240,
  earlyCheckoutMinutes: 30,
  lateWarnAfterCount: 3,
  lateToHalfDayCount: null,
  lateToDayCount: null,
  halfDayDeductsHalf: true,
  earlyCheckoutPenalty: "NONE",
  bookingBonusThreshold: 50,
  bookingBonusAmount: 2500,
};

type HrSettingsRow = {
  payrollDivisor: number;
  paidLeavesPerMonth: number;
  weeklyOffDays: string[];
  graceMinutes: number;
  autoAbsentAfterMinutes: number;
  minHalfDayMinutes: number;
  earlyCheckoutMinutes: number;
  lateWarnAfterCount: number;
  lateToHalfDayCount: number | null;
  lateToDayCount: number | null;
  halfDayDeductsHalf: boolean;
  earlyCheckoutPenalty: string;
  bookingBonusThreshold?: number;
  bookingBonusAmount?: unknown; // Prisma Decimal
};

/** Coerce a stored HrSettings row (or null) into a complete engine config. */
export function toHrConfig(row: HrSettingsRow | null | undefined): HrConfig {
  if (!row) return { ...DEFAULT_HR_CONFIG };
  return {
    payrollDivisor: row.payrollDivisor,
    paidLeavesPerMonth: row.paidLeavesPerMonth,
    weeklyOffDays: row.weeklyOffDays,
    graceMinutes: row.graceMinutes,
    autoAbsentAfterMinutes: row.autoAbsentAfterMinutes,
    minHalfDayMinutes: row.minHalfDayMinutes,
    earlyCheckoutMinutes: row.earlyCheckoutMinutes,
    lateWarnAfterCount: row.lateWarnAfterCount,
    lateToHalfDayCount: row.lateToHalfDayCount,
    lateToDayCount: row.lateToDayCount,
    halfDayDeductsHalf: row.halfDayDeductsHalf,
    earlyCheckoutPenalty: row.earlyCheckoutPenalty === "HALF_DAY" ? "HALF_DAY" : "NONE",
    bookingBonusThreshold: row.bookingBonusThreshold ?? DEFAULT_HR_CONFIG.bookingBonusThreshold,
    bookingBonusAmount: row.bookingBonusAmount != null ? Number(row.bookingBonusAmount) : DEFAULT_HR_CONFIG.bookingBonusAmount,
  };
}

export const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
