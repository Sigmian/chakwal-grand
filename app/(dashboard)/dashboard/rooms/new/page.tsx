// ============================================================
// app/(dashboard)/rooms/new/page.tsx
// Create a new room — multi-section form
// ============================================================

import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared";
import { NewRoomForm } from "@/features/rooms/components/NewRoomForm";
import prisma from "@/lib/db/prisma";

export const metadata = { title: "Add Room" };

export default async function NewRoomPage() {
  const user     = await requirePermission("rooms:create");
  const branchId = getScopedBranchId(user);

  const branches = await prisma.branch.findMany({
    where:   { isActive: true, ...(branchId ? { id: branchId } : {}) },
    select:  { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <Link
          href="/dashboard/rooms"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Rooms
        </Link>
        <PageHeader
          title="Add New Room"
          subtitle="Configure the room details, pricing, and amenities"
        />
      </div>

      <NewRoomForm branches={branches} defaultBranchId={branchId} />
    </div>
  );
}
