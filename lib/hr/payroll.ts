// ============================================================
// lib/hr/payroll.ts
// The payroll engine. One pure function turns a month of
// attendance + approved leaves + manual adjustments into a
// fully itemised, non-double-counted salary breakdown.
//
// Model (matches CGH policy):
//   dailySalary   = monthlySalary / payrollDivisor
//   Gross         = monthlySalary (contractual)
//   Deductions    = dailySalary × unpaid days  (absent + unpaid leave)
//                 + half-day, late and early-checkout penalties (configurable)
//                 + manual fines
//   Net Payable   = Gross − Deductions + Additions − Advance
//
// Weekly-offs, holidays and *approved paid* leaves are paid days: they earn
// the daily salary and never deduct, so a normal full month reaches the full
// monthly salary.
// ============================================================

import type { HrConfig } from "./settings";
import type { AttendanceStatus } from "./attendance";
import { daysInMonth, weekdayOf } from "./time";

export interface AttendanceInput {
  workDate: string;               // YYYY-MM-DD
  status: AttendanceStatus;
  lateMinutes?: number;
  earlyMinutes?: number;
}

export interface LeaveInput {
  fromDate: string;               // YYYY-MM-DD
  toDate: string;                 // YYYY-MM-DD
  paid: boolean;                  // decided at approval
}

export type ManualKind =
  | "BONUS" | "COMMISSION" | "OVERTIME" | "ADJUSTMENT" | "FINE" | "ADVANCE";

export interface ManualEntry {
  kind: ManualKind;
  amount: number;                 // always positive; sign implied by kind
  description?: string;
}

export interface LedgerLine {
  date: string;
  label: string;
  credit: number;                 // 0 or +daily
  deduction: number;              // 0 or +amount (shown as −)
  balance: number;                // running earned balance
}

export interface PayrollResult {
  month: number;
  year: number;
  monthlySalary: number;
  dailySalary: number;

  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  halfDays: number;
  lateCount: number;
  earlyCount: number;
  weeklyOffDays: number;
  holidayDays: number;
  missingDays: number;            // shifts with no check-in, not yet resolved

  absenceDeduction: number;
  halfDayDeduction: number;
  lateDeduction: number;
  earlyDeduction: number;
  manualDeductions: number;

  additions: number;
  advance: number;

  grossSalary: number;
  totalDeductions: number;
  netPayable: number;

  earnedToDate: number;           // dashboard progress = pay accrued on paid days so far
  ledger: LedgerLine[];
}

export interface PayrollParams {
  monthlySalary: number;
  month: number;                  // 1-12
  year: number;
  config: HrConfig;
  attendance: AttendanceInput[];
  leaves: LeaveInput[];           // approved leaves only
  manual: ManualEntry[];
  /** "today" as YYYY-MM-DD (PKT). Days after this are ignored (future). */
  todayStr: string;
  /** Explicit holiday business dates (YYYY-MM-DD). */
  holidays?: string[];
}

const r2 = (n: number) => Math.round(n * 100) / 100;

