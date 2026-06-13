// ============================================================
// app/(dashboard)/inventory/pos/page.tsx
// Point of Sale — sell products, attach to rooms or walk-in
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { getInventory } from "@/server/actions/inventory";
import { getBookings } from "@/server/actions/bookings";
import { POSTerminal } from "@/features/inventory/components/POSTerminal";
import { PageHeader } from "@/components/shared";
import { BookingStatus } from "@/types";

export const metadata = { title: "Point of Sale" };

export default async function POSPage() {
  await requirePermission("inventory:pos_sell");

  const [inventory, activeBookings] = await Promise.all([
    getInventory(),
    getBookings({ status: BookingStatus.CHECKED_IN, pageSize: 100 }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Point of Sale"
        subtitle="Sell products to guests or walk-in customers"
      />
      <POSTerminal
        inventory={inventory as never}
        activeBookings={activeBookings.data.map(b => ({
          id:          b.id,
          bookingRef:  b.bookingRef,
          customer:    { name: b.customer.name },
          room:        { number: b.room.number },
        }))}
      />
    </div>
  );
}
