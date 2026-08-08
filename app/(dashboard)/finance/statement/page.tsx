// ============================================================
// app/(dashboard)/finance/statement/page.tsx
// Monthly statement — the full month in one shareable sheet
// ============================================================

import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { MonthlyStatementView } from "@/features/finance/components/MonthlyStatementView";
import { PageHeader } from "@/components/shared";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Monthly Statement" };

export default async function MonthlyStatementPage() {
  const user     = await requirePermission("finance:read");
  const branchId = getScopedBranchId(user);

  const branches = branchId
    ? []
    : await prisma.branch.findMany({
        where:   { isActive: true, companyId: user.companyId },
        select:  { id: true, name: true },
        orderBy: { name: "asc" },
      });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Monthly Statement"
        subtitle="Every guest, payment, expense and salary for one month — in a single sheet you can export and share"
      />
      <MonthlyStatementView branches={branches} defaultBranchId={branchId} />
    </div>
  );
}
