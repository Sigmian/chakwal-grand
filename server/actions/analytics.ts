"use server";

import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { BookingStatus, RoomStatus } from "@/types";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { getCashRevenueForPeriod, getPKTMonthPeriod, getPKTMonthPeriods } from "@/lib/finance/reporting";

// ---- DASHBOARD OVERVIEW -----------------------------------------------
export async function getDashboardOverview(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);

  const now        = new Date();
  const todayStart = startOfDay(now);
  const todayEnd   = endOfDay(now);
  const { start: monthStart, end: monthEnd } = getPKTMonthPeriod(0, now);
  const { start: lastMonthStart, end: lastMonthEnd } = getPKTMonthPeriod(-1, now);

  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const [
    roomStats,
    todayBookings,
    monthRevenue,
    monthDiscounts,
    monthExpenses,
    pendingBookings,
    allInventory,
    checkInsToday,
    checkOutsToday,
    lastMonthRevenue,
  ] = await Promise.all([
    prisma.room.groupBy({
      by:    ["status"],
      where: { isActive: true, ...branchFilter },
      _count: { id: true },
    }),
    prisma.booking.count({
      where: {
        ...branchFilter,
        createdAt: { gte: todayStart, lte: todayEnd },
        status: { notIn: [BookingStatus.CANCELLED] },
      },
    }),
    getCashRevenueForPeriod(monthStart, monthEnd, scopedBranch),
    prisma.booking.aggregate({
      where: {
        ...branchFilter,
        status: { notIn: [BookingStatus.CANCELLED, BookingStatus.NO_SHOW] },
        checkInDate: { gte: monthStart, lte: monthEnd },
      },
      _sum: { discountAmount: true },
    }),
    prisma.expense.aggregate({
      where: {
        ...branchFilter,
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { amount: true },
    }),
    prisma.booking.count({
      where: { ...branchFilter, status: BookingStatus.PENDING },
    }),
    prisma.inventoryItem.findMany({
      where:  branchFilter,
      select: { currentStock: true, minStockLevel: true },
    }),
    prisma.booking.count({
      where: {
        ...branchFilter,
        checkInDate: { gte: todayStart, lte: todayEnd },
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
      },
    }),
    prisma.booking.count({
      where: {
        ...branchFilter,
        checkOutDate: { gte: todayStart, lte: todayEnd },
        status: { in: [BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
      },
    }),
    getCashRevenueForPeriod(lastMonthStart, lastMonthEnd, scopedBranch),
  ]);

  const lowStockCount = allInventory.filter(
    (item) => item.currentStock <= item.minStockLevel
  ).length;

  const roomStatusMap  = Object.fromEntries(roomStats.map((r) => [r.status, r._count.id]));
  const totalRooms     = Object.values(roomStatusMap).reduce((a, b) => a + b, 0);
  const availableRooms = roomStatusMap[RoomStatus.AVAILABLE] ?? 0;
  const occupiedRooms  = roomStatusMap[RoomStatus.OCCUPIED]  ?? 0;

  const revenueThisMonth     = monthRevenue.totalRevenue;
  const revenueLastMonth     = lastMonthRevenue.totalRevenue;
  const totalDiscountThisMonth = Number(monthDiscounts._sum.discountAmount ?? 0);
  const expensesThisMonth    = Number(monthExpenses._sum.amount ?? 0);
  const profitThisMonth      = revenueThisMonth - expensesThisMonth;
  const occupancyRate     = totalRooms > 0
    ? Math.round((occupiedRooms / totalRooms) * 100)
    : 0;

  // Real month-over-month revenue trend (null when no prior-month baseline).
  const revenueTrend = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : null;

  return {
    totalRooms,
    availableRooms,
    occupiedRooms,
    maintenanceRooms: roomStatusMap[RoomStatus.MAINTENANCE] ?? 0,
    cleaningRooms:    roomStatusMap[RoomStatus.CLEANING] ?? 0,
    revenueThisMonth,
    revenueLastMonth,
    revenueTrend,
    totalDiscountThisMonth,
    expensesThisMonth,
    profitThisMonth,
    bookingsToday:    todayBookings,
    checkInsToday,
    checkOutsToday,
    pendingBookings,
    lowStockAlerts:   lowStockCount,
    occupancyRate,
  };
}

// ---- REVENUE CHART DATA (last 6 months) --------------------------------
export async function getRevenueChartData(branchId?: string, months = 6) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const periods = getPKTMonthPeriods(months);

  const chartData = await Promise.all(
    periods.map(async ({ label, start, end }) => {
      const [revenue, ghExpenses, invExpenses] = await Promise.all([
        getCashRevenueForPeriod(start, end, scopedBranch),
        prisma.expense.aggregate({
          where: { ...branchFilter, paidAt: { gte: start, lte: end }, expenseType: "GUESTHOUSE" as never },
          _sum:  { amount: true },
        }),
        prisma.expense.aggregate({
          where: { ...branchFilter, paidAt: { gte: start, lte: end }, expenseType: "INVENTORY" as never },
          _sum:  { amount: true },
        }),
      ]);

      const roomRevenue    = revenue.roomRevenue;
      const productRev     = revenue.productRevenue;
      const totalRevenue   = roomRevenue + productRev;
      const ghExpTotal     = Number(ghExpenses._sum.amount ?? 0);
      const invExpTotal    = Number(invExpenses._sum.amount ?? 0);
      const totalExpenses  = ghExpTotal + invExpTotal;

      return {
        label,
        roomRevenue,
        productRevenue: productRev,
        expenses:       totalExpenses,
        ghExpenses:     ghExpTotal,
        invExpenses:    invExpTotal,
        profit:         totalRevenue - totalExpenses,
      };
    })
  );

  return chartData;
}

// ---- BRANCH PERFORMANCE COMPARISON ------------------------------------
export async function getBranchPerformance() {
  const user = await requirePermission("analytics:company");

  const { start: monthStart, end: monthEnd } = getPKTMonthPeriod();

  const branches = await prisma.branch.findMany({
    where:   { isActive: true, companyId: user.companyId },
    include: { _count: { select: { rooms: true, bookings: true } } },
  });

  const performance = await Promise.all(
    branches.map(async (branch) => {
      const [revenue, expenses, avgRating, occupancy] = await Promise.all([
        getCashRevenueForPeriod(monthStart, monthEnd, branch.id),
        prisma.expense.aggregate({
          where: { branchId: branch.id, paidAt: { gte: monthStart, lte: monthEnd } },
          _sum:  { amount: true },
        }),
        prisma.review.aggregate({
          where: { branchId: branch.id, isApproved: true },
          _avg:  { rating: true },
        }),
        prisma.room.groupBy({
          by:    ["status"],
          where: { branchId: branch.id, isActive: true },
          _count: { id: true },
        }),
      ]);

      const totalRevenue  = revenue.totalRevenue;
      const totalExpenses = Number(expenses._sum.amount ?? 0);

      const occupancyMap  = Object.fromEntries(occupancy.map((o) => [o.status, o._count.id]));
      const totalRooms    = Object.values(occupancyMap).reduce((a, b) => a + b, 0);
      const occupiedRooms = occupancyMap[RoomStatus.OCCUPIED] ?? 0;

      return {
        branchId:      branch.id,
        branchName:    branch.name,
        city:          branch.city,
        revenue:       totalRevenue,
        expenses:      totalExpenses,
        profit:        totalRevenue - totalExpenses,
        occupancyRate: totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
        bookingsCount: branch._count.bookings,
        avgRating:     Math.round((avgRating._avg.rating ?? 0) * 10) / 10,
      };
    })
  );

  return performance;
}

// ---- OCCUPANCY HEATMAP (last 30 days) ----------------------------------
export async function getOccupancyData(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const totalRooms = await prisma.room.count({
    where: { isActive: true, ...branchFilter },
  });

  const days = [];
  for (let i = 29; i >= 0; i--) {
    const date     = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = startOfDay(date);
    const dayEnd   = endOfDay(date);

    const occupiedCount = await prisma.booking.count({
      where: {
        ...branchFilter,
        status: { in: [BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT, BookingStatus.CONFIRMED] },
        checkInDate:  { lte: dayEnd },
        checkOutDate: { gte: dayStart },
      },
    });

    days.push({
      date:      format(date, "MMM dd"),
      occupied:  occupiedCount,
      available: Math.max(0, totalRooms - occupiedCount),
      total:     totalRooms,
      rate:      totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0,
    });
  }

  return days;
}

// ---- TOP PERFORMING ROOMS ---------------------------------------------
export async function getTopRooms(branchId?: string, limit = 5) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const now        = new Date();
  const monthStart = startOfMonth(now);

  const topRooms = await prisma.booking.groupBy({
    by:    ["roomId"],
    where: {
      ...branchFilter,
      status:      { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
      checkInDate: { gte: monthStart },
    },
    _sum:    { totalAmount: true },
    _count:  { id: true },
    orderBy: { _sum: { totalAmount: "desc" } },
    take:    limit,
  });

  const rooms = await Promise.all(
    topRooms.map(async (r) => {
      const room = await prisma.room.findUnique({
        where:  { id: r.roomId },
        select: { number: true, name: true, type: true },
      });
      return {
        roomId:        r.roomId,
        roomNumber:    room?.number ?? "-",
        roomName:      room?.name   ?? "-",
        roomType:      room?.type   ?? "STANDARD",
        totalRevenue:  Number(r._sum.totalAmount ?? 0),
        bookingsCount: r._count.id,
      };
    })
  );

  return rooms;
}

// ---- RECENT ACTIVITY FEED ---------------------------------------------
export async function getRecentActivity(limit = 20, branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);

  // ActivityLog has no branchId column - filter via staff relation
  const staffFilter = scopedBranch
    ? { staff: { branchId: scopedBranch } }
    : {};

  const logs = await prisma.activityLog.findMany({
    where:   scopedBranch
      ? { staffId: { not: null }, ...staffFilter }
      : { staffId: { not: null }, staff: { branch: { companyId: user.companyId } } },
    orderBy: { createdAt: "desc" },
    take:    limit,
    include: { user: { select: { name: true, role: true } } },
  });

  return logs;
}

