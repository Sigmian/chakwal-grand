// ============================================================
// app/(dashboard)/staff/payroll/page.tsx
// Payroll overview — all staff, this month's status, advances
// ============================================================

import Link from "next/link";
import { requirePermission } from "@/lib/auth/session";
import { getPayrollOverview } from "@/server/actions/payroll";
import { PageHeader, Badge } from "@/components/shared";
import { formatPKR, USER_ROLE_CONFIG, getInitials, cn } from "@/utils";
import { UserRole } from "@/types";
import { CheckCircle2, Clock, AlertTriangle, ChevronRight, Banknote, DollarSign } from "lucide-react";

export const metadata = { title: "Payroll" };

export default async function PayrollPage() {
  await requirePermission("staff:view_salaries");
  const staff = await getPayrollOverview();

  const paid   = staff.filter((s) => s.paidThisMonth).length;
  const unpaid = staff.filter((s) => !s.paidThisMonth).length;
  const totalAdvances = staff.reduce((s, m) => s + m.totalPendingAdv, 0);
  const now = new Date();
  const monthName = now.toLocaleString("en-PK", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Payroll"
        subtitle={`Salary management — ${monthName}`}
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Staff",       value: staff.length,        icon: DollarSign,   color: "text-foreground",  bg: "bg-accent"        },
          { label: "Paid This Month",   value: paid,                icon: CheckCircle2, color: "text-green-400",   bg: "bg-green-500/15"  },
          { label: "Pending Payment",   value: unpaid,              icon: Clock,        color: "text-amber-400",   bg: "bg-amber-500/15"  },
          { label: "Outstanding Adv.",  value: formatPKR(totalAdvances), icon: Banknote, color: "text-red-400",    bg: "bg-red-500/15"    },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card-luxury p-4 flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", bg)}>
              <Icon className={cn("w-5 h-5", color)} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              <p className={cn("text-xl font-bold font-serif mt-0.5", color)}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Staff list */}
      <div className="card-luxury overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-bold text-foreground">Staff Payroll — {monthName}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Click a staff member to view full ledger and pay salary</p>
        </div>

        <div className="divide-y divide-border/50">
          {staff.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No active staff found</div>
          ) : (
            staff.map((s) => (
              <Link
                key={s.staffMemberId}
                href={`/staff/payroll/${s.staffMemberId}`}
                className="flex items-center gap-4 p-4 hover:bg-surface-elevated transition-colors group"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center text-background font-bold text-sm flex-shrink-0">
                  {getInitials(s.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-foreground text-sm">{s.name}</p>
                    <Badge variant={
                      s.role === UserRole.BRANCH_MANAGER ? "blue" :
                      s.role === UserRole.RECEPTIONIST   ? "green" :
                      s.role === UserRole.HOUSEKEEPING   ? "purple" : "orange"
                    }>
                      {USER_ROLE_CONFIG[s.role as UserRole]?.label ?? s.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.branch}</p>
                </div>

                {/* Salary */}
                <div className="text-right flex-shrink-0 hidden sm:block">
                  <p className="text-xs text-muted-foreground">Monthly</p>
                  <p className="text-sm font-bold text-gold-400">{s.salary > 0 ? formatPKR(s.salary) : "—"}</p>
                </div>

                {/* Advance badge */}
                {s.totalPendingAdv > 0 && (
                  <div className="flex-shrink-0 hidden md:block">
                    <span className="flex items-center gap-1 text-xs bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-1 rounded-full">
                      <AlertTriangle className="w-3 h-3" />
                      Adv: {formatPKR(s.totalPendingAdv)}
                    </span>
                  </div>
                )}

                {/* Paid status */}
                <div className="flex-shrink-0">
                  {s.paidThisMonth ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Paid</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                      <Clock className="w-4 h-4" />
                      <span className="hidden sm:inline">Pending</span>
                    </span>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold-400 transition-colors flex-shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
