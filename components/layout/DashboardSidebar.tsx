// ============================================================
// components/layout/DashboardSidebar.tsx
// Collapsible sidebar with role-filtered navigation,
// animated submenu accordion, mobile drawer
// ============================================================

"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Building2, BedDouble, CalendarCheck,
  Sparkles, Users, Package, DollarSign, UserCog, Star,
  Settings, ChevronDown, ChevronRight, LogOut, Menu, X,
  Shield, Crown,
} from "lucide-react";
import { cn, getInitials } from "@/utils";
import { getNavForRole } from "@/config/navigation";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { SessionUser } from "@/types";
import { UserRole } from "@/types";

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, Building2, BedDouble, CalendarCheck,
  Sparkles, Users, Package, DollarSign, UserCog, Star,
  Settings,
};

interface Props {
  user: SessionUser;
}

const ROLE_BADGE: Record<UserRole, { label: string; className: string; icon: React.ElementType }> = {
  [UserRole.SUPER_ADMIN]:     { label: "Super Admin",    className: "bg-gold-500/20 text-gold-400 border-gold-500/30",    icon: Crown  },
  [UserRole.BRANCH_MANAGER]:  { label: "Manager",        className: "bg-blue-500/20 text-blue-400 border-blue-500/30",    icon: Shield },
  [UserRole.RECEPTIONIST]:    { label: "Reception",      className: "bg-green-500/20 text-green-400 border-green-500/30", icon: UserCog },
  [UserRole.HOUSEKEEPING]:    { label: "Housekeeping",   className: "bg-violet-500/20 text-violet-400 border-violet-500/30", icon: Sparkles },
  [UserRole.INVENTORY_STAFF]: { label: "Inventory",      className: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: Package },
};

export function DashboardSidebar({ user }: Props) {
  const pathname       = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus]   = useState<Record<string, boolean>>({});

  const navItems  = useMemo(() => getNavForRole(user.role), [user.role]);
  const roleBadge = ROLE_BADGE[user.role];
  const RoleIcon  = roleBadge.icon;

  // Auto-open parent menu when a child is active
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children?.some((c) => pathname.startsWith(c.href))) {
        setOpenMenus((prev) => ({ ...prev, [item.href]: true }));
      }
    });
  }, [pathname, navItems]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const toggleMenu = (href: string) =>
    setOpenMenus((prev) => ({ ...prev, [href]: !prev[href] }));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* ── Logo ── */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-border/50",
        collapsed && "justify-center px-2"
      )}>
        <Image
          src="/images/logo.png"
          alt="Chakwal Grand Guest House"
          width={36}
          height={36}
          className="rounded-xl flex-shrink-0 shadow-gold-sm"
        />
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground font-serif leading-tight truncate">
              Chakwal Grand
            </p>
            <p className="text-2xs text-muted-foreground truncate">Management Portal</p>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon      = ICON_MAP[item.icon ?? ""] ?? LayoutDashboard;
          const active    = isActive(item.href);
          const hasChildren = !!item.children?.length;
          const menuOpen  = openMenus[item.href] ?? false;
          const childActive = item.children?.some((c) => pathname.startsWith(c.href));

          if (hasChildren) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => toggleMenu(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                    collapsed ? "justify-center" : "justify-between",
                    childActive
                      ? "bg-gold-500/10 text-gold-400"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn(
                      "w-4 h-4 flex-shrink-0 transition-colors",
                      childActive ? "text-gold-400" : "text-muted-foreground group-hover:text-foreground"
                    )} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && (
                    <ChevronDown className={cn(
                      "w-3.5 h-3.5 transition-transform flex-shrink-0",
                      menuOpen && "rotate-180"
                    )} />
                  )}
                </button>

                <AnimatePresence>
                  {menuOpen && !collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-4 mt-0.5 border-l border-border/50 pl-3 space-y-0.5"
                    >
                      {item.children!.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all",
                            pathname === child.href || pathname.startsWith(child.href + "/")
                              ? "text-gold-400 bg-gold-500/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                        >
                          <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-50" />
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                collapsed && "justify-center",
                active
                  ? "bg-gold-500/15 text-gold-400 shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 flex-shrink-0 transition-colors",
                active ? "text-gold-400" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!collapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-gold-500 text-background text-2xs font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
              {active && !collapsed && (
                <div className="w-1 h-4 bg-gold-gradient rounded-full flex-shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── User profile + logout ── */}
      <div className={cn(
        "border-t border-border/50 p-3",
        collapsed ? "flex flex-col items-center gap-2" : "space-y-2"
      )}>
        {/* Role badge */}
        {!collapsed && (
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium",
            roleBadge.className
          )}>
            <RoleIcon className="w-3 h-3" />
            {roleBadge.label}
          </div>
        )}

        {/* User info + logout */}
        <div className={cn(
          "flex items-center gap-3",
          collapsed ? "flex-col" : ""
        )}>
          <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-background text-xs font-bold">
              {getInitials(user.name)}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-2xs text-muted-foreground truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className={cn(
        "hidden md:flex flex-col bg-surface-elevated border-r border-border transition-all duration-300 ease-in-out flex-shrink-0",
        collapsed ? "w-16" : "w-[240px]"
      )}>
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute left-0 top-[72px] -right-3 z-10 w-6 h-6 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold-500/50 transition-all shadow-card ml-auto mr-0"
          style={{ left: collapsed ? "52px" : "228px" }}
        >
          <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", !collapsed && "rotate-180")} />
        </button>

        <SidebarContent />
      </aside>

      {/* ── Mobile: hamburger button ── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-surface-elevated border border-border rounded-xl text-foreground shadow-card"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-surface-elevated border-r border-border"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
