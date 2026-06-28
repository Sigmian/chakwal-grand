// ============================================================
// Zara Group Mode — Staff WhatsApp group support
//
// Triggered ONLY when someone mentions "@Zara" or "zara," in a group.
// Manager mode is completely blocked here.
// Staff can:
//   - Check room status & today's bookings
//   - Log a guest complaint on behalf of front desk
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/db/prisma";
import { BookingStatus, RoomStatus } from "@/types";
import { startOfDay, endOfDay, format } from "date-fns";
import type { MessageParam } from "./core";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// PKT = UTC+5
function pktNow(): Date {
  return new Date(Date.now() + 5 * 60 * 60 * 1000);
}

// ── Group system prompt ────────────────────────────────────────

function getGroupSystemPrompt(): string {
  const now = pktNow();
  const pkTime = new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(new Date());

  return `You are Zara — the AI assistant of Chakwal Guest House, active in the staff WhatsApp group.

Current Time (PKT): ${pkTime}

════════════════════════════════════════════════
YOUR ROLE HERE

You are a quick-lookup tool for staff. Keep replies SHORT and ACTIONABLE.
Staff are busy — give them the info, nothing extra.

You help with:
1. Room status — which rooms are occupied, available, under maintenance
2. Today's check-ins and check-outs
3. Logging a guest complaint directly from the group

You do NOT help with: booking rooms, pricing, guest queries, revenue data.
If someone asks something outside your scope here, say: "Yeh main yahan nahi kar sakti — admin dashboard use karein."

════════════════════════════════════════════════
LANGUAGE

Roman Urdu + English mix. Bullet points. Short.
Example: "Room 101 — Occupied (checkout aaj 12pm). Room 102 — Available."

IMPORTANT: Never reveal guest personal data (full name, CNIC, phone) in the group.
Use initials or "Guest" only.

════════════════════════════════════════════════
TOOLS

get_room_status       → "rooms ka haal", "kaun se rooms available", "occupancy"
get_todays_schedule   → "aaj kaun aa raha hai", "aaj kaun ja raha hai", "check-in list"
log_complaint         → "complaint darj karo", "guest ko masla hai", "log complaint"`;
}

// ── Group tools ────────────────────────────────────────────────

const GROUP_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_room_status",
    description: "Get current status of all rooms. Call when staff asks about room availability, occupancy, or which rooms are vacant/occupied/maintenance.",
    input_schema: {
      type: "object" as const,
      properties: {
        branch_id: {
          type: "string",
          description: "Filter by branch ID. Omit for all branches.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_todays_schedule",
    description: "Get today's check-ins and check-outs. Call when staff asks who is arriving or leaving today.",
    input_schema: {
      type: "object" as const,
      properties: {
        branch_id: {
          type: "string",
          description: "Filter by branch. Omit for all.",
        },
      },
      required: [],
    },
  },
  {
    name: "log_complaint",
    description: "Log a guest complaint. Call when staff reports a guest issue in the group. Ask for room number and brief description if not provided.",
    input_schema: {
      type: "object" as const,
      properties: {
        room_number: {
          type: "string",
          description: "The room number the guest is in e.g. '101'.",
        },
        description: {
          type: "string",
          description: "Brief description of the complaint.",
        },
        severity: {
          type: "string",
          description: "Severity: LOW, MEDIUM, or HIGH. Default MEDIUM if unclear.",
        },
        staff_phone: {
          type: "string",
          description: "WhatsApp number of the staff member who reported it.",
        },
      },
      required: ["description"],
    },
  },
];

// ── Tool implementations ───────────────────────────────────────

async function executeGroupTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "get_room_status":    return groupGetRoomStatus(input);
    case "get_todays_schedule":return groupGetTodaysSchedule(input);
    case "log_complaint":      return groupLogComplaint(input);
    default: return { error: `Unknown tool: ${name}` };
  }
}

async function groupGetRoomStatus(input: Record<string, unknown>) {
  const branchFilter = input.branch_id ? { branchId: input.branch_id as string } : {};

  const rooms = await prisma.room.findMany({
    where: { isActive: true, ...branchFilter },
    orderBy: [{ branch: { name: "asc" } }, { name: "asc" }],
    select: {
      name: true, type: true, status: true,
      branch: { select: { name: true } },
    },
  });

  const byBranch: Record<string, typeof rooms> = {};
  for (const r of rooms) {
    if (!byBranch[r.branch.name]) byBranch[r.branch.name] = [];
    byBranch[r.branch.name].push(r);
  }

  const result: Record<string, unknown[]> = {};
  for (const [branch, bRooms] of Object.entries(byBranch)) {
    result[branch] = bRooms.map(r => ({
      room:   r.name,
      status: r.status,
      type:   r.type,
    }));
  }

  const occupied    = rooms.filter(r => r.status === RoomStatus.OCCUPIED).length;
  const available   = rooms.filter(r => r.status === RoomStatus.AVAILABLE).length;
  const maintenance = rooms.filter(r => r.status === RoomStatus.MAINTENANCE).length;

  return {
    summary: { occupied, available, maintenance, total: rooms.length },
    by_branch: result,
  };
}

