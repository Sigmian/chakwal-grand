// ============================================================
// features/inventory/components/POSTerminal.tsx
// Point of Sale — cart-based terminal for selling products
// ============================================================

"use client";

import { useState, useTransition, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Minus, Trash2, ShoppingCart,
  Check, Printer, User, BedDouble, Loader2,
} from "lucide-react";
import { createSale } from "@/server/actions/inventory";
import { cn, formatPKR } from "@/utils";
import { PaymentMethod } from "@/types";

interface InventoryItem {
  id:           string;
  currentStock: number;
  sellingPrice: number;
  product?: { id: string; name: string; unit: string; brand?: string | null } | null;
  category?: { name: string } | null;
}

interface ActiveBooking {
  id:       string;
  bookingRef: string;
  customer: { name: string };
  room: { number: string };
}

interface CartItem {
  itemId:    string;
  name:      string;
  unit:      string;
  price:     number;
  qty:       number;
  stock:     number;
}

interface Props {
  inventory:      InventoryItem[];
  activeBookings: ActiveBooking[];
  branchId?:      string;
}

const PAYMENT_METHODS = [
  { value: PaymentMethod.CASH,         label: "💵 Cash"         },
  { value: PaymentMethod.ONLINE_CARD,  label: "💳 Card/Online"  },
  { value: PaymentMethod.JAZZCASH,     label: "📱 JazzCash"     },
  { value: PaymentMethod.EASYPAISA,    label: "📲 EasyPaisa"    },
  { value: PaymentMethod.BANK_TRANSFER,label: "🏦 Bank Transfer"},
];

