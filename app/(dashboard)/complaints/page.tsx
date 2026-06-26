import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/shared";
import { getComplaints } from "@/server/actions/complaints";
import { ComplaintsClient } from "@/features/complaints/components/ComplaintsClient";

export const metadata = { title: "Complaints" };

export default async function ComplaintsPage() {
  const user      = await requirePermission("complaints:read");
  const canManage = hasPermission(user.role, "complaints:update");
  const complaints = await getComplaints();

  const counts = {
    open:        complaints.filter(c => c.status === "OPEN").length,
    inProgress:  complaints.filter(c => c.status === "IN_PROGRESS").length,
    resolved:    complaints.filter(c => c.status === "RESOLVED").length,
    high:        complaints.filter(c => c.severity === "HIGH" && c.status !== "RESOLVED").length,
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <PageHeader
        title="Complaints"
        subtitle="Guest complaints logged from WhatsApp bot, web, and calls — prioritized by severity"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-luxury p-5 text-center border-red-500/30">
          <p className="text-3xl font-bold text-red-400 font-serif">{counts.high}</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1">High Priority</p>
        </div>
        <div className="card-luxury p-5 text-center">
          <p className="text-3xl font-bold text-amber-400 font-serif">{counts.open}</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1">Open</p>
        </div>
        <div className="card-luxury p-5 text-center">
          <p className="text-3xl font-bold text-blue-400 font-serif">{counts.inProgress}</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1">In Progress</p>
        </div>
        <div className="card-luxury p-5 text-center">
          <p className="text-3xl font-bold text-emerald-400 font-serif">{counts.resolved}</p>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-1">Resolved</p>
        </div>
      </div>

      <ComplaintsClient complaints={complaints as any} canManage={canManage} />
    </div>
  );
}
