// ============================================================
// lib/auth/permissions.ts
// Role-Based Access Control (RBAC)
//
// Every protected action/page checks against this map.
// One place to update when permissions change — not scattered
// across 50 files.
// ============================================================

import { UserRole } from "@/types";

// ─── Permission Definitions ───────────────────────────────────

export type Permission =
  // Branches
  | "branches:read"
  | "branches:create"
  | "branches:update"
  | "branches:delete"
  // Rooms
  | "rooms:read"
  | "rooms:create"
  | "rooms:update"
  | "rooms:delete"
  | "rooms:upload_images"
  | "rooms:set_maintenance"
  // Bookings
  | "bookings:read"
  | "bookings:create"
  | "bookings:update"
  | "bookings:cancel"
  | "bookings:checkin"
  | "bookings:checkout"
  // Customers
  | "customers:read"
  | "customers:create"
  | "customers:update"
  | "customers:blacklist"
  // Inventory
  | "inventory:read"
  | "inventory:create"
  | "inventory:update"
  | "inventory:restock"
  | "inventory:transfer"
  | "inventory:pos_sell"
  // Finance
  | "finance:read"
  | "finance:expenses:create"
  | "finance:expenses:update"
  | "finance:reports:export"
  // Staff
  | "staff:read"
  | "staff:view"
  | "staff:manage"
  | "staff:create"
  | "staff:update"
  | "staff:delete"
  | "staff:view_salaries"
  // Reviews
  | "reviews:read"
  | "reviews:approve"
  | "reviews:delete"
  // Analytics
  | "analytics:branch"
  | "analytics:company"
  // Settings
  | "settings:company"
  | "settings:branch"
  | "settings:users"
  // CMS
  | "cms:read"
  | "cms:update"
  // Housekeeping
  | "housekeeping:read"
  | "housekeeping:update"
  // Offers
  | "offers:read"
  | "offers:create"
  | "offers:update"
  | "offers:delete";

// ─── Role → Permission Map ────────────────────────────────────

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Full access to everything
    "branches:read", "branches:create", "branches:update", "branches:delete",
    "rooms:read", "rooms:create", "rooms:update", "rooms:delete",
    "rooms:upload_images", "rooms:set_maintenance",
    "bookings:read", "bookings:create", "bookings:update", "bookings:cancel",
    "bookings:checkin", "bookings:checkout",
    "customers:read", "customers:create", "customers:update", "customers:blacklist",
    "inventory:read", "inventory:create", "inventory:update",
    "inventory:restock", "inventory:transfer", "inventory:pos_sell",
    "finance:read", "finance:expenses:create", "finance:expenses:update",
    "finance:reports:export",
    "staff:read", "staff:view", "staff:manage", "staff:create", "staff:update", "staff:delete",
    "staff:view_salaries",
    "reviews:read", "reviews:approve", "reviews:delete",
    "analytics:branch", "analytics:company",
    "settings:company", "settings:branch", "settings:users",
    "cms:read", "cms:update",
    "housekeeping:read", "housekeeping:update",
    "offers:read", "offers:create", "offers:update", "offers:delete",
  ],

  [UserRole.BRANCH_MANAGER]: [
    "branches:read", "branches:update",
    "rooms:read", "rooms:create", "rooms:update",
    "rooms:upload_images", "rooms:set_maintenance",
    "bookings:read", "bookings:create", "bookings:update", "bookings:cancel",
    "bookings:checkin", "bookings:checkout",
    "customers:read", "customers:create", "customers:update",
    "inventory:read", "inventory:create", "inventory:update",
    "inventory:restock", "inventory:pos_sell",
    "finance:read", "finance:expenses:create", "finance:reports:export",
    "staff:read", "staff:view", "staff:manage",
    "reviews:read", "reviews:approve",
    "analytics:branch",
    "settings:branch",
    "cms:read",
    "housekeeping:read", "housekeeping:update",
    "offers:read", "offers:create", "offers:update",
  ],

  [UserRole.RECEPTIONIST]: [
    "rooms:read",
    "bookings:read", "bookings:create", "bookings:update",
    "bookings:checkin", "bookings:checkout",
    "customers:read", "customers:create", "customers:update",
    "inventory:read", "inventory:pos_sell",
    "reviews:read",
    "housekeeping:read",
    "offers:read",
  ],

  [UserRole.HOUSEKEEPING]: [
    "rooms:read",
    "housekeeping:read", "housekeeping:update",
    "rooms:set_maintenance",
  ],

  [UserRole.INVENTORY_STAFF]: [
    "inventory:read", "inventory:update", "inventory:restock",
    "inventory:pos_sell",
  ],
};

// ─── Utility Functions ────────────────────────────────────────

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role.
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Roles that can access the full company overview (all branches).
 */
export const COMPANY_LEVEL_ROLES: UserRole[] = [UserRole.SUPER_ADMIN];

/**
 * Roles that have access to the admin dashboard at all.
 */
export const DASHBOARD_ROLES: UserRole[] = [
  UserRole.SUPER_ADMIN,
  UserRole.BRANCH_MANAGER,
  UserRole.RECEPTIONIST,
  UserRole.HOUSEKEEPING,
  UserRole.INVENTORY_STAFF,
];

// ─── Role Display Helpers ─────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]:     "Super Admin",
  [UserRole.BRANCH_MANAGER]:  "Branch Manager",
  [UserRole.RECEPTIONIST]:    "Receptionist",
  [UserRole.HOUSEKEEPING]:    "Housekeeping",
  [UserRole.INVENTORY_STAFF]: "Inventory Staff",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]:     "gold",
  [UserRole.BRANCH_MANAGER]:  "blue",
  [UserRole.RECEPTIONIST]:    "green",
  [UserRole.HOUSEKEEPING]:    "purple",
  [UserRole.INVENTORY_STAFF]: "orange",
};
