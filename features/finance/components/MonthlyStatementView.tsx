"use client";

// ============================================================
// features/finance/components/MonthlyStatementView.tsx
// One month, one sheet — guests, payments, expenses, sales,
// payroll — viewable on screen and exportable as a single CSV
// to hand to the owner.
// ============================================================

import { useEffect, useState } from "react";
import {
  Download, Building2, Calendar, Loader2, Users, Receipt,
  Wallet, Package, BadgeDollarSign, Printer,
} from "lucide-react";
import { getMonthlyStatement, type MonthlyStatement } from "@/server/actions/statement";
import { formatPKR, cn } from "@/utils";

interface Branch { id: string; name: string }
interface Props {
  branches: Branch[];
  defaultBranchId?: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type TabKey = "guests" | "payments" | "expenses" | "sales" | "payroll";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "guests",   label: "Guests",   icon: Users },
  { key: "payments", label: "Payments", icon: Wallet },
  { key: "expenses", label: "Expenses", icon: Receipt },
  { key: "sales",    label: "Sales",    icon: Package },
  { key: "payroll",  label: "Payroll",  icon: BadgeDollarSign },
];

// ── CSV helpers ───────────────────────────────────────────────
/** Quote a value so commas, quotes and newlines survive Excel. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const csvRow = (cells: unknown[]) => cells.map(csvCell).join(",");

function buildCsv(s: MonthlyStatement): string {
  const out: string[] = [];
  const section = (title: string) => { out.push("", title, ""); };

  out.push(csvRow(["CHAKWAL GUEST HOUSE — MONTHLY FINANCIAL STATEMENT"]));
  out.push(csvRow(["Month", s.label]));
  out.push(csvRow(["Branch", s.branchLabel]));
  out.push(csvRow(["Generated", new Date(s.generatedAt).toLocaleString("en-PK")]));

  section("SUMMARY");
  const sm = s.summary;
  out.push(csvRow(["Item", "Amount (PKR)"]));
  out.push(csvRow(["Room Revenue",           sm.roomRevenue.toFixed(2)]));
  out.push(csvRow(["Product / POS Revenue",  sm.productRevenue.toFixed(2)]));
  out.push(csvRow(["TOTAL REVENUE",          sm.totalRevenue.toFixed(2)]));
  out.push(csvRow(["Guesthouse Expenses",    sm.guesthouseExpenses.toFixed(2)]));
  out.push(csvRow(["Inventory Expenses",     sm.inventoryExpenses.toFixed(2)]));
  out.push(csvRow(["TOTAL EXPENSES",         sm.totalExpenses.toFixed(2)]));
  out.push(csvRow(["NET PROFIT",             sm.netProfit.toFixed(2)]));
  out.push(csvRow(["Profit Margin (%)",      sm.profitMargin.toFixed(1)]));
  out.push(csvRow([]));
  out.push(csvRow(["Bookings in month",      sm.bookingCount]));
  out.push(csvRow(["Total guests",           sm.guestCount]));
  out.push(csvRow(["Nights sold",            sm.nightsSold]));
  out.push(csvRow(["New bookings made",      sm.newBookings]));
  out.push(csvRow(["Cancelled",              sm.cancelled]));
  out.push(csvRow(["Outstanding (guests still owe)", sm.outstanding.toFixed(2)]));
  out.push(csvRow(["Less: advance / overpaid credit", sm.overpaidCredit.toFixed(2)]));
  out.push(csvRow(["Net receivable (= Balance column total)", sm.netReceivable.toFixed(2)]));
  out.push(csvRow(["Salaries paid",          sm.payrollPaid.toFixed(2)]));
  out.push(csvRow(["Advances given",         sm.advancesGiven.toFixed(2)]));

  section(`GUESTS / BOOKINGS (${s.guests.length})`);
  out.push(csvRow([
    "Booking Ref", "Guest Name", "Phone", "CNIC", "City", "Branch", "Room",
    "Check In", "Check Out", "Nights", "Guests", "Status", "Source",
    "Base", "Discount", "Extra", "Total", "Paid", "Balance", "Payment Status",
  ]));
  for (const g of s.guests) {
    out.push(csvRow([
      g.bookingRef, g.guestName, g.phone, g.cnic, g.city, g.branch, g.room,
      g.checkIn, g.checkOut, g.nights, g.guests, g.status, g.source,
      g.baseAmount.toFixed(2), g.discount.toFixed(2), g.extraCharges.toFixed(2),
      g.totalAmount.toFixed(2), g.paidAmount.toFixed(2), g.balance.toFixed(2),
      g.paymentStatus,
    ]));
  }
  out.push(csvRow(["TOTAL", "", "", "", "", "", "", "", "",
    s.guests.reduce((a, g) => a + g.nights, 0),
    s.guests.reduce((a, g) => a + g.guests, 0),
    "", "", "", "", "",
    s.guests.reduce((a, g) => a + g.totalAmount, 0).toFixed(2),
    s.guests.reduce((a, g) => a + g.paidAmount, 0).toFixed(2),
    s.guests.reduce((a, g) => a + g.balance, 0).toFixed(2),
    "",
  ]));

  section(`PAYMENTS RECEIVED (${s.payments.length})`);
  out.push(csvRow(["Date", "Booking Ref", "Guest", "Branch", "Method", "Reference", "Amount"]));
  for (const p of s.payments) {
    out.push(csvRow([p.date, p.bookingRef, p.guestName, p.branch, p.method, p.reference, p.amount.toFixed(2)]));
  }
  out.push(csvRow(["TOTAL", "", "", "", "", "", s.payments.reduce((a, p) => a + p.amount, 0).toFixed(2)]));

  section(`EXPENSES (${s.expenses.length})`);
  out.push(csvRow(["Date", "Branch", "Type", "Category", "Title", "Description", "Amount"]));
  for (const e of s.expenses) {
    out.push(csvRow([e.date, e.branch, e.type, e.category, e.title, e.description, e.amount.toFixed(2)]));
  }
  out.push(csvRow(["TOTAL", "", "", "", "", "", s.expenses.reduce((a, e) => a + e.amount, 0).toFixed(2)]));

  section(`PRODUCT / POS SALES (${s.sales.length})`);
  out.push(csvRow(["Date", "Branch", "Type", "Booking Ref", "Items", "Amount"]));
  for (const x of s.sales) {
    out.push(csvRow([x.date, x.branch, x.type, x.bookingRef, x.items, x.amount.toFixed(2)]));
  }
  out.push(csvRow(["TOTAL", "", "", "", "", s.sales.reduce((a, x) => a + x.amount, 0).toFixed(2)]));

  section(`PAYROLL — SALARIES & ADVANCES (${s.payroll.length})`);
  out.push(csvRow(["Date", "Staff", "Branch", "Kind", "Period / Status", "Gross", "Advance Deducted", "Net Paid", "Notes"]));
  for (const p of s.payroll) {
    out.push(csvRow([p.date, p.staffName, p.branch, p.kind, p.period,
      p.gross.toFixed(2), p.deducted.toFixed(2), p.net.toFixed(2), p.notes]));
  }
  out.push(csvRow(["TOTAL", "", "", "", "", "", "", s.payroll.reduce((a, p) => a + p.net, 0).toFixed(2), ""]));

  return out.join("\r\n");
}

// ── Component ─────────────────────────────────────────────────
export function MonthlyStatementView({ branches, defaultBranchId }: Props) {
  const now = new Date();
  // Default to last completed month — that's the sheet an owner usually wants.
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

  const [year,  setYear]  = useState(lastMonth.getUTCFullYear());
  const [month, setMonth] = useState(lastMonth.getUTCMonth() + 1);
  const [branchId, setBranchId] = useState(defaultBranchId ?? "");
  const [data, setData] = useState<MonthlyStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("guests");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getMonthlyStatement(year, month, branchId || undefined)
      .then((d) => { if (active) setData(d); })
      .catch(() => {
        if (!active) return;
        setError("Could not load the statement. Please try again.");
        setData(null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [year, month, branchId]);

  function handleExport() {
    if (!data) return;
    // BOM keeps ₨ / — readable when Excel opens the file.
    const blob = new Blob(["﻿" + buildCsv(data)], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    const slug = data.branchLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    a.href = url;
    a.download = `CGH-statement-${data.year}-${String(data.month).padStart(2, "0")}-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const years = Array.from({ length: 5 }, (_, i) => now.getUTCFullYear() - i);
  const sm = data?.summary;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <select
            aria-label="Month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold-500/50"
          >
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select
            aria-label="Year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold-500/50"
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {!defaultBranchId && branches.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <select
              aria-label="Branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold-500/50"
            >
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={() => window.print()}
          disabled={!data}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-gold-500/40 transition-all disabled:opacity-50"
        >
          <Printer className="w-4 h-4" /> Print / PDF
        </button>
        <button
          onClick={handleExport}
          disabled={!data || loading}
          className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-50"
        >
          <Download className="w-4 h-4" /> Export Full Sheet (CSV)
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          Building statement…
        </div>
      )}

      {!loading && data && sm && (
        <>
          {/* Statement header */}
          <div className="card-luxury p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold font-serif text-foreground">
                  {data.label} — Financial Statement
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {data.branchLabel} · {sm.bookingCount} booking{sm.bookingCount !== 1 ? "s" : ""} ·{" "}
                  {sm.nightsSold} night{sm.nightsSold !== 1 ? "s" : ""} sold
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Net Profit</p>
                <p className={cn(
                  "text-2xl font-bold font-serif",
                  sm.netProfit >= 0 ? "text-green-400" : "text-red-400",
                )}>
                  {formatPKR(sm.netProfit)}
                </p>
              </div>
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Room Revenue",     value: formatPKR(sm.roomRevenue),     color: "text-gold-400" },
              { label: "Product Revenue",  value: formatPKR(sm.productRevenue),  color: "text-gold-400" },
              { label: "Total Revenue",    value: formatPKR(sm.totalRevenue),    color: "text-green-400" },
              { label: "Total Expenses",   value: formatPKR(sm.totalExpenses),   color: "text-red-400" },
              { label: "Guesthouse Exp.",  value: formatPKR(sm.guesthouseExpenses), color: "text-foreground" },
              { label: "Inventory Exp.",   value: formatPKR(sm.inventoryExpenses),  color: "text-foreground" },
              { label: "Outstanding (owed)", value: formatPKR(sm.outstanding),
                color: sm.outstanding > 0 ? "text-amber-400" : "text-muted-foreground" },
              { label: "Profit Margin",    value: `${sm.profitMargin.toFixed(1)}%`,
                color: sm.profitMargin >= 0 ? "text-green-400" : "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="card-luxury p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className={cn("text-lg font-bold font-serif mt-1", color)}>{value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 print:hidden">
            {TABS.map(({ key, label, icon: Icon }) => {
              const count = data[key].length;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                    tab === key
                      ? "bg-gold-500/15 border-gold-500/40 text-gold-300"
                      : "bg-surface-elevated border-border text-muted-foreground hover:text-foreground hover:border-gold-500/30",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Tables */}
          <div className="card-luxury overflow-hidden">
            <div className="overflow-x-auto">
              {tab === "guests" && (
                <Table
                  head={["Booking", "Guest", "Phone", "Room", "Check In", "Check Out", "Nights", "Total", "Paid", "Balance", "Status"]}
                  rows={data.guests.map((g) => [
                    g.bookingRef, g.guestName, g.phone, g.room, g.checkIn, g.checkOut,
                    String(g.nights), formatPKR(g.totalAmount), formatPKR(g.paidAmount),
                    formatPKR(g.balance), g.status,
                  ])}
                  empty="No bookings in this month"
                />
              )}
              {tab === "payments" && (
                <Table
                  head={["Date", "Booking", "Guest", "Method", "Reference", "Amount"]}
                  rows={data.payments.map((p) => [
                    p.date, p.bookingRef, p.guestName, p.method, p.reference ?? "—", formatPKR(p.amount),
                  ])}
                  empty="No payments received in this month"
                />
              )}
              {tab === "expenses" && (
                <Table
                  head={["Date", "Branch", "Type", "Category", "Title", "Amount"]}
                  rows={data.expenses.map((e) => [
                    e.date, e.branch, e.type, e.category, e.title, formatPKR(e.amount),
                  ])}
                  empty="No expenses recorded in this month"
                />
              )}
              {tab === "sales" && (
                <Table
                  head={["Date", "Branch", "Type", "Booking", "Items", "Amount"]}
                  rows={data.sales.map((x) => [
                    x.date, x.branch, x.type, x.bookingRef ?? "—", x.items || "—", formatPKR(x.amount),
                  ])}
                  empty="No product sales in this month"
                />
              )}
              {tab === "payroll" && (
                <Table
                  head={["Date", "Staff", "Branch", "Kind", "Period / Status", "Net Paid"]}
                  rows={data.payroll.map((p) => [
                    p.date, p.staffName, p.branch, p.kind, p.period, formatPKR(p.net),
                  ])}
                  empty="No salary payments or advances in this month"
                />
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center print:hidden">
            The CSV export contains every section above in a single file — ready to share.
          </p>
        </>
      )}
    </div>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: string[][]; empty: string }) {
  if (rows.length === 0) {
    return <div className="p-10 text-center text-sm text-muted-foreground">{empty}</div>;
  }
  return (
    <table className="data-table w-full">
      <thead>
        <tr>{head.map((h) => <th key={h}>{h}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j} className={j === 0 ? "font-medium text-foreground whitespace-nowrap" : "whitespace-nowrap"}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
