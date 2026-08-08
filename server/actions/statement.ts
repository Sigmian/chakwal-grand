"use server";

// ============================================================
// server/actions/statement.ts
// Monthly financial statement — one month, every line item.
// Powers the owner-shareable sheet at /finance/statement.
// ============================================================

import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { assertFinanceUnlocked } from "@/lib/auth/finance-pin";
import { getCashRevenueForPeriod } from "@/lib/finance/reporting";

const PKT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Calendar-month boundaries for a specific year/month in Asia/Karachi. */
function pktMonthBounds(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1) - PKT_OFFSET_MS);
  const end   = new Date(Date.UTC(year, month, 1) - PKT_OFFSET_MS - 1);
  return { start, end };
}

export interface StatementRowGuest {
  bookingRef:   string;
  guestName:    string;
  phone:        string;
  cnic:         string | null;
  city:         string | null;
  branch:       string;
  room:         string;
  checkIn:      string;
  checkOut:     string;
  nights:       number;
  guests:       number;
  status:       string;
  source:       string | null;
  baseAmount:   number;
  discount:     number;
  extraCharges: number;
  totalAmount:  number;
  paidAmount:   number;
  balance:      number;
  paymentStatus: string;
}

export interface StatementRowPayment {
  date:       string;
  bookingRef: string;
  guestName:  string;
  branch:     string;
  method:     string;
  reference:  string | null;
  amount:     number;
}

export interface StatementRowExpense {
  date:        string;
  branch:      string;
  type:        string;
  category:    string;
  title:       string;
  description: string | null;
  amount:      number;
}

export interface StatementRowSale {
  date:       string;
  branch:     string;
  type:       string;
  bookingRef: string | null;
  items:      string;
  amount:     number;
}

export interface StatementRowPayroll {
  date:       string;
  staffName:  string;
  branch:     string;
  kind:       string; // "Salary" | "Advance"
  period:     string;
  gross:      number;
  deducted:   number;
  net:        number;
  notes:      string | null;
}

