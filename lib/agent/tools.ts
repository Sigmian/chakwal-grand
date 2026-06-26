// ============================================================
// WhatsApp AI Agent — Tool definitions + implementations
// Wraps existing public server actions so Claude can call them
// ============================================================

import type Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/db/prisma";
import { createPublicBooking, getBookingByRef } from "@/server/actions/public";
import { siteConfig } from "@/config/site";
import { BookingStatus } from "@/types";

// ── Tool schemas (sent to Claude) ────────────────────────────

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "lookup_customer",
    description:
      "Look up a returning customer by their WhatsApp phone number. Call this on the FIRST message of every new session " +
      "to greet returning guests by name and skip re-asking for their details. " +
      "Returns name, total visits, preferred room type, VIP status, and last visit date if found.",
    input_schema: {
      type: "object" as const,
      properties: {
        phone: {
          type: "string",
          description: "Guest WhatsApp phone (the sender — use the number this conversation is from)",
        },
      },
      required: ["phone"],
    },
  },
  {
    name: "log_complaint",
    description:
      "Log a customer complaint to the admin dashboard. Call this WHENEVER a guest expresses dissatisfaction " +
      "(broken AC, dirty room, rude staff, refund request, late check-in, missed booking, anything negative). " +
      "Triggers escalation notification to the manager for HIGH severity.",
    input_schema: {
      type: "object" as const,
      properties: {
        guest_phone: { type: "string", description: "Sender's WhatsApp number" },
        text:        { type: "string", description: "Full description of the complaint in the guest's own words (summarize if very long)" },
        severity:    { type: "string", enum: ["LOW", "MEDIUM", "HIGH"], description: "LOW=minor inconvenience, MEDIUM=service issue, HIGH=refund/health/safety/threatened bad review" },
        booking_ref: { type: "string", description: "Booking ref if available (optional)" },
        guest_name:  { type: "string", description: "Guest name if known (optional)" },
      },
      required: ["guest_phone", "text", "severity"],
    },
  },
  {
    name: "search_rooms",
    description:
      "Find available rooms for given dates. Returns id, name, type, price, capacity, branch. " +
      "Always call this before create_booking so you have the correct room_id and branch_id.",
    input_schema: {
      type: "object" as const,
      properties: {
        check_in:    { type: "string", description: "Check-in date (YYYY-MM-DD)" },
        check_out:   { type: "string", description: "Check-out date (YYYY-MM-DD)" },
        adults:      { type: "number", description: "Number of adults — used to filter by capacity" },
        branch_city: {
          type: "string",
          description: "Filter by city: Chakwal, Kallar Kahar, or Sargodha (optional)",
        },
      },
      required: [],
    },
  },
  {
    name: "create_booking",
    description:
      "Create a booking once you have ALL fields. " +
      "Use room_id and branch_id from search_rooms. Returns booking ref and total amount.",
    input_schema: {
      type: "object" as const,
      properties: {
        guest_name:       { type: "string", description: "Full name of the guest" },
        guest_phone:      { type: "string", description: "Guest phone (03xx-xxxxxxx or +92 format)" },
        check_in:         { type: "string", description: "Check-in date (YYYY-MM-DD)" },
        check_out:        { type: "string", description: "Check-out date (YYYY-MM-DD)" },
        room_id:          { type: "string", description: "Room ID from search_rooms" },
        branch_id:        { type: "string", description: "Branch ID from search_rooms" },
        adults:           { type: "number", description: "Number of adults" },
        children:         { type: "number", description: "Number of children (default 0)" },
        special_requests: { type: "string", description: "Special requests (optional)" },
      },
      required: [
        "guest_name", "guest_phone", "check_in", "check_out",
        "room_id", "branch_id", "adults",
      ],
    },
  },
  {
    name: "get_booking",
    description: "Look up a booking by reference number. Use when a guest asks about their reservation status.",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_ref: { type: "string", description: "Booking reference (e.g. BK-2026-XXXX)" },
      },
      required: ["booking_ref"],
    },
  },
  {
    name: "cancel_booking",
    description: "Cancel a booking. Verify the guest by matching their phone number.",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_ref: { type: "string", description: "Booking reference number" },
        guest_phone: { type: "string", description: "Guest phone to verify identity" },
      },
      required: ["booking_ref", "guest_phone"],
    },
  },
];

// ── Tool router ───────────────────────────────────────────────

export async function executeAgentTool(
  toolName: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  switch (toolName) {
    case "lookup_customer": return lookupCustomerTool(input);
    case "log_complaint":   return logComplaintTool(input);
    case "search_rooms":    return searchRooms(input);
    case "create_booking":  return createBookingTool(input);
    case "get_booking":     return getBookingTool(input);
    case "cancel_booking":  return cancelBookingTool(input);
    default:                return { error: "Unknown tool: " + toolName };
  }
}

// Normalize phone for comparison: strip non-digits, take last 10
function normalizePhone(p: string): string {
  return p.replace(/\D/g, "").slice(-10);
}

async function lookupCustomerTool(input: Record<string, unknown>) {
  const phone = input.phone as string;
  if (!phone) return { found: false };

  const last10 = normalizePhone(phone);
  // Find by last 10 digits match (handles +92 vs 0334 vs 92 formats)
  const customers = await prisma.customer.findMany({
    where: { phone: { contains: last10 } },
    include: {
      bookings: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { bookingRef: true, checkInDate: true, status: true, room: { select: { name: true } } },
      },
    },
    take: 5,
  });

  const match = customers.find(c => normalizePhone(c.phone) === last10);
  if (!match) return { found: false };

  return {
    found: true,
    name:              match.name,
    email:             match.email,
    cnic:              match.cnic,
    totalVisits:       match.totalVisits,
    loyaltyTier:       match.loyaltyTier,
    isVIP:             match.isVIP,
    preferredRoomType: match.preferredRoomType,
    specialRequests:   match.specialRequests,
    lastVisitAt:       match.lastVisitAt?.toISOString().split("T")[0] ?? null,
    lastBooking:       match.bookings[0] ?? null,
  };
}

