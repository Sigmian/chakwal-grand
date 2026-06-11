// ============================================================
// features/bookings/components/BookingStatusTabs.tsx
// Status filter tabs with live counts
// ============================================================

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/utils";
import { BookingStatus } from "@/types";

interface Props {
  currentStatus?: BookingStatus;
  counts: {
    all:         number;
    pending:     number;
    confirmed:   number;
    checked_in:  number;
    checked_out: number;
    cancelled:   number;
  };
}

const TABS = [
  { label: "All",        value: "",                               color: "text-foreground"     },
  { label: "Pending",    value: BookingStatus.PENDING,            color: "text-amber-400"      },
  { label: "Confirmed",  value: BookingStatus.CONFIRMED,          color: "text-blue-400"       },
  { label: "Checked In", value: BookingStatus.CHECKED_IN,         color: "text-emerald-400"    },
  { label: "Checked Out",value: BookingStatus.CHECKED_OUT,        color: "text-muted-foreground"},
  { label: "Cancelled",  value: BookingStatus.CANCELLED,          color: "text-red-400"        },
];

export function BookingStatusTabs({ currentStatus, counts }: Props) {
  const searchParams = useSearchParams();

  return (
    <div className="flex items-center gap-1 bg-card rounded-xl p-1 border border-border overflow-x-auto">
      {TABS.map((tab) => {
        const isActive = (currentStatus ?? "") === tab.value;
        const count =
          tab.value === ""                       ? counts.all
          : tab.value === BookingStatus.PENDING    ? counts.pending
          : tab.value === BookingStatus.CONFIRMED  ? counts.confirmed
          : tab.value === BookingStatus.CHECKED_IN ? counts.checked_in
          : tab.value === BookingStatus.CHECKED_OUT? counts.checked_out
          : counts.cancelled;

        const params = new URLSearchParams(searchParams.toString());
        if (tab.value) params.set("status", tab.value);
        else           params.delete("status");
        params.set("page", "1");

        return (
          <Link
            key={tab.value}
            href={`/bookings?${params}`}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
              isActive
                ? "bg-gold-500/15 text-gold-400 shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            )}
          >
            {tab.label}
            {count > 0 && (
              <span className={cn(
                "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                isActive ? "bg-gold-500/20 text-gold-300" : "bg-accent text-muted-foreground"
              )}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
