// ============================================================
// app/(dashboard)/staff/page.tsx
// Staff directory with role badges, shift info, salary (manager+)
// ============================================================

import Link from "next/link";
import { UserCog, Plus, Clock, Building2, Phone } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader, EmptyState, Badge } from "@/components/shared";
import { cn, formatPKR, USER_ROLE_CONFIG, getInitials } from "@/utils";
import { UserRole } from "@/types";
import prisma from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { getScopedBranchId } from "@/lib/auth/session";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const user      = await requirePermission("staff:read");
  const canSalary = hasPermission(user.role, "staff:view_salaries");
  const canCreate = hasPermission(user.role, "staff:create");

  const branchId = getScopedBranchId(user);

  const staffMembers = await prisma.staffMember.findMany({
    where: branchId ? { branchId } : {},
    include: {
      user:   { select: { name: true, email: true, role: true, image: true, isActive: true, lastLoginAt: true } },
      branch: { select: { name: true, city: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Staff"
        subtitle={`${staffMembers.length} staff member${staffMembers.length !== 1 ? "s" : ""}`}
        actions={
          canCreate ? (
            <Link
              href="/staff/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Add Staff
            </Link>
          ) : undefined
        }
      />

      {/* Role summary */}
      <div className="flex flex-wrap gap-3">
        {Object.values(UserRole).filter((r) => r !== UserRole.SUPER_ADMIN).map((role) => {
          const count  = staffMembers.filter((s) => s.user.role === role).length;
          const config = USER_ROLE_CONFIG[role];
          if (count === 0) return null;
          return (
            <div key={role} className="flex items-center gap-2 px-3 py-1.5 bg-surface-elevated border border-border rounded-xl text-sm">
              <span className={cn("font-bold", config.color)}>{count}</span>
              <span className="text-muted-foreground">{config.label}</span>
            </div>
          );
        })}
      </div>

      {staffMembers.length === 0 ? (
        <EmptyState
          icon={<UserCog className="w-8 h-8" />}
          title="No staff members"
          body="Add staff accounts for your branch team."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {staffMembers.map((staff) => {
            const roleCfg = USER_ROLE_CONFIG[staff.user.role as UserRole];
            const isOnline = staff.user.lastLoginAt
              ? new Date(staff.user.lastLoginAt) > new Date(Date.now() - 8 * 3600 * 1000)
              : false;

            return (
              <div key={staff.id} className={cn(
                "card-luxury p-5 hover:-translate-y-0.5 hover:shadow-gold-sm transition-all",
                !staff.user.isActive && "opacity-60"
              )}>
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gold-gradient flex items-center justify-center text-background font-bold text-base">
                      {getInitials(staff.user.name)}
                    </div>
                    {isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-surface-base" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{staff.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{staff.user.email}</p>
                      </div>
                      <Badge variant={
                        staff.user.role === UserRole.BRANCH_MANAGER ? "blue" :
                        staff.user.role === UserRole.RECEPTIONIST   ? "green" :
                        staff.user.role === UserRole.HOUSEKEEPING   ? "purple" :
                        "orange"
                      }>
                        {roleCfg.label}
                      </Badge>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      {staff.designation && (
                        <p className="text-xs text-muted-foreground">{staff.designation}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5" />
                        {staff.branch.name}, {staff.branch.city}
                      </div>
                      {staff.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="w-3.5 h-3.5" />
                          {staff.phone}
                        </div>
                      )}
                      {staff.shiftStart && staff.shiftEnd && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {staff.shiftStart} – {staff.shiftEnd}
                        </div>
                      )}
                      {canSalary && staff.salary && (
                        <div className="text-xs font-semibold text-gold-400">
                          {formatPKR(Number(staff.salary))} / month
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                      <span className={cn(
                        "text-2xs font-semibold",
                        staff.user.isActive ? "text-green-400" : "text-red-400"
                      )}>
                        {staff.user.isActive ? "● Active" : "● Inactive"}
                      </span>
                      <div className="flex-1" />
                      <Link
                        href={`/staff/${staff.id}`}
                        className="text-xs text-gold-400 hover:text-gold-300 font-semibold"
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
