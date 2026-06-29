// ============================================================
// WhatsApp AI Agent — Tool definitions + implementations
// Wraps existing public server actions so Claude can call them
// ============================================================

import type Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/db/prisma";
import { createPublicBooking, getBookingByRef } from "@/server/actions/public";
import { siteConfig } from "@/config/site";
import { BookingStatus, RoomType } from "@/types";
import { sendPushToAllStaff } from "@/lib/push/send";
import { sendWhatsAppImages } from "@/lib/whatsapp/send";

// ── Owner alert with retry ────────────────────────────────────
// Retries up to 3 times with exponential backoff (2s, 4s, 8s).
// A single fire-and-forget fetch means a 5-second Meta blip loses
// a HIGH complaint alert forever — this ensures delivery.
const cleanEnv = (s: string | undefined) =>
  s ? s.replace(/^﻿/, "").replace(/[​-‍﻿]/g, "").trim() : undefined;

async function sendOwnerAlertWithRetry(
  message: string,
  attempt = 1,
): Promise<void> {
  const token   = cleanEnv(process.env.WHATSAPP_API_TOKEN);
  const phoneId = cleanEnv(process.env.WHATSAPP_PHONE_NUMBER_ID);

  if (!token || !phoneId) {
    console.warn("[Owner Alert] WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set — skipping");
    return;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method:  "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to:   siteConfig.whatsapp,
          type: "text",
          text: { body: message, preview_url: false },
        }),
      },
    );

    if (res.ok) {
      console.log(`[Owner Alert] Delivered on attempt ${attempt}`);
      return;
    }

    const errBody = await res.text();
    throw new Error(`Meta ${res.status}: ${errBody}`);

  } catch (err) {
    if (attempt >= 3) {
      console.error(`[Owner Alert] Failed after ${attempt} attempts:`, err);
      throw err;
    }
    const delayMs = 2000 * Math.pow(2, attempt - 1); // 2s, 4s, 8s
    console.warn(`[Owner Alert] Attempt ${attempt} failed — retrying in ${delayMs}ms`, err);
    await new Promise(r => setTimeout(r, delayMs));
    return sendOwnerAlertWithRetry(message, attempt + 1);
  }
}

// ── Customer memory helpers ───────────────────────────────────
// Bot-learned preferences are stored as JSON inside Customer.notes.
// Human notes written by staff are stored in Customer.specialRequests.
// The JSON structure is additive — new facts are merged in, never erased.

type PreferredLanguage = "roman_urdu" | "english" | "urdu_script" | "mixed";

interface BotMemory {
  preferences:       string[];          // "prefers ground floor", "vegetarian"
  avoidances:        string[];          // "no top floor", "sensitive to noise"
  occasions:         string[];          // "honeymoon 2024-06", "family eid trip"
  preferredLanguage: PreferredLanguage | null; // detected from their messages
  lastUpdated:       string;            // ISO date
}

const EMPTY_MEMORY: BotMemory = {
  preferences: [], avoidances: [], occasions: [],
  preferredLanguage: null, lastUpdated: "",
};

function parseBotMemory(notes: string | null | undefined): BotMemory {
  if (!notes) return { ...EMPTY_MEMORY };
  try {
    const parsed = JSON.parse(notes);
    if (typeof parsed === "object" && parsed !== null && "preferences" in parsed) {
      // Backfill preferredLanguage for records saved before this field existed
      return { ...EMPTY_MEMORY, ...parsed } as BotMemory;
    }
    // Plain-text human note — preserve it as a preference entry
    return { ...EMPTY_MEMORY, preferences: [notes] };
  } catch {
    return { ...EMPTY_MEMORY, preferences: notes ? [notes] : [] };
  }
}

function serializeBotMemory(mem: BotMemory): string {
  return JSON.stringify({ ...mem, lastUpdated: new Date().toISOString().split("T")[0] });
}

