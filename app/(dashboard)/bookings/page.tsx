// ============================================================
// app/(dashboard)/bookings/page.tsx
// Bookings management page — server component with filtering.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Building2 } from "lucide-react";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { getBookings, getBookingStatusCounts } from "@/server/actions/bookings";
import { BookingsTable } from "@/features/bookings/components/BookingsTable";
import { BookingStatusTabs } from "@/features/bookings/components/BookingStatusTabs";
import { PageHeader, TableSkeleton } from "@/components/shared";
import { BookingStatus } from "@/types";
import prisma from "@/lib/db/prisma";

interface PageProps {
  searchParams: {
    status?:   string;
    date?:     string;
    branch?:   string;
    page?:     string;
    search?:   string;
  };
}

export const metadata = { title: "Bookings" };

export default async function BookingsPage({ searchParams }: PageProps) {
  const user = await requirePermission("bookings:read");
  const scopedBranchId = getScopedBranchId(user);

  const page   = parseInt(searchParams.page ?? "1");
  const status = searchParams.status as BookingStatus | undefined;
  const activeBranch = searchParams.branch ?? "";

  const [bookings, statusCounts, branches] = await Promise.all([
    getBookings({
      status,
      date:     searchParams.date as "today" | "this_week" | "this_month" | undefined,
      branchId: scopedBranchId ?? (activeBranch || undefined),
      page,
      pageSize: 20,
    }),
    getBookingStatusCounts(scopedBranchId ?? (activeBranch || undefined)),
    // Only super admins (no scoped branch) see the branch selector
    !scopedBranchId ? prisma.branch.findMany({
      where:   { isActive: true },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }) : Promise.resolve([] as { id: string; name: string }[]),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Bookings"
        subtitle={`${bookings.total} total bookings`}
        actions={
          <Link
            href="/bookings/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </Link>
        }
      />

      {/* Status filter tabs */}
      <BookingStatusTabs currentStatus={status} counts={statusCounts} />

      {/* Date + branch filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { label: "All Time",   value: ""            },
          { label: "Today",      value: "today"       },
          { label: "This Week",  value: "this_week"   },
          { label: "This Month", value: "this_month"  },
        ].map((f) => (
          <Link
            key={f.value}
            href={`/bookings?${new URLSearchParams({ ...searchParams, date: f.value, page: "1" })}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              (searchParams.date ?? "") === f.value
                ? "bg-gold-500/15 text-gold-400 border-gold-500/30"
                : "bg-accent/30 text-muted-foreground border-border hover:text-foreground"
            }`}
          >
            {f.label}
          </Link>
        ))}

        {/* Branch selector — super admins only */}
        {branches.length > 0 && (
          <div className="flex items-center gap-1.5 ml-auto">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            <div className="flex gap-1">
              <Link
                href={`/bookings?${new URLSearchParams({ ...searchParams, branch: "", page: "1" })}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  !activeBranch
                    ? "bg-gold-500/15 text-gold-400 border-gold-500/30"
                    : "bg-accent/30 text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                All
              </Link>
              {branches.map(b => (
                <Link
                  key={b.id}
                  href={`/bookings?${new URLSearchParams({ ...searchParams, branch: b.id, page: "1" })}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    activeBranch === b.id
                      ? "bg-gold-500/15 text-gold-400 border-gold-500/30"
                      : "bg-accent/30 text-muted-foreground border-border hover:text-foreground"
                  }`}
                >
                  {b.name.replace("Chakwal Guest House", "").replace("–", "").trim() || b.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bookings table */}
      <Suspense fallback={<TableSkeleton rows={10} cols={7} />}>
        <BookingsTable
          bookings={bookings.data as never}
          pagination={{
            page:       bookings.page,
            totalPages: bookings.totalPages,
            total:      bookings.total,
          }}
        />
      </Suspense>
    </div>
  );
}
