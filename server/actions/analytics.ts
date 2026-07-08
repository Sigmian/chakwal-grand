"use server";

import prisma from "@/lib/db/prisma";
import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import { BookingStatus, RoomStatus } from "@/types";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, format } from "date-fns";

// ---- DASHBOARD OVERVIEW -----------------------------------------------
export async function getDashboardOverview(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);

  const now        = new Date();
  const todayStart = startOfDay(now);
  const todayEnd   = endOfDay(now);
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd   = endOfMonth(subMonths(now, 1));

  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const [
    roomStats,
    todayBookings,
    monthRevenue,
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
    prisma.booking.aggregate({
      where: {
        ...branchFilter,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
        checkInDate: { gte: monthStart, lte: monthEnd },
        paidAmount: { gt: 0 },  // only bookings with at least some payment recorded
      },
      _sum: { paidAmount: true, discountAmount: true },
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
    prisma.booking.aggregate({
      where: {
        ...branchFilter,
        status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
        checkInDate: { gte: lastMonthStart, lte: lastMonthEnd },
        paidAmount: { gt: 0 },
      },
      _sum: { paidAmount: true },
    }),
  ]);

  const lowStockCount = allInventory.filter(
    (item) => item.currentStock <= item.minStockLevel
  ).length;

  const roomStatusMap  = Object.fromEntries(roomStats.map((r) => [r.status, r._count.id]));
  const totalRooms     = Object.values(roomStatusMap).reduce((a, b) => a + b, 0);
  const availableRooms = roomStatusMap[RoomStatus.AVAILABLE] ?? 0;
  const occupiedRooms  = roomStatusMap[RoomStatus.OCCUPIED]  ?? 0;

  const revenueThisMonth     = Number(monthRevenue._sum.paidAmount ?? 0);
  const revenueLastMonth     = Number(lastMonthRevenue._sum.paidAmount ?? 0);
  const totalDiscountThisMonth = Number(monthRevenue._sum.discountAmount ?? 0);
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
export async function getRevenueChartData(branchId?: string) {
  const user         = await requirePermission("analytics:branch");
  const scopedBranch = getScopedBranchId(user, branchId);
  const branchFilter = scopedBranch ? { branchId: scopedBranch } : {};

  const months = [];
  for (let i = 5; i >= 0; i--) {
    const date  = subMonths(new Date(), i);
    const start = startOfMonth(date);
    const end   = endOfMonth(date);
    months.push({ label: format(date, "MMM"), start, end });
  }

  const chartData = await Promise.all(
    months.map(async ({ label, start, end }) => {
      const [bookingRevenue, productRevenue, ghExpenses, invExpenses] = await Promise.all([
        prisma.booking.aggregate({
          where: {
            ...branchFilter,
            status: { in: [BookingStatus.CHECKED_OUT, BookingStatus.CHECKED_IN, BookingStatus.CONFIRMED] },
            checkInDate: { gte: start, lte: end },
          },
          _sum: { totalAmount: true },
        }),
        prisma.sale.aggregate({
          where: { ...branchFilter, createdAt: { gte: start, lte: end } },
          _sum:  { totalAmount: true },
        }),
        prisma.expense.aggregate({
          where: { ...branchFilter, paidAt: { gte: start, lte: end }, expenseType: "GUESTHOUSE" as never },
          _sum:  { amount: true },
        }),
        prisma.expense.aggregate({
          where: { ...branchFilter, paidAt: { gte: start, lte: end }, expenseType: "INVENTORY" as never },
          _sum:  { amount: true },
        }),
      ]);

      const roomRevenue    = Number(bookingRevenue._sum.totalAmount ?? 0);
      const productRev     = Number(productRevenue._sum.totalAmount ?? 0);
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

  const now        = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd   = endOfMonth(now);

  const branches = await prisma.branch.findMany({
    where:   { isActive: true },
    include: { _count: { select: { rooms: true, bookings: true } } },
  });

  const performance = await Promise.all(
    branches.map(async (branch) => {
      const [revenue, expenses, avgRating, occupancy] = await Promise.all([
        prisma.booking.aggregate({
          where: {
            branchId: branch.id,
            status:   { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.CHECKED_OUT] },
            checkInDate: { gte: monthStart, lte: monthEnd },
          },
          _sum: { totalAmount: true },
        }),
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

      const totalRevenue  = Number(revenue._sum.totalAmount ?? 0);
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
    where:   scopedBranch ? { staffId: { not: null }, ...staffFilter } : {},
    orderBy: { createdAt: "desc" },
    take:    limit,
    include: { user: { select: { name: true, role: true } } },
  });

  return logs;
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
