// ============================================================
// app/(dashboard)/finance/expenses/page.tsx
// Expenses split by type: Guest House vs Inventory, filterable by date range
// ============================================================

import { Suspense } from "react";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader, SectionHeader, Badge } from "@/components/shared";
import { ExpenseForm } from "@/features/finance/components/ExpenseForm";
import { DateRangeFilter } from "@/features/finance/components/DateRangeFilter";
import { ExpenseCategory } from "@/types";
import { cn, formatPKR, formatDate } from "@/utils";
import prisma from "@/lib/db/prisma";
import { Receipt, Building2, Package } from "lucide-react";
import { parseDateRange } from "@/lib/finance/reporting";

export const metadata = { title: "Expenses" };

interface PageProps {
  searchParams: { from?: string; to?: string };
}

const CATEGORY_ICONS: Record<string, string> = {
  ELECTRICITY: "⚡", GAS: "🔥", INTERNET: "🌐", WATER: "💧",
  STAFF_SALARY: "👥", MAINTENANCE: "🔧", CLEANING_SUPPLIES: "🧹",
  INVENTORY_PURCHASE: "📦", MARKETING: "📣", RENT: "🏢",
  TAXES: "📋", FURNITURE: "🪑", EQUIPMENT: "⚙️", MISCELLANEOUS: "📌",
};

function CategoryBar({ category, total, pct }: { category: string; total: number; pct: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg w-7 flex-shrink-0">{CATEGORY_ICONS[category] ?? "📌"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-foreground capitalize">
            {category.toLowerCase().replace(/_/g, " ")}
          </span>
          <span className="text-sm font-bold text-foreground">{formatPKR(total)}</span>
        </div>
        <div className="h-1.5 bg-accent rounded-full overflow-hidden">
          <div className="h-full bg-gold-gradient rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="text-xs text-muted-foreground w-12 text-right flex-shrink-0">{pct.toFixed(1)}%</span>
    </div>
  );
}

export default async function ExpensesPage({ searchParams }: PageProps) {
  const user      = await requirePermission("finance:read");
  const branchId  = getScopedBranchId(user);
  const canCreate = hasPermission(user.role, "finance:expenses:create");

  const { start, end, label } = parseDateRange(searchParams.from, searchParams.to);
  const branchWhere = branchId
    ? { branchId }
    : { branch: { companyId: user.companyId } };

  const [expenses, branches] = await Promise.all([
    prisma.expense.findMany({
      where: { ...branchWhere, paidAt: { gte: start, lte: end } },
      include: { branch: { select: { name: true } } },
      orderBy: { paidAt: "desc" },
    }),
    prisma.branch.findMany({
      where:  { isActive: true, companyId: user.companyId },
      select: { id: true, name: true },
    }),
  ]);

  const ghExpenses  = expenses.filter(e => String(e.expenseType) !== "INVENTORY");
  const invExpenses = expenses.filter(e => String(e.expenseType) === "INVENTORY");

  const ghTotal  = ghExpenses.reduce((s, e)  => s + Number(e.amount), 0);
  const invTotal = invExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const total    = ghTotal + invTotal;

  function byCategory(list: typeof expenses) {
    return Object.values(ExpenseCategory).map((cat) => {
      const catExpenses = list.filter((e) => e.category === cat);
      const t = catExpenses.reduce((s, e) => s + Number(e.amount), 0);
      return { category: cat, total: t, count: catExpenses.length };
    }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  }

  const ghByCategory  = byCategory(ghExpenses);
  const invByCategory = byCategory(invExpenses);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Expenses"
        subtitle={`${label}: ${formatPKR(total)} total`}
      />

      {/* Date range filter */}
      <Suspense>
        <div className="card-luxury p-4">
          <DateRangeFilter />
        </div>
      </Suspense>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Expenses",    value: formatPKR(total),    icon: Receipt,   color: "text-foreground", bg: "bg-accent"      },
          { label: "Guest House Costs", value: formatPKR(ghTotal),  icon: Building2, color: "text-gold-400",   bg: "bg-gold-500/15" },
          { label: "Inventory Costs",   value: formatPKR(invTotal), icon: Package,   color: "text-blue-400",   bg: "bg-blue-500/15" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card-luxury p-5 flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className={cn("text-xl font-bold font-serif mt-0.5", color)}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: split expense panels */}
        <div className="lg:col-span-2 space-y-5">

          {/* Guest House Expenses */}
          <div className="card-luxury p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gold-500/15 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-gold-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Guest House Expenses</p>
                <p className="text-xs text-muted-foreground">Operational running costs</p>
              </div>
              <span className="ml-auto text-lg font-bold text-gold-400">{formatPKR(ghTotal)}</span>
            </div>
            {ghByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">No guest house expenses in this period</p>
            ) : (
              <div className="space-y-2.5">
                {ghByCategory.map(({ category, total: t }) => (
                  <CategoryBar key={category} category={category} total={t} pct={ghTotal > 0 ? (t / ghTotal) * 100 : 0} />
                ))}
              </div>
            )}
          </div>

          {/* Inventory Expenses */}
          <div className="card-luxury p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                <Package className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Inventory Expenses</p>
                <p className="text-xs text-muted-foreground">Stock & product purchases</p>
              </div>
              <span className="ml-auto text-lg font-bold text-blue-400">{formatPKR(invTotal)}</span>
            </div>
            {invByCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">No inventory expenses in this period</p>
            ) : (
              <div className="space-y-2.5">
                {invByCategory.map(({ category, total: t }) => (
                  <CategoryBar key={category} category={category} total={t} pct={invTotal > 0 ? (t / invTotal) * 100 : 0} />
                ))}
              </div>
            )}
          </div>

          {/* Full expense list */}
          <div className="card-luxury overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <SectionHeader title={`All Expenses — ${label}`} />
              <Badge variant="slate">{expenses.length} entries</Badge>
            </div>
            {expenses.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No expenses recorded in this period</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th className="hidden sm:table-cell">Category</th>
                      <th className="hidden md:table-cell">Type</th>
                      <th className="hidden lg:table-cell">Branch</th>
                      <th className="hidden sm:table-cell">Date</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>
                          <p className="text-sm font-medium text-foreground">{expense.title}</p>
                          <p className="text-xs text-muted-foreground sm:hidden capitalize">
                            {CATEGORY_ICONS[expense.category] ?? "📌"} {expense.category.toLowerCase().replace(/_/g, " ")}
                          </p>
                        </td>
                        <td className="hidden sm:table-cell">
                          <span className="flex items-center gap-1.5">
                            <span>{CATEGORY_ICONS[expense.category] ?? "📌"}</span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {expense.category.toLowerCase().replace(/_/g, " ")}
                            </span>
                          </span>
                        </td>
                        <td className="hidden md:table-cell">
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                            String(expense.expenseType) === "INVENTORY"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-gold-500/10 text-gold-400"
                          )}>
                            {String(expense.expenseType) === "INVENTORY" ? "📦 Inv" : "🏨 GH"}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell"><span className="text-sm text-muted-foreground">{expense.branch?.name ?? "—"}</span></td>
                        <td className="hidden sm:table-cell"><span className="text-sm text-muted-foreground">{formatDate(expense.paidAt)}</span></td>
                        <td className="text-right">
                          <span className="text-sm font-bold text-foreground whitespace-nowrap">{formatPKR(Number(expense.amount))}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right: add expense form */}
        {canCreate && (
          <div>
            <div className="card-luxury p-5 sticky top-6">
              <SectionHeader title="Log Expense" />
              <ExpenseForm branches={branches} defaultBranchId={branchId} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
