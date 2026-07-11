// ============================================================
// app/(dashboard)/layout.tsx
// Protected dashboard shell — sidebar + header
// All /dashboard/* routes render inside this layout
// ============================================================

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { DASHBOARD_ROLES } from "@/lib/auth/permissions";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader }  from "@/components/layout/DashboardHeader";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();

  if (!user) redirect("/login");
  if (!DASHBOARD_ROLES.includes(user.role)) redirect("/unauthorized");

  return (
    <div className="flex h-screen bg-surface-base overflow-hidden">
      {/* ── Sidebar ── */}
      <DashboardSidebar user={user} />

      {/* ── Main content area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardHeader user={user} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 lg:p-6 max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