// ---- REVENUE FORECAST (next 30 days) ----------------------------------
export async function getRevenueForecast(branchId?: string) {
  const user = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  // Anchor to the START of today so a booking checking in today (stored at
  // midnight) isn't excluded by a mid-day `now` timestamp.
  const dayStart = startOfDay(new Date());
  const thirtyDaysLater = new Date(dayStart.getTime() + 30 * 86_400_000);

  // Get all confirmed/pending bookings in next 30 days
  const bookings = await prisma.booking.findMany({
    where: {
      ...branchFilter,
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      checkInDate: { gte: dayStart, lte: thirtyDaysLater },
    },
    select: {
      checkInDate: true,
      totalAmount: true,
      paidAmount: true,
      nights: true,
    },
  });

  // Group into weekly buckets by days-from-today. Labels match the bucket
  // boundaries below (daysAhead 0–6 → Week 1, 7–13 → Week 2, …).
  const weeks = [
    { label: "Week 1", days: "Days 1–7",   revenue: 0, bookings: 0, outstanding: 0 },
    { label: "Week 2", days: "Days 8–14",  revenue: 0, bookings: 0, outstanding: 0 },
    { label: "Week 3", days: "Days 15–21", revenue: 0, bookings: 0, outstanding: 0 },
    { label: "Week 4", days: "Days 22–30", revenue: 0, bookings: 0, outstanding: 0 },
  ];

  for (const b of bookings) {
    const daysAhead = Math.floor((b.checkInDate.getTime() - dayStart.getTime()) / 86_400_000);
    const weekIdx = daysAhead < 7 ? 0 : daysAhead < 14 ? 1 : daysAhead < 21 ? 2 : 3;
    weeks[weekIdx].revenue += Number(b.totalAmount);
    weeks[weekIdx].outstanding += Number(b.totalAmount) - Number(b.paidAmount);
    weeks[weekIdx].bookings++;
  }

  const totalForecast   = weeks.reduce((s, w) => s + w.revenue, 0);
  const totalOutstanding = weeks.reduce((s, w) => s + w.outstanding, 0);
  const totalBookings   = weeks.reduce((s, w) => s + w.bookings, 0);

  return { weeks, totalForecast, totalOutstanding, totalBookings };
}

