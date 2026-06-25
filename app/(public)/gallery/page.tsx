// app/(public)/gallery/page.tsx
import type { Metadata } from "next";
import prisma from "@/lib/db/prisma";
import { GalleryGrid } from "@/features/public/components/GalleryGrid";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Photo Gallery",
  description: "Browse our photo gallery — elegant rooms, cosy interiors, and beautiful facilities at Chakwal Grand Guest House.",
  alternates: { canonical: `${siteConfig.url}/gallery` },
  openGraph: {
    title:       "Photo Gallery | Chakwal Grand Guest House",
    description: "Elegant rooms and beautiful facilities — browse photos of Chakwal Grand Guest House.",
    url:         `${siteConfig.url}/gallery`,
    images:      [{ url: `${siteConfig.url}/images/blogs/chakwal-travel-mountains-punjab.webp`, width: 1200, height: 630, alt: "Chakwal Grand Guest House photo gallery" }],
  },
};

export const revalidate = 60; // Re-generate at most once per minute

async function getGalleryImages() {
  const rooms = await prisma.room.findMany({
    where:   { isActive: true },
    select:  {
      id:   true,
      name: true,
      type: true,
      images: {
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        select:  { id: true, url: true, altText: true, isCover: true },
      },
    },
    orderBy: { type: "asc" },
  });
  // Flatten and attach room context
  return rooms.flatMap(r =>
    r.images.map(img => ({
      id:       img.id,
      url:      img.url,
      altText:  img.altText ?? r.name,
      roomName: r.name,
      roomType: r.type,
      isCover:  img.isCover,
    }))
  );
}

export default async function GalleryPage() {
  const images = await getGalleryImages();

  return (
    <div className="pt-28 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-[4px] text-gold-400 mb-3">Our Property</p>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-4">
            Photo Gallery
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Explore our beautifully appointed rooms and facilities at Chakwal Grand Guest House.
          </p>
        </div>

        <GalleryGrid images={images} />
      </div>
    </div>
  );
}
