// ============================================================
// app/(dashboard)/bookings/unpaid/page.tsx
// Guests who checked out but still owe money — chase list.
// ============================================================

import Link from "next/link";
import { Phone, CheckCircle2, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { requirePermission } from "@/lib/auth/session";
import { getUnpaidCheckouts } from "@/server/actions/receivables";
import { cn, formatPKR } from "@/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Unpaid Checkouts" };

const leftOn = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { timeZone: "Asia/Karachi", day: "2-digit", month: "short", year: "numeric" }) : "—";

export default async function UnpaidCheckoutsPage() {
  await requirePermission("bookings:read");
  const { rows, totalOwed } = await getUnpaidCheckouts();

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Checked Out — Still Owes"
        subtitle="Guests who left with an unpaid balance. Collect and record the payment on each booking."
      />

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="card-luxury p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Guests owing</p>
          <p className="mt-1 text-2xl font-bold font-serif text-foreground">{rows.length}</p>
        </div>
        <div className="card-luxury p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total owed</p>
          <p className={cn("mt-1 text-2xl font-bold font-serif tabular-nums", totalOwed > 0 ? "text-amber-400" : "text-green-400")}>{formatPKR(totalOwed)}</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card-luxury flex flex-col items-center gap-2 p-12 text-center">
          <CheckCircle2 className="h-8 w-8 text-green-400" />
          <p className="font-semibold text-foreground">Every checked-out guest has paid in full.</p>
        </div>
      ) : (
        <div className="card-luxury overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Guest</th>
                  <th className="px-3 py-3 font-semibold">Room · Branch</th>
                  <th className="px-3 py-3 font-semibold">Left on</th>
                  <th className="px-3 py-3 text-right font-semibold">Bill</th>
                  <th className="px-3 py-3 text-right font-semibold">Paid</th>
                  <th className="px-3 py-3 text-right font-semibold">Owes</th>
                  <th className="px-3 py-3 font-semibold">Reason given</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border/50 last:border-0 align-top hover:bg-accent/30">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">{r.guestName}</p>
                      <a href={`tel:${r.guestPhone}`} className="mt-0.5 inline-flex items-center gap-1 text-xs text-gold-400 hover:underline">
                        <Phone className="h-3 w-3" /> {r.guestPhone}
                      </a>
                      <p className="text-[11px] text-muted-foreground">{r.bookingRef}</p>
                    </td>
                    <td className="px-3 py-3 text-muted-foreground">Room {r.roomNumber}<br /><span className="text-[11px]">{r.branchName}</span></td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <p className="text-foreground">{leftOn(r.checkedOutAt)}</p>
                      <p className={cn("text-[11px]", r.daysSince >= 7 ? "text-red-400" : r.daysSince >= 2 ? "text-amber-400" : "text-muted-foreground")}>
                        {r.daysSince === 0 ? "today" : `${r.daysSince} day${r.daysSince === 1 ? "" : "s"} ago`}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{formatPKR(r.totalAmount)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-muted-foreground">{formatPKR(r.paidAmount)}</td>
                    <td className="px-3 py-3 text-right font-bold tabular-nums text-amber-400">{formatPKR(r.balance)}</td>
                    <td className="px-3 py-3 max-w-[220px] text-xs text-muted-foreground">{r.reason ?? <span className="italic">— (before checkout guard)</span>}</td>
                    <td className="px-3 py-3 text-right">
                      <Link href={`/bookings/${r.id}#payment`} className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-gold-gradient px-3 py-1.5 text-xs font-bold text-background">
                        Record payment <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
