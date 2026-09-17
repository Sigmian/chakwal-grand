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
    label: "My Attendance",
    href:  "/portal",
    icon:  "Fingerprint",
    // Every staff role can mark their own attendance.
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.RECEPTIONIST,
      UserRole.HOUSEKEEPING,
      UserRole.INVENTORY_STAFF,
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
      { label: "Stock Ledger", href: "/inventory/ledger" },
    ],
  },
  {
    label: "POS",
    href:  "/pos",
    icon:  "Receipt",
    // Guest Orders POS — free-text receipts for food/items arranged for guests.
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
      UserRole.RECEPTIONIST,
    ],
    children: [
      { label: "New Receipt",     href: "/pos/new" },
      { label: "Receipt History", href: "/pos/history" },
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
    label: "Analytics",
    href:  "/analytics",
    icon:  "BarChart2",
    requiredRoles: [
      UserRole.SUPER_ADMIN,
      UserRole.BRANCH_MANAGER,
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
      { label: "Monthly Statement", href: "/finance/statement" },
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
    children: [
      {
        label: "Directory",
        href:  "/staff",
        icon:  "Users",
        requiredRoles: [UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER],
      },
      {
        label: "Attendance & Payroll",
        href:  "/staff/attendance",
        icon:  "ClipboardCheck",
        requiredRoles: [UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER],
      },
      {
        label: "Tasks & Discipline",
        href:  "/staff/ops",
        icon:  "ListTodo",
        requiredRoles: [UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER],
      },
      {
        label: "Attendance Reports",
        href:  "/staff/reports",
        icon:  "BarChart2",
        requiredRoles: [UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER],
      },
      {
        label: "Activity Log",
        href:  "/staff/activity",
        icon:  "Activity",
        requiredRoles: [UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER],
      },
      {
        label: "Payroll",
        href:  "/staff/payroll",
        icon:  "Banknote",
        requiredRoles: [UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER],
      },
      {
        label: "HR Settings",
        href:  "/staff/hr",
        icon:  "SlidersHorizontal",
        requiredRoles: [UserRole.SUPER_ADMIN, UserRole.BRANCH_MANAGER],
      },
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
      // Zara AI settings require settings:ai — super admin only. Without this the
      // link showed to branch managers and clicking it hit Access Denied.
      { label: "Zara AI",      href: "/settings/zara", requiredRoles: [UserRole.SUPER_ADMIN] },
    ],
  },
];

/**
 * Filter navigation items for a given role.
 */
export function getNavForRole(role: UserRole): NavItem[] {
  return DASHBOARD_NAV
    .filter((item) => !item.requiredRoles || item.requiredRoles.includes(role))
    .map((item) =>
      item.children
        ? {
            ...item,
            // Also filter sub-links by their own requiredRoles so a role is never
            // shown a child page it can't actually open.
            children: item.children.filter(
              (c) => !c.requiredRoles || c.requiredRoles.includes(role),
            ),
          }
        : item,
    );
}
