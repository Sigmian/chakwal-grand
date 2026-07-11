// ============================================================
// server/actions/rooms.ts
// Room management — create, update, availability,
// housekeeping status updates, maintenance logging.
// ============================================================

"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db/prisma";
import { sendPushToBranch } from "@/lib/push/send";
import {
  requirePermission,
  getScopedBranchId,
  assertBranchAccess,
} from "@/lib/auth/session";
import { createRoomSchema, updateRoomSchema } from "@/lib/validation/schemas";
import type { CreateRoomInput, UpdateRoomInput } from "@/lib/validation/schemas";
import { RoomStatus, BookingStatus, type SessionUser } from "@/types";

async function requireRoomAccess(user: SessionUser, roomId: string) {
  const room = await prisma.room.findUnique({ where: { id: roomId }, select: { branchId: true } });
  if (!room) throw new Error("Room not found");
  assertBranchAccess(user, room.branchId);
  return room;
}

// ─── GET ALL ROOMS ────────────────────────────────────────────
export async function getRooms(params?: {
  branchId?: string;
  status?:   RoomStatus;
  type?:     string;
}) {
  const user         = await requirePermission("rooms:read");
  const scopedBranch = getScopedBranchId(user, params?.branchId);

  return prisma.room.findMany({
    where: {
      isActive: true,
      ...(scopedBranch        ? { branchId: scopedBranch } : {}),
      ...(params?.status      ? { status: params.status }  : {}),
      ...(params?.type        ? { type: params.type as never } : {}),
    },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      branch: { select: { id: true, name: true, slug: true, city: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: [{ branch: { name: "asc" } }, { number: "asc" }],
  });
}

// ─── GET SINGLE ROOM ──────────────────────────────────────────
export async function getRoom(roomId: string) {
  const user = await requirePermission("rooms:read");
  await requireRoomAccess(user, roomId);

  return prisma.room.findUnique({
    where: { id: roomId },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      branch: { select: { id: true, name: true, slug: true } },
      maintenanceLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      cleaningLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      bookings: {
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
          checkOutDate: { gte: new Date() },
        },
        include: {
          customer: { select: { name: true, phone: true } },
        },
        orderBy: { checkInDate: "asc" },
        take: 5,
      },
    },
  });
}

// ─── CHECK AVAILABILITY ───────────────────────────────────────
export async function checkRoomAvailability(params: {
  branchId:    string;
  checkInDate: string;
  checkOutDate: string;
  roomType?:   string;
  adultCount?: number;
}) {
  const user = await requirePermission("rooms:read");
  assertBranchAccess(user, params.branchId);

  const checkIn  = new Date(params.checkInDate);
  const checkOut = new Date(params.checkOutDate);

  // Find all booked room IDs for the date range
  const bookedRoomIds = await prisma.booking
    .findMany({
      where: {
        branchId: params.branchId,
        status:   { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
        AND: [
          { checkInDate:  { lt: checkOut } },
          { checkOutDate: { gt: checkIn  } },
        ],
      },
      select: { roomId: true },
    })
    .then((bookings) => bookings.map((b) => b.roomId));

  // Return available rooms (not booked, not blocked/maintenance)
  return prisma.room.findMany({
    where: {
      branchId: params.branchId,
      isActive: true,
      status:   { in: [RoomStatus.AVAILABLE, RoomStatus.CLEANING] },
      id:       { notIn: bookedRoomIds },
      ...(params.roomType  ? { type: params.roomType as never } : {}),
      ...(params.adultCount ? { maxAdults: { gte: params.adultCount } } : {}),
    },
    include: {
      images: {
        where:   { isCover: true },
        take:    1,
      },
      branch: { select: { name: true, slug: true } },
    },
    orderBy: { pricePerNight: "asc" },
  });
}

// ─── CREATE ROOM ─────────────────────────────────────────────
export async function createRoom(rawInput: CreateRoomInput) {
  const user = await requirePermission("rooms:create");

  const result = createRoomSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }
  const input = result.data;

  // Verify branch access
  const branchId = getScopedBranchId(user, input.branchId);
  if (!branchId) return { success: false, error: "Branch access denied" };

  try {
    // Check room number is unique within this branch
    const existing = await prisma.room.findUnique({
      where: { branchId_number: { branchId, number: input.number } },
    });
    if (existing) {
      return { success: false, error: `Room number ${input.number} already exists in this branch` };
    }

    const room = await prisma.room.create({
      data: {
        branchId,
        number:        input.number,
        name:          input.name,
        type:          input.type,
        floor:         input.floor,
        description:   input.description,
        pricePerNight: input.pricePerNight,
        weekendPrice:  input.weekendPrice,
        seasonalPrice: input.seasonalPrice,
        maxAdults:     input.maxAdults,
        maxChildren:   input.maxChildren ?? 0,
        bedCount:      input.bedCount,
        bedType:       input.bedType,
        amenities:     input.amenities ?? [],
        size:          input.size,
        hasBalcony:    input.hasBalcony   ?? false,
        hasKitchenette: input.hasKitchenette ?? false,
        hasJacuzzi:    input.hasJacuzzi   ?? false,
        status:        RoomStatus.AVAILABLE,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId:      user.id,
        action:      "ROOM_CREATED",
        entity:      "Room",
        entityId:    room.id,
        description: `Room ${room.number} — ${room.name} created in branch ${branchId}`,
      },
    });

    revalidatePath("/dashboard/rooms");
    revalidatePath(`/branches/${branchId}`);

    return { success: true, data: room };
  } catch (error) {
    console.error("[createRoom]", error);
    return { success: false, error: "Failed to create room" };
  }
}

