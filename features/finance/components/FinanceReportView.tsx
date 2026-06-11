// ============================================================
// features/finance/components/FinanceReportView.tsx
// P&L report: revenue, expenses, profit by month and category
// ============================================================

"use client";

import { useState, useTransition, useEffect } from "react";
import {
  TrendingUp, TrendingDown, DollarSign,
  Download, Building2, Calendar,
} from "lucide-react";
import { cn, formatPKR } from "@/utils";
import { RevenueAreaChart } from "@/components/charts/RevenueChart";

interface MonthlyData {
  label:          string;
  month?:         number;
  year?:          number;
  roomRevenue:    number;
  productRevenue: number;
  expenses:       number;
  profit:         number;
}

interface Branch {
  id:   string;
  name: string;
}

interface Props {
  branches: Branch[];
  defaultBranchId?: string;
}

async function fetchReportData(branchId?: string, months: number = 6): Promise<MonthlyData[]> {
  // Dynamic import to keep server actions server-only
  const { getRevenueChartData } = await import("@/server/actions/analytics");
  return getRevenueChartData(branchId);
}

const CATEGORY_EXPENSE_MOCK = [
  { category: "Staff Salary",        amount: 450000, pct: 42 },
  { category: "Electricity",         amount: 120000, pct: 11 },
  { category: "Inventory Purchase",  amount: 95000,  pct: 9  },
  { category: "Maintenance",         amount: 75000,  pct: 7  },
  { category: "Marketing",           amount: 55000,  pct: 5  },
  { category: "Gas & Utilities",     amount: 42000,  pct: 4  },
  { category: "Other",               amount: 163000, pct: 15 },
];

