// ============================================================
// config/navigation.ts
// Dashboard navigation — items filtered by user role at render
// ============================================================

import type { NavItem } from "@/types";
import { UserRole } from "@/types";

export const DASHBOARD_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href:  "/dashboard",
    icon:  "LayoutDashboard",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.RECEPTIONIST,
    ],
  },
  {
    label: "Branches",
    href:  "/branches",
    icon:  "Building2",
    requiredRoles: [UserRole.SUPER_ADMIN],
  },
  {
    label: "Rooms",
    href:  "/dashboard/rooms",
    icon:  "BedDouble",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.RECEPTIONIST,
      UserRole.HOUSEKEEPING,
    ],
  },
  {
    label: "Gallery",
    href:  "/dashboard/gallery",
    icon:  "Images",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
    ],
  },
  {
    label: "Bookings",
    href:  "/bookings",
    icon:  "CalendarCheck",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.RECEPTIONIST,
    ],
    children: [
      { label: "All Bookings", href: "/bookings" },
      { label: "New Booking",  href: "/bookings/new" },
    ],
  },
  {
    label: "Housekeeping",
    href:  "/housekeeping",
    icon:  "Sparkles",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.HOUSEKEEPING,
    ],
  },
  {
    label: "Customers",
    href:  "/customers",
    icon:  "Users",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.RECEPTIONIST,
    ],
  },
  {
    label: "Inventory",
    href:  "/inventory",
    icon:  "Package",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.INVENTORY_STAFF,
    ],
    children: [
      { label: "Products",  href: "/inventory/products" },
      { label: "Point of Sale", href: "/inventory/pos" },
    ],
  },
  {
    label: "Room Orders",
    href:  "/dashboard/orders",
    icon:  "ShoppingBag",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.RECEPTIONIST,
    ],
  },
  {
    label: "Finance",
    href:  "/finance",
    icon:  "DollarSign",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
    ],
    children: [
      { label: "Revenue",  href: "/finance/revenue"  },
      { label: "Expenses", href: "/finance/expenses" },
      { label: "Reports",  href: "/finance/reports"  },
    ],
  },
  {
    label: "Staff",
    href:  "/staff",
    icon:  "UserCog",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
    ],
  },
  {
    label: "Reviews",
    href:  "/reviews",
    icon:  "Star",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
    ],
  },
  {
    label: "Complaints",
    href:  "/complaints",
    icon:  "AlertCircle",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.RECEPTIONIST,
    ],
  },
  {
    label: "Promo Codes",
    href:  "/offers",
    icon:  "Tag",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
    ],
  },
  {
    label: "Announcements",
    href:  "/announcements",
    icon:  "Megaphone",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
    ],
  },
  {
    label: "Settings",
    href:  "/settings",
    icon:  "Settings",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
    ],
    children: [
      { label: "General",      href: "/settings" },
      { label: "Zara AI",      href: "/settings/zara" },
    ],
  },
];

/**
 * Filter navigation items for a given role.
 */
export function getNavForRole(role: UserRole): NavItem[] {
  return DASHBOARD_NAV.filter(
    (item) =>
      !item.requiredRoles || item.requiredRoles.includes(role)
  );
}
