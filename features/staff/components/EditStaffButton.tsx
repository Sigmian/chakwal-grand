"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { EditStaffPanel } from "./EditStaffPanel";

interface Branch { id: string; name: string; city: string }

interface StaffData {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  branchId: string;
  phone: string | null;
  cnic: string | null;
  designation: string | null;
  salary: number | null;
  shiftStart: string | null;
  shiftEnd: string | null;
  workingDays: string[];
  notes: string | null;
}

interface Props {
  staff: StaffData;
  branches: Branch[];
  isSuperAdmin: boolean;
}

export function EditStaffButton({ staff, branches, isSuperAdmin }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-xl border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 transition-all"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </button>
      {open && (
        <EditStaffPanel
          staff={staff}
          branches={branches}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