// ─── UPDATE ROOM ─────────────────────────────────────────────
export async function updateRoom(roomId: string, rawInput: UpdateRoomInput) {
  const user = await requirePermission("rooms:update");
  await requireRoomAccess(user, roomId);

  const result = updateRoomSchema.safeParse(rawInput);
  if (!result.success) {
    return { success: false, error: result.error.errors[0].message };
  }

  try {
    const room = await prisma.room.update({
      where: { id: roomId },
      data:  result.data,
    });

    revalidatePath("/dashboard/rooms");
    revalidatePath(`/dashboard/rooms/${roomId}`);

    return { success: true, data: room };
  } catch (error) {
    console.error("[updateRoom]", error);
    return { success: false, error: "Failed to update room" };
  }
}

// ─── UPDATE ROOM STATUS ───────────────────────────────────────
export async function updateRoomStatus(
  roomId:  string,
  status:  RoomStatus,
  notes?:  string
) {
  const user = await requirePermission("rooms:update");
  await requireRoomAccess(user, roomId);

  try {
    const room = await prisma.room.update({
      where: { id: roomId },
      data:  { status },
    });

    // If marking as cleaned, log it
    if (status === RoomStatus.AVAILABLE) {
      await prisma.cleaningLog.create({
        data: {
          roomId,
          cleanedById: user.id,
          notes,
        },
      });
      await prisma.room.update({
        where: { id: roomId },
        data:  { lastCleaned: new Date() },
      });
    }

    await prisma.activityLog.create({
      data: {
        userId:      user.id,
        action:      "ROOM_STATUS_UPDATED",
        entity:      "Room",
        entityId:    roomId,
        description: `Room ${room.number} status changed to ${status}`,
        metadata:    { previousStatus: room.status, newStatus: status, notes },
      },
    });

    // Push alert when room is marked for cleaning
    if (status === RoomStatus.CLEANING) {
      sendPushToBranch(room.branchId, {
        title: "🧹 Room Needs Cleaning",
        body:  `Room ${room.number} has been checked out and is ready for housekeeping.`,
        tag:   `cleaning-${roomId}`,
        data:  { url: "/housekeeping" },
      }).catch(() => {/* ignore push errors */});
    }

    revalidatePath("/dashboard/rooms");
    revalidatePath("/housekeeping");

    return { success: true, data: room };
  } catch (error) {
    console.error("[updateRoomStatus]", error);
    return { success: false, error: "Failed to update room status" };
  }
}

// ─── LOG MAINTENANCE ─────────────────────────────────────────
export async function logMaintenance(params: {
  roomId:      string;
  title:       string;
  description?: string;
  cost?:        number;
}) {
  const user = await requirePermission("rooms:set_maintenance");
  await requireRoomAccess(user, params.roomId);

  try {
    // Set room to maintenance mode
    await prisma.$transaction([
      prisma.room.update({
        where: { id: params.roomId },
        data:  { status: RoomStatus.MAINTENANCE },
      }),
      prisma.maintenanceLog.create({
        data: {
          roomId:      params.roomId,
          title:       params.title,
          description: params.description,
          cost:        params.cost,
        },
      }),
    ]);

    await prisma.activityLog.create({
      data: {
        userId:      user.id,
        action:      "MAINTENANCE_LOGGED",
        entity:      "Room",
        entityId:    params.roomId,
        description: `Maintenance: ${params.title}`,
      },
    });

    revalidatePath("/dashboard/rooms");
    revalidatePath("/housekeeping");

    return { success: true };
  } catch (error) {
    console.error("[logMaintenance]", error);
    return { success: false, error: "Failed to log maintenance" };
  }
}