function mergeMemory(existing: BotMemory, patch: Partial<BotMemory>): BotMemory {
  const dedup = (arr: string[]) => [...new Set(arr.map(s => s.toLowerCase().trim()))];
  return {
    preferences:       dedup([...existing.preferences, ...(patch.preferences ?? [])]),
    avoidances:        dedup([...existing.avoidances,  ...(patch.avoidances  ?? [])]),
    occasions:         dedup([...existing.occasions,   ...(patch.occasions   ?? [])]),
    // Language: only update if a new value is provided; keep existing otherwise
    preferredLanguage: patch.preferredLanguage ?? existing.preferredLanguage,
    lastUpdated:       new Date().toISOString().split("T")[0],
  };
}

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
        branch_name: {
          type: "string",
          description: "Filter by branch name. Pass 'Main Branch' for Talagang Road branch, or 'Madina Town' for Madina Town branch. Leave empty to search all branches.",
        },
      },
      required: [],
    },
  },
  {
    name: "send_room_images",
    description:
      "Send room or property photos to the guest on WhatsApp. " +
      "Call this when a guest asks to see pictures, photos, or images of a room, room type, or branch. " +
      "Sends up to 3 cover photos directly into the WhatsApp chat. " +
      "Only works in WhatsApp mode — pass the guest's WhatsApp phone number. " +
      "Call search_rooms first if you need a room_id.",
    input_schema: {
      type: "object" as const,
      properties: {
        to_phone:    { type: "string",  description: "Guest WhatsApp phone number to send images to" },
        room_id:     { type: "string",  description: "Specific room ID — use when guest asked about one room (from search_rooms)" },
        room_type:   { type: "string",  description: "Room type to show (STANDARD, DELUXE, FAMILY, VIP, SUITE) — use when no specific room chosen yet" },
        branch_city: { type: "string",  description: "Filter by branch: 'Main Branch' or 'Madina Town Branch' — optional" },
      },
      required: ["to_phone"],
    },
  },
  {
    name: "validate_coupon",
    description:
      "Validate a promo or discount code BEFORE creating a booking. Call this when a guest mentions a code. " +
      "Also call it proactively when a guest qualifies for WELCOME15 (first-time visitor — no prior bookings). " +
      "Returns discount amount and a human-friendly label if valid, or a clear error if not.",
    input_schema: {
      type: "object" as const,
      properties: {
        code:         { type: "string",  description: "Coupon/promo code the guest wants to use (e.g. WELCOME15, WEEKLY14)" },
        guest_phone:  { type: "string",  description: "Guest WhatsApp phone — needed for first-time-only validation" },
        nights:       { type: "number",  description: "Number of nights they plan to stay" },
        base_amount:  { type: "number",  description: "Total price BEFORE discount (nights × price per night)" },
      },
      required: ["code", "guest_phone", "nights", "base_amount"],
    },
  },
  {
    name: "create_booking",
    description:
      "Create a booking once you have ALL required fields. " +
      "Use room_id and branch_id from search_rooms. " +
      "If the guest has a validated coupon code, pass it in coupon_code — the discount will be applied automatically. " +
      "Returns booking ref and total amount (after discount).",
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
        coupon_code:      { type: "string", description: "Validated promo/coupon code to apply (optional — from validate_coupon)" },
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
  {
    name: "modify_booking_dates",
    description:
      "Change the check-in and/or check-out dates of an existing booking. Verifies guest by phone. " +
      "Checks the room is still available for the new dates. Updates the booking and recalculates the total.",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_ref:  { type: "string", description: "Booking reference number" },
        guest_phone:  { type: "string", description: "Guest phone to verify identity" },
        new_check_in:  { type: "string", description: "New check-in date (YYYY-MM-DD). Pass current date if only changing check-out." },
        new_check_out: { type: "string", description: "New check-out date (YYYY-MM-DD). Pass current date if only changing check-in." },
      },
      required: ["booking_ref", "guest_phone", "new_check_in", "new_check_out"],
    },
  },
  {
    name: "checkout_guest",
    description:
      "Mark a booking as CHECKED_OUT when a guest confirms they are leaving today. " +
      "Verifies guest by phone. Use this when a guest says they are checking out, leaving, or done with their stay.",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_ref: { type: "string", description: "Booking reference number" },
        guest_phone: { type: "string", description: "Guest phone to verify identity" },
      },
      required: ["booking_ref", "guest_phone"],
    },
  },
  {
    name: "extend_stay",
    description:
      "Extend an existing booking by N additional nights. Verifies guest by phone, checks room availability for extra nights, " +
      "updates check-out date and total amount.",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_ref:  { type: "string", description: "Booking reference number" },
        guest_phone:  { type: "string", description: "Guest phone to verify identity" },
        extra_nights: { type: "number", description: "Number of additional nights to add (must be 1 or more)" },
      },
      required: ["booking_ref", "guest_phone", "extra_nights"],
    },
  },
  {
    name: "log_service_request",
    description:
      "Log an in-stay service request (extra towels, late check-out, transport pickup, room service food, laundry, etc). " +
      "Notifies staff through the complaints/requests dashboard.",
    input_schema: {
      type: "object" as const,
      properties: {
        guest_phone: { type: "string", description: "Sender's WhatsApp number" },
        guest_name:  { type: "string", description: "Guest name if known (optional)" },
        booking_ref: { type: "string", description: "Booking ref if available (optional)" },
        request_text: { type: "string", description: "Full description of what the guest wants" },
      },
      required: ["guest_phone", "request_text"],
    },
  },
  {
    name: "update_customer_memory",
    description:
      "Save something you learned about this guest so future conversations remember it. " +
      "Call this silently (no need to tell the guest) whenever you discover a preference, " +
      "avoidance, or special occasion. Examples: guest says 'ground floor please', " +
      "'we are vegetarian', 'always book family room', 'coming for our honeymoon'. " +
      "Also call after a successful create_booking to record the room type they chose. " +
      "Do NOT call this for one-time requests — only for things worth remembering forever.",
    input_schema: {
      type: "object" as const,
      properties: {
        guest_phone: {
          type: "string",
          description: "Guest WhatsApp phone (the sender's number)",
        },
        preferred_room_type: {
          type: "string",
          enum: ["STANDARD", "DELUXE", "FAMILY", "VIP", "SUITE"],
          description: "Update preferred room type if guest has shown a clear preference",
        },
        preferences: {
          type: "array",
          items: { type: "string" },
          description: "New things to remember — short phrases, e.g. ['prefers ground floor', 'vegetarian', 'travels with family of 4']",
        },
        avoidances: {
          type: "array",
          items: { type: "string" },
          description: "Things the guest wants to avoid — e.g. ['no top floor', 'noise sensitive']",
        },
        occasions: {
          type: "array",
          items: { type: "string" },
          description: "Special occasions mentioned — e.g. ['honeymoon June 2026', 'anniversary trip']",
        },
        preferred_language: {
          type: "string",
          enum: ["roman_urdu", "english", "urdu_script", "mixed"],
          description: "The language this guest clearly prefers to communicate in. Detect from their first few messages and save once — do not update every turn.",
        },
      },
      required: ["guest_phone"],
    },
  },
];

