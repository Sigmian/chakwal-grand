// ============================================================
// components/shared/index.tsx
// Shared primitive UI components used across all features
// ============================================================

"use client";

import React from "react";
import { cn } from "@/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ─── STAT CARD ────────────────────────────────────────────────
interface StatCardProps {
  title:       string;
  value:       string;
  subtitle?:   string;
  icon:        React.ReactNode;
  iconBg?:     string;
  trend?:      { value: number; label: string };
  className?:  string;
  loading?:    boolean;
}

export function StatCard({
  title, value, subtitle, icon, iconBg = "bg-gold-500/15",
  trend, className, loading,
}: StatCardProps) {
  if (loading) return <StatCardSkeleton />;

  return (
    <div className={cn("card-luxury card-lift p-4 sm:p-5 group relative overflow-hidden", className)}>
      {/* Decorative corner glow — brightens on hover */}
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gold-500/[0.05] blur-2xl pointer-events-none transition-colors duration-300 group-hover:bg-gold-500/[0.09]" />

      <div className="relative">
        {/* Title + icon share the top row so the value gets full card width */}
        <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
          <p className="text-2xs sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-1 min-w-0">
            {title}
          </p>
          <div className={cn(
            "w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-white/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
            iconBg
          )}>
            {icon}
          </div>
        </div>

        <p className="text-xl sm:text-2xl lg:text-[1.7rem] font-bold text-foreground font-serif truncate leading-tight">{value}</p>
        {subtitle && (
          <p className="text-2xs sm:text-xs text-muted-foreground mt-1 sm:mt-1.5 truncate">{subtitle}</p>
        )}
        {trend && (
          <div className={cn(
            "inline-flex items-center gap-1 mt-2 sm:mt-2.5 text-2xs font-bold px-2 py-0.5 rounded-full border",
            trend.value > 0 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            : trend.value < 0 ? "text-red-400 bg-red-500/10 border-red-500/20"
            : "text-muted-foreground bg-accent/50 border-border"
          )}>
            {trend.value > 0 ? <TrendingUp className="w-3 h-3" /> :
             trend.value < 0 ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            <span className="truncate">
              {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────
interface SectionHeaderProps {
  title:     string;
  subtitle?: string;
  actions?:  React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, actions, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mb-6", className)}>
      <div className="flex items-center gap-3">
        <div className="w-1 h-6 bg-gold-gradient rounded-full" />
        <div>
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─── PAGE HEADER ──────────────────────────────────────────────
interface PageHeaderProps {
  title:     string;
  subtitle?: string;
  actions?:  React.ReactNode;
  back?:     string;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground font-serif">{title}</h1>
        <div className="h-0.5 w-10 bg-gold-gradient rounded-full mt-1.5" />
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>
      )}
    </div>
  );
}

// ─── BADGE ────────────────────────────────────────────────────
type BadgeVariant = "gold" | "green" | "red" | "blue" | "purple" | "orange" | "slate" | "amber";

const BADGE_STYLES: Record<BadgeVariant, string> = {
  gold:   "bg-gold-500/15 text-gold-400 border-gold-500/30",
  green:  "bg-green-500/15 text-green-400 border-green-500/30",
  red:    "bg-red-500/15 text-red-400 border-red-500/30",
  blue:   "bg-blue-500/15 text-blue-400 border-blue-500/30",
  purple: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  orange: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  slate:  "bg-slate-500/15 text-slate-400 border-slate-500/30",
  amber:  "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

interface BadgeProps {
  children:   React.ReactNode;
  variant?:   BadgeVariant;
  className?: string;
  dot?:       boolean;
  dotColor?:  string;
}

export function Badge({ children, variant = "slate", className, dot, dotColor }: BadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold border",
      BADGE_STYLES[variant],
      className
    )}>
      {dot && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotColor ?? "bg-current")} />
      )}
      {children}
    </span>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────
interface EmptyStateProps {
  icon:      React.ReactNode;
  title:     string;
  body:      string;
  action?:   React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-surface-overlay border border-border ring-4 ring-accent/20 flex items-center justify-center mb-4 text-muted-foreground">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1 font-serif">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">{body}</p>
      {action}
    </div>
  );
}

// ─── GOLD DIVIDER ─────────────────────────────────────────────
export function GoldDivider({ className }: { className?: string }) {
  return (
    <div className={cn("divider-gold my-6", className)} />
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────
interface ProgressBarProps {
  value:      number;  // 0–100
  max?:       number;
  label?:     string;
  className?: string;
  color?:     "gold" | "green" | "red" | "blue";
}

const PROGRESS_COLORS = {
  gold:  "bg-gold-gradient",
  green: "bg-green-500",
  red:   "bg-red-500",
  blue:  "bg-blue-500",
};

export function ProgressBar({ value, max = 100, label, className, color = "gold" }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-semibold text-foreground">{Math.round(pct)}%</span>
        </div>
      )}
      <div className="h-1.5 bg-accent rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", PROGRESS_COLORS[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── REVENUE CHANGE ───────────────────────────────────────────
export function RevenueChange({ value, className }: { value: number; className?: string }) {
  const isPositive = value >= 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-semibold",
      isPositive ? "text-green-400" : "text-red-400",
      className
    )}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? "+" : ""}{value.toFixed(1)}%
    </span>
  );
}

// ─── SKELETONS ────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="card-luxury p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── LOADING SPINNER ──────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin text-gold-400", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── CARD ─────────────────────────────────────────────────────
export function Card({
  children,
  className,
  glass,
}: {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}) {
  return (
    <div className={cn(glass ? "card-glass" : "card-luxury", className)}>
      {children}
    </div>
  );
}

// ─── TOOLTIP ──────────────────────────────────────────────────
export function Tooltip({
  children,
  tip,
  side = "top",
}: {
  children: React.ReactNode;
  tip: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className={cn(
        "absolute z-50 px-2 py-1 text-xs bg-surface-overlay border border-border rounded-lg shadow-card-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity",
        side === "top"    && "bottom-full mb-1.5 left-1/2 -translate-x-1/2",
        side === "bottom" && "top-full mt-1.5 left-1/2 -translate-x-1/2",
        side === "left"   && "right-full mr-1.5 top-1/2 -translate-y-1/2",
        side === "right"  && "left-full ml-1.5 top-1/2 -translate-y-1/2",
      )}>
        {tip}
      </div>
    </div>
  );
}
