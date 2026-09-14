// ============================================================
// app/portal/layout.tsx
// Minimal, mobile-first shell for the staff attendance portal —
// deliberately outside the admin dashboard chrome.
// ============================================================

import { requireAuth } from "@/lib/auth/session";
import { TaskAlerts } from "@/features/hr/components/TaskAlerts";
import { PushNotificationToggle } from "@/features/dashboard/components/PushNotificationToggle";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  await requireAuth(); // redirects to /login when signed out
  return (
    <div className="min-h-[100dvh] bg-[#0b0d10] text-white">
      <div className="mx-auto w-full max-w-md px-4 pb-16 pt-5">
        {/* Let staff enable OS push here — the dashboard toggle isn't reachable from the portal/phone. */}
        <div className="mb-3 flex justify-end">
          <PushNotificationToggle />
        </div>
        {children}
      </div>
      <TaskAlerts portalHref="/portal" />
    </div>
  );
}
