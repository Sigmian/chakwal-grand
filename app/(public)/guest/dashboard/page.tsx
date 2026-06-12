import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getGuestDashboard } from "@/server/actions/guest";
import { GuestNav } from "@/features/guest/components/GuestNav";
import { GuestDashboardContent } from "@/features/guest/components/GuestDashboardContent";

export const metadata: Metadata = { title: "My Stay" };

export default async function GuestDashboardPage() {
  const data = await getGuestDashboard();
  if (!data.authenticated) redirect("/guest/login");

  return (
    <div className="min-h-screen bg-surface-base pb-20">
      <GuestNav guestName={data.guest.name} roomNumber={data.room.number} />
      <GuestDashboardContent data={data} />
    </div>
  );
}