// ── Tool router ───────────────────────────────────────────────

export async function executeAgentTool(
  toolName: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  switch (toolName) {
    case "lookup_customer":        return lookupCustomerTool(input);
    case "log_complaint":          return logComplaintTool(input);
    case "log_service_request":    return logServiceRequestTool(input);
    case "search_rooms":           return searchRooms(input);
    case "send_room_images":        return sendRoomImagesTool(input);
    case "validate_coupon":        return validateCouponTool(input);
    case "create_booking":         return createBookingTool(input);
    case "get_booking":            return getBookingTool(input);
    case "cancel_booking":         return cancelBookingTool(input);
    case "modify_booking_dates":   return modifyBookingDatesTool(input);
    case "checkout_guest":         return checkoutGuestTool(input);
    case "extend_stay":            return extendStayTool(input);
    case "update_customer_memory": return updateCustomerMemoryTool(input);
    default:                       return { error: "Unknown tool: " + toolName };
  }
}

// Normalize phone for comparison: strip non-digits, take last 10.
// Exported so callers outside this module share the same logic.
export function normalizePhone(p: string): string {
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

  // Parse bot-learned memory stored as JSON in the notes field
  const memory = parseBotMemory(match.notes);

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
    // Structured memory the bot has learned over time
    learnedPreferences: memory.preferences,
    learnedAvoidances:  memory.avoidances,
    knownOccasions:     memory.occasions,
    preferredLanguage:  memory.preferredLanguage,
    memoryLastUpdated:  memory.lastUpdated || null,
    lastVisitAt:       match.lastVisitAt?.toISOString().split("T")[0] ?? null,
    lastBooking:       match.bookings[0] ?? null,
  };
}

