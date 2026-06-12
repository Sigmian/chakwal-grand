import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { getGuestOrders } from "@/server/actions/guest";
import { GuestNav } from "@/features/guest/components/GuestNav";
import { GuestOrderCard } from "@/features/guest/components/GuestOrderCard";

export const metadata: Metadata = { title: "My Orders" };

export default async function GuestOrdersPage() {
  const data = await getGuestOrders();
  if (!data.authenticated) redirect("/guest/login");

  return (
    <div className="min-h-screen bg-surface-base pb-20">
      <GuestNav guestName={data.guestName} roomNumber={data.roomNumber} />
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <h1 className="text-xl font-bold text-foreground mb-1">My Orders</h1>
        <p className="text-sm text-muted-foreground mb-6">Room {data.roomNumber}</p>

        {data.orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ClipboardList className="w-10 h-10 text-muted-foreground mb-3" />
            <h3 className="text-base font-semibold text-foreground mb-1">No orders yet</h3>
            <p className="text-sm text-muted-foreground">
              Visit Room Service to order food and drinks to your room.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.orders.map((order) => (
              <GuestOrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