export function POSTerminal({ inventory, activeBookings, branchId }: Props) {
  const [search, setSearch]             = useState("");
  const [cart, setCart]                 = useState<CartItem[]>([]);
  const [selectedBooking, setBooking]   = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [discount, setDiscount]         = useState("");
  const [note, setNote]                 = useState("");
  const [completed, setCompleted]       = useState<{ ref: string; total: number } | null>(null);
  const [isPending, startTransition]    = useTransition();

  // Filter inventory by search
  const filtered = useMemo(() => {
    if (!search) return inventory.filter(i => i.currentStock > 0);
    const q = search.toLowerCase();
    return inventory.filter(i =>
      i.currentStock > 0 && (
        i.product?.name.toLowerCase().includes(q) ||
        i.product?.brand?.toLowerCase().includes(q)
      )
    );
  }, [inventory, search]);

  // Cart operations
  const addToCart = (item: InventoryItem) => {
    if (!item.product) return;
    setCart(prev => {
      const existing = prev.find(c => c.itemId === item.id);
      if (existing) {
        if (existing.qty >= item.currentStock) {
          toast.error("Insufficient stock");
          return prev;
        }
        return prev.map(c => c.itemId === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, {
        itemId: item.id,
        name:   item.product!.name,
        unit:   item.product!.unit,
        price:  item.sellingPrice,
        qty:    1,
        stock:  item.currentStock,
      }];
    });
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev => prev
      .map(c => c.itemId === itemId ? { ...c, qty: Math.max(0, Math.min(c.stock, c.qty + delta)) } : c)
      .filter(c => c.qty > 0)
    );
  };

  const removeFromCart = (itemId: string) => setCart(c => c.filter(i => i.itemId !== itemId));

  const subtotal      = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const discountAmt   = Math.min(subtotal, Number(discount) || 0);
  const total         = subtotal - discountAmt;
  const cartCount     = cart.reduce((s, c) => s + c.qty, 0);

  const handleCheckout = () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    startTransition(async () => {
      const res = await createSale({
        branchId:  branchId ?? "",
        bookingId: selectedBooking || undefined,
        type:      selectedBooking ? "ROOM_ATTACHED" : "WALK_IN",
        items:     cart.map(c => ({ inventoryItemId: c.itemId, quantity: c.qty })),
        notes:     note || undefined,
      });
      if (res.success) {
        setCompleted({ ref: `SALE-${res.data?.id?.slice(-6).toUpperCase() ?? "OK"}`, total });
        setCart([]);
        setDiscount("");
        setNote("");
        setBooking("");
      } else {
        toast.error(res.error ?? "Sale failed");
      }
    });
  };

  // ── Sale complete screen ──────────────────────────────────
  if (completed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-foreground mb-2">Sale Complete!</h2>
        <p className="text-muted-foreground mb-1">Reference: <span className="font-mono text-gold-400">{completed.ref}</span></p>
        <p className="text-xl font-bold text-gold-400 mb-8">{formatPKR(completed.total)}</p>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm hover:bg-accent transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print Receipt
          </button>
          <button
            onClick={() => setCompleted(null)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all"
          >
            New Sale
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-[calc(100vh-160px)] min-h-[600px]">
      {/* ── Product list ── */}
      <div className="lg:col-span-3 flex flex-col min-h-0">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-surface-elevated border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50"
          />
        </div>

        {/* Product grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 content-start pr-1">
          {filtered.map(item => {
            const inCart  = cart.find(c => c.itemId === item.id);
            const outOfStock = item.currentStock === 0;
            return (
              <button
                key={item.id}
                onClick={() => !outOfStock && addToCart(item)}
                disabled={outOfStock}
                className={cn(
                  "card-luxury p-4 text-left transition-all hover:-translate-y-0.5",
                  inCart  && "border-gold-500/30 bg-gold-500/5",
                  outOfStock && "opacity-40 cursor-not-allowed"
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-surface-highlight flex items-center justify-center mb-3 text-lg">
                  📦
                </div>
                <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
                  {item.product?.name ?? "—"}
                </p>
                {item.product?.brand && (
                  <p className="text-xs text-muted-foreground mt-0.5">{item.product.brand}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-gold-400">{formatPKR(item.sellingPrice)}</span>
                  <span className={cn(
                    "text-2xs font-semibold",
                    item.currentStock <= 5 ? "text-amber-400" : "text-muted-foreground"
                  )}>
                    {item.currentStock} {item.product?.unit}
                  </span>
                </div>
                {inCart && (
                  <div className="mt-2 text-center py-0.5 rounded-lg bg-gold-500/20 text-gold-400 text-2xs font-bold">
                    ×{inCart.qty} in cart
                  </div>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Cart & Checkout ── */}
      <div className="lg:col-span-2 flex flex-col min-h-0 card-luxury overflow-hidden">
        {/* Cart header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-gold-400" />
            Cart
            {cartCount > 0 && (
              <span className="bg-gold-500 text-background text-2xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </h2>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-300">
              Clear
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          <AnimatePresence>
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs mt-1 opacity-60">Click products to add them</p>
              </div>
            ) : (
              cart.map(item => (
                <motion.div
                  key={item.itemId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-3 bg-surface-highlight rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-gold-400">{formatPKR(item.price)} × {item.qty} = {formatPKR(item.price * item.qty)}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => updateQty(item.itemId, -1)} className="w-7 h-7 rounded-lg bg-accent hover:bg-accent/80 flex items-center justify-center text-foreground">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold text-foreground">{item.qty}</span>
                    <button onClick={() => updateQty(item.itemId, +1)} disabled={item.qty >= item.stock} className="w-7 h-7 rounded-lg bg-accent hover:bg-accent/80 flex items-center justify-center text-foreground disabled:opacity-40">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeFromCart(item.itemId)} className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-red-400 ml-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Checkout panel */}
        {cart.length > 0 && (
          <div className="px-4 py-4 border-t border-border space-y-3">
            {/* Attach to booking */}
            {activeBookings.length > 0 && (
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <select
                  value={selectedBooking}
                  onChange={e => setBooking(e.target.value)}
                  className="flex-1 bg-surface-base border border-border rounded-lg px-2.5 py-2 text-sm text-foreground focus:outline-none focus:border-gold-500/50"
                >
                  <option value="">Walk-in</option>
                  {activeBookings.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.room.number} — {b.customer.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Payment method */}
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full bg-surface-base border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-gold-500/50"
            >
              {PAYMENT_METHODS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            {/* Discount */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                placeholder="Discount (₨)"
                className="flex-1 bg-surface-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50"
              />
            </div>

            {/* Totals */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPKR(subtotal)}</span>
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-red-400">
                  <span>Discount</span>
                  <span>-{formatPKR(discountAmt)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base text-foreground pt-1 border-t border-border">
                <span>Total</span>
                <span className="text-gold-400">{formatPKR(total)}</span>
              </div>
            </div>

            {/* Charge button */}
            <button
              onClick={handleCheckout}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gold-gradient text-background font-bold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-60"
            >
              {isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                : <><Check className="w-4 h-4" />Charge {formatPKR(total)}</>
              }
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