async function logServiceRequestTool(input: Record<string, unknown>) {
  // Re-uses the Complaint table with source="service-request" so staff
  // see all guest needs in one inbox without an extra table.
  const text  = (input.request_text as string)?.trim();
  const phone = (input.guest_phone   as string) ?? "";
  if (!text || !phone) return { success: false, error: "Missing request text or phone" };

  const req = await prisma.complaint.create({
    data: {
      bookingRef: (input.booking_ref as string) || null,
      guestPhone: phone,
      guestName:  (input.guest_name as string) || null,
      text,
      severity:   "LOW",
      source:     "service-request",
      status:     "OPEN",
    },
  });
  return { success: true, requestId: req.id };
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

  const escalated = severity === "HIGH";
  const guestLabel = (input.guest_name as string) || phone;

  // ── A1: Real escalation — notify staff immediately ─────────
  // Push notification to all staff browsers
  sendPushToAllStaff({
    title: escalated
      ? `🚨 HIGH Complaint — ${guestLabel}`
      : `New Complaint — ${guestLabel}`,
    body:  text.slice(0, 120),
    data:  { url: "/complaints" },
  }).catch((err) => console.error("[Push Error]", err));

  // HIGH severity: also WhatsApp the owner directly with retry
  if (escalated) {
    const alertMsg =
      `🚨 *HIGH Severity Complaint*\n\n` +
      `Guest: ${guestLabel}\n` +
      `Phone: ${phone}\n` +
      (complaint.bookingRef ? `Booking: ${complaint.bookingRef}\n` : "") +
      `\n"${text.slice(0, 300)}"\n\n` +
      `Action needed immediately. View: ${siteConfig.url}/complaints`;

    sendOwnerAlertWithRetry(alertMsg).catch((err) =>
      console.error("[Owner WhatsApp Alert Failed after retries]", err),
    );
  }

  return {
    success:    true,
    complaintId: complaint.id,
    severity,
    escalated,
  };
}

// ── Implementations ───────────────────────────────────────────

