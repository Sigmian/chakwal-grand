import { computeMonthlyPayroll } from "./payroll.ts";
import { resolveWorkDate } from "./time.ts";
import { deriveAttendance } from "./attendance.ts";
import { DEFAULT_HR_CONFIG } from "./settings.ts";

const cfg = { ...DEFAULT_HR_CONFIG }; // divisor 30, 2 paid leaves, grace 15
let pass = 0, fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  got=${JSON.stringify(got)}${ok ? "" : ` want=${JSON.stringify(want)}`}`);
  ok ? pass++ : fail++;
};

const base = { monthlySalary: 30000, month: 9, year: 2026, config: cfg, leaves: [], manual: [], holidays: [] as string[] };

// ── Scenario A: one present day earns +1,000 ──
const A = computeMonthlyPayroll({
  ...base, todayStr: "2026-09-01",
  attendance: [{ workDate: "2026-09-01", status: "PRESENT" }],
});
eq("A dailySalary", A.dailySalary, 1000);
eq("A earnedToDate", A.earnedToDate, 1000);
eq("A presentDays", A.presentDays, 1);
eq("A absentDays", A.absentDays, 0);

// ── Scenario B: first approved paid leave — no deduction ──
const B = computeMonthlyPayroll({
  ...base, todayStr: "2026-09-02",
  attendance: [{ workDate: "2026-09-01", status: "PRESENT" }],
  leaves: [{ fromDate: "2026-09-02", toDate: "2026-09-02", paid: true }],
});
eq("B paidLeaveDays", B.paidLeaveDays, 1);
eq("B absenceDeduction", B.absenceDeduction, 0);

// ── Scenario C: second paid leave — still no deduction ──
const C = computeMonthlyPayroll({
  ...base, todayStr: "2026-09-03",
  attendance: [{ workDate: "2026-09-01", status: "PRESENT" }],
  leaves: [
    { fromDate: "2026-09-02", toDate: "2026-09-02", paid: true },
    { fromDate: "2026-09-03", toDate: "2026-09-03", paid: true },
  ],
});
eq("C paidLeaveDays", C.paidLeaveDays, 2);
eq("C totalDeductions", C.totalDeductions, 0);

// ── Scenario D: absence beyond the paid allowance — deduct one daily ──
const D = computeMonthlyPayroll({
  ...base, todayStr: "2026-09-04",
  attendance: [{ workDate: "2026-09-01", status: "PRESENT" }],
  leaves: [
    { fromDate: "2026-09-02", toDate: "2026-09-02", paid: true },
    { fromDate: "2026-09-03", toDate: "2026-09-03", paid: true },
  ],
  // 2026-09-04 has no attendance and no leave → absent
});
eq("D absentDays", D.absentDays, 1);
eq("D absenceDeduction", D.absenceDeduction, 1000);
eq("D netPayable", D.netPayable, 29000);

// ── Section 11 full example: 30000 − 2000 − 500 + 1000 − 5000 = 23500 ──
const S11 = computeMonthlyPayroll({
  ...base, todayStr: "2026-09-05",
  attendance: [
    { workDate: "2026-09-01", status: "PRESENT" },
    { workDate: "2026-09-02", status: "PRESENT" },
    { workDate: "2026-09-03", status: "HALF_DAY" },
    // 09-04, 09-05 absent
  ],
  manual: [
    { kind: "ADVANCE", amount: 5000 },
    { kind: "BONUS", amount: 1000 },
  ],
});
eq("S11 absenceDeduction", S11.absenceDeduction, 2000);
eq("S11 halfDayDeduction", S11.halfDayDeduction, 500);
eq("S11 additions", S11.additions, 1000);
eq("S11 advance", S11.advance, 5000);
eq("S11 netPayable", S11.netPayable, 23500);

// ── Scenario F: overnight shift stays one work-date ──
const night = { startTime: "20:00", endTime: "08:30", crossesMidnight: true };
eq("F evening check-in", resolveWorkDate(new Date("2026-09-12T20:05:00+05:00"), night), "2026-09-12");
eq("F post-midnight check-in", resolveWorkDate(new Date("2026-09-13T00:30:00+05:00"), night), "2026-09-12");
eq("F morning checkout day", resolveWorkDate(new Date("2026-09-13T08:00:00+05:00"), night), "2026-09-12");
const day = { startTime: "08:00", endTime: "20:00", crossesMidnight: false };
eq("F day-shift work-date", resolveWorkDate(new Date("2026-09-12T08:05:00+05:00"), day), "2026-09-12");

// ── Late / on-time / half-day derivation ──
const onTime = deriveAttendance("2026-09-12", day, cfg, new Date("2026-09-12T08:10:00+05:00"), new Date("2026-09-12T20:00:00+05:00"));
eq("derive on-time (within grace)", onTime.status, "PRESENT");
const late = deriveAttendance("2026-09-12", day, cfg, new Date("2026-09-12T08:18:00+05:00"), new Date("2026-09-12T20:00:00+05:00"));
eq("derive late status", late.status, "LATE");
eq("derive late minutes", late.lateMinutes, 18);
const half = deriveAttendance("2026-09-12", day, cfg, new Date("2026-09-12T08:00:00+05:00"), new Date("2026-09-12T11:00:00+05:00"));
eq("derive half-day (< 240 min)", half.status, "HALF_DAY");
const early = deriveAttendance("2026-09-12", day, cfg, new Date("2026-09-12T08:00:00+05:00"), new Date("2026-09-12T18:45:00+05:00"));
eq("derive early checkout", early.status, "EARLY_CHECKOUT");
eq("derive early minutes", early.earlyMinutes, 75);

// ── Overnight payroll: night shift present earns one day on its work-date ──
const F2 = computeMonthlyPayroll({
  ...base, todayStr: "2026-09-12",
  attendance: [{ workDate: "2026-09-12", status: "PRESENT" }],
});
eq("F payroll one work-date", F2.presentDays, 1);

// ── Scenario G: a configured holiday is PAID, not an absence ──
// Day 1 present, day 2 a public holiday with no check-in.
const Gholiday = computeMonthlyPayroll({
  ...base, todayStr: "2026-09-02", holidays: ["2026-09-02"],
  attendance: [{ workDate: "2026-09-01", status: "PRESENT" }],
});
eq("G holidayDays", Gholiday.holidayDays, 1);
eq("G absentDays (holiday not absent)", Gholiday.absentDays, 0);
eq("G absenceDeduction (holiday paid)", Gholiday.absenceDeduction, 0);
eq("G earnedToDate (2 paid days)", Gholiday.earnedToDate, 2000);

// Same setup WITHOUT the holiday configured → day 2 is a deducted absence.
const GnoHoliday = computeMonthlyPayroll({
  ...base, todayStr: "2026-09-02", holidays: [],
  attendance: [{ workDate: "2026-09-01", status: "PRESENT" }],
});
eq("G no-holiday absentDays", GnoHoliday.absentDays, 1);
eq("G no-holiday absenceDeduction", GnoHoliday.absenceDeduction, 1000);

// ── Scenario H: day-based paid-leave allowance (2 days) splits a 3-day leave ──
// A single 3-day paid-eligible leave with a 2-day allowance → 2 paid + 1 unpaid.
const H = computeMonthlyPayroll({
  ...base, todayStr: "2026-09-03",
  attendance: [],
  leaves: [{ fromDate: "2026-09-01", toDate: "2026-09-03", paid: true }],
});
eq("H paidLeaveDays (cap 2)", H.paidLeaveDays, 2);
eq("H unpaidLeaveDays (overflow)", H.unpaidLeaveDays, 1);
eq("H absenceDeduction (1 unpaid day)", H.absenceDeduction, 1000);

// ── Scenario I: allowance spans requests in date order (1 day + 2 days) ──
// First leave (1 day) paid; second leave (2 days) gets 1 paid + 1 unpaid.
const I = computeMonthlyPayroll({
  ...base, todayStr: "2026-09-06",
  attendance: [],
  leaves: [
    { fromDate: "2026-09-01", toDate: "2026-09-01", paid: true },
    { fromDate: "2026-09-05", toDate: "2026-09-06", paid: true },
  ],
});
eq("I paidLeaveDays (cap 2 across requests)", I.paidLeaveDays, 2);
eq("I unpaidLeaveDays", I.unpaidLeaveDays, 1);

// ── Scenario J: manager override pays a leave beyond the allowance (extra) ──
// Override days are always paid and never consume the normal allowance.
const J = computeMonthlyPayroll({
  ...base, todayStr: "2026-09-04",
  attendance: [],
  leaves: [
    { fromDate: "2026-09-01", toDate: "2026-09-02", paid: true },                     // 2 paid, fills allowance
    { fromDate: "2026-09-03", toDate: "2026-09-04", paid: true, override: true },      // 2 extra paid via override
  ],
});
eq("J paidLeaveDays (2 + 2 override)", J.paidLeaveDays, 4);
eq("J unpaidLeaveDays", J.unpaidLeaveDays, 0);
eq("J totalDeductions", J.totalDeductions, 0);

// ── Scenario K: an approved *unpaid* leave still deducts, regardless of allowance ──
const K = computeMonthlyPayroll({
  ...base, todayStr: "2026-09-01",
  attendance: [],
  leaves: [{ fromDate: "2026-09-01", toDate: "2026-09-01", paid: false }],
});
eq("K unpaidLeaveDays", K.unpaidLeaveDays, 1);
eq("K paidLeaveDays", K.paidLeaveDays, 0);
eq("K absenceDeduction", K.absenceDeduction, 1000);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
