// ============================================================
// features/settings/components/UserManagementTable.tsx
// User list with role display and deactivate toggle
// ============================================================

"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Power } from "lucide-react";
import { Badge } from "@/components/shared";
import { cn, formatDateTime, USER_ROLE_CONFIG, getInitials } from "@/utils";
import { UserRole } from "@/types";
import { toggleUserActive } from "@/server/actions/settings";

interface User {
  id:         string;
  name:       string;
  email:      string;
  role:       UserRole;
  isActive:   boolean;
  lastLoginAt?:Date | null;
  staffMember?: { branch?: { name: string } | null } | null;
}

interface Props { users: User[] }

const ROLE_BADGE_VARIANT: Record<UserRole, "gold" | "blue" | "green" | "purple" | "orange"> = {
  [UserRole.SUPER_ADMIN]:     "gold",
  [UserRole.BRANCH_MANAGER]:  "blue",
  [UserRole.RECEPTIONIST]:    "green",
  [UserRole.HOUSEKEEPING]:    "purple",
  [UserRole.INVENTORY_STAFF]: "orange",
};

function UserRow({ user }: { user: User }) {
  const [isPending, startTransition] = useTransition();
  const roleCfg = USER_ROLE_CONFIG[user.role];

  const handleToggle = () => {
    startTransition(async () => {
      await toggleUserActive(user.id, user.isActive);
      toast.success(user.isActive ? `${user.name} deactivated` : `${user.name} activated`);
    });
  };

  return (
    <tr className={cn("group", !user.isActive && "opacity-50")}>
      <td>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-background text-xs font-bold flex-shrink-0">
            {getInitials(user.name)}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </td>
      <td>
        <Badge variant={ROLE_BADGE_VARIANT[user.role]}>
          {roleCfg.label}
        </Badge>
      </td>
      <td>
        <span className="text-sm text-muted-foreground">
          {user.staffMember?.branch?.name ?? "All Branches"}
        </span>
      </td>
      <td>
        <span className="text-xs text-muted-foreground">
          {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : "Never"}
        </span>
      </td>
      <td>
        <Badge variant={user.isActive ? "green" : "red"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      </td>
      <td>
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={cn(
            "p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100",
            user.isActive
              ? "text-red-400 hover:bg-red-500/10"
              : "text-green-400 hover:bg-green-500/10"
          )}
          title={user.isActive ? "Deactivate" : "Activate"}
        >
          <Power className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

export function UserManagementTable({ users }: Props) {
  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No users found</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Branch</th>
            <th>Last Login</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => <UserRow key={user.id} user={user} />)}
        </tbody>
      </table>
    </div>
  );
}
