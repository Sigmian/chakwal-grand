// ============================================================
// app/(dashboard)/staff/activity/page.tsx
// Staff activity / audit log — accountability across the guest
// house. Admin-only; branch managers see their own branch.
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { getActivityLog, getActivityFilterData } from "@/server/actions/activity";
import { PageHeader } from "@/components/shared";
import { ActivityLogView } from "@/features/hr/components/ActivityLogView";

export const dynamic = "force-dynamic";
export const metadata = { title: "Staff Activity" };

export default async function StaffActivityPage() {
  await requirePermission("staff:manage");

  const [rows, filters] = await Promise.all([
    getActivityLog({ limit: 200 }),
    getActivityFilterData(),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Staff Activity Log" subtitle="Who did what, where and when — full accountability trail" />
      <ActivityLogView initialRows={rows} filters={filters} />
    </div>
  );
}