async function searchRooms(input: Record<string, unknown>) {
  const checkIn    = input.check_in    as string | undefined;
  const checkOut   = input.check_out   as string | undefined;
  const adults     = input.adults      as number | undefined;
  const branchName = (input.branch_name as string | undefined) ?? (input.branch_city as string | undefined);

  const rooms = await prisma.room.findMany({
    where: {
      isActive: true,
      status:   { not: "BLOCKED" },
      ...(adults     ? { maxAdults: { gte: adults } } : {}),
      ...(branchName ? { branch: { name: { contains: branchName, mode: "insensitive" as const } } } : {}),
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

async function sendRoomImagesTool(input: Record<string, unknown>) {
  const toPhone   = (input.to_phone    as string)?.trim();
  const roomId    = (input.room_id     as string)?.trim();
  const roomType  = (input.room_type   as string)?.trim().toUpperCase();
  const city      = (input.branch_city as string)?.trim();

  if (!toPhone) return { success: false, error: "to_phone is required" };

  // Build the image query — prefer specific room, fallback to type/city
  type ImageWithRoom = {
    url: string;
    altText: string | null;
    room: { name: string; type: string; pricePerNight: unknown; branch: { city: string } };
  };

  let images: ImageWithRoom[] = [];

  if (roomId) {
    images = await prisma.roomImage.findMany({
      where:   { roomId, isCover: true },
      take:    3,
      orderBy: { sortOrder: "asc" },
      select:  {
        url: true, altText: true,
        room: { select: { name: true, type: true, pricePerNight: true, branch: { select: { city: true } } } },
      },
    });
    // If no cover images marked, fall back to any images for this room
    if (images.length === 0) {
      images = await prisma.roomImage.findMany({
        where:   { roomId },
        take:    3,
        orderBy: { sortOrder: "asc" },
        select:  {
          url: true, altText: true,
          room: { select: { name: true, type: true, pricePerNight: true, branch: { select: { city: true } } } },
        },
      }) as ImageWithRoom[];
    }
  } else {
    images = await prisma.roomImage.findMany({
      where: {
        isCover: true,
        room: {
          isActive: true,
          status:   { not: "BLOCKED" },
          ...(roomType ? { type: roomType as RoomType } : {}),
          ...(city     ? { branch: { city: { contains: city, mode: "insensitive" as const } } } : {}),
        },
      },
      take:    3,
      orderBy: { sortOrder: "asc" },
      select:  {
        url: true, altText: true,
        room: { select: { name: true, type: true, pricePerNight: true, branch: { select: { city: true } } } },
      },
    });
  }

  if (images.length === 0) {
    return { success: false, error: "No images found for that room/type." };
  }

  const toSend = images.map(img => ({
    url:     img.url,
    caption: `${img.room.name} — PKR ${Number(img.room.pricePerNight).toLocaleString("en-PK")}/night (${img.room.branch.city})`,
  }));

  const { sent } = await sendWhatsAppImages(toPhone, toSend, 3);

  return {
    success:    sent > 0,
    sent,
    total:      images.length,
    roomNames:  [...new Set(images.map(i => i.room.name))],
  };
}

async function validateCouponTool(input: Record<string, unknown>) {
  const code        = (input.code        as string)?.trim().toUpperCase();
  const phone       = (input.guest_phone as string)?.trim();
  const nights      = Number(input.nights      ?? 0);
  const baseAmount  = Number(input.base_amount ?? 0);

  if (!code)  return { valid: false, error: "Coupon code missing." };
  if (!phone) return { valid: false, error: "Guest phone required to validate." };

  const offer = await prisma.offer.findFirst({
    where: {
      code,
      isActive:  true,
      startsAt:  { lte: new Date() },
      expiresAt: { gte: new Date() },
    },
  });

  if (!offer) return { valid: false, error: "Yeh code valid nahi hai ya expire ho gaya." };

  if (offer.minNights && nights < offer.minNights) {
    return {
      valid: false,
      error: `Yeh code ${offer.minNights} ya zyada raatein chahta hai. Aap ki booking sirf ${nights} raat ki hai.`,
    };
  }

  if (offer.maxUses && offer.usedCount >= offer.maxUses) {
    return { valid: false, error: "Yeh promo code ka limit poora ho gaya." };
  }

  // First-time-only check: guest must have NO prior completed/active bookings
  if (offer.firstTimeOnly) {
    const last10 = normalizePhone(phone);
    const customers = await prisma.customer.findMany({
      where: { phone: { contains: last10 } },
      take: 5,
    });
    const customer = customers.find(c => normalizePhone(c.phone) === last10);

    if (customer) {
      const priorBooking = await prisma.booking.findFirst({
        where: {
          customerId: customer.id,
          status: { in: ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] },
        },
        select: { id: true },
      });

      if (priorBooking) {
        return {
          valid: false,
          error: "WELCOME15 sirf pehli baar aane walay mehmanon ke liye hai. Aap already hamari family mein hain! Koi aur code check karein ya humse poochein.",
        };
      }
    }
  }

  const discountAmount =
    offer.discountType === "PERCENTAGE"
      ? Math.round((baseAmount * Number(offer.discountValue)) / 100)
      : Math.min(Number(offer.discountValue), baseAmount);

  const discountLabel =
    offer.discountType === "PERCENTAGE"
      ? `${Number(offer.discountValue)}% off`
      : `PKR ${Number(offer.discountValue).toLocaleString()} off`;

  return {
    valid:          true,
    code,
    offerName:      offer.name,
    discountLabel,
    discountAmount,
    finalAmount:    Math.max(0, baseAmount - discountAmount),
    firstTimeOnly:  offer.firstTimeOnly,
  };
}

async function createBookingTool(input: Record<string, unknown>) {
  const result = await createPublicBooking({
    roomId:     input.room_id      as string,
    branchId:   input.branch_id    as string,
    checkIn:    input.check_in     as string,
    checkOut:   input.check_out    as string,
    adults:     input.adults       as number,
    children:  (input.children     as number) ?? 0,
    name:       input.guest_name   as string,
    phone:      input.guest_phone  as string,
    promoCode: (input.coupon_code  as string) || undefined,
    notes:     (input.special_requests as string) || undefined,
  });

  if (!result.success) return { success: false, error: result.error };

  const ref            = (result as { ref: string }).ref;
  const discountAmount = (result as { discountAmount: number }).discountAmount ?? 0;
  return {
    success:         true,
    bookingRef:      ref,
    discountApplied: discountAmount > 0,
    discountAmount,
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

  if (normalizePhone(phone) !== normalizePhone(booking.customer.phone)) {
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

// ── Booking modification helpers ──────────────────────────────

const verifyPhone = (input: string, stored: string) =>
  normalizePhone(input) === normalizePhone(stored);

async function modifyBookingDatesTool(input: Record<string, unknown>) {
  const ref       = input.booking_ref  as string;
  const phone     = input.guest_phone  as string;
  const newCheckIn  = input.new_check_in  as string;
  const newCheckOut = input.new_check_out as string;

  const booking = await prisma.booking.findUnique({
    where: { bookingRef: ref },
    include: { customer: { select: { phone: true } }, room: { select: { id: true, pricePerNight: true, name: true } } },
  });
  if (!booking) return { success: false, error: "Booking not found." };
  if (!verifyPhone(phone, booking.customer.phone))
    return { success: false, error: "Phone number does not match booking records." };
  if ([BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT, BookingStatus.CANCELLED].includes(booking.status as BookingStatus))
    return { success: false, error: `Cannot modify a booking in ${booking.status} status.` };

  const ci = new Date(newCheckIn);
  const co = new Date(newCheckOut);
  if (co <= ci) return { success: false, error: "Check-out must be after check-in." };
  const today = new Date(); today.setHours(0,0,0,0);
  if (ci < today) return { success: false, error: "Check-in cannot be in the past." };

  // Check the SAME room is free for the new dates (excluding this booking itself)
  const conflict = await prisma.booking.findFirst({
    where: {
      roomId: booking.roomId,
      id:     { not: booking.id },
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
      checkInDate:  { lt: co },
      checkOutDate: { gt: ci },
    },
    select: { bookingRef: true },
  });
  if (conflict) return { success: false, error: `Room ${booking.room.name} is already booked for those dates.` };

  const nights = Math.max(1, Math.round((co.getTime() - ci.getTime()) / 86_400_000));
  const baseAmount = Number(booking.room.pricePerNight) * nights;
  // Preserve any existing discount ratio
  const discountRatio = Number(booking.discountAmount) / Math.max(1, Number(booking.baseAmount));
  const newDiscount   = Math.round(baseAmount * discountRatio);
  const newTotal      = Math.max(0, baseAmount - newDiscount + Number(booking.taxAmount) + Number(booking.extraCharges));

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      checkInDate:    ci,
      checkOutDate:   co,
      nights,
      baseAmount,
      discountAmount: newDiscount,
      totalAmount:    newTotal,
    },
  });

  return {
    success:    true,
    bookingRef: ref,
    newCheckIn,
    newCheckOut,
    newNights:  nights,
    newTotal,
  };
}

async function checkoutGuestTool(input: Record<string, unknown>) {
  const ref   = input.booking_ref as string;
  const phone = input.guest_phone as string;

  const booking = await prisma.booking.findUnique({
    where:   { bookingRef: ref },
    include: { customer: { select: { phone: true, name: true } }, room: { select: { name: true } } },
  });
  if (!booking) return { success: false, error: "Booking not found." };
  if (!verifyPhone(phone, booking.customer.phone))
    return { success: false, error: "Phone number does not match booking records." };
  if (booking.status === BookingStatus.CHECKED_OUT)
    return { success: false, error: "Booking is already checked out." };
  if (booking.status === BookingStatus.CANCELLED)
    return { success: false, error: "Cannot check out a cancelled booking." };

  await prisma.booking.update({
    where: { id: booking.id },
    data:  { status: BookingStatus.CHECKED_OUT },
  });

  return {
    success:    true,
    bookingRef: ref,
    guestName:  booking.customer.name,
    roomName:   booking.room.name,
    message:    "Checkout complete. Room marked as available.",
  };
}

async function extendStayTool(input: Record<string, unknown>) {
  const ref          = input.booking_ref  as string;
  const phone        = input.guest_phone  as string;
  const extraNights  = Number(input.extra_nights ?? 0);
  if (extraNights < 1) return { success: false, error: "extra_nights must be 1 or more." };

  const booking = await prisma.booking.findUnique({
    where: { bookingRef: ref },
    include: { customer: { select: { phone: true } }, room: { select: { id: true, pricePerNight: true, name: true } } },
  });
  if (!booking) return { success: false, error: "Booking not found." };
  if (!verifyPhone(phone, booking.customer.phone))
    return { success: false, error: "Phone number does not match booking records." };
  if ([BookingStatus.CHECKED_OUT, BookingStatus.CANCELLED].includes(booking.status as BookingStatus))
    return { success: false, error: `Cannot extend a booking in ${booking.status} status.` };

  const newCheckOut = new Date(booking.checkOutDate.getTime() + extraNights * 86_400_000);

  // Ensure room is free for the extra nights
  const conflict = await prisma.booking.findFirst({
    where: {
      roomId: booking.roomId,
      id:     { not: booking.id },
      status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
      checkInDate:  { lt: newCheckOut },
      checkOutDate: { gt: booking.checkOutDate },
    },
    select: { bookingRef: true },
  });
  if (conflict) return {
    success: false,
    error: `Room ${booking.room.name} is already booked for one of those extra nights. Try a different number of nights or a different room.`,
  };

  const newNights = booking.nights + extraNights;
  const baseAmount = Number(booking.room.pricePerNight) * newNights;
  const discountRatio = Number(booking.discountAmount) / Math.max(1, Number(booking.baseAmount));
  const newDiscount   = Math.round(baseAmount * discountRatio);
  const newTotal      = Math.max(0, baseAmount - newDiscount + Number(booking.taxAmount) + Number(booking.extraCharges));

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      checkOutDate:   newCheckOut,
      nights:         newNights,
      baseAmount,
      discountAmount: newDiscount,
      totalAmount:    newTotal,
    },
  });

  return {
    success:        true,
    bookingRef:     ref,
    extraNights,
    newCheckOut:    newCheckOut.toISOString().split("T")[0],
    newNights,
    newTotal,
  };
}

