"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import { toggleStaffActive } from "@/server/actions/staff";
import { cn } from "@/utils";

interface Props {
  staffId:  string;
  isActive: boolean;
  canManage: boolean;
}

export function ToggleActiveButton({ staffId, isActive, canManage }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [pending, startTransition] = useTransition();

  if (!canManage) return null;

  const handle = () => {
    startTransition(async () => {
      try {
        const result = await toggleStaffActive(staffId);
        setActive(result.isActive);
        toast.success(result.isActive ? "Account reactivated" : "Account deactivated");
        router.refresh();
      } catch (e: unknown) {
        toast.error(e instanceof Error ? e.message : "Failed to update account");
      }
    });
  };

  return (
    <button
      onClick={handle}
      disabled={pending}
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-all disabled:opacity-50",
        active
          ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
      )}
    >
      {active ? (
        <><UserX className="w-4 h-4" />{pending ? "Deactivating…" : "Deactivate Account"}</>
      ) : (
        <><UserCheck className="w-4 h-4" />{pending ? "Reactivating…" : "Reactivate Account"}</>
      )}
    </button>
  );
}