// ─── RESOLVE MAINTENANCE ─────────────────────────────────────
export async function resolveMaintenance(maintenanceLogId: string) {
  const user = await requirePermission("rooms:set_maintenance");

  try {
    const existingLog = await prisma.maintenanceLog.findUnique({
      where: { id: maintenanceLogId },
      include: { room: { select: { branchId: true } } },
    });
    if (!existingLog) return { success: false, error: "Maintenance record not found" };
    assertBranchAccess(user, existingLog.room.branchId);

    const log = await prisma.maintenanceLog.update({
      where: { id: maintenanceLogId },
      data:  { resolvedAt: new Date() },
      include: { room: true },
    });

    // Set room back to cleaning (needs cleaning after maintenance)
    await prisma.room.update({
      where: { id: log.roomId },
      data:  { status: RoomStatus.CLEANING },
    });

    await prisma.activityLog.create({
      data: {
        userId:      user.id,
        action:      "MAINTENANCE_RESOLVED",
        entity:      "Room",
        entityId:    log.roomId,
        description: `Maintenance resolved: ${log.title}`,
      },
    });

    revalidatePath("/dashboard/rooms");
    revalidatePath("/housekeeping");

    return { success: true };
  } catch (error) {
    console.error("[resolveMaintenance]", error);
    return { success: false, error: "Failed to resolve maintenance" };
  }
}

// ─── GET HOUSEKEEPING BOARD ───────────────────────────────────
export async function getHousekeepingBoard(branchId?: string) {
  const user         = await requirePermission("housekeeping:read");
  const scopedBranch = getScopedBranchId(user, branchId);

  const rooms = await prisma.room.findMany({
    where: {
      isActive: true,
      ...(scopedBranch ? { branchId: scopedBranch } : {}),
    },
    include: {
      images: { where: { isCover: true }, take: 1 },
      branch: { select: { name: true } },
      cleaningLogs: {
        orderBy: { createdAt: "desc" },
        take:    1,
      },
      maintenanceLogs: {
        where:   { resolvedAt: null },
        orderBy: { createdAt: "desc" },
        take:    1,
      },
      bookings: {
        where: {
          checkOutDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
          status: BookingStatus.CHECKED_IN,
        },
        select: { checkOutDate: true, customer: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: [{ floor: "asc" }, { number: "asc" }],
  });

  return rooms;
}

// ─── GET BOOKING CALENDAR DATA (for a room) ──────────────────
export async function getRoomCalendar(roomId: string, year: number, month: number) {
  const user = await requirePermission("rooms:read");
  await requireRoomAccess(user, roomId);

  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month,     0, 23, 59, 59);

  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      status: { notIn: [BookingStatus.CANCELLED] },
      AND: [
        { checkInDate:  { lte: end   } },
        { checkOutDate: { gte: start } },
      ],
    },
    select: {
      id:          true,
      bookingRef:  true,
      checkInDate: true,
      checkOutDate: true,
      status:      true,
      customer:    { select: { name: true } },
    },
  });

  return bookings;
}

// ─── UPLOAD ROOM IMAGES (returns signed URL for client upload) ─
export async function addRoomImages(
  roomId: string,
  imageUrls: string[],
  setCoverIndex?: number
) {
  const user = await requirePermission("rooms:upload_images");
  await requireRoomAccess(user, roomId);

  try {
    const existingCount = await prisma.roomImage.count({ where: { roomId } });

    const images = await prisma.$transaction(
      imageUrls.map((url, idx) =>
        prisma.roomImage.create({
          data: {
            roomId,
            url,
            isCover:   idx === (setCoverIndex ?? 0) && existingCount === 0,
            sortOrder: existingCount + idx,
          },
        })
      )
    );

    revalidatePath(`/dashboard/rooms/${roomId}`);
    revalidatePath("/dashboard/rooms");

    return { success: true, data: images };
  } catch (error) {
    console.error("[addRoomImages]", error);
    return { success: false, error: "Failed to save images" };
  }
}

// ─── SET COVER IMAGE ─────────────────────────────────────────
export async function setRoomCoverImage(roomId: string, imageId: string) {
  const user = await requirePermission("rooms:upload_images");
  await requireRoomAccess(user, roomId);
  const image = await prisma.roomImage.findUnique({ where: { id: imageId }, select: { roomId: true } });
  if (!image || image.roomId !== roomId) return { success: false, error: "Image does not belong to this room" };

  await prisma.$transaction([
    prisma.roomImage.updateMany({
      where: { roomId },
      data:  { isCover: false },
    }),
    prisma.roomImage.update({
      where: { id: imageId },
      data:  { isCover: true },
    }),
  ]);

  revalidatePath(`/dashboard/rooms/${roomId}`);
  return { success: true };
}

// ─── DELETE ROOM IMAGE ────────────────────────────────────────
export async function deleteRoomImage(imageId: string) {
  const user = await requirePermission("rooms:upload_images");
  const image = await prisma.roomImage.findUnique({ where: { id: imageId }, select: { roomId: true } });
  if (!image) return { success: false, error: "Image not found" };
  await requireRoomAccess(user, image.roomId);

  await prisma.roomImage.delete({ where: { id: imageId } });
  revalidatePath("/dashboard/rooms");
  return { success: true };
}
