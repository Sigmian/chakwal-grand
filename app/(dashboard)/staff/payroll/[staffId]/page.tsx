// ============================================================
// app/(dashboard)/staff/payroll/[staffId]/page.tsx
// Individual staff payroll ledger — salary history + advances
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/session";
import { getStaffPayrollLedger } from "@/server/actions/payroll";
import { PageHeader, Badge } from "@/components/shared";
import { formatPKR, USER_ROLE_CONFIG, getInitials, cn } from "@/utils";
import { UserRole } from "@/types";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { PayrollClient } from "./PayrollClient";

export const metadata = { title: "Staff Payroll Ledger" };

interface Props { params: { staffId: string } }

export default async function StaffPayrollPage({ params }: Props) {
  await requirePermission("staff:view_salaries");

  let data;
  try {
    data = await getStaffPayrollLedger(params.staffId);
  } catch {
    notFound();
  }

  const { staffMember, payments, advances, pendingAdvances, totalPending } = data;
  const roleCfg = USER_ROLE_CONFIG[staffMember.role as UserRole];

  const totalPaid = payments.reduce((s, p) => s + Number(p.netAmount), 0);
  const thisYear  = new Date().getFullYear();
  const paidThisYear = payments
    .filter((p) => p.year === thisYear)
    .reduce((s, p) => s + Number(p.netAmount), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <Link href="/staff/payroll" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        All Staff
      </Link>

      {/* Header */}
      <div className="card-luxury p-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gold-gradient flex items-center justify-center text-background font-bold text-lg flex-shrink-0">
            {getInitials(staffMember.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold font-serif text-foreground">{staffMember.name}</h1>
              <Badge variant={
                staffMember.role === UserRole.BRANCH_MANAGER ? "blue" :
                staffMember.role === UserRole.RECEPTIONIST   ? "green" :
                staffMember.role === UserRole.HOUSEKEEPING   ? "purple" : "orange"
              }>
                {roleCfg?.label ?? staffMember.role}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{staffMember.branch}, {staffMember.city}</p>
            {staffMember.designation && (
              <p className="text-xs text-muted-foreground">{staffMember.designation}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-muted-foreground">Monthly Salary</p>
            <p className="text-xl font-bold font-serif text-gold-400">
              {staffMember.salary > 0 ? formatPKR(staffMember.salary) : "Not set"}
            </p>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Paid (All Time)", value: formatPKR(totalPaid),     color: "text-gold-400"   },
          { label: `Paid in ${thisYear}`,   value: formatPKR(paidThisYear),  color: "text-green-400"  },
          { label: "Payment Records",        value: payments.length,          color: "text-foreground" },
          { label: "Pending Advances",       value: formatPKR(totalPending),  color: totalPending > 0 ? "text-amber-400" : "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="card-luxury p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className={cn("text-lg font-bold font-serif mt-1", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pending advance warning */}
      {totalPending > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-300">
            {pendingAdvances.length} outstanding advance{pendingAdvances.length !== 1 ? "s" : ""} totalling{" "}
            <span className="font-bold">{formatPKR(totalPending)}</span> — will be deducted from next salary payment.
          </p>
        </div>
      )}

      {/* Client interactive section */}
      <PayrollClient
        staffMemberId={staffMember.id}
        staffName={staffMember.name}
        defaultSalary={staffMember.salary}
        pendingAdvances={pendingAdvances.map((a) => ({
          id:         a.id,
          amount:     Number(a.amount),
          reason:     a.reason,
          notes:      a.notes,
          givenAt:    a.givenAt.toISOString(),
          status:     String(a.status),
          signature:  a.signature,
          deductedAt: a.deductedAt?.toISOString() ?? null,
        }))}
        payments={payments.map((p) => ({
          id:              p.id,
          month:           p.month,
          year:            p.year,
          grossAmount:     Number(p.grossAmount),
          advanceDeducted: Number(p.advanceDeducted),
          netAmount:       Number(p.netAmount),
          notes:           p.notes,
          signature:       p.signature,
          paidAt:          p.paidAt.toISOString(),
        }))}
        advances={advances.map((a) => ({
          id:         a.id,
          amount:     Number(a.amount),
          reason:     a.reason,
          notes:      a.notes,
          givenAt:    a.givenAt.toISOString(),
          status:     String(a.status),
          signature:  a.signature,
          deductedAt: a.deductedAt?.toISOString() ?? null,
        }))}
        totalPending={totalPending}
      />
    </div>
  );
}
