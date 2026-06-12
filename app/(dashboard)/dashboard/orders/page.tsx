import type { Metadata } from "next";
import { getInRoomOrders } from "@/server/actions/orders";
import { OrdersBoard } from "@/features/orders/components/OrdersBoard";

export const metadata: Metadata = { title: "Room Orders" };

export default async function OrdersPage() {
  const orders = await getInRoomOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Room Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage in-room canteen and room service orders</p>
      </div>
      <OrdersBoard orders={orders as any} />
    </div>
  );
}