async function groupGetTodaysSchedule(input: Record<string, unknown>) {
  const now      = pktNow();
  const dayStart = startOfDay(now);
  const dayEnd   = endOfDay(now);
  const branchFilter = input.branch_id ? { branchId: input.branch_id as string } : {};

  const [checkIns, checkOuts] = await Promise.all([
    prisma.booking.findMany({
      where: { ...branchFilter, status: BookingStatus.CONFIRMED, checkInDate: { gte: dayStart, lte: dayEnd } },
      select: {
        bookingRef: true, checkInDate: true, estimatedArrival: true,
        customer: { select: { name: true } },
        room: { select: { name: true, branch: { select: { name: true } } } },
      },
    }),
    prisma.booking.findMany({
      where: { ...branchFilter, status: BookingStatus.CHECKED_IN, checkOutDate: { gte: dayStart, lte: dayEnd } },
      select: {
        bookingRef: true, checkOutDate: true,
        customer: { select: { name: true } },
        room: { select: { name: true, branch: { select: { name: true } } } },
      },
    }),
  ]);

  // Mask guest names for group privacy — use initials only
  const initials = (name: string) =>
    name.split(" ").map(n => n[0]?.toUpperCase() + ".").join(" ");

  return {
    check_ins: checkIns.map(b => ({
      ref:     b.bookingRef,
      guest:   initials(b.customer.name),
      room:    `${b.room.name} (${b.room.branch.name})`,
      arrival: b.estimatedArrival ?? format(b.checkInDate, "d MMM"),
    })),
    check_outs: checkOuts.map(b => ({
      ref:   b.bookingRef,
      guest: initials(b.customer.name),
      room:  `${b.room.name} (${b.room.branch.name})`,
      by:    "12:00 PM",
    })),
  };
}

async function groupLogComplaint(input: Record<string, unknown>) {
  const description = input.description as string;
  const severity    = (input.severity as string | undefined)?.toUpperCase() ?? "MEDIUM";
  const roomNum     = input.room_number as string | undefined;
  const staffPhone  = input.staff_phone as string | undefined;

  // Try to find the guest from the room booking
  let guestPhone = "group-staff-report";
  let guestName: string | undefined;

  if (roomNum) {
    const activeBooking = await prisma.booking.findFirst({
      where: {
        room: { name: { contains: roomNum } },
        status: BookingStatus.CHECKED_IN,
      },
      select: { customer: { select: { phone: true, name: true } } },
    });
    if (activeBooking) {
      guestPhone = activeBooking.customer.phone;
      guestName  = activeBooking.customer.name;
    }
  }

  const complaint = await prisma.complaint.create({
    data: {
      guestPhone,
      guestName:   guestName ?? (roomNum ? `Room ${roomNum} Guest` : "Unknown"),
      text:        `[Staff Report${staffPhone ? ` via ${staffPhone}` : ""}] ${description}`,
      severity:    ["LOW", "MEDIUM", "HIGH"].includes(severity) ? severity : "MEDIUM",
      source:      "whatsapp_group",
      status:      "OPEN",
    },
    select: { id: true, severity: true },
  });

  return {
    logged: true,
    complaint_id: complaint.id,
    severity:     complaint.severity,
    note:         "Owner ko notification mil gayi. Complaint dashboard mein bhi record ho gayi.",
  };
}

// ── Group agentic loop ─────────────────────────────────────────

export async function runGroupAgent(
  userText:    string,
  senderPhone: string,
): Promise<string> {
  const systemPrompt = getGroupSystemPrompt();

  // Single-turn only in groups — no conversation history (public channel)
  const messages: MessageParam[] = [
    { role: "user", content: `[Staff member ${senderPhone}]: ${userText}` },
  ];

  let response = await anthropic.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 512, // shorter replies for group context
    system:     systemPrompt,
    tools:      GROUP_TOOLS,
    messages,
  });

  while (response.stop_reason === "tool_use") {
    const assistantMsg: MessageParam = { role: "assistant", content: response.content };
    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      let result: unknown;
      try {
        result = await executeGroupTool(block.name, block.input as Record<string, unknown>);
      } catch (err) {
        result = { error: String(err) };
      }
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result) });
    }

    messages.push(assistantMsg);
    messages.push({ role: "user", content: toolResults });

    response = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system:     systemPrompt,
      tools:      GROUP_TOOLS,
      messages,
    });
  }

  const reply = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map(b => b.text)
    .join("\n")
    .trim();

  return reply || "Ji, mujhe samajh nahi aaya. `@Zara rooms` ya `@Zara aaj ka schedule` try karein.";
}
