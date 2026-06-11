// ============================================================
// app/(dashboard)/bookings/new/page.tsx
// New booking — uses the multi-step wizard
// ============================================================

import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { checkRoomAvailability } from "@/server/actions/rooms";
import prisma from "@/lib/db/prisma";
import { PageHeader } from "@/components/shared";
import { NewBookingWizard } from "@/features/bookings/components/NewBookingWizard";

export const metadata = { title: "New Booking" };

interface PageProps {
  searchParams: {
    roomId?:       string;
    checkIn?:      string;
    checkOut?:     string;
  };
}

export default async function NewBookingPage({ searchParams }: PageProps) {
  const user     = await requirePermission("bookings:create");
  const branchId = getScopedBranchId(user);

  // Get branches the user can book for
  const branches = await prisma.branch.findMany({
    where: {
      isActive: true,
      ...(branchId ? { id: branchId } : {}),
    },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  // Get available rooms (all, filterable client-side)
  const rooms = await prisma.room.findMany({
    where: {
      isActive: true,
      ...(branchId ? { branchId } : {}),
    },
    include: {
      images: { where: { isCover: true }, take: 1 },
    },
    orderBy: [{ branch: { name: "asc" } }, { pricePerNight: "asc" }],
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="New Booking"
        subtitle="Walk guests through the booking process step by step"
      />

      <NewBookingWizard
        branches={branches}
        rooms={rooms.map((r) => ({
          id:           r.id,
          number:       r.number,
          name:         r.name,
          type:         r.type,
          pricePerNight: Number(r.pricePerNight),
          maxAdults:    r.maxAdults,
          images:       r.images,
        }))}
      />
    </div>
  );
}
