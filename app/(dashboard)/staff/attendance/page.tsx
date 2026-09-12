// ============================================================
// app/(dashboard)/staff/attendance/page.tsx
// Admin HR hub — Today overview, approvals, payroll dashboard.
// ============================================================

import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared";
import { getTodayOverview, getPendingApprovals } from "@/server/actions/hr-approvals";
import { AttendanceAdminView } from "@/features/hr/components/AttendanceAdminView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Attendance & Payroll" };

export default async function AttendanceAdminPage() {
  const user = await requirePermission("hr:manage");
  const scoped = getScopedBranchId(user);

  const [overview, approvals, staff] = await Promise.all([
    getTodayOverview(),
    getPendingApprovals(),
    prisma.staffMember.findMany({
      where: { isActive: true, ...(scoped ? { branchId: scoped } : { branch: { companyId: user.companyId } }) },
      select: { id: true, user: { select: { name: true } }, branch: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const now = new Date();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Attendance & Payroll" subtitle="Today's staff, approvals and monthly payroll" />
      <AttendanceAdminView
        overview={overview}
        approvals={approvals}
        staff={staff.map((s) => ({ id: s.id, name: s.user.name, branch: s.branch.name }))}
        canFinalize={user.role === "SUPER_ADMIN"}
        defaultMonth={now.getUTCMonth() + 1}
        defaultYear={now.getUTCFullYear()}
      />
    </div>
  );
}