// ---- DAILY REVENUE PULSE (this month vs last month, day-by-day) --------
export async function getDailyRevenuePulse(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const now = new Date();
  const { start: thisStart, end: thisEnd } = getPKTMonthPeriod(0, now);
  const { start: lastStart, end: lastEnd } = getPKTMonthPeriod(-1, now);

  const [thisBookings, lastBookings, thisSales, lastSales] = await Promise.all([
    prisma.booking.findMany({
      where:  { ...branchFilter, status: BookingStatus.CHECKED_OUT, checkOutDate: { gte: thisStart, lte: thisEnd } },
      select: { checkOutDate: true, totalAmount: true },
    }),
    prisma.booking.findMany({
      where:  { ...branchFilter, status: BookingStatus.CHECKED_OUT, checkOutDate: { gte: lastStart, lte: lastEnd } },
      select: { checkOutDate: true, totalAmount: true },
    }),
    prisma.sale.findMany({
      where:  { ...branchFilter, createdAt: { gte: thisStart, lte: thisEnd } },
      select: { createdAt: true, totalAmount: true },
    }),
    prisma.sale.findMany({
      where:  { ...branchFilter, createdAt: { gte: lastStart, lte: lastEnd } },
      select: { createdAt: true, totalAmount: true },
    }),
  ]);

  const toMap = (bookings: { checkOutDate: Date; totalAmount: unknown }[], sales: { createdAt: Date; totalAmount: unknown }[]) => {
    const map: Record<number, number> = {};
    for (const b of bookings) { const d = new Date(b.checkOutDate).getUTCDate(); map[d] = (map[d] || 0) + Number(b.totalAmount); }
    for (const s of sales)    { const d = new Date(s.createdAt).getUTCDate();    map[d] = (map[d] || 0) + Number(s.totalAmount); }
    return map;
  };

  const thisMap = toMap(thisBookings, thisSales);
  const lastMap = toMap(lastBookings, lastSales);
  const days    = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getUTCDate();

  return Array.from({ length: days }, (_, i) => ({
    day:       i + 1,
    thisMonth: thisMap[i + 1] || 0,
    lastMonth: lastMap[i + 1] || 0,
  }));
}