// ── Customer memory ───────────────────────────────────────────

async function updateCustomerMemoryTool(input: Record<string, unknown>) {
  const phone = (input.guest_phone as string)?.trim();
  if (!phone) return { success: false, error: "guest_phone is required" };

  const last10 = normalizePhone(phone);
  const customers = await prisma.customer.findMany({
    where: { phone: { contains: last10 } },
    take: 5,
  });
  const customer = customers.find(c => normalizePhone(c.phone) === last10);
  if (!customer) {
    // Guest not yet in DB — will be created when they book. Nothing to persist yet.
    return { success: false, reason: "customer_not_found" };
  }

  const existing = parseBotMemory(customer.notes);

  const patch: Partial<BotMemory> = {
    preferences:       (input.preferences       as string[] | undefined) ?? [],
    avoidances:        (input.avoidances         as string[] | undefined) ?? [],
    occasions:         (input.occasions          as string[] | undefined) ?? [],
    preferredLanguage: (input.preferred_language as PreferredLanguage | undefined) ?? null,
  };

  const merged = mergeMemory(existing, patch);

  const updateData: Record<string, unknown> = {
    notes: serializeBotMemory(merged),
  };

  // Also update the structured preferredRoomType field if provided
  const rtype = input.preferred_room_type as string | undefined;
  const validTypes: string[] = Object.values(RoomType);
  if (rtype && validTypes.includes(rtype)) {
    updateData.preferredRoomType = rtype as RoomType;
  }

  await prisma.customer.update({
    where: { id: customer.id },
    data:  updateData,
  });

  return {
    success:     true,
    customerId:  customer.id,
    savedMemory: merged,
  };
}
