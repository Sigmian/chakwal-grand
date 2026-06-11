// ============================================================
// app/(dashboard)/settings/page.tsx
// Company & branch settings, user management
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader, SectionHeader, GoldDivider } from "@/components/shared";
import { CompanySettingsForm } from "@/features/settings/components/CompanySettingsForm";
import { UserManagementTable } from "@/features/settings/components/UserManagementTable";
import { Settings, Shield, Users } from "lucide-react";
import prisma from "@/lib/db/prisma";
import { getScopedBranchId } from "@/lib/auth/session";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user         = await requirePermission("settings:branch");
  const canCompany   = hasPermission(user.role, "settings:company");
  const canUsers     = hasPermission(user.role, "settings:users");
  const branchId     = getScopedBranchId(user);

  const [company, users] = await Promise.all([
    prisma.company.findFirst(),
    canUsers
      ? prisma.user.findMany({
          where:   { companyId: user.companyId, isActive: true },
          include: { staffMember: { include: { branch: { select: { name: true } } } } },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Manage company configuration and user accounts"
      />

      {/* Company settings */}
      {canCompany && company && (
        <section className="card-luxury p-6">
          <SectionHeader
            title="Company Settings"
            subtitle="Business information shown on invoices and public website"
          />
          <CompanySettingsForm company={company as any} />
        </section>
      )}

      {/* Security section */}
      <section className="card-luxury p-6">
        <SectionHeader
          title="Security"
          subtitle="Account security settings"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-surface-highlight rounded-xl border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gold-500/15 flex items-center justify-center">
                <Shield className="w-4 h-4 text-gold-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Password</p>
                <p className="text-xs text-muted-foreground">Change your login password</p>
              </div>
            </div>
            <button className="w-full py-2 text-xs font-semibold rounded-lg border border-border hover:border-gold-500/50 hover:text-gold-400 transition-all">
              Change Password
            </button>
          </div>

          <div className="p-4 bg-surface-highlight rounded-xl border border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Settings className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Session</p>
                <p className="text-xs text-muted-foreground">Manage active sessions</p>
              </div>
            </div>
            <button className="w-full py-2 text-xs font-semibold rounded-lg border border-border hover:border-red-500/50 hover:text-red-400 transition-all">
              Sign Out All Devices
            </button>
          </div>
        </div>
      </section>

      {/* User management */}
      {canUsers && (
        <section className="card-luxury p-6">
          <SectionHeader
            title="Users & Permissions"
            subtitle="Manage staff accounts and access levels"
            actions={
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-gradient text-background text-xs font-semibold rounded-lg">
                <Users className="w-3.5 h-3.5" />
                Add User
              </button>
            }
          />
          <UserManagementTable users={users as any} />
        </section>
      )}
    </div>
  );
}
