// ============================================================
// features/finance/components/FinanceReportView.tsx
// P&L report with inventory vs guesthouse expense split
// ============================================================

"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, DollarSign,
  Download, Building2, Calendar, Package,
} from "lucide-react";
import { cn, formatPKR } from "@/utils";
import { RevenueAreaChart } from "@/components/charts/RevenueChart";
import { getRevenueChartData } from "@/server/actions/analytics";
import { getExpenseBreakdown } from "@/server/actions/expenses";

interface MonthlyData {
  label:          string;
  roomRevenue:    number;
  productRevenue: number;
  expenses:       number;
  ghExpenses:     number;
  invExpenses:    number;
  profit:         number;
}

interface ExpenseBreakdown {
  inventory:  { total: number; byCategory: Record<string, number> };
  guesthouse: { total: number; byCategory: Record<string, number> };
}

interface Branch { id: string; name: string }
interface Props  { branches: Branch[]; defaultBranchId?: string | null }

function fetchReportData(branchId?: string): Promise<MonthlyData[]> {
  return getRevenueChartData(branchId);
}

function fetchExpenseBreakdown(branchId?: string, months = 6): Promise<ExpenseBreakdown> {
  return getExpenseBreakdown(branchId, months);
}

const CATEGORY_ICONS: Record<string, string> = {
  ELECTRICITY: "⚡", GAS: "🔥", INTERNET: "🌐", WATER: "💧",
  STAFF_SALARY: "👥", MAINTENANCE: "🔧", CLEANING_SUPPLIES: "🧹",
  INVENTORY_PURCHASE: "📦", MARKETING: "📣", RENT: "🏢",
  TAXES: "📋", FURNITURE: "🪑", EQUIPMENT: "⚙️", MISCELLANEOUS: "📌",
};

