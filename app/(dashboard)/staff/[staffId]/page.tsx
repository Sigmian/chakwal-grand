// ============================================================
// app/(dashboard)/staff/[staffId]/page.tsx
// Staff member detail — profile, performance, activity log
// ============================================================

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, CreditCard, MapPin, Calendar,
  Clock, TrendingUp, Activity, BookOpen, ChevronRight,
  Shield, CheckCircle2, XCircle,
} from "lucide-react";
import { getStaffMember, getStaffPerformance } from "@/server/actions/staff";
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader, Badge, StatCard, GoldDivider, SectionHeader } from "@/components/shared";
import { ToggleActiveButton } from "@/features/staff/components/ToggleActiveButton";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { cn, formatPKR, formatDate, formatTime, USER_ROLE_CONFIG } from "@/utils";
import { UserRole } from "@/types";

export const dynamic = "force-dynamic";

const DAY_LABELS: Record<string, string> = {
  MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu",
  FRI: "Fri", SAT: "Sat", SUN: "Sun",
};
const ALL_DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

interface Props { params: { staffId: string } }

export default async function StaffDetailPage({ params }: Props) {
  const viewer = await requirePermission("staff:view");
  const canManage = hasPermission(viewer.role, "staff:manage");

  let data;
  try {
    data = await getStaffMember(params.staffId);
  } catch {
    notFound();
  }
  const { staff, bookings } = data;
  const perf     = await getStaffPerformance(params.staffId);
  const isActive = staff.user.isActive;
  const roleCfg  = USER_ROLE_CONFIG[staff.user.role as UserRole] ?? { label: staff.user.role, color: "text-muted-foreground" };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/staff" className="flex items-center gap-1 hover:text-gold-400 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Staff
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground">{staff.user.name}</span>
      </div>

      {/* Profile card */}
      <div className="card-luxury p-6">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gold-gradient flex items-center justify-center text-3xl font-bold text-background flex-shrink-0">
            {staff.user.name?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
              <div>
                <h1 className="text-2xl font-bold font-serif text-foreground">{staff.user.name}</h1>
                <p className="text-muted-foreground text-sm mt-0.5">{staff.user.email}</p>
                {staff.designation && (
                  <p className="text-gold-400 text-sm mt-1 font-medium">{staff.designation}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant={
                  staff.user.role === UserRole.SUPER_ADMIN     ? "gold"   :
                  staff.user.role === UserRole.BRANCH_MANAGER  ? "blue"   :
                  staff.user.role === UserRole.RECEPTIONIST    ? "green"  :
                  staff.user.role === UserRole.HOUSEKEEPING    ? "purple" : "orange"
                }>
                  {roleCfg.label}
                </Badge>
                <Badge variant={isActive ? "green" : "red"}>
                  {isActive ? "Active" : "Inactive"}
                </Badge>
                <ToggleActiveButton
                  staffId={staff.id}
                  isActive={isActive}
                  canManage={canManage}
                />
              </div>
            </div>

            <GoldDivider className="my-3" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-gold-500/60" />
                {staff.branch.name}
              </div>
              {staff.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 text-gold-500/60" />
                  {staff.phone}
                </div>
              )}
              {staff.salary && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CreditCard className="w-3.5 h-3.5 text-gold-500/60" />
                  {formatPKR(Number(staff.salary))}/mo
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 text-gold-500/60" />
                Joined {formatDate(staff.joinedAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance — last 30 days */}
      <div>
        <SectionHeader title="Performance · Last 30 Days" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Bookings Created" value={String(perf.bookingsHandled)}
            icon={<BookOpen className="w-5 h-5 text-gold-400" />} iconBg="bg-gold-500/15" />
          <StatCard title="Check-ins"        value={String(perf.checkIns)}
            icon={<CheckCircle2 className="w-5 h-5 text-green-400" />} iconBg="bg-green-500/15" />
          <StatCard title="Check-outs"       value={String(perf.checkOuts)}
            icon={<TrendingUp className="w-5 h-5 text-blue-400" />} iconBg="bg-blue-500/15" />
          <StatCard title="Activity Events"  value={String(perf.activityCount)}
            icon={<Activity className="w-5 h-5 text-purple-400" />} iconBg="bg-purple-500/15" />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Schedule */}
        <div className="card-luxury p-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold-400" />
            Work Schedule
          </h2>

          {staff.shiftStart && staff.shiftEnd ? (
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 font-mono text-sm">
                {staff.shiftStart}
              </div>
              <span className="text-muted-foreground">→</span>
              <div className="px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 font-mono text-sm">
                {staff.shiftEnd}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No shift defined</p>
          )}

          <div>
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Working Days</p>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_DAYS.map(d => (
                <div
                  key={d}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-semibold border",
                    staff.workingDays.includes(d)
                      ? "bg-gold-500/15 text-gold-400 border-gold-500/30"
                      : "bg-accent text-muted-foreground border-border/50"
                  )}
                >
                  {DAY_LABELS[d]}
                </div>
              ))}
            </div>
          </div>

          {staff.notes && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm text-foreground">{staff.notes}</p>
            </div>
          )}
        </div>

        {/* Identity & Access */}
        <div className="card-luxury p-5 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-gold-400" />
            Identity & Access
          </h2>

          <div className="space-y-3 text-sm">
            {[
              { label: "System Role",   value: roleCfg.label         },
              { label: "Branch Access", value: staff.branch.name     },
              { label: "Account",       value: isActive ? "Active" : "Deactivated",
                className: isActive ? "text-green-400" : "text-red-400" },
            ].concat(staff.cnic ? [{ label: "CNIC", value: staff.cnic.replace(/(\d{5})(\d{7})(\d)/, "$1-$2-$3"), className: "font-mono text-xs" }] : [])
             .map(({ label, value, className }) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className={cn("font-medium text-foreground", className)}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent bookings */}
        <div className="card-luxury p-5 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gold-400" />
            Recent Bookings Handled
          </h2>
          {bookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">No bookings recorded</p>
          ) : (
            bookings.slice(0, 8).map(b => (
              <Link
                key={b.id}
                href={`/bookings/${b.id}`}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-accent transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate group-hover:text-gold-400 transition-colors">
                    {b.customer.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Room {b.room.number} · {formatDate(b.checkInDate)}
                  </p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-gold-400 transition-colors flex-shrink-0" />
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Activity Log */}
      <div className="card-luxury p-6">
        <SectionHeader title="Activity Log" />
        {staff.activityLogs.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">No activity recorded</p>
        ) : (
          <div className="space-y-0">
            {staff.activityLogs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
                <div className="w-2 h-2 rounded-full bg-gold-500/50 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{log.action}</p>
                </div>
                <time className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDate(log.createdAt)} {formatTime(log.createdAt)}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
