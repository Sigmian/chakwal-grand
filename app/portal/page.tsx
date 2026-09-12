// ============================================================
// app/portal/page.tsx
// Staff attendance portal — today's shift, 2-tap check-in/out,
// monthly summary, leave & correction requests.
// ============================================================

import Link from "next/link";
import type { Metadata } from "next";
import { getMyDashboard } from "@/server/actions/attendance";
import { getMyTasks, getMyWarnings, getOpenHandoversForMe } from "@/server/actions/hr-ops";
import { StaffPortal } from "@/features/hr/components/StaffPortal";
import { StaffOpsSection } from "@/features/hr/components/StaffOpsSection";

export const metadata: Metadata = { title: "My Attendance" };

export default async function PortalPage() {
  let data;
  try {
    data = await getMyDashboard();
  } catch {
    // Signed in but not linked to a staff profile (e.g. a pure admin account).
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <h1 className="font-serif text-xl font-bold">No staff profile</h1>
        <p className="mt-2 text-sm text-white/60">
          Your account isn&apos;t linked to a staff record, so there&apos;s no attendance to show.
        </p>
        <Link href="/dashboard" className="mt-6 rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-semibold text-background">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const [tasks, warnings, openHandovers] = await Promise.all([
    getMyTasks(), getMyWarnings(), getOpenHandoversForMe(),
  ]);

  return (
    <div className="space-y-5">
      <StaffPortal data={data} />
      <StaffOpsSection tasks={tasks} warnings={warnings} openHandovers={openHandovers} />
    </div>
  );
}