export function FinanceReportView({ branches, defaultBranchId }: Props) {
  const [branchId, setBranchId] = useState(defaultBranchId ?? "");
  const [months, setMonths]     = useState(6);
  const [data, setData]         = useState<MonthlyData[]>([]);
  const [breakdown, setBreakdown] = useState<ExpenseBreakdown>({
    inventory:  { total: 0, byCategory: {} },
    guesthouse: { total: 0, byCategory: {} },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchReportData(branchId || undefined),
      fetchExpenseBreakdown(branchId || undefined, months),
    ]).then(([d, b]) => {
      setData(d);
      setBreakdown(b);
    }).finally(() => setLoading(false));
  }, [branchId, months]);

  const totalRevenue   = data.reduce((s, d) => s + d.roomRevenue + d.productRevenue, 0);
  const ghExpenses     = breakdown.guesthouse.total;
  const invExpenses    = breakdown.inventory.total;
  const totalExpenses  = ghExpenses + invExpenses;

  // Guest house P&L: room + product revenue minus guesthouse operational costs
  const ghProfit  = totalRevenue - ghExpenses;
  // Inventory P&L: product revenue only minus inventory purchase costs
  const invProfit = data.reduce((s, d) => s + d.productRevenue, 0) - invExpenses;

  const totalProfit  = ghProfit;  // Net profit = revenue - guesthouse ops (inventory is a sub-P&L)
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const handleExport = () => {
    const rows = [
      ["Month", "Room Revenue", "Product Revenue", "Total Revenue", "GH Expenses", "Inv Expenses", "Net Profit"],
      ...data.map(d => [
        d.label,
        d.roomRevenue,
        d.productRevenue,
        d.roomRevenue + d.productRevenue,
        "",
        "",
        d.profit,
      ]),
      ["TOTAL", data.reduce((s,d)=>s+d.roomRevenue,0), data.reduce((s,d)=>s+d.productRevenue,0), totalRevenue, ghExpenses, invExpenses, totalProfit],
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `finance-report-${new Date().toISOString().slice(0, 7)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-gold-500/40 transition-all"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Overall KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue",   value: formatPKR(totalRevenue),  sub: `${months}m period`,        icon: DollarSign,  color: "text-gold-400",  bg: "bg-gold-500/15" },
          { label: "Total Expenses",  value: formatPKR(totalExpenses), sub: `GH + Inventory`,           icon: TrendingDown, color: "text-red-400",   bg: "bg-red-500/15" },
          { label: "Net Profit",      value: formatPKR(totalProfit),   sub: `${profitMargin.toFixed(1)}% margin`, icon: TrendingUp, color: totalProfit >= 0 ? "text-green-400" : "text-red-400", bg: totalProfit >= 0 ? "bg-green-500/15" : "bg-red-500/15" },
          { label: "Profit Margin",   value: `${profitMargin.toFixed(1)}%`, sub: "Net / Revenue",       icon: TrendingUp,  color: profitMargin >= 30 ? "text-green-400" : profitMargin >= 15 ? "text-amber-400" : "text-red-400", bg: "bg-accent" },
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

      {/* Separate P&L cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Guest House P&L */}
        <div className="card-luxury p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gold-500/15 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-gold-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Guest House P&L</p>
              <p className="text-xs text-muted-foreground">Revenue minus operational costs</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: "Revenue",    value: totalRevenue, color: "text-gold-400" },
              { label: "GH Expenses", value: -ghExpenses, color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-sm py-1 border-b border-border/50">
                <span className="text-muted-foreground">{label}</span>
                <span className={cn("font-semibold", color)}>
                  {value < 0 ? `(${formatPKR(Math.abs(value))})` : formatPKR(value)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 font-bold">
              <span className="text-foreground">Net Profit</span>
              <span className={ghProfit >= 0 ? "text-green-400" : "text-red-400"}>
                {loading ? "—" : formatPKR(ghProfit)}
              </span>
            </div>
          </div>
          {/* GH expense breakdown */}
          {!loading && Object.entries(breakdown.guesthouse.byCategory).length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Breakdown</p>
              {Object.entries(breakdown.guesthouse.byCategory)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([cat, amt]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-sm">{CATEGORY_ICONS[cat] ?? "📌"}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground capitalize">{cat.toLowerCase().replace(/_/g, " ")}</span>
                        <span className="font-medium text-foreground">{formatPKR(amt)}</span>
                      </div>
                      <div className="h-1 bg-accent rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-gold-gradient rounded-full" style={{ width: `${ghExpenses > 0 ? (amt / ghExpenses) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Inventory P&L */}
        <div className="card-luxury p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Inventory P&L</p>
              <p className="text-xs text-muted-foreground">Product sales minus purchase costs</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: "Product Revenue", value: data.reduce((s, d) => s + d.productRevenue, 0), color: "text-blue-400" },
              { label: "Inventory Costs",  value: -invExpenses, color: "text-red-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between text-sm py-1 border-b border-border/50">
                <span className="text-muted-foreground">{label}</span>
                <span className={cn("font-semibold", color)}>
                  {value < 0 ? `(${formatPKR(Math.abs(value))})` : formatPKR(value)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-2 font-bold">
              <span className="text-foreground">Inventory Profit</span>
              <span className={invProfit >= 0 ? "text-green-400" : "text-red-400"}>
                {loading ? "—" : formatPKR(invProfit)}
              </span>
            </div>
          </div>
          {!loading && Object.entries(breakdown.inventory.byCategory).length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Breakdown</p>
              {Object.entries(breakdown.inventory.byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amt]) => (
                  <div key={cat} className="flex items-center gap-2">
                    <span className="text-sm">{CATEGORY_ICONS[cat] ?? "📌"}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground capitalize">{cat.toLowerCase().replace(/_/g, " ")}</span>
                        <span className="font-medium text-foreground">{formatPKR(amt)}</span>
                      </div>
                      <div className="h-1 bg-accent rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${invExpenses > 0 ? (amt / invExpenses) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Trend chart */}
      <div className="card-luxury p-6">
        <h3 className="font-semibold text-foreground mb-4">Revenue vs Expenses Trend</h3>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">Loading chart…</div>
        ) : data.length > 0 ? (
          <RevenueAreaChart data={data} />
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No data for this period</div>
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
                <th className="text-right">GH Expenses</th>
                <th className="text-right">Inv Expenses</th>
                <th className="text-right">Net Profit</th>
                <th className="text-right">Margin</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">Loading…</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-muted-foreground">No data</td></tr>
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
                      <td className="text-right text-amber-400">{formatPKR(row.ghExpenses)}</td>
                      <td className="text-right text-blue-400">{formatPKR(row.invExpenses)}</td>
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
                  <td className="text-right text-amber-400">{formatPKR(ghExpenses)}</td>
                  <td className="text-right text-blue-400">{formatPKR(invExpenses)}</td>
                  <td className={cn("text-right", totalProfit >= 0 ? "text-green-400" : "text-red-400")}>{formatPKR(totalProfit)}</td>
                  <td className="text-right">{profitMargin.toFixed(1)}%</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
