// ============================================================
// app/(dashboard)/housekeeping/page.tsx
// Housekeeping board — visual room status grid
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { getHousekeepingBoard } from "@/server/actions/rooms";
import { HousekeepingBoard } from "@/features/rooms/components/HousekeepingBoard";
import { PageHeader } from "@/components/shared";

export const metadata = { title: "Housekeeping" };

export default async function HousekeepingPage() {
  await requirePermission("housekeeping:read");
  const rooms = await getHousekeepingBoard();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Housekeeping"
        subtitle="Room status board — tap any room to update"
      />
      <HousekeepingBoard rooms={rooms as never} />
    </div>
  );
}
