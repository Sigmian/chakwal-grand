// ============================================================
// utils/index.ts
// Shared utility functions — pure, framework-agnostic
// ============================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInDays, parseISO, isValid } from "date-fns";
import {
  BookingStatus,
  PaymentStatus,
  RoomStatus,
  RoomType,
  LoyaltyTier,
  UserRole,
} from "@/types";

// ─── Tailwind class merging ────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency Formatting ──────────────────────────────────────

/**
 * Format a number as Pakistani Rupees.
 * Examples: 1500 → "₨1,500"  |  1500000 → "₨1,500,000"
 */
export function formatPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "₨0";
  return `₨${amount.toLocaleString("en-PK")}`;
}

/**
 * Format large amounts with K/M suffix for dashboard cards.
 * Examples: 1500 → "₨1.5K"  |  1500000 → "₨1.5M"
 */
export function formatPKRShort(amount: number): string {
  if (amount >= 1_000_000) return `₨${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `₨${(amount / 1_000).toFixed(1)}K`;
  return formatPKR(amount);
}

/**
 * Format a decimal or string amount from Prisma (Decimal type).
 */
export function formatAmount(
  amount: number | string | { toNumber: () => number } | null | undefined
): string {
  if (amount === null || amount === undefined) return "₨0";
  const num = typeof amount === "object" && amount !== null && typeof (amount as any).toNumber === "function"
    ? (amount as { toNumber: () => number }).toNumber()
    : Number(amount);
  return formatPKR(num);
}

// ─── Date Formatting ──────────────────────────────────────────

/**
 * Compact relative time for notification feeds.
 * Past: "just now", "5m ago", "3h ago", "2d ago" — Future: "in 3h".
 */
export function timeAgo(date: Date | string): string {
  const d    = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(Math.abs(diff) / 60_000);
  if (mins < 1) return "just now";
  const label =
    mins < 60    ? `${mins}m` :
    mins < 1_440 ? `${Math.round(mins / 60)}h` :
    `${Math.round(mins / 1_440)}d`;
  return diff >= 0 ? `${label} ago` : `in ${label}`;
}


export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "Invalid date";
  return format(d, "dd MMM yyyy");
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "Invalid date";
  return format(d, "dd MMM yyyy, h:mm a");
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "h:mm a");
}

export function getNights(checkIn: Date | string, checkOut: Date | string): number {
  const ci = typeof checkIn  === "string" ? parseISO(checkIn)  : checkIn;
  const co = typeof checkOut === "string" ? parseISO(checkOut) : checkOut;
  return Math.max(1, differenceInDays(co, ci));
}

export function isDateInPast(date: Date | string): boolean {
  const d = typeof date === "string" ? parseISO(date) : date;
  return d < new Date();
}

// ─── Booking Reference Generator ─────────────────────────────

/**
 * Generate a human-readable booking reference.
 * Format: BK-2026-XXXXXX (6 uppercase alphanumeric chars)
 */
export function generateBookingRef(): string {
  const year   = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `BK-${year}-${random}`;
}

// ─── Status Label/Color Maps ──────────────────────────────────

export const BOOKING_STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  [BookingStatus.PENDING]:    { label: "Pending",    color: "text-amber-400",   bgColor: "bg-amber-400/10",  borderColor: "border-amber-400/30" },
  [BookingStatus.CONFIRMED]:  { label: "Confirmed",  color: "text-blue-400",    bgColor: "bg-blue-400/10",   borderColor: "border-blue-400/30"  },
  [BookingStatus.CHECKED_IN]: { label: "Checked In", color: "text-green-400",   bgColor: "bg-green-400/10",  borderColor: "border-green-400/30" },
  [BookingStatus.CHECKED_OUT]:{ label: "Checked Out",color: "text-slate-400",   bgColor: "bg-slate-400/10",  borderColor: "border-slate-400/30" },
  [BookingStatus.CANCELLED]:  { label: "Cancelled",  color: "text-red-400",     bgColor: "bg-red-400/10",    borderColor: "border-red-400/30"   },
  [BookingStatus.NO_SHOW]:    { label: "No Show",    color: "text-orange-400",  bgColor: "bg-orange-400/10", borderColor: "border-orange-400/30"},
};

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  [PaymentStatus.UNPAID]:    { label: "Unpaid",   color: "text-red-400"    },
  [PaymentStatus.PARTIAL]:   { label: "Partial",  color: "text-amber-400"  },
  [PaymentStatus.PAID]:      { label: "Paid",     color: "text-green-400"  },
  [PaymentStatus.REFUNDED]:  { label: "Refunded", color: "text-purple-400" },
};

export const ROOM_STATUS_CONFIG: Record<
  RoomStatus,
  { label: string; dotClass: string; color: string }
> = {
  [RoomStatus.AVAILABLE]:   { label: "Available",    dotClass: "bg-status-available",   color: "text-emerald-400" },
  [RoomStatus.OCCUPIED]:    { label: "Occupied",     dotClass: "bg-status-occupied",    color: "text-red-400"     },
  [RoomStatus.MAINTENANCE]: { label: "Maintenance",  dotClass: "bg-status-maintenance", color: "text-amber-400"   },
  [RoomStatus.BLOCKED]:     { label: "Blocked",      dotClass: "bg-status-blocked",     color: "text-slate-400"   },
  [RoomStatus.CLEANING]:    { label: "Cleaning",     dotClass: "bg-status-cleaning",    color: "text-violet-400"  },
};

export const ROOM_TYPE_CONFIG: Record<
  RoomType,
  { label: string; priceMultiplier: number; icon: string }
> = {
  [RoomType.STANDARD]: { label: "Standard",  priceMultiplier: 1.0, icon: "🛏️"  },
  [RoomType.DELUXE]:   { label: "Deluxe",    priceMultiplier: 1.5, icon: "🌟"  },
  [RoomType.FAMILY]:   { label: "Family",    priceMultiplier: 2.0, icon: "👨‍👩‍👧" },
  [RoomType.VIP]:      { label: "VIP",       priceMultiplier: 3.0, icon: "👑"  },
  [RoomType.SUITE]:    { label: "Suite",     priceMultiplier: 4.0, icon: "💎"  },
};

export const LOYALTY_TIER_CONFIG: Record<
  LoyaltyTier,
  { label: string; color: string; minVisits: number; icon: string }
> = {
  [LoyaltyTier.BRONZE]: { label: "Bronze", color: "text-orange-600", minVisits: 1,  icon: "🥉" },
  [LoyaltyTier.SILVER]: { label: "Silver", color: "text-slate-400",  minVisits: 4,  icon: "🥈" },
  [LoyaltyTier.GOLD]:   { label: "Gold",   color: "text-gold-500",   minVisits: 10, icon: "🥇" },
  [LoyaltyTier.VIP]:    { label: "VIP",    color: "text-purple-400", minVisits: 25, icon: "👑" },
};

export const USER_ROLE_CONFIG: Record<
  UserRole,
  { label: string; color: string }
> = {
  [UserRole.SUPER_ADMIN]:     { label: "Super Admin",    color: "text-gold-400"   },
  [UserRole.BRANCH_MANAGER]:  { label: "Branch Manager", color: "text-blue-400"   },
  [UserRole.RECEPTIONIST]:    { label: "Receptionist",   color: "text-green-400"  },
  [UserRole.HOUSEKEEPING]:    { label: "Housekeeping",   color: "text-violet-400" },
  [UserRole.INVENTORY_STAFF]: { label: "Inventory Staff",color: "text-orange-400" },
};

// ─── Computation Helpers ──────────────────────────────────────

/**
 * Calculate booking total from components.
 */
export function calculateBookingTotal(params: {
  baseAmount: number;
  discountAmount: number;
  taxAmount: number;
  extraCharges: number;
}): number {
  return (
    params.baseAmount -
    params.discountAmount +
    params.taxAmount +
    params.extraCharges
  );
}

/**
 * Calculate occupancy rate as a percentage (0–100).
 */
export function calculateOccupancyRate(
  totalRooms: number,
  occupiedRooms: number
): number {
  if (totalRooms === 0) return 0;
  return Math.round((occupiedRooms / totalRooms) * 100);
}

/**
 * Compute profit margin as a percentage.
 */
export function calculateProfitMargin(
  revenue: number,
  expenses: number
): number {
  if (revenue === 0) return 0;
  return Math.round(((revenue - expenses) / revenue) * 100);
}

/**
 * Compute profit per inventory item.
 */
export function calculateItemProfit(selling: number, purchase: number): number {
  return selling - purchase;
}

export function calculateItemMargin(selling: number, purchase: number): number {
  if (selling === 0) return 0;
  return Math.round(((selling - purchase) / selling) * 100);
}

// ─── Branch Color Helpers ─────────────────────────────────────

const BRANCH_COLORS: Record<string, { badge: string; dot: string; border: string }> = {
  "branch-chakwal": {
    badge:  "bg-gold-500/15 text-gold-400 border-gold-500/30",
    dot:    "bg-gold-400",
    border: "border-gold-500/40",
  },
  "branch-madina": {
    badge:  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    dot:    "bg-emerald-400",
    border: "border-emerald-500/40",
  },
};

const BRANCH_COLOR_FALLBACK = {
  badge:  "bg-blue-500/15 text-blue-400 border-blue-500/30",
  dot:    "bg-blue-400",
  border: "border-blue-500/40",
};

export function getBranchColor(branchId: string) {
  return BRANCH_COLORS[branchId] ?? BRANCH_COLOR_FALLBACK;
}

// ─── String Helpers ───────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}

// ─── Array Helpers ────────────────────────────────────────────

export function groupBy<T>(
  array: T[],
  key: (item: T) => string
): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const group = key(item);
      return { ...groups, [group]: [...(groups[group] ?? []), item] };
    },
    {} as Record<string, T[]>
  );
}

export function sumBy<T>(array: T[], key: (item: T) => number): number {
  return array.reduce((sum, item) => sum + key(item), 0);
}

// ─── WhatsApp ─────────────────────────────────────────────────

export function buildWhatsAppUrl(
  phone: string,
  message: string
): string {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const encoded    = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}

export function buildBookingWhatsAppMessage(params: {
  bookingRef: string;
  guestName: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  total: number;
}): string {
  return (
    `🏨 *Chakwal Guest House*\n\n` +
    `Booking Confirmation\n` +
    `----------------------------\n` +
    `Ref: *${params.bookingRef}*\n` +
    `Guest: ${params.guestName}\n` +
    `Room: ${params.roomName}\n` +
    `Check-in: ${params.checkIn}\n` +
    `Check-out: ${params.checkOut}\n` +
    `Nights: ${params.nights}\n` +
    `Total: *${formatPKR(params.total)}*\n` +
    `----------------------------\n` +
    `Please confirm your booking. Thank you!`
  );
}
