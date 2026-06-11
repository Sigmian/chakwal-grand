// ============================================================
// app/(dashboard)/finance/reports/page.tsx
// Finance reports — P&L, monthly breakdown, export
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { getScopedBranchId } from "@/lib/auth/session";
import { FinanceReportView } from "@/features/finance/components/FinanceReportView";
import { PageHeader } from "@/components/shared";
import prisma from "@/lib/db/prisma";

export const metadata = { title: "Finance Reports" };

export default async function FinanceReportsPage() {
  const user     = await requirePermission("finance:read");
  const branchId = getScopedBranchId(user);

  const branches = await prisma.branch.findMany({
    where:   { isActive: true },
    select:  { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Financial Reports"
        subtitle="Profit & loss, revenue breakdown, expense analysis"
      />
      <FinanceReportView
        branches={branches}
        defaultBranchId={branchId}
      />
    </div>
  );
}
