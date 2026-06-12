"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Plus, Minus, Trash2, Send, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import { placeRoomOrder } from "@/server/actions/guest";
import { formatPKR, cn } from "@/utils";
import type { getCanteenMenu } from "@/server/actions/guest";

type MenuData = Extract<Awaited<ReturnType<typeof getCanteenMenu>>, { authenticated: true }>;
type Category = MenuData["categories"][number];
type MenuItem = Category["items"][number];

type CartItem = MenuItem & { qty: number };

export function CanteenGrid({ data }: { data: MenuData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cart, setCart]   = useState<Record<string, CartItem>>({});
  const [notes, setNotes] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");
  const [activeCategory, setActiveCategory] = useState(data.categories[0]?.id ?? "");

  const cartItems   = Object.values(cart);
  const cartTotal   = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount   = cartItems.reduce((s, i) => s + i.qty, 0);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev[item.inventoryItemId];
      if (existing) {
        if (existing.qty >= item.stock) return prev;
        return { ...prev, [item.inventoryItemId]: { ...existing, qty: existing.qty + 1 } };
      }
      return { ...prev, [item.inventoryItemId]: { ...item, qty: 1 } };
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const existing = prev[id];
      if (!existing || existing.qty <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...existing, qty: existing.qty - 1 } };
    });
  };

  const deleteFromCart = (id: string) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const placeOrder = () => {
    if (!cartItems.length) return;
    setError("");
    startTransition(async () => {
      const res = await placeRoomOrder(
        cartItems.map((i) => ({ inventoryItemId: i.inventoryItemId, quantity: i.qty })),
        notes.trim() || undefined,
      );
      if (res.success) {
        setSuccess(true);
        setCart({});
        setNotes("");
        setTimeout(() => {
          router.push("/guest/orders");
          router.refresh();
        }, 1800);
      } else {
        setError(res.error ?? "Order failed. Please try again.");
      }
    });
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
          <Send className="w-7 h-7 text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Order Placed!</h3>
        <p className="text-sm text-muted-foreground">We're preparing your order. Redirecting to orders…</p>
      </div>
    );
  }

  if (!data.canOrder) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-2">Room service available after check-in</h3>
        <p className="text-sm text-muted-foreground">Once you check in, you can order from our menu.</p>
      </div>
    );
  }

  if (!data.categories.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <ShoppingCart className="w-10 h-10 text-muted-foreground mb-3" />
        <h3 className="text-lg font-bold text-foreground mb-2">Menu coming soon</h3>
        <p className="text-sm text-muted-foreground">Contact reception to order items.</p>
      </div>
    );
  }

  const activeItems = data.categories.find((c) => c.id === activeCategory)?.items ?? [];

  return (
    <div className="max-w-2xl mx-auto pb-24">

      {/* Category tabs */}
      <div className="sticky top-14 z-30 bg-surface-base border-b border-border">
        <div className="flex gap-1 px-4 py-2 overflow-x-auto scrollbar-hide">
          {data.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                activeCategory === cat.id
                  ? "bg-gold-gradient text-background shadow-gold"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {cat.icon && <span>{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu items */}
      <div className="px-4 pt-4 grid grid-cols-2 gap-3">
        {activeItems.map((item) => {
          const inCart = cart[item.inventoryItemId];
          return (
            <div
              key={item.inventoryItemId}
              className="bg-surface-elevated border border-border rounded-2xl overflow-hidden hover:border-gold-500/30 transition-all"
            >
              {/* Image */}
              <div className="relative h-28 bg-accent">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-3xl">
                    {item.category.icon ?? "🛒"}
                  </div>
                )}
              </div>

              <div className="p-3">
                <p className="text-sm font-bold text-foreground leading-tight">{item.name}</p>
                {item.brand && <p className="text-[10px] text-muted-foreground mt-0.5">{item.brand}</p>}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-bold text-gold-400">{formatPKR(item.price)}</p>
                  <p className="text-[10px] text-muted-foreground">{item.unit}</p>
                </div>

                {/* Cart controls */}
                {inCart ? (
                  <div className="flex items-center justify-between mt-2 bg-gold-500/10 border border-gold-500/20 rounded-lg px-2 py-1">
                    <button onClick={() => removeFromCart(item.inventoryItemId)} className="p-0.5 text-gold-400 hover:text-foreground">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold text-foreground">{inCart.qty}</span>
                    <button
                      onClick={() => addToCart(item)}
                      disabled={inCart.qty >= item.stock}
                      className="p-0.5 text-gold-400 hover:text-foreground disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full mt-2 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold bg-gold-gradient text-background"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart drawer */}
      {cartCount > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-50 px-4 pb-2">
          <div className="max-w-2xl mx-auto bg-surface-elevated border border-border rounded-2xl shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-bold text-foreground">{cartCount} item{cartCount !== 1 ? "s" : ""}</span>
              </div>
              <span className="text-sm font-bold text-gold-400">{formatPKR(cartTotal)}</span>
            </div>

            {/* Cart items list */}
            <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.inventoryItemId} className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-semibold truncate mr-2">{item.qty}× {item.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-muted-foreground">{formatPKR(item.price * item.qty)}</span>
                    <button onClick={() => deleteFromCart(item.inventoryItemId)} className="text-muted-foreground hover:text-red-400">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions? (optional)"
              rows={2}
              className="w-full bg-surface-base border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold-500/40 resize-none mb-3"
            />

            {error && (
              <p className="text-xs text-red-400 mb-2">{error}</p>
            )}

            <button
              onClick={placeOrder}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl shadow-gold disabled:opacity-60"
            >
              {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing order…</> : <><Send className="w-4 h-4" /> Place Order · {formatPKR(cartTotal)}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