// ---- OCCUPANCY HEATMAP (last 90 days) ----------------------------------
export async function getOccupancyHeatmapData(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const today    = startOfDay(new Date());
  const since    = new Date(today.getTime() - 89 * 86_400_000);

  const [totalRooms, bookings] = await Promise.all([
    prisma.room.count({ where: { isActive: true, ...branchFilter } }),
    prisma.booking.findMany({
      where: {
        ...branchFilter,
        status:       { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
        checkInDate:  { lte: endOfDay(today) },
        checkOutDate: { gte: since },
      },
      select: { checkInDate: true, checkOutDate: true },
    }),
  ]);

  return Array.from({ length: 90 }, (_, i) => {
    const date    = new Date(since.getTime() + i * 86_400_000);
    const ds      = startOfDay(date);
    const de      = endOfDay(date);
    const occupied = bookings.filter(
      (b) => new Date(b.checkInDate) <= de && new Date(b.checkOutDate) >= ds
    ).length;
    const rate = totalRooms > 0 ? Math.round((Math.min(occupied, totalRooms) / totalRooms) * 100) : 0;
    return { date: format(date, "yyyy-MM-dd"), label: format(date, "MMM d"), rate, occupied, total: totalRooms };
  });
}

// ---- RevPAR BY ROOM (revenue per available room night, last 30 days) ---
export async function getRevPARByRoom(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const { start: monthStart, end: monthEnd } = getPKTMonthPeriod(0);
  const daysInMonth = Math.round((monthEnd.getTime() - monthStart.getTime()) / 86_400_000);

  const rooms = await prisma.room.findMany({
    where:   { isActive: true, ...branchFilter },
    select:  { id: true, number: true, name: true, type: true, pricePerNight: true },
  });

  const results = await Promise.all(rooms.map(async (room) => {
    const agg = await prisma.booking.aggregate({
      where: {
        roomId:      room.id,
        status:      { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
        checkInDate: { gte: monthStart, lte: monthEnd },
      },
      _sum:   { totalAmount: true },
      _count: { id: true },
    });
    const revenue      = Number(agg._sum.totalAmount ?? 0);
    const bookingCount = agg._count.id;
    const revPAR       = daysInMonth > 0 ? Math.round(revenue / daysInMonth) : 0;
    const occupancyPct = daysInMonth > 0 ? Math.round((bookingCount / daysInMonth) * 100) : 0;
    return { roomId: room.id, roomNumber: room.number, roomName: room.name, roomType: room.type, revenue, revPAR, bookingCount, occupancyPct, baseRate: Number(room.pricePerNight) };
  }));

  return results.sort((a, b) => b.revPAR - a.revPAR);
}

// ---- ROOM PERFORMANCE MATRIX (6 months) --------------------------------
export async function getRoomPerformanceMatrix(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const periods  = getPKTMonthPeriods(6);
  const since    = periods[0].start;
  const rooms    = await prisma.room.findMany({ where: { isActive: true, ...branchFilter }, select: { id: true, number: true, name: true, type: true, pricePerNight: true } });

  const results = await Promise.all(rooms.map(async (room) => {
    const [bookingAgg, maintenanceAgg, lastCleaning] = await Promise.all([
      prisma.booking.aggregate({
        where:  { roomId: room.id, status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] }, checkInDate: { gte: since } },
        _sum:   { totalAmount: true, nights: true },
        _count: { id: true },
      }),
      prisma.maintenanceLog.aggregate({
        where: { roomId: room.id, createdAt: { gte: since } },
        _count: { id: true },
        _sum:   { cost: true },
      }),
      prisma.cleaningLog.findFirst({ where: { roomId: room.id }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
    ]);

    const totalRevenue    = Number(bookingAgg._sum.totalAmount ?? 0);
    const totalNights     = Number(bookingAgg._sum.nights ?? 0);
    const bookingCount    = bookingAgg._count.id;
    const avgRate         = bookingCount > 0 ? Math.round(totalRevenue / bookingCount) : 0;
    const maintenanceCost = Number(maintenanceAgg._sum.cost ?? 0);
    const maintenanceCount = maintenanceAgg._count.id;

    // 6-month revPAR: ~180 available nights
    const availableNights = 180;
    const revPAR6M = Math.round(totalRevenue / availableNights);

    return {
      roomId: room.id, roomNumber: room.number, roomName: room.name, roomType: room.type,
      totalRevenue, bookingCount, totalNights, avgRate, revPAR6M,
      maintenanceCost, maintenanceCount,
      lastCleaned: lastCleaning?.createdAt ?? null,
    };
  }));

  return results.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

// ---- WEEKDAY OCCUPANCY -------------------------------------------------
export async function getWeekdayOccupancy(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const since = new Date(Date.now() - 90 * 86_400_000);
  const bookings = await prisma.booking.findMany({
    where:  { ...branchFilter, status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] }, checkInDate: { gte: since } },
    select: { checkInDate: true, nights: true, totalAmount: true },
  });

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const map  = DAYS.map((day) => ({ day, bookings: 0, revenue: 0 }));
  for (const b of bookings) {
    const dow = new Date(b.checkInDate).getDay();
    map[dow].bookings++;
    map[dow].revenue += Number(b.totalAmount);
  }
  // Reorder Mon–Sun
  return [...map.slice(1), map[0]];
}

// ---- BOOKING LEAD TIME DISTRIBUTION ------------------------------------
export async function getBookingLeadTimeDistribution(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const since    = new Date(Date.now() - 90 * 86_400_000);
  const bookings = await prisma.booking.findMany({
    where:  { ...branchFilter, status: { notIn: [BookingStatus.CANCELLED] }, createdAt: { gte: since } },
    select: { createdAt: true, checkInDate: true },
  });

  const buckets = [
    { label: "Same day", min: 0,  max: 0,   count: 0 },
    { label: "1–3 days", min: 1,  max: 3,   count: 0 },
    { label: "4–7 days", min: 4,  max: 7,   count: 0 },
    { label: "1–2 wks",  min: 8,  max: 14,  count: 0 },
    { label: "2–4 wks",  min: 15, max: 30,  count: 0 },
    { label: "1–2 mo",   min: 31, max: 60,  count: 0 },
    { label: "2+ mo",    min: 61, max: 9999, count: 0 },
  ];

  for (const b of bookings) {
    const days = Math.floor((new Date(b.checkInDate).getTime() - new Date(b.createdAt).getTime()) / 86_400_000);
    const bucket = buckets.find((bk) => days >= bk.min && days <= bk.max);
    if (bucket) bucket.count++;
  }
  return buckets.map(({ label, count }) => ({ label, count }));
}

// ---- AVERAGE LENGTH OF STAY TREND (6 months) ---------------------------
export async function getAvgLengthOfStayTrend(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const periods = getPKTMonthPeriods(6);
  return Promise.all(periods.map(async ({ label, start, end }) => {
    const agg = await prisma.booking.aggregate({
      where: { ...branchFilter, status: BookingStatus.CHECKED_OUT, checkOutDate: { gte: start, lte: end } },
      _avg:  { nights: true },
      _count: { id: true },
    });
    return { label, avgNights: Math.round((agg._avg.nights ?? 0) * 10) / 10, bookings: agg._count.id };
  }));
}

// ---- EXPENSE CATEGORY TREND (6 months stacked) -------------------------
export async function getExpenseCategoryTrend(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const periods = getPKTMonthPeriods(6);
  const TOP_CATS = ["ELECTRICITY", "GAS", "STAFF_SALARY", "MAINTENANCE", "INVENTORY_PURCHASE", "MISCELLANEOUS"];

  return Promise.all(periods.map(async ({ label, start, end }) => {
    const expenses = await prisma.expense.findMany({
      where:  { ...branchFilter, paidAt: { gte: start, lte: end } },
      select: { category: true, amount: true },
    });
    const entry: Record<string, number | string> = { label };
    for (const cat of TOP_CATS) entry[cat] = 0;
    for (const e of expenses) {
      const key = TOP_CATS.includes(e.category) ? e.category : "MISCELLANEOUS";
      entry[key] = Number(entry[key] || 0) + Number(e.amount);
    }
    return entry;
  }));
}

// ---- P&L WATERFALL (current month) -------------------------------------
export async function getPLWaterfall(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const { start, end } = getPKTMonthPeriod(0);

  const [revenue, expenses] = await Promise.all([
    getCashRevenueForPeriod(start, end, scopedBranch),
    prisma.expense.findMany({
      where:  { ...branchFilter, paidAt: { gte: start, lte: end } },
      select: { category: true, amount: true },
    }),
  ]);

  const catMap: Record<string, number> = {};
  for (const e of expenses) catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount);

  const CAT_LABELS: Record<string, string> = {
    ELECTRICITY: "Electricity", GAS: "Gas", INTERNET: "Internet", WATER: "Water",
    STAFF_SALARY: "Staff Salary", MAINTENANCE: "Maintenance", CLEANING_SUPPLIES: "Cleaning",
    INVENTORY_PURCHASE: "Inventory", MARKETING: "Marketing", RENT: "Rent",
    TAXES: "Taxes", FURNITURE: "Furniture", EQUIPMENT: "Equipment", MISCELLANEOUS: "Other",
  };

  const totalRevenue = revenue.totalRevenue;
  let running = totalRevenue;
  const bars: { name: string; value: number; base: number; type: "income" | "expense" | "profit" }[] = [
    { name: "Revenue", value: totalRevenue, base: 0, type: "income" },
  ];

  const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  for (const [cat, amount] of sorted) {
    if (amount <= 0) continue;
    bars.push({ name: CAT_LABELS[cat] ?? cat, value: amount, base: running - amount, type: "expense" });
    running -= amount;
  }
  bars.push({ name: "Net Profit", value: Math.max(0, running), base: 0, type: "profit" });

  return { bars, totalRevenue, totalExpenses: totalRevenue - running, netProfit: running };
}

