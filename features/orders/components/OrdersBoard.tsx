"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Package, CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateOrderStatus } from "@/server/actions/orders";
import { formatPKR, cn } from "@/utils";

type OrderItem = { productName: string; quantity: number; unitPrice: number; totalPrice: number };
type Order = {
  id:          string;
  status:      string;
  totalAmount: { toNumber(): number } | number;
  notes:       string | null;
  createdAt:   Date;
  deliveredAt: Date | null;
  items:       OrderItem[];
  booking: {
    bookingRef: string;
    room:       { number: string; name: string };
    customer:   { name: string; phone: string };
  };
};

const STATUS_CONFIG = {
  PENDING:   { label: "Pending",   color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30" },
  PREPARING: { label: "Preparing", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30" },
  DELIVERED: { label: "Delivered", color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30" },
  CANCELLED: { label: "Cancelled", color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30" },
};

const NEXT_ACTIONS: Record<string, { label: string; next: "PREPARING" | "DELIVERED" | "CANCELLED" }[]> = {
  PENDING:   [{ label: "Start Preparing", next: "PREPARING" }, { label: "Cancel",        next: "CANCELLED" }],
  PREPARING: [{ label: "Mark Delivered",  next: "DELIVERED" }, { label: "Cancel",        next: "CANCELLED" }],
};

function OrderRow({ order }: { order: Order }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded]      = useState(false);

  const cfg    = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
  const amount = typeof order.totalAmount === "number" ? order.totalAmount : order.totalAmount.toNumber();
  const actions = NEXT_ACTIONS[order.status] ?? [];

  const doUpdate = (status: "PREPARING" | "DELIVERED" | "CANCELLED") => {
    startTransition(async () => {
      const res = await updateOrderStatus(order.id, status);
      if (res.success) {
        toast.success(`Order marked as ${status.toLowerCase()}`);
        router.refresh();
      } else {
        toast.error("Update failed");
      }
    });
  };

  return (
    <div className={cn("border rounded-2xl overflow-hidden transition-all", cfg.border, cfg.bg)}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground">Room {order.booking.room.number}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-sm text-foreground">{order.booking.customer.name}</span>
              <span className={cn("text-xs font-bold uppercase px-2 py-0.5 rounded-full border", cfg.color, cfg.border, cfg.bg)}>
                {cfg.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
              {new Date(order.createdAt).toLocaleString("en-PK", { hour: "numeric", minute: "2-digit", hour12: true, day: "numeric", month: "short" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">{formatPKR(amount)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border/50 px-4 py-3 space-y-3 bg-surface-base/60">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-foreground">{item.quantity}× {item.productName}</span>
              <span className="font-semibold text-foreground">{formatPKR(item.totalPrice)}</span>
            </div>
          ))}

          {order.notes && (
            <div className="bg-accent rounded-xl px-3 py-2">
              <p className="text-xs text-muted-foreground">Note: {order.notes}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            {actions.map(({ label, next }) => (
              <button
                key={next}
                onClick={() => doUpdate(next)}
                disabled={isPending}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all disabled:opacity-60",
                  next === "DELIVERED" && "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20",
                  next === "PREPARING" && "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20",
                  next === "CANCELLED" && "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20",
                )}
              >
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrdersBoard({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<string>("ACTIVE");

  const filtered = orders.filter((o) =>
    filter === "ACTIVE"
      ? ["PENDING", "PREPARING"].includes(o.status)
      : filter === "ALL"
      ? true
      : o.status === filter
  );

  const pending   = orders.filter((o) => o.status === "PENDING").length;
  const preparing = orders.filter((o) => o.status === "PREPARING").length;

  const tabs = [
    { key: "ACTIVE",    label: `Active (${pending + preparing})` },
    { key: "DELIVERED", label: "Delivered" },
    { key: "CANCELLED", label: "Cancelled" },
    { key: "ALL",       label: "All" },
  ];

  return (
    <div>
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Pending",   count: pending,   color: "text-amber-400" },
          { label: "Preparing", count: preparing, color: "text-blue-400" },
          { label: "Today",     count: orders.filter((o) => {
            const d = new Date(o.createdAt);
            const t = new Date();
            return d.getDate() === t.getDate() && d.getMonth() === t.getMonth();
          }).length, color: "text-foreground" },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-surface-elevated border border-border rounded-2xl p-4 text-center">
            <p className={cn("text-2xl font-bold", color)}>{count}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
              filter === key
                ? "bg-gold-gradient text-background border-transparent shadow-gold"
                : "text-muted-foreground border-border hover:text-foreground hover:border-border"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Orders */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No {filter === "ACTIVE" ? "active" : filter.toLowerCase()} orders
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => <OrderRow key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
}
