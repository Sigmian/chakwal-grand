// ============================================================
// components/layout/DashboardHeader.tsx
// Top bar: breadcrumbs, branch selector, notifications, clock
// ============================================================

"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Bell, ChevronRight, Building2, Check, Clock, Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatTime } from "@/utils";
import type { SessionUser } from "@/types";
import { UserRole } from "@/types";
import { PushNotificationToggle } from "@/features/dashboard/components/PushNotificationToggle";

interface Props {
  user: SessionUser;
}

// Map path segments to readable labels
const PATH_LABELS: Record<string, string> = {
  dashboard:   "Dashboard",
  rooms:       "Rooms",
  bookings:    "Bookings",
  branches:    "Branches",
  customers:   "Customers",
  housekeeping:"Housekeeping",
  inventory:   "Inventory",
  products:    "Products",
  pos:         "Point of Sale",
  finance:     "Finance",
  revenue:     "Revenue",
  expenses:    "Expenses",
  reports:     "Reports",
  staff:       "Staff",
  reviews:     "Reviews",
  settings:    "Settings",
  offers:      "Promo Codes",
};

// Context-aware labels for "new" based on parent segment
const NEW_LABELS: Record<string, string> = {
  bookings:  "New Booking",
  rooms:     "New Room",
  customers: "New Customer",
  staff:     "New Staff",
  branches:  "New Branch",
};

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "warning", title: "Low stock alert",  body: "Mineral water running low in Branch 1", time: "5m ago", read: false },
  { id: "2", type: "info",    title: "New booking",      body: "BK-2026-A3F9K2 — Room 201 confirmed",  time: "12m ago", read: false },
  { id: "3", type: "success", title: "Check-out done",   body: "Ali Hassan checked out of Room 103",   time: "1h ago",  read: true  },
  { id: "4", type: "warning", title: "Maintenance due",  body: "Room 305 — AC filter replacement",     time: "2h ago",  read: true  },
];

export function DashboardHeader({ user }: Props) {
  const pathname = usePathname();
  const [time, setTime]         = useState<string>("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  // Auto-mark all as read 2s after opening panel
  useEffect(() => {
    if (!notifOpen) return;
    const timer = setTimeout(() => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, 2000);
    return () => clearTimeout(timer);
  }, [notifOpen]);

  // Live clock
  useEffect(() => {
    const update = () => setTime(formatTime(new Date()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Breadcrumbs from pathname
  const isIdSegment = (seg: string) => /^[a-z0-9]{20,}$/i.test(seg) && !PATH_LABELS[seg];
  const rawSegs = pathname.split("/").filter(Boolean);
  const segments = rawSegs.map((seg, idx) => {
    if (seg === "new") {
      const parent = rawSegs[idx - 1] ?? "";
      return { label: NEW_LABELS[parent] ?? "New", raw: seg };
    }
    return {
      label: PATH_LABELS[seg] ?? (isIdSegment(seg) ? "Profile" : seg.charAt(0).toUpperCase() + seg.slice(1)),
      raw:   seg,
    };
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  const markOneRead = (id: string) =>
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const NOTIF_COLORS: Record<string, string> = {
    warning: "text-amber-400 bg-amber-400/10",
    info:    "text-blue-400 bg-blue-400/10",
    success: "text-green-400 bg-green-400/10",
    error:   "text-red-400 bg-red-400/10",
  };

  return (
    <header className="h-16 border-b border-border bg-surface-elevated/80 backdrop-blur-sm flex items-center justify-between px-3 sm:px-6 flex-shrink-0 z-30">
      {/* ── Breadcrumbs — offset on mobile to clear hamburger button ── */}
      <nav className="flex items-center gap-1.5 text-sm min-w-0 pl-10 md:pl-0">
        {segments.map((seg, idx) => (
          <span key={idx} className="flex items-center gap-1.5 min-w-0">
            {idx > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-border flex-shrink-0" />
            )}
            <span className={cn(
              "truncate",
              idx === segments.length - 1
                ? "text-foreground font-semibold"
                : "text-muted-foreground"
            )}>
              {seg.label}
            </span>
          </span>
        ))}
      </nav>

      {/* ── Right controls ── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Branch badge (non-super-admin) */}
        {user.role !== UserRole.SUPER_ADMIN && user.branchId && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-accent rounded-lg border border-border text-xs text-muted-foreground">
            <Building2 className="w-3.5 h-3.5" />
            <span>Your Branch</span>
          </div>
        )}

        {/* Push notification toggle */}
        <div className="hidden sm:block">
          <PushNotificationToggle />
        </div>

        {/* Clock */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono">{time}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className={cn(
              "relative p-2 rounded-xl border transition-all",
              notifOpen
                ? "bg-accent border-gold-500/50 text-gold-400"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent"
            )}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full text-background text-2xs font-bold flex items-center justify-center animate-pulse-gold">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setNotifOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-[min(320px,calc(100vw-1rem))] card-luxury border border-border shadow-card-lg z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-border/50 max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        onClick={() => markOneRead(n.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 transition-colors hover:bg-accent/50 cursor-pointer",
                          !n.read && "bg-accent/20"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5",
                            NOTIF_COLORS[n.type]
                          )}>
                            {n.type}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                          </div>
                          {!n.read && (
                            <div className="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-2xs text-muted-foreground mt-1.5 ml-0">{n.time}</p>
                      </button>
                    ))}
                  </div>

                  <div className="px-4 py-2.5 border-t border-border text-center">
                    <button className="text-xs text-gold-400 hover:text-gold-300">
                      View all notifications
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