// ---- GUEST RETENTION FUNNEL --------------------------------------------
export async function getGuestRetentionFunnel(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);

  // Customers are company-wide; if branch-scoped, filter by booking history
  const companyId = user.companyId;

  const [once, twice, thricePlus, vip] = await Promise.all([
    prisma.customer.count({ where: { companyId, totalVisits: 1 } }),
    prisma.customer.count({ where: { companyId, totalVisits: 2 } }),
    prisma.customer.count({ where: { companyId, totalVisits: { gte: 3 } } }),
    prisma.customer.count({ where: { companyId, isVIP: true } }),
  ]);

  return [
    { stage: "1st Visit",    count: once,       pct: 100 },
    { stage: "2nd Visit",    count: twice,      pct: once > 0 ? Math.round((twice / once) * 100) : 0 },
    { stage: "3rd+ Visit",   count: thricePlus, pct: once > 0 ? Math.round((thricePlus / once) * 100) : 0 },
    { stage: "VIP / Loyal",  count: vip,        pct: once > 0 ? Math.round((vip / once) * 100) : 0 },
  ];
}

// ---- LOYALTY PROGRAMME STATS -------------------------------------------
export async function getLoyaltyStats(branchId?: string) {
  const user      = await requirePermission("analytics:branch");
  const companyId = user.companyId;

  const [tierCounts, totalCredits, nearMilestone] = await Promise.all([
    prisma.customer.groupBy({ by: ["loyaltyTier"], where: { companyId }, _count: { id: true } }),
    prisma.customer.aggregate({ where: { companyId }, _sum: { freeNightCredits: true } }),
    // Guests with 4 qualifying stays (1 away from free night credit)
    prisma.customer.count({ where: { companyId, totalVisits: { gte: 4 }, freeNightCredits: 0 } }),
  ]);

  const tiers = Object.fromEntries(tierCounts.map((t) => [t.loyaltyTier, t._count.id]));
  return {
    tiers,
    totalCreditsIssued: Number(totalCredits._sum.freeNightCredits ?? 0),
    nearMilestone,
  };
}