export interface MonthlyStatement {
  year:   number;
  month:  number;
  label:  string;
  branchLabel: string;
  generatedAt: string;
  summary: {
    roomRevenue:      number;
    productRevenue:   number;
    totalRevenue:     number;
    guesthouseExpenses: number;
    inventoryExpenses:  number;
    totalExpenses:    number;
    netProfit:        number;
    profitMargin:     number;
    bookingCount:     number;
    guestCount:       number;
    nightsSold:       number;
    newBookings:      number;
    cancelled:        number;
    outstanding:      number;
    overpaidCredit:   number;
    netReceivable:    number;
    payrollPaid:      number;
    advancesGiven:    number;
  };
  guests:   StatementRowGuest[];
  payments: StatementRowPayment[];
  expenses: StatementRowExpense[];
  sales:    StatementRowSale[];
  payroll:  StatementRowPayroll[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const fmtDate = (d: Date) =>
  new Date(d.getTime() + PKT_OFFSET_MS).toISOString().slice(0, 10);

/**
 * Full financial record for one calendar month (PKT).
 *
 * Bookings are included when they *overlap* the month (a stay spanning the
 * month boundary still belongs on the sheet), while payments, expenses, sales
 * and payroll are included by their transaction date — so the money columns
 * reconcile to the cash actually moved that month.
 */
export async function getMonthlyStatement(
  year: number,
  month: number,
  branchId?: string,
): Promise<MonthlyStatement> {
  const user = await requirePermission("finance:read");
  assertFinanceUnlocked(user.id);

  const now       = new Date();
  const safeYear  = Math.min(2100, Math.max(2000, Math.trunc(year)  || now.getUTCFullYear()));
  const safeMonth = Math.min(12,   Math.max(1,    Math.trunc(month) || now.getUTCMonth() + 1));
  const { start, end } = pktMonthBounds(safeYear, safeMonth);

  const scopedBranchId = getScopedBranchId(user, branchId);

  // Resolve the branches in scope once — Sale has only a `branchId` scalar
  // (no `branch` relation), so it must be filtered by id list.
  const branchesInScope = await prisma.branch.findMany({
    where: scopedBranchId
      ? { id: scopedBranchId }
      : { companyId: user.companyId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const branchIds  = branchesInScope.map((b) => b.id);
  const branchName = new Map(branchesInScope.map((b) => [b.id, b.name]));

  const [bookings, payments, expenses, sales, salaryPayments, advances, revenue] =
    await Promise.all([
      prisma.booking.findMany({
        where: {
          branchId: { in: branchIds },
          // Any stay overlapping the month
          checkInDate:  { lte: end },
          checkOutDate: { gte: start },
        },
        include: {
          customer: { select: { name: true, phone: true, cnic: true, city: true } },
          room:     { select: { number: true, name: true } },
        },
        orderBy: { checkInDate: "asc" },
      }),
      prisma.payment.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          booking:   { branchId: { in: branchIds } },
        },
        include: {
          booking: {
            select: {
              bookingRef: true,
              branchId:   true,
              customer:   { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.expense.findMany({
        where: { branchId: { in: branchIds }, paidAt: { gte: start, lte: end } },
        orderBy: { paidAt: "asc" },
      }),
      prisma.sale.findMany({
        where: { branchId: { in: branchIds }, createdAt: { gte: start, lte: end } },
        include: {
          booking:   { select: { bookingRef: true } },
          lineItems: {
            select: {
              quantity: true,
              inventoryItem: { select: { product: { select: { name: true } } } },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.staffSalaryPayment.findMany({
        where: { branchId: { in: branchIds }, paidAt: { gte: start, lte: end } },
        include: { staffMember: { include: { user: { select: { name: true } } } } },
        orderBy: { paidAt: "asc" },
      }),
      prisma.staffAdvance.findMany({
        where: { branchId: { in: branchIds }, givenAt: { gte: start, lte: end } },
        include: { staffMember: { include: { user: { select: { name: true } } } } },
        orderBy: { givenAt: "asc" },
      }),
      getCashRevenueForPeriod(start, end, scopedBranchId, user.companyId),
    ]);

  // ── Rows ────────────────────────────────────────────────────
  const guests: StatementRowGuest[] = bookings.map((b) => {
    const total = Number(b.totalAmount);
    const paid  = Number(b.paidAmount);
    return {
      bookingRef:   b.bookingRef,
      guestName:    b.customer.name,
      phone:        b.customer.phone,
      cnic:         b.customer.cnic,
      city:         b.customer.city,
      branch:       branchName.get(b.branchId) ?? b.branchId,
      room:         b.room.name ? `${b.room.number} — ${b.room.name}` : b.room.number,
      checkIn:      fmtDate(b.checkInDate),
      checkOut:     fmtDate(b.checkOutDate),
      nights:       b.nights,
      guests:       b.guestCount,
      status:       String(b.status),
      source:       b.source,
      baseAmount:   Number(b.baseAmount),
      discount:     Number(b.discountAmount),
      extraCharges: Number(b.extraCharges),
      totalAmount:  total,
      paidAmount:   paid,
      balance:      total - paid,
      paymentStatus: String(b.paymentStatus),
    };
  });

  const paymentRows: StatementRowPayment[] = payments.map((p) => ({
    date:       fmtDate(p.createdAt),
    bookingRef: p.booking.bookingRef,
    guestName:  p.booking.customer.name,
    branch:     branchName.get(p.booking.branchId) ?? p.booking.branchId,
    method:     String(p.method),
    reference:  p.reference,
    amount:     Number(p.amount),
  }));

  const expenseRows: StatementRowExpense[] = expenses.map((e) => ({
    date:        fmtDate(e.paidAt),
    branch:      branchName.get(e.branchId) ?? e.branchId,
    type:        String(e.expenseType),
    category:    String(e.category),
    title:       e.title,
    description: e.description,
    amount:      Number(e.amount),
  }));

  const saleRows: StatementRowSale[] = sales.map((s) => ({
    date:       fmtDate(s.createdAt),
    branch:     branchName.get(s.branchId) ?? s.branchId,
    type:       String(s.type),
    bookingRef: s.booking?.bookingRef ?? null,
    items:      s.lineItems.map((li) => `${li.inventoryItem.product.name} x${li.quantity}`).join("; "),
    amount:     Number(s.totalAmount),
  }));

  const payrollRows: StatementRowPayroll[] = [
    ...salaryPayments.map((p) => ({
      date:      fmtDate(p.paidAt),
      staffName: p.staffMember.user.name ?? "—",
      branch:    branchName.get(p.branchId) ?? p.branchId,
      kind:      "Salary",
      period:    `${MONTH_NAMES[p.month - 1]} ${p.year}`,
      gross:     Number(p.grossAmount),
      deducted:  Number(p.advanceDeducted),
      net:       Number(p.netAmount),
      notes:     p.notes,
    })),
    ...advances.map((a) => ({
      date:      fmtDate(a.givenAt),
      staffName: a.staffMember.user.name ?? "—",
      branch:    branchName.get(a.branchId) ?? a.branchId,
      kind:      "Advance",
      period:    String(a.status),
      gross:     Number(a.amount),
      deducted:  0,
      net:       Number(a.amount),
      notes:     a.reason,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  // ── Summary ─────────────────────────────────────────────────
  let guesthouseExpenses = 0;
  let inventoryExpenses  = 0;
  for (const e of expenseRows) {
    if (e.type === "INVENTORY") inventoryExpenses += e.amount;
    else guesthouseExpenses += e.amount;
  }

  const totalExpenses = guesthouseExpenses + inventoryExpenses;
  const totalRevenue  = revenue.totalRevenue;
  const netProfit     = totalRevenue - totalExpenses;

  const inMonth = (d: Date) => d >= start && d <= end;

  return {
    year:  safeYear,
    month: safeMonth,
    label: `${MONTH_NAMES[safeMonth - 1]} ${safeYear}`,
    branchLabel: scopedBranchId
      ? (branchName.get(scopedBranchId) ?? "Branch")
      : "All Branches",
    generatedAt: new Date().toISOString(),
    summary: {
      roomRevenue:        revenue.roomRevenue,
      productRevenue:     revenue.productRevenue,
      totalRevenue,
      guesthouseExpenses,
      inventoryExpenses,
      totalExpenses,
      netProfit,
      profitMargin:  totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
      bookingCount:  guests.length,
      guestCount:    guests.reduce((s, g) => s + g.guests, 0),
      nightsSold:    guests.reduce((s, g) => s + g.nights, 0),
      newBookings:   bookings.filter((b) => inMonth(b.createdAt)).length,
      cancelled:     guests.filter((g) => g.status === "CANCELLED").length,
      // Split so the sheet reconciles: outstanding (what guests still owe) less
      // credit already overpaid equals the net of the Balance column.
      outstanding:    guests.reduce((s, g) => s + Math.max(0, g.balance), 0),
      overpaidCredit: guests.reduce((s, g) => s + Math.min(0, g.balance), 0) * -1,
      netReceivable:  guests.reduce((s, g) => s + g.balance, 0),
      payrollPaid:   payrollRows.filter((p) => p.kind === "Salary").reduce((s, p) => s + p.net, 0),
      advancesGiven: payrollRows.filter((p) => p.kind === "Advance").reduce((s, p) => s + p.net, 0),
    },
    guests,
    payments: paymentRows,
    expenses: expenseRows,
    sales:    saleRows,
    payroll:  payrollRows,
  };
}
