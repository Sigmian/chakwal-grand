// ============================================================
// app/(dashboard)/bookings/page.tsx
// Bookings management page — server component with filtering.
// ============================================================

import { Suspense } from "react";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getBookings, getBookingStatusCounts } from "@/server/actions/bookings";
import { BookingsTable } from "@/features/bookings/components/BookingsTable";
import { BookingStatusTabs } from "@/features/bookings/components/BookingStatusTabs";
import { PageHeader, TableSkeleton } from "@/components/shared";
import { BookingStatus } from "@/types";

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
  await requirePermission("bookings:read");

  const page   = parseInt(searchParams.page ?? "1");
  const status = searchParams.status as BookingStatus | undefined;

  const [bookings, statusCounts] = await Promise.all([
    getBookings({
      status,
      date:     searchParams.date as "today" | "this_week" | "this_month" | undefined,
      branchId: searchParams.branch,
      page,
      pageSize: 20,
    }),
    getBookingStatusCounts(searchParams.branch),
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

      {/* Date quick filters */}
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