// ---- BRANCH SCORECARD (super admin only) --------------------------------
export async function getBranchScorecard() {
  const user = await requirePermission("analytics:company");

  const { start: thisStart, end: thisEnd } = getPKTMonthPeriod(0);
  const { start: lastStart, end: lastEnd } = getPKTMonthPeriod(-1);

  const branches = await prisma.branch.findMany({ where: { isActive: true, companyId: user.companyId }, select: { id: true, name: true } });

  return Promise.all(branches.map(async (branch) => {
    const bf = { branchId: branch.id };
    const [thisRevenue, lastRevenue, expenses, occupancy, avgStay, complaints] = await Promise.all([
      getCashRevenueForPeriod(thisStart, thisEnd, branch.id),
      getCashRevenueForPeriod(lastStart, lastEnd, branch.id),
      prisma.expense.aggregate({ where: { ...bf, paidAt: { gte: thisStart, lte: thisEnd } }, _sum: { amount: true } }),
      prisma.room.groupBy({ by: ["status"], where: { ...bf, isActive: true }, _count: { id: true } }),
      prisma.booking.aggregate({ where: { ...bf, status: BookingStatus.CHECKED_OUT, checkOutDate: { gte: thisStart, lte: thisEnd } }, _avg: { nights: true }, _count: { id: true } }),
      prisma.complaint.count({ where: { status: { not: "RESOLVED" } } }),
    ]);

    const occMap      = Object.fromEntries(occupancy.map((o) => [o.status, o._count.id]));
    const totalRooms  = Object.values(occMap).reduce((a, b) => a + b, 0);
    const occupied    = occMap[RoomStatus.OCCUPIED] ?? 0;
    const revenue     = thisRevenue.totalRevenue;
    const lastRev     = lastRevenue.totalRevenue;
    const exp         = Number(expenses._sum.amount ?? 0);

    return {
      branchId:      branch.id,
      branchName:    branch.name,
      revenue,
      lastRevenue:   lastRev,
      revGrowth:     lastRev > 0 ? Math.round(((revenue - lastRev) / lastRev) * 100) : null,
      expenses:      exp,
      profit:        revenue - exp,
      margin:        revenue > 0 ? Math.round(((revenue - exp) / revenue) * 100) : 0,
      occupancyRate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0,
      totalRooms,
      bookings:      avgStay._count.id,
      avgStay:       Math.round((avgStay._avg.nights ?? 0) * 10) / 10,
      openComplaints: complaints,
    };
  }));
}

