import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRoom } from "@/server/actions/rooms";
import { requirePermission } from "@/lib/auth/session";
import { PageHeader } from "@/components/shared";
import { EditRoomForm } from "@/features/rooms/components/EditRoomForm";

export const metadata = { title: "Edit Room" };

export default async function EditRoomPage({ params }: { params: { roomId: string } }) {
  await requirePermission("rooms:update");

  const room = await getRoom(params.roomId);
  if (!room) notFound();

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <Link
          href={`/dashboard/rooms/${room.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Room {room.number}
        </Link>
        <PageHeader
          title={`Edit Room ${room.number}`}
          subtitle={`${room.name} · ${room.branch.name}`}
        />
      </div>

      <EditRoomForm room={room} />
    </div>
  );
}
