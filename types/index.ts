// ============================================================
// types/index.ts
// Central type definitions — single source of truth
// All feature modules import from here
// ============================================================

// ─────────────────────────────────────────────
// ENUMS (mirrored from Prisma for client use)
// ─────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  BRANCH_MANAGER = "BRANCH_MANAGER",
  RECEPTIONIST = "RECEPTIONIST",
  HOUSEKEEPING = "HOUSEKEEPING",
  INVENTORY_STAFF = "INVENTORY_STAFF",
}

export enum RoomType {
  STANDARD = "STANDARD",
  DELUXE = "DELUXE",
  FAMILY = "FAMILY",
  VIP = "VIP",
  SUITE = "SUITE",
}

export enum RoomStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  MAINTENANCE = "MAINTENANCE",
  BLOCKED = "BLOCKED",
  CLEANING = "CLEANING",
}

export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CHECKED_IN = "CHECKED_IN",
  CHECKED_OUT = "CHECKED_OUT",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}

export enum PaymentStatus {
  UNPAID = "UNPAID",
  PARTIAL = "PARTIAL",
  PAID = "PAID",
  REFUNDED = "REFUNDED",
}

export enum PaymentMethod {
  CASH = "CASH",
  BANK_TRANSFER = "BANK_TRANSFER",
  EASYPAISA = "EASYPAISA",
  JAZZCASH = "JAZZCASH",
  ONLINE_CARD = "ONLINE_CARD",
}

export enum SaleType {
  ROOM_ATTACHED = "ROOM_ATTACHED",
  WALK_IN = "WALK_IN",
}

export enum ExpenseCategory {
  ELECTRICITY = "ELECTRICITY",
  GAS = "GAS",
  INTERNET = "INTERNET",
  WATER = "WATER",
  STAFF_SALARY = "STAFF_SALARY",
  MAINTENANCE = "MAINTENANCE",
  CLEANING_SUPPLIES = "CLEANING_SUPPLIES",
  INVENTORY_PURCHASE = "INVENTORY_PURCHASE",
  MARKETING = "MARKETING",
  RENT = "RENT",
  TAXES = "TAXES",
  FURNITURE = "FURNITURE",
  EQUIPMENT = "EQUIPMENT",
  MISCELLANEOUS = "MISCELLANEOUS",
}

export enum LoyaltyTier {
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  GOLD = "GOLD",
  VIP = "VIP",
}

// ─────────────────────────────────────────────
// COMPANY & BRANCH
// ─────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  tagline?: string;
  logo?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  country: string;
  currency: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  city: string;
  address: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  coverImage?: string;
  images: string[];
  facilities: string[];
  description?: string;
  isActive: boolean;
  openedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields (from relations)
  _count?: {
    rooms: number;
    bookings: number;
    staff: number;
  };
}

export interface BranchWithStats extends Branch {
  stats: {
    totalRooms: number;
    availableRooms: number;
    occupiedRooms: number;
    occupancyRate: number;
    revenueToday: number;
    revenueThisMonth: number;
    activeBookings: number;
  };
}

// ─────────────────────────────────────────────
// AUTH & USER
// ─────────────────────────────────────────────

export interface User {
  id: string;
  companyId: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  staffMember?: StaffMember;
}

// The session user — what NextAuth stores in the JWT
export interface SessionUser {
  id: string;
  companyId: string;
  email: string;
  name: string;
  image?: string;
  role: UserRole;
  branchId?: string; // Only set for non-SUPER_ADMIN
}

export interface StaffMember {
  id: string;
  userId: string;
  branchId: string;
  phone?: string;
  designation?: string;
  salary?: number;
  shiftStart?: string;
  shiftEnd?: string;
  workingDays: string[];
  joinedAt: Date;
  user?: User;
  branch?: Branch;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
  user?: Pick<User, "id" | "name" | "email" | "role">;
}

// ─────────────────────────────────────────────
// ROOMS
// ─────────────────────────────────────────────

export interface RoomImage {
  id: string;
  roomId: string;
  url: string;
  altText?: string;
  isCover: boolean;
  sortOrder: number;
}

