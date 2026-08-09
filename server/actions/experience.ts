"use server";

// ============================================================
// server/actions/experience.ts
//
// Data layer for the 3D exploration experience.
//
// The 3D scene never decides availability. It asks here, and this
// reads the same rooms, statuses and bookings the normal booking
// engine uses — so a room that is taken in one is taken in both.
// ============================================================

import prisma from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";

export type RoomAvailability =
  | "AVAILABLE"
  | "BOOKED"        // taken for the chosen dates
  | "OCCUPIED"      // someone is in it right now
  | "MAINTENANCE"
  | "UNAVAILABLE";  // blocked / inactive

export interface ExperienceRoom {
  id: string;
  number: string;
  name: string;
  type: string;
  floor: number;
  pricePerNight: number;
  maxAdults: number;
  maxChildren: number;
  bedCount: number;
  bedType: string | null;
  amenities: string[];
  size: number | null;
  hasBalcony: boolean;
  description: string | null;
  images: { url: string; altText: string | null }[];
  tourImages360: string[];
  availability: RoomAvailability;
}

export interface ExperienceFloor {
  index: number;
  label: string;
  rooms: ExperienceRoom[];
  availableCount: number;
  totalCount: number;
  startingFrom: number | null;
}

export interface ExperienceBranch {
  id: string;
  key: "main" | "madina";
  name: string;
  address: string;
  city: string;
  floors: ExperienceFloor[];
  totalRooms: number;
  availableRooms: number;
  startingFrom: number | null;
}

const floorLabel = (i: number) =>
  i === 0 ? "Ground Floor" : i === 1 ? "First Floor" : i === 2 ? "Second Floor" : `Floor ${i}`;

const keyFor = (branchId: string): "main" | "madina" =>
  branchId === siteConfig.branchIds.madinaTown ? "madina" : "main";

/**
 * Full branch → floor → room tree with live availability.
 *
 * `checkIn`/`checkOut` are optional: without them a room reads as
 * available unless its own status says otherwise; with them, bookings
 * overlapping the stay mark it BOOKED — the same overlap rule
 * getAvailableRooms uses.
 */
export async function getExperienceData(
  checkIn?: string,
  checkOut?: string,
): Promise<ExperienceBranch[]> {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, address: true, city: true },
    orderBy: { name: "asc" },
  });

  // Resolve date-range conflicts once for every branch in one query.
  let takenIds = new Set<string>();
  const ci = checkIn ? new Date(checkIn) : null;
  const co = checkOut ? new Date(checkOut) : null;
  const validRange = ci && co && !isNaN(ci.getTime()) && !isNaN(co.getTime()) && ci < co;

  if (validRange) {
    const conflicting = await prisma.booking.findMany({
      where: {
        status: { in: ["CONFIRMED", "CHECKED_IN", "PENDING"] },
        AND: [{ checkInDate: { lt: co! } }, { checkOutDate: { gt: ci! } }],
      },
      select: { roomId: true },
    });
    takenIds = new Set(conflicting.map((b) => b.roomId));
  }

  const rooms = await prisma.room.findMany({
    where: { isActive: true },
    include: {
      images: {
        select: { url: true, altText: true, isCover: true, sortOrder: true },
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
      },
    },
    orderBy: [{ floor: "asc" }, { number: "asc" }],
  });

  return branches.map((b) => {
    const branchRooms = rooms.filter((r) => r.branchId === b.id);
    const byFloor = new Map<number, ExperienceRoom[]>();

    for (const r of branchRooms) {
      let availability: RoomAvailability = "AVAILABLE";
      if (r.status === "MAINTENANCE") availability = "MAINTENANCE";
      else if (r.status === "BLOCKED") availability = "UNAVAILABLE";
      else if (takenIds.has(r.id)) availability = "BOOKED";
      else if (r.status === "OCCUPIED") availability = "OCCUPIED";

      const floor = r.floor ?? 0;
      const entry: ExperienceRoom = {
        id: r.id,
        number: r.number,
        name: r.name,
        type: String(r.type),
        floor,
        pricePerNight: Number(r.pricePerNight),
        maxAdults: r.maxAdults,
        maxChildren: r.maxChildren,
        bedCount: r.bedCount,
        bedType: r.bedType,
        amenities: r.amenities,
        size: r.size,
        hasBalcony: r.hasBalcony,
        description: r.description,
        images: r.images.map((i) => ({ url: i.url, altText: i.altText })),
        tourImages360: r.tourImages360,
        availability,
      };
      const list = byFloor.get(floor) ?? [];
      list.push(entry);
      byFloor.set(floor, list);
    }

    const floors: ExperienceFloor[] = [...byFloor.entries()]
      .sort((a, z) => a[0] - z[0])
      .map(([index, list]) => {
        const free = list.filter((r) => r.availability === "AVAILABLE");
        return {
          index,
          label: floorLabel(index),
          rooms: list,
          availableCount: free.length,
          totalCount: list.length,
          startingFrom: free.length ? Math.min(...free.map((r) => r.pricePerNight)) : null,
        };
      });

    const allFree = branchRooms.length
      ? floors.flatMap((f) => f.rooms).filter((r) => r.availability === "AVAILABLE")
      : [];

    return {
      id: b.id,
      key: keyFor(b.id),
      name: siteConfig.branches.find((s) => s.id === b.id)?.name ?? b.name,
      address: b.address ?? "",
      city: b.city ?? "",
      floors,
      totalRooms: branchRooms.length,
      availableRooms: allFree.length,
      startingFrom: allFree.length ? Math.min(...allFree.map((r) => r.pricePerNight)) : null,
    };
  });
}