async function logComplaintTool(input: Record<string, unknown>) {
  const text     = (input.text as string)?.trim();
  const phone    = (input.guest_phone as string) ?? "";
  const severity = ((input.severity as string) ?? "MEDIUM").toUpperCase();

  if (!text || !phone) {
    return { success: false, error: "Missing complaint text or phone" };
  }
  if (!["LOW", "MEDIUM", "HIGH"].includes(severity)) {
    return { success: false, error: "Invalid severity" };
  }

  const complaint = await prisma.complaint.create({
    data: {
      bookingRef:  (input.booking_ref as string) || null,
      guestPhone:  phone,
      guestName:   (input.guest_name  as string) || null,
      text,
      severity,
      source:      "whatsapp",
      status:      "OPEN",
    },
  });

  return {
    success:    true,
    complaintId: complaint.id,
    severity,
    escalated:  severity === "HIGH",
  };
}

// ── Implementations ───────────────────────────────────────────

async function searchRooms(input: Record<string, unknown>) {
  const checkIn  = input.check_in    as string | undefined;
  const checkOut = input.check_out   as string | undefined;
  const adults   = input.adults      as number | undefined;
  const city     = input.branch_city as string | undefined;

  const rooms = await prisma.room.findMany({
    where: {
      isActive: true,
      status:   { not: "BLOCKED" },
      ...(adults ? { maxAdults: { gte: adults } } : {}),
      ...(city   ? { branch: { city: { contains: city, mode: "insensitive" as const } } } : {}),
    },
    include: { branch: { select: { id: true, name: true, city: true } } },
    orderBy: [{ type: "asc" }, { pricePerNight: "asc" }],
  });

  // Filter by availability if dates provided
  let available = rooms;
  if (checkIn && checkOut) {
    const ci = new Date(checkIn);
    const co = new Date(checkOut);

    const booked = await prisma.booking.findMany({
      where: {
        status:       { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
        checkInDate:  { lt: co },
        checkOutDate: { gt: ci },
      },
      select: { roomId: true },
    });
    const bookedIds = new Set(booked.map((b) => b.roomId));
    available = rooms.filter((r) => !bookedIds.has(r.id));
  }

  if (available.length === 0) {
    return {
      available: false,
      message:   "No rooms available for those dates. Try different dates or another branch.",
    };
  }

  return {
    available: true,
    rooms: available.map((r) => ({
      id:            r.id,
      name:          r.name,
      type:          r.type,
      pricePerNight: Number(r.pricePerNight),
      maxAdults:     r.maxAdults,
      maxChildren:   r.maxChildren,
      amenities:     r.amenities,
      description:   r.description,
      branch:        { id: r.branch.id, name: r.branch.name, city: r.branch.city },
    })),
  };
}

async function createBookingTool(input: Record<string, unknown>) {
  const result = await createPublicBooking({
    roomId:    input.room_id      as string,
    branchId:  input.branch_id    as string,
    checkIn:   input.check_in     as string,
    checkOut:  input.check_out    as string,
    adults:    input.adults       as number,
    children: (input.children     as number) ?? 0,
    name:      input.guest_name   as string,
    phone:     input.guest_phone  as string,
    notes:    (input.special_requests as string) || undefined,
  });

  if (!result.success) return { success: false, error: result.error };

  // createPublicBooking returns: { success, bookingId, ref, shareToken, discountAmount }
  const ref = (result as { ref: string }).ref;
  return {
    success:         true,
    bookingRef:      ref,
    confirmationUrl: `${siteConfig.url}/booking-confirmation/${ref}`,
  };
}

async function getBookingTool(input: Record<string, unknown>) {
  const booking = await getBookingByRef(input.booking_ref as string);
  if (!booking) return { found: false, error: "Booking not found. Please check the reference number." };

  return {
    found:           true,
    bookingRef:      booking.bookingRef,
    status:          booking.status,
    guestName:       booking.customer.name,
    room:            booking.room.name,
    branch:          booking.branch.name,
    checkIn:         booking.checkInDate.toISOString().split("T")[0],
    checkOut:        booking.checkOutDate.toISOString().split("T")[0],
    nights:          booking.nights,
    totalAmount:     Number(booking.totalAmount),
    confirmationUrl: `${siteConfig.url}/booking-confirmation/${booking.bookingRef}`,
  };
}

async function cancelBookingTool(input: Record<string, unknown>) {
  const ref   = input.booking_ref as string;
  const phone = input.guest_phone as string;

  const booking = await prisma.booking.findUnique({
    where:   { bookingRef: ref },
    include: { customer: { select: { phone: true } } },
  });

  if (!booking) return { success: false, error: "Booking not found." };

  // Verify phone — match last 10 digits
  const last10 = (s: string) => s.replace(/\D/g, "").slice(-10);
  if (last10(phone) !== last10(booking.customer.phone)) {
    return { success: false, error: "Phone number does not match booking records. Cannot cancel." };
  }

  if (booking.status === BookingStatus.CANCELLED) {
    return { success: false, error: "This booking is already cancelled." };
  }
  if ([BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT].includes(booking.status as BookingStatus)) {
    return { success: false, error: "Cannot cancel a booking that has already checked in." };
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data:  { status: BookingStatus.CANCELLED },
  });

  return { success: true, bookingRef: ref };
}