export interface Room {
  id: string;
  branchId: string;
  number: string;
  name: string;
  type: RoomType;
  status: RoomStatus;
  floor?: number;
  description?: string;
  pricePerNight: number;
  weekendPrice?: number;
  seasonalPrice?: number;
  maxAdults: number;
  maxChildren: number;
  bedCount: number;
  bedType?: string;
  amenities: string[];
  size?: number;
  hasBalcony: boolean;
  hasKitchenette: boolean;
  hasJacuzzi: boolean;
  images: RoomImage[];
  tourImages360: string[];
  isActive: boolean;
  lastCleaned?: Date;
  createdAt: Date;
  updatedAt: Date;
  branch?: Pick<Branch, "id" | "name" | "slug">;
}

export interface RoomWithAvailability extends Room {
  isAvailableForDates?: boolean;
  nextAvailableDate?: Date;
  currentBooking?: Pick<Booking, "id" | "bookingRef" | "checkInDate" | "checkOutDate">;
}

export interface MaintenanceLog {
  id: string;
  roomId: string;
  title: string;
  description?: string;
  cost?: number;
  resolvedAt?: Date;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cnic?: string;
  passportNumber?: string;
  nationality: string;
  city?: string;
  loyaltyTier: LoyaltyTier;
  totalVisits: number;
  totalSpending: number;
  lastVisitAt?: Date;
  preferredRoomType?: RoomType;
  specialRequests?: string;
  notes?: string;
  isVIP: boolean;
  isBlacklisted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerWithHistory extends Customer {
  bookings: BookingSummary[];
  reviews: Review[];
}

// ─────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────

export interface Booking {
  id: string;
  bookingRef: string;
  branchId: string;
  roomId: string;
  customerId: string;
  checkInDate: Date;
  checkOutDate: Date;
  actualCheckIn?: Date;
  actualCheckOut?: Date;
  nights: number;
  guestCount: number;
  adultCount: number;
  childCount: number;
  baseAmount: number;
  discountAmount: number;
  taxAmount: number;
  extraCharges: number;
  totalAmount: number;
  paidAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  source?: string;
  offerId?: string;
  specialRequests?: string;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  // Relations
  branch?: Pick<Branch, "id" | "name" | "slug">;
  room?: Pick<Room, "id" | "number" | "name" | "type">;
  customer?: Customer;
  payments?: Payment[];
  salesAttached?: Sale[];
}

// Lightweight version for lists/tables
export interface BookingSummary {
  id: string;
  bookingRef: string;
  checkInDate: Date;
  checkOutDate: Date;
  nights: number;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  room: Pick<Room, "number" | "name" | "type">;
  branch: Pick<Branch, "name" | "slug">;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  receivedById?: string;
  notes?: string;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// OFFERS
// ─────────────────────────────────────────────

export interface Offer {
  id: string;
  branchId?: string;
  name: string;
  description?: string;
  code?: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  roomTypes: RoomType[];
  minNights?: number;
  maxUses?: number;
  usedCount: number;
  startsAt: Date;
  expiresAt: Date;
  isActive: boolean;
  createdAt: Date;
}

// ─────────────────────────────────────────────
// INVENTORY & POS
// ─────────────────────────────────────────────

export interface ProductCategory {
  id: string;
  name: string;
  icon?: string;
  sortOrder: number;
  products?: Product[];
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  brand?: string;
  sku?: string;
  unit: string;
  image?: string;
  isActive: boolean;
  category?: ProductCategory;
}

export interface InventoryItem {
  id: string;
  productId: string;
  branchId: string;
  purchasePrice: number;
  sellingPrice: number;
  currentStock: number;
  minStockLevel: number;
  expiresAt?: Date;
  supplierName?: string;
  supplierPhone?: string;
  lastRestockedAt?: Date;
  product?: Product;
  // Computed
  profitPerUnit?: number;
  profitMargin?: number;
  isLowStock?: boolean;
  isExpired?: boolean;
}

export interface StockTransfer {
  id: string;
  fromBranchId: string;
  toBranchId: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  requestedById?: string;
  approvedById?: string;
  notes?: string;
  transferredAt?: Date;
  createdAt: Date;
  fromBranch?: Pick<Branch, "id" | "name">;
  toBranch?: Pick<Branch, "id" | "name">;
  items: StockTransferItem[];
}

export interface StockTransferItem {
  id: string;
  transferId: string;
  productId: string;
  quantity: number;
  product?: Product;
}

export interface Sale {
  id: string;
  branchId: string;
  bookingId?: string;
  type: SaleType;
  soldById?: string;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  lineItems: SaleLineItem[];
  booking?: Pick<Booking, "bookingRef" | "customerId">;
}

export interface SaleLineItem {
  id: string;
  saleId: string;
  inventoryItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  inventoryItem?: InventoryItem & { product: Product };
}

// POS cart (client-side only, never persisted as-is)
export interface CartItem {
  inventoryItem: InventoryItem & { product: Product };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ─────────────────────────────────────────────
// FINANCE
// ─────────────────────────────────────────────

export interface Expense {
  id: string;
  branchId: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  description?: string;
  receiptUrl?: string;
  paidById?: string;
  paidAt: Date;
  month: number;
  year: number;
  branch?: Pick<Branch, "id" | "name">;
}

export interface FinanceSummary {
  period: { month: number; year: number } | { startDate: Date; endDate: Date };
  roomRevenue: number;
  productRevenue: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  expenseBreakdown: Record<ExpenseCategory, number>;
  revenueByBranch: Array<{ branchId: string; branchName: string; revenue: number }>;
}

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────

export interface Review {
  id: string;
  customerId: string;
  branchId: string;
  bookingId?: string;
  rating: number;
  title?: string;
  body: string;
  isApproved: boolean;
  isFeatured: boolean;
  approvedAt?: Date;
  createdAt: Date;
  customer?: Pick<Customer, "id" | "name">;
}

// ─────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────

export interface DashboardOverview {
  totalBranches: number;
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  revenueToday: number;
  revenueThisMonth: number;
  expensesThisMonth: number;
  profitThisMonth: number;
  bookingsToday: number;
  checkInsToday: number;
  checkOutsToday: number;
  pendingBookings: number;
  lowStockAlerts: number;
  occupancyRate: number;
}

export interface BranchPerformance {
  branchId: string;
  branchName: string;
  revenue: number;
  expenses: number;
  profit: number;
  occupancyRate: number;
  bookingsCount: number;
  avgRating: number;
  topRoom: string;
}

export interface RevenueChartData {
  label: string;       // "Jan", "Feb" or "Mon", "Tue" etc.
  roomRevenue: number;
  productRevenue: number;
  expenses: number;
  profit: number;
}

export interface OccupancyData {
  date: string;
  occupied: number;
  available: number;
  maintenance: number;
  rate: number;
}

// ─────────────────────────────────────────────
// API RESPONSE SHAPES
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─────────────────────────────────────────────
// FORM / INPUT TYPES
// ─────────────────────────────────────────────

export interface CreateBranchInput {
  name: string;
  city: string;
  address: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  description?: string;
  facilities?: string[];
}

export interface CreateRoomInput {
  branchId: string;
  number: string;
  name: string;
  type: RoomType;
  floor?: number;
  description?: string;
  pricePerNight: number;
  weekendPrice?: number;
  maxAdults: number;
  maxChildren?: number;
  bedCount: number;
  bedType?: string;
  amenities?: string[];
  size?: number;
  hasBalcony?: boolean;
  hasKitchenette?: boolean;
  hasJacuzzi?: boolean;
}

export interface CreateBookingInput {
  branchId: string;
  roomId: string;
  customerId?: string;       // If existing customer
  guestName?: string;        // If new customer
  guestPhone?: string;
  guestEmail?: string;
  checkInDate: string;       // ISO date string
  checkOutDate: string;
  adultCount: number;
  childCount?: number;
  source?: string;
  offerId?: string;
  specialRequests?: string;
}

export interface CheckAvailabilityInput {
  branchId?: string;
  checkInDate: string;
  checkOutDate: string;
  adultCount?: number;
  roomType?: RoomType;
}

// ─────────────────────────────────────────────
// UI / COMPONENT TYPES
// ─────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  badge?: number;
  children?: NavItem[];
  requiredRoles?: UserRole[];
}

export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

export interface FilterOption {
  label: string;
  value: string;
}

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "custom";
