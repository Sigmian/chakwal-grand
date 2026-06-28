// ============================================================
// Zara Manager Mode — Tool definitions + implementations
//
// Only active after the owner authenticates with /manager <PIN>.
// Gives the owner a WhatsApp-native operations dashboard:
//   - Daily report (revenue, occupancy, check-ins/outs)
//   - Open complaints
//   - Pending bookings needing action
//   - Room status snapshot
//   - Inventory alerts
//   - Staff on-duty list
//   - Broadcast message to all staff via push
// ============================================================

import type Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/db/prisma";
import { BookingStatus, RoomStatus } from "@/types";
import { startOfDay, endOfDay, format, subDays } from "date-fns";
import { sendPushToAllStaff } from "@/lib/push/send";

// Pakistan Standard Time = UTC+5. No dst, so offset is constant.
// We shift UTC Date by +5h so date-fns startOfDay/endOfDay treat it as PKT.
function pktNow(): Date {
  return new Date(Date.now() + 5 * 60 * 60 * 1000);
}

// ── Tool definitions (schema only) ────────────────────────────

export const MANAGER_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_daily_report",
    description:
      "Get today's operations summary: revenue collected, bookings, " +
      "check-ins, check-outs, and occupancy rate. " +
      "Call this when owner asks 'aaj ki report', 'daily summary', 'kitna kamai hua', 'kaisa chal raha hai', or similar.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: {
          type: "string",
          description: "Date to report on (YYYY-MM-DD). Defaults to today (Pakistan time) if omitted.",
        },
        branch_id: {
          type: "string",
          description: "Filter by branch ID (branch-chakwal or branch-madina). Omit for both branches combined.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_open_complaints",
    description:
      "List all unresolved guest complaints (OPEN + IN_PROGRESS). " +
      "Call when owner asks 'complaints', 'koi shikayat', 'kya maslay hain', 'pending issues'.",
    input_schema: {
      type: "object" as const,
      properties: {
        severity: {
          type: "string",
          description: "Filter by severity: LOW, MEDIUM, HIGH. Omit for all.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_pending_bookings",
    description:
      "List bookings that need action: PENDING (not yet confirmed) or " +
      "guests checking in/out today. " +
      "Call when owner asks 'pending bookings', 'aaj check-in', 'confirm karne hain', 'kaun aa raha hai aaj'.",
    input_schema: {
      type: "object" as const,
      properties: {
        branch_id: {
          type: "string",
          description: "Filter by branch. Omit for all branches.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_room_status",
    description:
      "Get current status of all rooms: occupied, vacant, under maintenance. " +
      "Call when owner asks 'room status', 'kaun se rooms available hain', 'occupancy', 'rooms ka haal'.",
    input_schema: {
      type: "object" as const,
      properties: {
        branch_id: {
          type: "string",
          description: "Filter by branch. Omit for all branches.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_inventory_alerts",
    description:
      "Get products/items that are low on stock (below reorder level). " +
      "Call when owner asks 'inventory', 'stock', 'kya khatam ho raha hai', 'low stock'.",
    input_schema: {
      type: "object" as const,
      properties: {
        branch_id: {
          type: "string",
          description: "Filter by branch. Omit for all branches.",
        },
      },
      required: [],
    },
  },
  {
    name: "get_staff_on_duty",
    description:
      "List active staff members per branch with their role and shift. " +
      "Call when owner asks 'kaun on duty hai', 'staff list', 'aaj kaun aa raha hai'.",
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
    name: "broadcast_to_staff",
    description:
      "Send a push notification to all staff members. Use for urgent announcements, " +
      "shift changes, or operational alerts. " +
      "Call when owner says 'staff ko batao', 'sab ko message karo', 'announce karo'.",
    input_schema: {
      type: "object" as const,
      properties: {
        message: {
          type: "string",
          description: "The message to broadcast to all staff (keep under 100 chars).",
        },
      },
      required: ["message"],
    },
  },
  {
    name: "resolve_complaint",
    description:
      "Mark a complaint as resolved. Call when owner says 'complaint resolve kar do', " +
      "'yeh masla hal ho gaya', 'close kar do'.",
    input_schema: {
      type: "object" as const,
      properties: {
        complaint_id: {
          type: "string",
          description: "The complaint ID (from get_open_complaints).",
        },
        resolution_note: {
          type: "string",
          description: "Brief note on how it was resolved.",
        },
      },
      required: ["complaint_id"],
    },
  },
  {
    name: "confirm_booking",
    description:
      "Confirm a pending booking. Call when owner says 'booking confirm karo', " +
      "'approve karo' with a booking reference.",
    input_schema: {
      type: "object" as const,
      properties: {
        booking_ref: {
          type: "string",
          description: "Booking reference e.g. BK-2026-XXXX or CGH-2026-XXXX.",
        },
      },
      required: ["booking_ref"],
    },
  },
  {
    name: "get_revenue_summary",
    description:
      "Get revenue comparison: today vs yesterday, this month vs last month. " +
      "Call when owner asks 'revenue', 'total income', 'is mahine kitna', 'earnings'.",
    input_schema: {
      type: "object" as const,
      properties: {
        branch_id: {
          type: "string",
          description: "Filter by branch. Omit for combined.",
        },
      },
      required: [],
    },
  },
];

// ── Tool implementations ───────────────────────────────────────

export async function executeManagerTool(
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case "get_daily_report":    return getDailyReport(input);
    case "get_open_complaints": return getOpenComplaints(input);
    case "get_pending_bookings":return getPendingBookings(input);
    case "get_room_status":     return getRoomStatus(input);
    case "get_inventory_alerts":return getInventoryAlerts(input);
    case "get_staff_on_duty":   return getStaffOnDuty(input);
    case "broadcast_to_staff":  return broadcastToStaff(input);
    case "resolve_complaint":   return resolveComplaint(input);
    case "confirm_booking":     return confirmBooking(input);
    case "get_revenue_summary": return getRevenueSummary(input);
    default: return { error: `Unknown manager tool: ${name}` };
  }
}

// ── Implementations ────────────────────────────────────────────

async function getDailyReport(input: Record<string, unknown>) {
  const now    = pktNow();
  const target = input.date ? new Date(input.date as string) : now;
  const dayStart = startOfDay(target);
  const dayEnd   = endOfDay(target);
  const branchFilter = input.branch_id ? { branchId: input.branch_id as string } : {};

  const [bookings, revenue, checkIns, checkOuts, rooms, complaints] = await Promise.all([
    prisma.booking.count({
      where: {
        ...branchFilter,
        createdAt: { gte: dayStart, lte: dayEnd },
        status: { notIn: [BookingStatus.CANCELLED] },
      },
    }),
    prisma.booking.aggregate({
      where: {
        ...branchFilter,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
        checkInDate: { gte: dayStart, lte: dayEnd },
      },
      _sum: { paidAmount: true, totalAmount: true },
    }),
    prisma.booking.count({
      where: { ...branchFilter, checkInDate: { gte: dayStart, lte: dayEnd }, status: BookingStatus.CONFIRMED },
    }),
    prisma.booking.count({
      where: { ...branchFilter, checkOutDate: { gte: dayStart, lte: dayEnd }, status: BookingStatus.CHECKED_IN },
    }),
    prisma.room.groupBy({
      by: ["status"],
      where: { isActive: true, ...branchFilter },
      _count: { id: true },
    }),
    prisma.complaint.count({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
  ]);

  const totalRooms   = rooms.reduce((s, r) => s + r._count.id, 0);
  const occupiedRooms = rooms.find(r => r.status === RoomStatus.OCCUPIED)?._count.id ?? 0;
  const occupancy    = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
  const collected    = Number(revenue._sum.paidAmount ?? 0);
  const pending      = Number(revenue._sum.totalAmount ?? 0) - collected;

  return {
    date:           format(target, "EEEE, d MMMM yyyy"),
    bookings_today: bookings,
    check_ins_due:  checkIns,
    check_outs_due: checkOuts,
    revenue_collected: `PKR ${collected.toLocaleString()}`,
    revenue_pending:   `PKR ${pending.toLocaleString()}`,
    occupancy_pct:  `${occupancy}% (${occupiedRooms}/${totalRooms} rooms)`,
    open_complaints: complaints,
  };
}

async function getOpenComplaints(input: Record<string, unknown>) {
  const where: Record<string, unknown> = { status: { in: ["OPEN", "IN_PROGRESS"] } };
  if (input.severity) where.severity = input.severity;

  const complaints = await prisma.complaint.findMany({
    where,
    orderBy: [
      { severity: "desc" },
      { createdAt: "asc" },
    ],
    take: 15,
    select: {
      id: true,
      guestName: true,
      guestPhone: true,
      text: true,
      severity: true,
      status: true,
      createdAt: true,
    },
  });

  if (complaints.length === 0) return { complaints: [], message: "Alhamdulillah — no open complaints!" };

  return {
    total: complaints.length,
    complaints: complaints.map(c => ({
      id:       c.id,
      guest:    c.guestName ?? "Unknown",
      phone:    c.guestPhone,
      issue:    c.text,
      severity: c.severity,
      status:   c.status,
      age:      `${Math.round((Date.now() - c.createdAt.getTime()) / 3_600_000)}h ago`,
    })),
  };
}

async function getPendingBookings(input: Record<string, unknown>) {
  const now      = pktNow();
  const dayStart = startOfDay(now);
  const dayEnd   = endOfDay(now);
  const branchFilter = input.branch_id ? { branchId: input.branch_id as string } : {};

  const [pending, checkInsToday, checkOutsToday] = await Promise.all([
    prisma.booking.findMany({
      where: { ...branchFilter, status: BookingStatus.PENDING },
      orderBy: { createdAt: "asc" },
      take: 10,
      select: {
        bookingRef: true, checkInDate: true, checkOutDate: true, totalAmount: true,
        customer: { select: { name: true } },
        room: { select: { name: true, branch: { select: { name: true } } } },
      },
    }),
    prisma.booking.findMany({
      where: { ...branchFilter, status: BookingStatus.CONFIRMED, checkInDate: { gte: dayStart, lte: dayEnd } },
      take: 10,
      select: {
        bookingRef: true, checkInDate: true,
        customer: { select: { name: true } },
        room: { select: { name: true, branch: { select: { name: true } } } },
      },
    }),
    prisma.booking.findMany({
      where: { ...branchFilter, status: BookingStatus.CHECKED_IN, checkOutDate: { gte: dayStart, lte: dayEnd } },
      take: 10,
      select: {
        bookingRef: true, checkOutDate: true,
        customer: { select: { name: true } },
        room: { select: { name: true, branch: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    pending_confirmation: pending.map(b => ({
      ref:    b.bookingRef,
      guest:  b.customer.name,
      room:   `${b.room.name} (${b.room.branch.name})`,
      dates:  `${format(b.checkInDate, "d MMM")} – ${format(b.checkOutDate, "d MMM")}`,
      amount: `PKR ${Number(b.totalAmount).toLocaleString()}`,
    })),
    checking_in_today: checkInsToday.map(b => ({
      ref:   b.bookingRef,
      guest: b.customer.name,
      room:  `${b.room.name} (${b.room.branch.name})`,
    })),
    checking_out_today: checkOutsToday.map(b => ({
      ref:   b.bookingRef,
      guest: b.customer.name,
      room:  `${b.room.name} (${b.room.branch.name})`,
    })),
  };
}

async function getRoomStatus(input: Record<string, unknown>) {
  const branchFilter = input.branch_id ? { branchId: input.branch_id as string } : {};

  const rooms = await prisma.room.findMany({
    where: { isActive: true, ...branchFilter },
    orderBy: [{ branch: { name: "asc" } }, { name: "asc" }],
    select: {
      name: true, type: true, status: true,
      pricePerNight: true,
      branch: { select: { name: true } },
    },
  });

  const grouped: Record<string, typeof rooms> = {};
  for (const r of rooms) {
    const key = r.branch.name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  const result: Record<string, unknown[]> = {};
  for (const [branch, bRooms] of Object.entries(grouped)) {
    result[branch] = bRooms.map(r => ({
      room:   r.name,
      type:   r.type,
      status: r.status,
      price:  `PKR ${Number(r.pricePerNight).toLocaleString()}/night`,
    }));
  }

  const counts = {
    occupied:    rooms.filter(r => r.status === RoomStatus.OCCUPIED).length,
    vacant:      rooms.filter(r => r.status === RoomStatus.AVAILABLE).length,
    maintenance: rooms.filter(r => r.status === RoomStatus.MAINTENANCE).length,
    total:       rooms.length,
  };

  return { summary: counts, by_branch: result };
}

async function getInventoryAlerts(input: Record<string, unknown>) {
  const branchFilter = input.branch_id ? { branchId: input.branch_id as string } : {};

  // currentStock and minStockLevel are the actual schema field names
  const allItems = await prisma.inventoryItem.findMany({
    where: branchFilter,
    orderBy: { currentStock: "asc" },
    take: 100,
    select: {
      currentStock: true,
      minStockLevel: true,
      product: { select: { name: true } },
      branch:  { select: { name: true } },
    },
  });

  const low = allItems.filter(i => i.currentStock <= i.minStockLevel);
  if (low.length === 0) return { alerts: [], message: "All stock levels are healthy!" };

  return {
    total_alerts: low.length,
    alerts: low.map(i => ({
      item:    i.product.name,
      branch:  i.branch.name,
      qty:     `${i.currentStock} units`,
      minimum: `${i.minStockLevel} units`,
    })),
  };
}

async function getStaffOnDuty(input: Record<string, unknown>) {
  const branchFilter = input.branch_id
    ? { branchId: input.branch_id as string }
    : {};

  // isActive is on User, not StaffMember; phone/shiftStart/shiftEnd on StaffMember; role/name on User
  const staff = await prisma.staffMember.findMany({
    where: { user: { isActive: true }, ...branchFilter },
    orderBy: [{ branch: { name: "asc" } }],
    select: {
      phone: true, shiftStart: true, shiftEnd: true,
      user:   { select: { name: true, role: true } },
      branch: { select: { name: true } },
    },
  });

  if (staff.length === 0) return { message: "No active staff found." };

  const grouped: Record<string, typeof staff> = {};
  for (const s of staff) {
    const key = s.branch.name;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  }

  const result: Record<string, unknown[]> = {};
  for (const [branch, members] of Object.entries(grouped)) {
    result[branch] = members.map(s => ({
      name:  s.user.name,
      role:  s.user.role.replace(/_/g, " "),
      phone: s.phone ?? "—",
      shift: s.shiftStart && s.shiftEnd ? `${s.shiftStart} – ${s.shiftEnd}` : "Not set",
    }));
  }

  return { total: staff.length, by_branch: result };
}

async function broadcastToStaff(input: Record<string, unknown>) {
  const message = (input.message as string).slice(0, 200);
  try {
    await sendPushToAllStaff({ title: "📢 Owner Message", body: message });
    return { sent: true, message };
  } catch (err) {
    return { sent: false, error: String(err) };
  }
}

async function resolveComplaint(input: Record<string, unknown>) {
  const id   = input.complaint_id as string;
  const note = (input.resolution_note as string | undefined) ?? "Resolved by owner";

  try {
    await prisma.complaint.update({
      where: { id },
      data: {
        status:     "RESOLVED",
        resolvedAt: new Date(),
        resolvedBy: `Owner (via WhatsApp): ${note}`,
      },
    });
    return { success: true, complaint_id: id, resolution: note };
  } catch {
    return { success: false, error: "Complaint not found or already resolved." };
  }
}

async function confirmBooking(input: Record<string, unknown>) {
  const ref = (input.booking_ref as string).toUpperCase();

  try {
    const booking = await prisma.booking.findFirst({
      where: { bookingRef: ref },
      select: { id: true, status: true, customer: { select: { name: true } } },
    });

    if (!booking) return { success: false, error: `Booking ${ref} not found.` };
    if (booking.status !== BookingStatus.PENDING)
      return { success: false, error: `Booking is already ${booking.status} — no action needed.` };

    await prisma.booking.update({
      where: { id: booking.id },
      data:  { status: BookingStatus.CONFIRMED },
    });

    return { success: true, ref, guest: booking.customer.name, new_status: "CONFIRMED" };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function getRevenueSummary(input: Record<string, unknown>) {
  const now        = pktNow();
  const todayStart = startOfDay(now);
  const todayEnd   = endOfDay(now);
  const ystStart   = startOfDay(subDays(now, 1));
  const ystEnd     = endOfDay(subDays(now, 1));

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const lastMStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const branchFilter = input.branch_id ? { branchId: input.branch_id as string } : {};
  const paidFilter   = { status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] } };

  const [today, yesterday, thisMonth, lastMonth] = await Promise.all([
    prisma.booking.aggregate({ where: { ...branchFilter, ...paidFilter, checkInDate: { gte: todayStart, lte: todayEnd } }, _sum: { paidAmount: true } }),
    prisma.booking.aggregate({ where: { ...branchFilter, ...paidFilter, checkInDate: { gte: ystStart,   lte: ystEnd   } }, _sum: { paidAmount: true } }),
    prisma.booking.aggregate({ where: { ...branchFilter, ...paidFilter, checkInDate: { gte: monthStart, lte: monthEnd } }, _sum: { paidAmount: true } }),
    prisma.booking.aggregate({ where: { ...branchFilter, ...paidFilter, checkInDate: { gte: lastMStart, lte: lastMEnd } }, _sum: { paidAmount: true } }),
  ]);

  const fmt = (n: unknown) => `PKR ${Number(n ?? 0).toLocaleString()}`;
  const diff = (a: unknown, b: unknown) => {
    const delta = Number(a ?? 0) - Number(b ?? 0);
    return delta >= 0 ? `+${fmt(delta)}` : `-${fmt(Math.abs(delta))}`;
  };

  return {
    today:          fmt(today._sum.paidAmount),
    yesterday:      fmt(yesterday._sum.paidAmount),
    today_vs_yday:  diff(today._sum.paidAmount, yesterday._sum.paidAmount),
    this_month:     fmt(thisMonth._sum.paidAmount),
    last_month:     fmt(lastMonth._sum.paidAmount),
    month_vs_last:  diff(thisMonth._sum.paidAmount, lastMonth._sum.paidAmount),
  };
}