// ---- 30-DAY REVENUE PIPELINE (day-by-day confirmed bookings) -----------
export async function getRevenuePipeline30Day(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const today = startOfDay(new Date());
  const end30 = new Date(today.getTime() + 29 * 86_400_000);

  const bookings = await prisma.booking.findMany({
    where: {
      ...branchFilter,
      status:      { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      checkInDate: { gte: today, lte: end30 },
    },
    select: { checkInDate: true, totalAmount: true, status: true },
  });

  return Array.from({ length: 30 }, (_, i) => {
    const date     = new Date(today.getTime() + i * 86_400_000);
    const ds       = startOfDay(date);
    const de       = endOfDay(date);
    const dayBooks = bookings.filter((b) => { const ci = new Date(b.checkInDate); return ci >= ds && ci <= de; });
    const confirmed = dayBooks.filter((b) => b.status === BookingStatus.CONFIRMED).reduce((s, b) => s + Number(b.totalAmount), 0);
    const pending   = dayBooks.filter((b) => b.status === BookingStatus.PENDING).reduce((s, b) => s + Number(b.totalAmount), 0);
    return { date: format(date, "MMM d"), confirmed, pending, total: confirmed + pending, bookings: dayBooks.length };
  });
}

// ---- AI SUGGESTIONS (computed heuristics) --------------------------------
export async function getAISuggestions(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};
  const companyId    = user.companyId;

  const now = new Date();
  const { start: thisStart, end: thisEnd }   = getPKTMonthPeriod(0, now);
  const { start: lastStart, end: lastEnd }   = getPKTMonthPeriod(-1, now);
  const next7End   = new Date(now.getTime() + 7 * 86_400_000);
  const past30Start = new Date(now.getTime() - 30 * 86_400_000);

  const [
    totalRooms, next7Bookings, thisRevenue, lastRevenue,
    pendingCount, lowStock, nearMilestone,
    thisExpenses, last6Expenses,
    recentMaintenance,
  ] = await Promise.all([
    prisma.room.count({ where: { isActive: true, ...branchFilter } }),
    prisma.booking.count({
      where: { ...branchFilter, status: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] }, checkInDate: { gte: startOfDay(now), lte: next7End } },
    }),
    getCashRevenueForPeriod(thisStart, thisEnd, scopedBranch),
    getCashRevenueForPeriod(lastStart, lastEnd, scopedBranch),
    prisma.booking.count({ where: { ...branchFilter, status: BookingStatus.PENDING } }),
    prisma.inventoryItem.findMany({ where: { ...branchFilter }, select: { currentStock: true, minStockLevel: true, product: { select: { name: true } } } }),
    prisma.customer.count({ where: { companyId, totalVisits: { gte: 4 }, freeNightCredits: 0 } }),
    prisma.expense.aggregate({ where: { ...branchFilter, paidAt: { gte: thisStart, lte: thisEnd } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { ...branchFilter, paidAt: { gte: new Date(now.getTime() - 180 * 86_400_000), lte: lastEnd } }, _sum: { amount: true } }),
    prisma.maintenanceLog.count({ where: { createdAt: { gte: past30Start }, resolvedAt: null, room: branchFilter.branchId ? { branchId: branchFilter.branchId } : {} } }),
  ]);

  const suggestions: { type: "warning" | "opportunity" | "info" | "action"; icon: string; title: string; body: string; priority: number }[] = [];

  // 1. Low occupancy next week
  const next7Occupancy = totalRooms > 0 ? Math.round((next7Bookings / (totalRooms * 7)) * 100) : 0;
  if (next7Occupancy < 40) {
    suggestions.push({ type: "warning", icon: "🚨", title: "Low occupancy next 7 days", body: `Only ${next7Occupancy}% booked across next week (${next7Bookings} booking${next7Bookings !== 1 ? "s" : ""} for ${totalRooms} room${totalRooms !== 1 ? "s" : ""}). Consider a WhatsApp flash promo or short-stay discount.`, priority: 1 });
  }

  // 2. Revenue down vs last month
  const revDiff = thisRevenue.totalRevenue - lastRevenue.totalRevenue;
  if (lastRevenue.totalRevenue > 0 && revDiff < 0) {
    const pct = Math.abs(Math.round((revDiff / lastRevenue.totalRevenue) * 100));
    suggestions.push({ type: "warning", icon: "📉", title: `Revenue down ${pct}% vs last month`, body: `This month so far: PKR ${Math.round(thisRevenue.totalRevenue).toLocaleString()} vs PKR ${Math.round(lastRevenue.totalRevenue).toLocaleString()} last month. Focus on upselling extensions and POS.`, priority: 2 });
  }

  // 3. Pending bookings pile-up
  if (pendingCount >= 3) {
    suggestions.push({ type: "action", icon: "⏳", title: `${pendingCount} pending bookings unconfirmed`, body: `${pendingCount} bookings are still in Pending status. Confirm or cancel them to keep the calendar accurate and avoid double-booking risk.`, priority: 2 });
  }

  // 4. Low stock
  const criticalStock = lowStock.filter((i) => i.currentStock <= i.minStockLevel);
  if (criticalStock.length > 0) {
    const names = criticalStock.slice(0, 3).map((i) => i.product?.name ?? "item").join(", ");
    suggestions.push({ type: "warning", icon: "📦", title: `${criticalStock.length} inventory item${criticalStock.length > 1 ? "s" : ""} at reorder level`, body: `Low stock: ${names}${criticalStock.length > 3 ? ` +${criticalStock.length - 3} more` : ""}. Reorder now to avoid guest-facing shortages.`, priority: 1 });
  }

  // 5. Near-milestone loyalty guests
  if (nearMilestone > 0) {
    suggestions.push({ type: "opportunity", icon: "💎", title: `${nearMilestone} guest${nearMilestone > 1 ? "s" : ""} near free-night milestone`, body: `${nearMilestone} guest${nearMilestone > 1 ? "s are" : " is"} 1 qualifying stay away from earning a free night. A proactive WhatsApp message could convert a booking this week.`, priority: 3 });
  }

  // 6. Expenses spike
  const avgMonthlyExp = last6Expenses._sum.amount ? Number(last6Expenses._sum.amount) / 6 : 0;
  const thisExp = Number(thisExpenses._sum.amount ?? 0);
  if (avgMonthlyExp > 0 && thisExp > avgMonthlyExp * 1.3) {
    const pct = Math.round(((thisExp - avgMonthlyExp) / avgMonthlyExp) * 100);
    suggestions.push({ type: "warning", icon: "⚡", title: `Expenses ${pct}% above 6-month average`, body: `This month's expenses (PKR ${Math.round(thisExp).toLocaleString()}) are significantly above your average of PKR ${Math.round(avgMonthlyExp).toLocaleString()}. Review utility and maintenance bills.`, priority: 2 });
  }

  // 7. Open maintenance issues
  if (recentMaintenance >= 2) {
    suggestions.push({ type: "action", icon: "🔧", title: `${recentMaintenance} unresolved maintenance issue${recentMaintenance > 1 ? "s" : ""}`, body: `${recentMaintenance} maintenance log${recentMaintenance > 1 ? "s" : ""} opened in the last 30 days with no resolution date. Unresolved issues reduce room availability.`, priority: 2 });
  }

  // 8. Revenue up — positive signal
  if (lastRevenue.totalRevenue > 0 && revDiff > 0) {
    const pct = Math.round((revDiff / lastRevenue.totalRevenue) * 100);
    suggestions.push({ type: "info", icon: "🏆", title: `Revenue up ${pct}% vs last month`, body: `Great momentum. This month is tracking PKR ${Math.round(revDiff).toLocaleString()} ahead of last month. Keep it going with consistent confirmations and upsells.`, priority: 4 });
  }

  return suggestions.sort((a, b) => a.priority - b.priority);
}

// ---- TODAY'S SCHEDULE -------------------------------------------------
export async function getTodaySchedule(branchId?: string) {
  const user         = await requirePermission("bookings:read");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const todayStart = startOfDay(new Date());
  const todayEnd   = endOfDay(new Date());

  const [checkIns, checkOuts] = await Promise.all([
    prisma.booking.findMany({
      where: {
        ...branchFilter,
        checkInDate: { gte: todayStart, lte: todayEnd },
        status:      { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      },
      include: {
        customer: { select: { name: true, phone: true, loyaltyTier: true } },
        room:     { select: { number: true, name: true, type: true } },
      },
      orderBy: { checkInDate: "asc" },
    }),
    prisma.booking.findMany({
      where: {
        ...branchFilter,
        checkOutDate: { gte: todayStart, lte: todayEnd },
        status:       BookingStatus.CHECKED_IN,
      },
      include: {
        customer: { select: { name: true, phone: true } },
        room:     { select: { number: true, name: true, type: true } },
      },
      orderBy: { checkOutDate: "asc" },
    }),
  ]);

  return { checkIns, checkOuts };
}
