// ============================================================
// components/layout/DashboardHeader.tsx
// Top bar: breadcrumbs, branch selector, notifications, clock
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell, ChevronRight, Building2, Check, Clock, CheckCircle2, RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatTime, timeAgo } from "@/utils";
import type { SessionUser } from "@/types";
import { UserRole } from "@/types";
import { PushNotificationToggle } from "@/features/dashboard/components/PushNotificationToggle";
import { getHeaderNotifications, type HeaderNotification } from "@/server/actions/notifications";

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

// Client-side read tracking — notifications are derived from live data,
// so "read" state lives in localStorage keyed by stable notification ids.
const READ_KEY = "cgh_notif_read";

function loadReadIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_KEY) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids].slice(-200)));
  } catch { /* storage unavailable */ }
}

export function DashboardHeader({ user }: Props) {
  const pathname = usePathname();
  const router   = useRouter();
  const [time, setTime]           = useState<string>("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
  const [readIds, setReadIds]     = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setRefreshing(true);
      const items = await getHeaderNotifications();
      setNotifications(items);
    } catch { /* keep whatever we had */ }
    finally { setRefreshing(false); }
  }, []);

  // Load read-state, fetch on mount, refresh every 60s
  useEffect(() => {
    setReadIds(loadReadIds());
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Auto-mark all as read 2s after opening panel
  useEffect(() => {
    if (!notifOpen) return;
    const timer = setTimeout(() => {
      setReadIds(prev => {
        const next = new Set(prev);
        notifications.forEach(n => next.add(n.id));
        saveReadIds(next);
        return next;
      });
    }, 2000);
    return () => clearTimeout(timer);
  }, [notifOpen, notifications]);

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

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = () =>
    setReadIds(prev => {
      const next = new Set(prev);
      notifications.forEach(n => next.add(n.id));
      saveReadIds(next);
      return next;
    });

  const markOneRead = (id: string) =>
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });

  const openNotification = (n: HeaderNotification) => {
    markOneRead(n.id);
    setNotifOpen(false);
    router.push(n.href);
  };

  const NOTIF_COLORS: Record<string, string> = {
    warning: "text-amber-400 bg-amber-400/10",
    info:    "text-blue-400 bg-blue-400/10",
    success: "text-green-400 bg-green-400/10",
    error:   "text-red-400 bg-red-400/10",
  };

  return (
    <header className="relative h-16 border-b border-border/70 bg-surface-elevated/70 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 flex-shrink-0 z-30">
      {/* Gold hairline under the header */}
      <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />
      {/* ── Breadcrumbs — offset on mobile to clear hamburger button ── */}
      <nav className="flex items-center gap-1.5 text-sm min-w-0 pl-12 md:pl-0">
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
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/10 rounded-lg border border-gold-500/20 text-xs text-gold-400/90 font-medium">
            <Building2 className="w-3.5 h-3.5" />
            <span>Your Branch</span>
          </div>
        )}

        {/* Push notification toggle */}
        <div className="hidden sm:block">
          <PushNotificationToggle />
        </div>

        {/* Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 bg-accent/40 border border-border/60 rounded-lg text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5 text-gold-400/70" />
          <span className="font-mono tabular-nums">{time}</span>
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
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                        <p className="text-sm font-semibold text-foreground">All caught up</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Nothing needs your attention right now.</p>
                      </div>
                    ) : notifications.map((n) => {
                      const isUnread = !readIds.has(n.id);
                      return (
                        <button
                          key={n.id}
                          onClick={() => openNotification(n)}
                          className={cn(
                            "w-full text-left px-4 py-3 transition-colors hover:bg-accent/50 cursor-pointer",
                            isUnread && "bg-accent/20"
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
                            {isUnread && (
                              <div className="w-2 h-2 bg-gold-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-2xs text-muted-foreground mt-1.5 ml-0">{timeAgo(n.at)}</p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-4 py-2.5 border-t border-border text-center">
                    <button
                      onClick={fetchNotifications}
                      disabled={refreshing}
                      className="text-xs text-gold-400 hover:text-gold-300 inline-flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
                      {refreshing ? "Refreshing…" : "Refresh"}
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
