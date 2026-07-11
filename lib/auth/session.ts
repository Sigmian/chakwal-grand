// ============================================================
// lib/auth/session.ts
// Server-side session utilities
//
// Used in:
//   - Server Components (RSC)
//   - Server Actions
//   - API Route handlers
//
// Never import this in client components.
// ============================================================

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth-options";
import { hasPermission, DASHBOARD_ROLES } from "./permissions";
import type { Permission } from "./permissions";
import type { SessionUser } from "@/types";
import { UserRole } from "@/types";
import prisma from "@/lib/db/prisma";

// ─── Get current session ──────────────────────────────────────

/**
 * Returns the current user session or null.
 * Does NOT redirect — use requireAuth for protected pages.
 */
export async function getSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  // JWT authorization claims can be stale for up to 30 days. Resolve current
  // access state so deactivation, demotion, and branch transfers apply now.
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      companyId: true,
      email: true,
      name: true,
      image: true,
      role: true,
      isActive: true,
      staffMember: { select: { branchId: true } },
    },
  });

  if (!currentUser?.isActive) return null;

  return {
    id: currentUser.id,
    companyId: currentUser.companyId,
    email: currentUser.email,
    name: currentUser.name,
    image: currentUser.image ?? undefined,
    role: currentUser.role as UserRole,
    branchId: currentUser.staffMember?.branchId ?? undefined,
  };
}

/**
 * Returns the current user or redirects to /login.
 * Use this at the top of every Server Component that needs auth.
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    redirect("/login");
  }

  if (!DASHBOARD_ROLES.includes(user.role)) {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * Require auth AND a specific permission.
 * Throws 403-equivalent redirect if permission missing.
 */
export async function requirePermission(
  permission: Permission
): Promise<SessionUser> {
  const user = await requireAuth();

  if (!hasPermission(user.role, permission)) {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * Require Super Admin role.
 * Used for company-level operations (cross-branch analytics, user management).
 */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireAuth();

  if (user.role !== UserRole.SUPER_ADMIN) {
    redirect("/unauthorized");
  }

  return user;
}

/**
 * Scope a branch query to the user's branch.
 *
 * - SUPER_ADMIN: can pass any branchId (or null for all)
 * - Others: always restricted to their own branch
 *
 * Usage in Server Actions:
 *   const branchId = getScopedBranchId(user, requestedBranchId);
 *   const bookings = await prisma.booking.findMany({ where: { branchId } });
 */
export function getScopedBranchId(
  user: SessionUser,
  requestedBranchId?: string | null
): string | undefined {
  if (user.role === UserRole.SUPER_ADMIN) {
    // Super admin can query any branch, or all branches (undefined)
    return requestedBranchId ?? undefined;
  }

  // Non-super-admin is always restricted to their branch
  return user.branchId;
}

/** Return whether the current user may access records owned by a branch. */
export function canAccessBranch(user: SessionUser, branchId: string): boolean {
  return user.role === UserRole.SUPER_ADMIN || user.branchId === branchId;
}

/**
 * Enforce branch ownership after loading an entity by ID. This is intended for
 * Server Actions where the entity's branch is not known until it is queried.
 */
export function assertBranchAccess(user: SessionUser, branchId: string): void {
  if (!canAccessBranch(user, branchId)) {
    throw new Error("Unauthorized branch access");
  }
}

/** Enforce company ownership for company-level entities such as customers. */
export function assertCompanyAccess(user: SessionUser, companyId: string): void {
  if (user.companyId !== companyId) {
    throw new Error("Unauthorized company access");
  }
}

/**
 * Verify a user can access a specific branch's data.
 * Throws redirect if they can't.
 */
export async function requireBranchAccess(
  branchId: string
): Promise<SessionUser> {
  const user = await requireAuth();

  if (
    user.role !== UserRole.SUPER_ADMIN &&
    user.branchId !== branchId
  ) {
    redirect("/unauthorized");
  }

  return user;
}