export function computeMonthlyPayroll(p: PayrollParams): PayrollResult {
  const { monthlySalary, month, year, config, todayStr } = p;
  const divisor = Math.max(1, config.payrollDivisor);
  const daily = monthlySalary / divisor;
  const dim = daysInMonth(year, month);

  const attByDate = new Map(p.attendance.map((a) => [a.workDate, a]));
  const holidaySet = new Set(p.holidays ?? []);

  // Expand approved leaves into a per-date paid/unpaid map.
  const leaveByDate = new Map<string, boolean>(); // date -> paid
  for (const lv of p.leaves) {
    let d = lv.fromDate;
    while (d <= lv.toDate) {
      // A day already covered as paid stays paid.
      leaveByDate.set(d, (leaveByDate.get(d) ?? false) || lv.paid);
      d = nextDate(d);
    }
  }

  let presentDays = 0, paidLeaveDays = 0, unpaidLeaveDays = 0, absentDays = 0;
  let halfDays = 0, lateCount = 0, earlyCount = 0, weeklyOffDays = 0, holidayDays = 0;
  let missingDays = 0;
  let creditDays = 0, halfCreditDays = 0;

  const ledger: LedgerLine[] = [];
  let balance = 0;
  const pad = (d: number) => String(d).padStart(2, "0");

  for (let day = 1; day <= dim; day++) {
    const dateStr = `${year}-${pad(month)}-${pad(day)}`;
    if (dateStr > todayStr) continue; // future day — not yet earned or missed

    const att = attByDate.get(dateStr);
    const leavePaid = leaveByDate.get(dateStr);
    const isWeeklyOff = config.weeklyOffDays.includes(weekdayOf(year, month, day));
    const isHoliday = holidaySet.has(dateStr);

    let credit = 0, deduction = 0, label = "";

    if (att && (att.status === "PRESENT" || att.status === "LATE" || att.status === "EARLY_CHECKOUT")) {
      presentDays++; creditDays++; credit = daily; label = att.status === "LATE" ? "Present (late)" : att.status === "EARLY_CHECKOUT" ? "Present (early out)" : "Present";
      if (att.status === "LATE") lateCount++;
      if (att.status === "EARLY_CHECKOUT") earlyCount++;
    } else if (att && att.status === "HALF_DAY") {
      halfDays++; halfCreditDays++; credit = daily / 2; deduction = config.halfDayDeductsHalf ? daily / 2 : 0;
      label = "Half day";
    } else if (att && att.status === "HOLIDAY") {
      holidayDays++; creditDays++; credit = daily; label = "Holiday";
    } else if (att && att.status === "WEEKLY_OFF") {
      weeklyOffDays++; creditDays++; credit = daily; label = "Weekly off";
    } else if (att && att.status === "APPROVED_LEAVE") {
      // Approval already stamped paid/unpaid; fall through to leave handling.
      if (leavePaid ?? false) { paidLeaveDays++; creditDays++; credit = daily; label = "Approved paid leave"; }
      else { unpaidLeaveDays++; deduction = daily; label = "Unpaid leave"; }
    } else if (leavePaid !== undefined) {
      if (leavePaid) { paidLeaveDays++; creditDays++; credit = daily; label = "Approved paid leave"; }
      else { unpaidLeaveDays++; deduction = daily; label = "Unpaid leave"; }
    } else if (isHoliday) {
      holidayDays++; creditDays++; credit = daily; label = "Holiday";
    } else if (isWeeklyOff) {
      weeklyOffDays++; creditDays++; credit = daily; label = "Weekly off";
    } else if (att && att.status === "MISSING") {
      missingDays++; label = "Check-in missing"; // not yet counted as absence
    } else {
      // A working day with no attendance and no leave — an absence.
      absentDays++; deduction = daily; label = "Absent";
    }

    balance = r2(balance + credit);
    ledger.push({ date: dateStr, label, credit: r2(credit), deduction: r2(deduction), balance });
  }

  // ── penalties from configurable late/early rules ──
  const absenceDeduction = r2(daily * (absentDays + unpaidLeaveDays));
  const halfDayDeduction = r2(config.halfDayDeductsHalf ? (daily / 2) * halfDays : 0);

  let lateDeduction = 0;
  if (config.lateToDayCount && config.lateToDayCount > 0) {
    lateDeduction = r2(Math.floor(lateCount / config.lateToDayCount) * daily);
  } else if (config.lateToHalfDayCount && config.lateToHalfDayCount > 0) {
    lateDeduction = r2(Math.floor(lateCount / config.lateToHalfDayCount) * (daily / 2));
  }

  const earlyDeduction = r2(config.earlyCheckoutPenalty === "HALF_DAY" ? (daily / 2) * earlyCount : 0);

  // ── manual adjustments ──
  let additions = 0, manualDeductions = 0, advance = 0;
  for (const m of p.manual) {
    const amt = Math.abs(m.amount);
    if (m.kind === "BONUS" || m.kind === "COMMISSION" || m.kind === "OVERTIME") additions += amt;
    else if (m.kind === "ADJUSTMENT") additions += m.amount; // signed adjustment
    else if (m.kind === "FINE") manualDeductions += amt;
    else if (m.kind === "ADVANCE") advance += amt;
  }
  additions = r2(additions);
  manualDeductions = r2(manualDeductions);
  advance = r2(advance);

  const grossSalary = r2(monthlySalary);
  const totalDeductions = r2(absenceDeduction + halfDayDeduction + lateDeduction + earlyDeduction + manualDeductions);
  const netPayable = r2(grossSalary - totalDeductions + additions - advance);
  const earnedToDate = r2(daily * creditDays + (daily / 2) * halfCreditDays);

  return {
    month, year,
    monthlySalary: r2(monthlySalary),
    dailySalary: r2(daily),
    presentDays, paidLeaveDays, unpaidLeaveDays, absentDays, halfDays,
    lateCount, earlyCount, weeklyOffDays, holidayDays, missingDays,
    absenceDeduction, halfDayDeduction, lateDeduction, earlyDeduction, manualDeductions,
    additions, advance,
    grossSalary, totalDeductions, netPayable, earnedToDate,
    ledger,
  };
}

function nextDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * How many of a month's approved leaves are paid, honouring the monthly
 * allowance in order of approval. Used at approval time to stamp each leave.
 */
export function paidLeaveDecision(
  approvedPaidCountThisMonth: number,
  allowance: number,
): { paid: boolean; remainingAfter: number } {
  const paid = approvedPaidCountThisMonth < allowance;
  const remainingAfter = Math.max(0, allowance - approvedPaidCountThisMonth - (paid ? 1 : 0));
  return { paid, remainingAfter };
}
