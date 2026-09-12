// ============================================================
// app/(dashboard)/inventory/ledger/page.tsx
// Stock ledger — the full audit trail of every stock movement,
// so admins can see exactly why a quantity changed.
// ============================================================

import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { getStockLedger } from "@/server/actions/inventory";
import { PageHeader } from "@/components/shared";
import { LedgerView } from "@/features/inventory/components/LedgerView";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stock Ledger" };

export default async function StockLedgerPage() {
  const user     = await requirePermission("inventory:read");
  const scoped   = getScopedBranchId(user);

  const [rows, branches, products] = await Promise.all([
    getStockLedger({ limit: 200 }),
    prisma.branch.findMany({ where: { companyId: user.companyId }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: {
        inventoryItems: { some: scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } } },
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Stock Ledger" subtitle="Every stock in and out — who, why, and when" />
      <LedgerView
        initialRows={rows}
        branches={scoped ? [] : branches}
        products={products}
      />
    </div>
  );
}