export function FinanceReportView({ branches, defaultBranchId }: Props) {
  const [branchId, setBranchId]   = useState(defaultBranchId ?? "");
  const [months, setMonths]       = useState(6);
  const [data, setData]           = useState<MonthlyData[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchReportData(branchId || undefined, months)
      .then(setData)
      .finally(() => setLoading(false));
  }, [branchId, months]);

  const totalRevenue  = data.reduce((s, d) => s + d.roomRevenue + d.productRevenue, 0);
  const totalExpenses = data.reduce((s, d) => s + d.expenses, 0);
  const totalProfit   = data.reduce((s, d) => s + d.profit, 0);
  const profitMargin  = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const handleExport = (format: "pdf" | "csv") => {
    // Build CSV export
    if (format === "csv") {
      const rows = [
        ["Month", "Room Revenue", "Product Revenue", "Expenses", "Profit"],
        ...data.map(d => [
          d.label,
          d.roomRevenue,
          d.productRevenue,
          d.expenses,
          d.profit,
        ]),
      ];
      const csv  = rows.map(r => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `finance-report-${new Date().toISOString().slice(0, 7)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {!defaultBranchId && branches.length > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <select
              value={branchId}
              onChange={e => setBranchId(e.target.value)}
              className="bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold-500/50"
            >
              <option value="">All Branches</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <select
            value={months}
            onChange={e => setMonths(Number(e.target.value))}
            className="bg-surface-elevated border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold-500/50"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>
        </div>

        <div className="flex-1" />

        <div className="flex gap-2">
          <button
            onClick={() => handleExport("csv")}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-gold-500/40 transition-all"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: formatPKR(totalRevenue),
            sub:   `${months}m period`,
            icon:  DollarSign,
            color: "text-gold-400",
            bg:    "bg-gold-500/15",
          },
          {
            label: "Total Expenses",
            value: formatPKR(totalExpenses),
            sub:   `Avg ${formatPKR(totalExpenses / Math.max(months, 1))}/mo`,
            icon:  TrendingDown,
            color: "text-red-400",
            bg:    "bg-red-500/15",
          },
          {
            label: "Net Profit",
            value: formatPKR(totalProfit),
            sub:   `${profitMargin.toFixed(1)}% margin`,
            icon:  TrendingUp,
            color: totalProfit >= 0 ? "text-green-400" : "text-red-400",
            bg:    totalProfit >= 0 ? "bg-green-500/15" : "bg-red-500/15",
          },
          {
            label: "Profit Margin",
            value: `${profitMargin.toFixed(1)}%`,
            sub:   "Net / Revenue",
            icon:  TrendingUp,
            color: profitMargin >= 30 ? "text-green-400" : profitMargin >= 15 ? "text-amber-400" : "text-red-400",
            bg:    "bg-surface-highlight",
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card-luxury p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}>
                <Icon className={cn("w-4 h-4", color)} />
              </div>
            </div>
            <p className={cn("text-2xl font-bold font-serif", color)}>{loading ? "—" : value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Trend chart */}
      <div className="card-luxury p-6">
        <h3 className="font-semibold text-foreground mb-4">Revenue vs Expenses Trend</h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading chart…
          </div>
        ) : data.length > 0 ? (
          <RevenueAreaChart data={data} />
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
            No data for this period
          </div>
        )}
      </div>

      {/* Monthly breakdown table */}
      <div className="card-luxury overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Monthly Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Month</th>
                <th className="text-right">Room Revenue</th>
                <th className="text-right">Product Revenue</th>
                <th className="text-right">Total Revenue</th>
                <th className="text-right">Expenses</th>
                <th className="text-right">Net Profit</th>
                <th className="text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No data</td></tr>
              ) : (
                data.map((row, i) => {
                  const rev    = row.roomRevenue + row.productRevenue;
                  const margin = rev > 0 ? (row.profit / rev) * 100 : 0;
                  return (
                    <tr key={i}>
                      <td className="font-semibold">{row.label}</td>
                      <td className="text-right text-muted-foreground">{formatPKR(row.roomRevenue)}</td>
                      <td className="text-right text-muted-foreground">{formatPKR(row.productRevenue)}</td>
                      <td className="text-right font-semibold text-gold-400">{formatPKR(rev)}</td>
                      <td className="text-right text-red-400">{formatPKR(row.expenses)}</td>
                      <td className={cn("text-right font-bold", row.profit >= 0 ? "text-green-400" : "text-red-400")}>
                        {row.profit >= 0 ? "+" : ""}{formatPKR(row.profit)}
                      </td>
                      <td className={cn("text-right text-sm", margin >= 20 ? "text-green-400" : margin >= 10 ? "text-amber-400" : "text-red-400")}>
                        {margin.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {data.length > 0 && !loading && (
              <tfoot>
                <tr className="border-t-2 border-border font-bold">
                  <td className="text-gold-400">TOTAL</td>
                  <td className="text-right">{formatPKR(data.reduce((s, d) => s + d.roomRevenue, 0))}</td>
                  <td className="text-right">{formatPKR(data.reduce((s, d) => s + d.productRevenue, 0))}</td>
                  <td className="text-right text-gold-400">{formatPKR(totalRevenue)}</td>
                  <td className="text-right text-red-400">{formatPKR(totalExpenses)}</td>
                  <td className={cn("text-right", totalProfit >= 0 ? "text-green-400" : "text-red-400")}>
                    {formatPKR(totalProfit)}
                  </td>
                  <td className="text-right">{profitMargin.toFixed(1)}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Expense breakdown */}
      <div className="card-luxury p-6">
        <h3 className="font-semibold text-foreground mb-4">Expense Breakdown by Category</h3>
        <div className="space-y-3">
          {CATEGORY_EXPENSE_MOCK.map(({ category, amount, pct }) => (
            <div key={category} className="flex items-center gap-4">
              <div className="w-36 text-sm text-muted-foreground truncate">{category}</div>
              <div className="flex-1 h-2 bg-accent rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold-gradient rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-24 text-right">
                <span className="text-sm font-semibold text-foreground">{formatPKR(amount)}</span>
              </div>
              <div className="w-10 text-right text-xs text-muted-foreground">{pct}%</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
