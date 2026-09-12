// ============================================================
// app/(dashboard)/staff/ops/page.tsx
// Admin operations — tasks, warnings/appreciation, handovers.
// ============================================================

import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared";
import { listTasks, listWarnings, listHandovers } from "@/server/actions/hr-ops";
import { HrOpsView } from "@/features/hr/components/HrOpsView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tasks & Discipline" };

export default async function HrOpsPage() {
  const user = await requirePermission("hr:manage");
  const scoped = getScopedBranchId(user);

  const [tasks, warnings, handovers, staff] = await Promise.all([
    listTasks(),
    listWarnings(),
    listHandovers(),
    prisma.staffMember.findMany({
      where: { isActive: true, ...(scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } }) },
      select: { id: true, user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Tasks & Discipline" subtitle="Assign tasks, issue warnings or appreciation, and review shift handovers" />
      <HrOpsView
        tasks={tasks}
        warnings={warnings}
        handovers={handovers}
        staff={staff.map((s) => ({ id: s.id, name: s.user.name }))}
      />
    </div>
  );
}
