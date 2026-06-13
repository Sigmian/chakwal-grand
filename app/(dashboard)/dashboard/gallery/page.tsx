// app/(dashboard)/dashboard/gallery/page.tsx
import { requirePermission } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getRooms } from "@/server/actions/rooms";
import { GalleryManager } from "@/features/rooms/components/GalleryManager";

export const metadata = { title: "Gallery Management" };

export default async function GalleryPage() {
  const user    = await requirePermission("rooms:read");
  const canEdit = hasPermission(user.role, "rooms:upload_images");

  const allRooms = await getRooms();

  const rooms = allRooms.map(r => ({
    id:     r.id,
    name:   r.name,
    number: r.number,
    type:   r.type,
    images: r.images.map(img => ({
      id:       img.id,
      url:      img.url,
      altText:  img.altText,
      isCover:  img.isCover,
      sortOrder: img.sortOrder,
    })),
  }));

  const totalPhotos = rooms.reduce((s, r) => s + r.images.length, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-serif text-foreground">Gallery</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {totalPhotos} photo{totalPhotos !== 1 ? "s" : ""} across {rooms.length} rooms — visible on the public gallery page
        </p>
      </div>
      <GalleryManager rooms={rooms} canEdit={canEdit} />
    </div>
  );
}
