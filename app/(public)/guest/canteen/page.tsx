import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCanteenMenu } from "@/server/actions/guest";
import { GuestNav } from "@/features/guest/components/GuestNav";
import { CanteenGrid } from "@/features/guest/components/CanteenGrid";

export const metadata: Metadata = { title: "Room Service" };

export default async function CanteenPage() {
  const data = await getCanteenMenu();
  if (!data.authenticated) redirect("/guest/login");

  return (
    <div className="min-h-screen bg-surface-base pb-20">
      <GuestNav guestName={data.guestName} roomNumber={data.roomNumber} />
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <h1 className="text-xl font-bold text-foreground">Room Service</h1>
        <p className="text-sm text-muted-foreground mt-1">Order to your room · Items delivered within 15 minutes</p>
      </div>
      <CanteenGrid data={data} />
    </div>
  );
}
