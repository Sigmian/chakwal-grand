"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { LayoutDashboard, ShoppingBag, ClipboardList, LogOut, Hotel } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils";

const links = [
  { href: "/guest/dashboard", icon: LayoutDashboard, label: "My Stay" },
  { href: "/guest/canteen",   icon: ShoppingBag,     label: "Room Service" },
  { href: "/guest/orders",    icon: ClipboardList,   label: "My Orders" },
];

export function GuestNav({ guestName, roomNumber }: { guestName: string; roomNumber: string }) {
  const pathname    = usePathname();
  const router      = useRouter();
  const [, startT]  = useTransition();

  const logout = () => {
    startT(async () => {
      await fetch("/api/guest/logout", { method: "POST" });
      router.push("/guest/login");
      router.refresh();
    });
  };

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-surface-elevated/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gold-gradient flex items-center justify-center">
              <Hotel className="w-3.5 h-3.5 text-background" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground leading-tight">{guestName}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">Room {roomNumber}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </header>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface-elevated/95 backdrop-blur-sm safe-area-pb">
        <div className="max-w-2xl mx-auto flex">
          {links.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                  active ? "text-gold-400" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_rgba(201,168,76,0.6)]")} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
