// ============================================================
// app/(dashboard)/finance/expenses/page.tsx
// Expense tracking with category breakdown and form
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { getScopedBranchId } from "@/lib/auth/session";
import { PageHeader, SectionHeader, Badge } from "@/components/shared";
import { ExpenseForm } from "@/features/finance/components/ExpenseForm";
import { ExpenseCategory } from "@/types";
import { cn, formatPKR, formatDate } from "@/utils";
import prisma from "@/lib/db/prisma";
import { startOfMonth, endOfMonth } from "date-fns";
import { Receipt, TrendingDown, Plus } from "lucide-react";
import { hasPermission } from "@/lib/auth/permissions";

export const metadata = { title: "Expenses" };

const CATEGORY_ICONS: Record<string, string> = {
  ELECTRICITY: "⚡", GAS: "🔥", INTERNET: "🌐", WATER: "💧",
  STAFF_SALARY: "👥", MAINTENANCE: "🔧", CLEANING_SUPPLIES: "🧹",
  INVENTORY_PURCHASE: "📦", MARKETING: "📣", RENT: "🏢",
  TAXES: "📋", FURNITURE: "🪑", EQUIPMENT: "⚙️", MISCELLANEOUS: "📌",
};

export default async function ExpensesPage() {
  const user      = await requirePermission("finance:read");
  const branchId  = getScopedBranchId(user);
  const canCreate = hasPermission(user.role, "finance:expenses:create");

  const now        = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  const expenses = await prisma.expense.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      paidAt: { gte: monthStart, lte: monthEnd },
    },
    include: { branch: { select: { name: true } } },
    orderBy: { paidAt: "desc" },
  });

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

  // Group by category
  const byCategory = Object.values(ExpenseCategory).map((cat) => {
    const catExpenses = expenses.filter((e) => e.category === cat);
    const total       = catExpenses.reduce((s, e) => s + Number(e.amount), 0);
    return { category: cat, total, count: catExpenses.length };
  }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const branches = await prisma.branch.findMany({
    where:   { isActive: true },
    select:  { id: true, name: true },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Expenses"
        subtitle={`This month: ${formatPKR(totalExpenses)}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: expense list */}
        <div className="lg:col-span-2 space-y-5">
          {/* Category breakdown */}
          <div className="card-luxury p-5">
            <SectionHeader title="By Category" />
            <div className="space-y-2.5">
              {byCategory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No expenses this month</p>
              ) : byCategory.map(({ category, total, count }) => {
                const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                return (
                  <div key={category} className="flex items-center gap-3">
                    <span className="text-lg w-7 flex-shrink-0">{CATEGORY_ICONS[category] ?? "📌"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground capitalize">
                          {category.toLowerCase().replace(/_/g, " ")}
                        </span>
                        <span className="text-sm font-bold text-foreground">{formatPKR(total)}</span>
                      </div>
                      <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold-gradient rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground w-16 text-right flex-shrink-0">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent expenses table */}
          <div className="card-luxury overflow-hidden">
            <div className="p-5 border-b border-border">
              <SectionHeader title="Recent Expenses" />
            </div>
            {expenses.length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No expenses recorded this month</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Title</th>
                      <th>Branch</th>
                      <th>Date</th>
                      <th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td>
                          <span className="flex items-center gap-2">
                            <span>{CATEGORY_ICONS[expense.category] ?? "📌"}</span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {expense.category.toLowerCase().replace(/_/g, " ")}
                            </span>
                          </span>
                        </td>
                        <td>
                          <p className="text-sm font-medium text-foreground">{expense.title}</p>
                          {expense.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">{expense.description}</p>
                          )}
                        </td>
                        <td>
                          <span className="text-sm text-muted-foreground">{expense.branch?.name ?? "—"}</span>
                        </td>
                        <td>
                          <span className="text-sm text-muted-foreground">{formatDate(expense.paidAt)}</span>
                        </td>
                        <td className="text-right">
                          <span className="text-sm font-bold text-foreground">{formatPKR(Number(expense.amount))}</span>
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
