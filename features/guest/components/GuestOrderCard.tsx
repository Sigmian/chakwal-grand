"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Package, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { cancelGuestOrder } from "@/server/actions/guest";
import { formatPKR, cn } from "@/utils";
import { toast } from "sonner";

type OrderItem = {
  productName: string;
  quantity:    number;
  unitPrice:   number;
  totalPrice:  number;
  image:       string | null;
};

type Order = {
  id:          string;
  status:      string;
  totalAmount: number;
  notes:       string | null;
  createdAt:   string;
  deliveredAt: string | null;
  items:       OrderItem[];
};

const STATUS_CONFIG = {
  PENDING:   { label: "Pending",    color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20",   icon: Clock },
  PREPARING: { label: "Preparing",  color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",     icon: Package },
  DELIVERED: { label: "Delivered",  color: "text-green-400",  bg: "bg-green-500/10 border-green-500/20",   icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled",  color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",       icon: XCircle },
};

export function GuestOrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const [open, setOpen] = useTransition();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const cfg   = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING;
  const Icon  = cfg.icon;

  const cancel = () => {
    startTransition(async () => {
      const res = await cancelGuestOrder(order.id);
      if (res.success) {
        toast.success("Order cancelled");
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not cancel order");
      }
    });
  };

  return (
    <div className="bg-surface-elevated border border-border rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className={cn("mt-0.5 p-1.5 rounded-lg border", cfg.bg)}>
            <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground">
                {order.items.length} item{order.items.length !== 1 ? "s" : ""}
              </p>
              <span className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(order.createdAt).toLocaleString("en-PK", {
                day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-foreground">{formatPKR(order.totalAmount)}</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {/* Items */}
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-sm">
              <div>
                <span className="font-semibold text-foreground">{item.quantity}× {item.productName}</span>
                <span className="text-xs text-muted-foreground ml-2">{formatPKR(item.unitPrice)} each</span>
              </div>
              <span className="font-bold text-foreground">{formatPKR(item.totalPrice)}</span>
            </div>
          ))}

          {order.notes && (
            <div className="bg-accent rounded-xl px-3 py-2">
              <p className="text-xs text-muted-foreground">Note: {order.notes}</p>
            </div>
          )}

          {order.deliveredAt && (
            <p className="text-xs text-green-400">
              Delivered at {new Date(order.deliveredAt).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit", hour12: true })}
            </p>
          )}

          {order.status === "PENDING" && (
            <button
              onClick={cancel}
              disabled={isPending}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:underline disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
              Cancel order
            </button>
          )}
        </div>
      )}
    </div>
  );
}
