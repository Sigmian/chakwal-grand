// ============================================================
// app/(dashboard)/staff/new/page.tsx
// Create a new staff member — auth user + staff profile
// ============================================================

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared";
import { NewStaffForm } from "@/features/staff/components/NewStaffForm";
import prisma from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add Staff" };

export default async function NewStaffPage() {
  const user     = await requirePermission("staff:manage");
  const branchId = getScopedBranchId(user);

  const branches = await prisma.branch.findMany({
    where:   { isActive: true, ...(branchId ? { id: branchId } : { companyId: user.companyId }) },
    select:  { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <Link
          href="/staff"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Staff
        </Link>
        <PageHeader
          title="Add New Staff Member"
          subtitle="Create their login, assign a role and branch, and set duty hours"
        />
      </div>

      <NewStaffForm branches={branches} defaultBranchId={branchId} />
    </div>
  );
}
