// ============================================================
// features/finance/components/ExpenseForm.tsx
// Quick expense logging form with Inventory / Guesthouse split
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { ExpenseCategory } from "@/types";
import { createExpenseAction } from "@/server/actions/expenses";

interface Branch { id: string; name: string }
interface Props { branches: Branch[]; defaultBranchId?: string | null }

const CATEGORY_LABELS: Record<string, string> = {
  ELECTRICITY: "⚡ Electricity", GAS: "🔥 Gas", INTERNET: "🌐 Internet",
  WATER: "💧 Water", STAFF_SALARY: "👥 Staff Salary", MAINTENANCE: "🔧 Maintenance",
  CLEANING_SUPPLIES: "🧹 Cleaning Supplies", INVENTORY_PURCHASE: "📦 Inventory Purchase",
  MARKETING: "📣 Marketing", RENT: "🏢 Rent", TAXES: "📋 Taxes",
  FURNITURE: "🪑 Furniture", EQUIPMENT: "⚙️ Equipment", MISCELLANEOUS: "📌 Miscellaneous",
};

// Categories that belong to inventory spending
const INVENTORY_CATEGORIES = new Set(["INVENTORY_PURCHASE"]);

// Derive default expenseType from selected category
function defaultType(cat: string): "INVENTORY" | "GUESTHOUSE" {
  return INVENTORY_CATEGORIES.has(cat) ? "INVENTORY" : "GUESTHOUSE";
}

const inputCls = "w-full bg-surface-base border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50 transition-all";

export function ExpenseForm({ branches, defaultBranchId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    branchId:    defaultBranchId ?? branches[0]?.id ?? "",
    category:    ExpenseCategory.ELECTRICITY as string,
    expenseType: "GUESTHOUSE" as "INVENTORY" | "GUESTHOUSE",
    title:       "",
    amount:      "",
    description: "",
    paidAt:      new Date().toISOString().split("T")[0],
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Auto-update expenseType when category changes
      if (key === "category") next.expenseType = defaultType(value);
      return next;
    });
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.amount || !form.branchId) {
      toast.error("Branch, title and amount are required");
      return;
    }
    startTransition(async () => {
      const res = await createExpenseAction({
        branchId:    form.branchId,
        category:    form.category,
        expenseType: form.expenseType,
        title:       form.title,
        amount:      Number(form.amount),
        description: form.description || undefined,
        paidAt:      form.paidAt,
      });
      if (res.success) {
        toast.success("Expense logged");
        setForm((f) => ({ ...f, title: "", amount: "", description: "" }));
      } else {
        toast.error(res.error ?? "Failed to log expense");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Expense Type toggle */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expense Type</label>
        <div className="grid grid-cols-2 gap-2">
          {(["GUESTHOUSE", "INVENTORY"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setForm(f => ({ ...f, expenseType: t }))}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                form.expenseType === t
                  ? t === "INVENTORY"
                    ? "bg-blue-500/15 border-blue-500/30 text-blue-400"
                    : "bg-gold-500/15 border-gold-500/30 text-gold-400"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "GUESTHOUSE" ? "🏨 Guest House" : "📦 Inventory"}
            </button>
          ))}
        </div>
      </div>

      {/* Branch */}
      {!defaultBranchId && (
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch</label>
          <select value={form.branchId} onChange={set("branchId")} className={inputCls}>
            {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      )}

      {/* Category */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
        <select value={form.category} onChange={set("category")} className={inputCls}>
          {Object.values(ExpenseCategory).map((cat) => (
            <option key={cat} value={cat}>{CATEGORY_LABELS[cat] ?? cat}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title *</label>
        <input value={form.title} onChange={set("title")} placeholder="e.g. July electricity bill" className={inputCls} />
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount (₨) *</label>
        <input type="number" value={form.amount} onChange={set("amount")} placeholder="0" className={inputCls} />
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date Paid</label>
        <input type="date" value={form.paidAt} onChange={set("paidAt")} className={inputCls} />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
        <textarea value={form.description} onChange={set("description")} rows={2} placeholder="Optional notes…" className={inputCls + " resize-none"} />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-60"
      >
        <Save className="w-4 h-4" />
        {isPending ? "Saving…" : "Log Expense"}
      </button>
    </div>
  );
}
