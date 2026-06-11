// ============================================================
// features/customers/components/BlacklistButton.tsx
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldAlert, Loader2 } from "lucide-react";
import { blacklistCustomer } from "@/server/actions/branches";

interface Props {
  customerId:   string;
  customerName: string;
}

export function BlacklistButton({ customerId, customerName }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleBlacklist = () => {
    if (!reason.trim()) { toast.error("Please provide a reason"); return; }
    startTransition(async () => {
      const result = await blacklistCustomer(customerId, reason);
      if (result.success) {
        toast.success(`${customerName} has been blacklisted`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error("Failed to blacklist customer");
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors"
      >
        <ShieldAlert className="w-4 h-4" />
        Blacklist Customer
      </button>
    );
  }

  return (
    <div className="card-luxury rounded-xl p-5 border border-red-500/30">
      <h3 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4" /> Blacklist {customerName}
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        This will flag the customer and prevent future bookings. This action is logged.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for blacklisting..."
        rows={3}
        className="w-full bg-surface-elevated border border-red-500/20 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-red-500/40 resize-none mb-3"
      />
      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          className="flex-1 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
        <button
          onClick={handleBlacklist}
          disabled={isPending || !reason.trim()}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/15 text-red-400 border border-red-500/30 text-sm font-semibold hover:bg-red-500/25 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
          Confirm
        </button>
      </div>
    </div>
  );
}
