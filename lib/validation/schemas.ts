// ============================================================
// lib/validation/schemas.ts
// Zod schemas for all form inputs and API payloads.
//
// Schemas are the single source of truth for validation —
// used in both client (react-hook-form) and server (API routes).
// ============================================================

import { z } from "zod";
import { RoomType, UserRole, PaymentMethod } from "@/types";

// ─── Reusable primitives ──────────────────────────────────────

const pkrAmount = z
  .number({ invalid_type_error: "Amount must be a number" })
  .min(0, "Amount cannot be negative")
  .max(99_999_999, "Amount too large");

const phoneNumber = z
  .string()
  .regex(/^(\+92|0)[0-9]{10}$/, "Enter a valid Pakistani phone number");

const cnicNumber = z
  .string()
  .regex(/^[0-9]{5}-[0-9]{7}-[0-9]$/, "CNIC must be in format 00000-0000000-0")
  .optional()
  .or(z.literal(""));

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// ─── Auth ─────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address")
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
  email: z.string().email().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.nativeEnum(UserRole),
  branchId: z.string().optional(), // Required for non-super-admin
  phone: phoneNumber.optional(),
  designation: z.string().optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ─── Branch ───────────────────────────────────────────────────

export const createBranchSchema = z.object({
  name: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  address: z.string().min(5).max(500),
  phone: phoneNumber.optional(),
  email: z.string().email().optional().or(z.literal("")),
  whatsapp: phoneNumber.optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  googleMapsUrl: z.string().url().optional().or(z.literal("")),
  description: z.string().max(2000).optional(),
  facilities: z.array(z.string()).default([]),
});
export type CreateBranchInput = z.infer<typeof createBranchSchema>;

export const updateBranchSchema = createBranchSchema.partial();
export type UpdateBranchInput = z.infer<typeof updateBranchSchema>;

// ─── Room ─────────────────────────────────────────────────────

export const createRoomSchema = z.object({
  branchId:     z.string().min(1, "Branch is required"),
  number:       z.string().min(1).max(20),
  name:         z.string().min(2).max(100),
  type:         z.nativeEnum(RoomType),
  floor:        z.number().int().min(0).max(50).optional(),
  description:  z.string().max(2000).optional(),
  pricePerNight: pkrAmount.min(1, "Price must be greater than 0"),
  weekendPrice: pkrAmount.optional(),
  seasonalPrice: pkrAmount.optional(),
  maxAdults:    z.number().int().min(1).max(20).default(2),
  maxChildren:  z.number().int().min(0).max(10).default(0),
  bedCount:     z.number().int().min(1).max(10).default(1),
  bedType:      z.enum(["Single", "Double", "Queen", "King", "Twin", "Bunk"]).optional(),
  amenities:    z.array(z.string()).default([]),
  size:         z.number().positive().optional(),
  hasBalcony:   z.boolean().default(false),
  hasKitchenette: z.boolean().default(false),
  hasJacuzzi:   z.boolean().default(false),
});
export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = createRoomSchema.omit({ branchId: true }).partial();
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;

// ─── Customer ─────────────────────────────────────────────────

export const createCustomerSchema = z.object({
  name:        z.string().min(2, "Name is required").max(100),
  phone:       phoneNumber,
  email:       z.string().email().optional().or(z.literal("")),
  cnic:        cnicNumber,
  nationality: z.string().default("Pakistani"),
  city:        z.string().max(100).optional(),
  specialRequests: z.string().max(500).optional(),
  notes:       z.string().max(500).optional(),
});
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;

// ─── Booking ──────────────────────────────────────────────────

export const createBookingSchema = z
  .object({
    branchId:     z.string().min(1, "Branch is required"),
    roomId:       z.string().min(1, "Room is required"),
    // Customer — either link existing or create new
    customerId:   z.string().optional(),
    guestName:    z.string().min(2).optional(),
    guestPhone:   phoneNumber.optional(),
    guestEmail:   z.string().email().optional().or(z.literal("")),
    // Dates
    checkInDate:  dateString,
    checkOutDate: dateString,
    // Guests
    adultCount:   z.number().int().min(1).max(20).default(1),
    childCount:   z.number().int().min(0).max(10).default(0),
    // Extras
    source:       z.enum(["website", "whatsapp", "walk_in", "phone", "email"]).default("website"),
    offerId:      z.string().optional(),
    specialRequests: z.string().max(500).optional(),
    internalNotes: z.string().max(500).optional(),
  })
  .refine(
    (d) => {
      const checkIn  = new Date(d.checkInDate);
      const checkOut = new Date(d.checkOutDate);
      return checkOut > checkIn;
    },
    { message: "Check-out must be after check-in", path: ["checkOutDate"] }
  )
  .refine(
    (d) => {
      // Must have either customerId or guest details
      return !!d.customerId || (!!d.guestName && !!d.guestPhone);
    },
    { message: "Either select an existing customer or provide guest name and phone", path: ["customerId"] }
  );
export type CreateBookingInput = z.infer<typeof createBookingSchema>;

export const updateBookingSchema = z.object({
  checkInDate:  dateString.optional(),
  checkOutDate: dateString.optional(),
  roomId:       z.string().optional(),
  adultCount:   z.number().int().min(1).optional(),
  childCount:   z.number().int().min(0).optional(),
  specialRequests: z.string().max(500).optional(),
  internalNotes: z.string().max(500).optional(),
});
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;

export const cancelBookingSchema = z.object({
  reason: z.string().min(5, "Please provide a cancellation reason").max(500),
});
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

// ─── Payment ──────────────────────────────────────────────────

export const addPaymentSchema = z.object({
  bookingId: z.string(),
  amount:    pkrAmount.min(1, "Amount must be greater than 0"),
  method:    z.nativeEnum(PaymentMethod),
  reference: z.string().max(100).optional(),
  notes:     z.string().max(500).optional(),
});
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;

// ─── Inventory ────────────────────────────────────────────────

export const createProductSchema = z.object({
  name:       z.string().min(2).max(100),
  brand:      z.string().max(100).optional(),
  categoryId: z.string().min(1, "Category is required"),
  sku:        z.string().max(50).optional(),
  unit:       z.enum(["piece", "bottle", "sachet", "box", "pack", "kg", "liter"]).default("piece"),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

export const addInventoryItemSchema = z.object({
  productId:     z.string().min(1),
  branchId:      z.string().min(1),
  purchasePrice: pkrAmount.min(1),
  sellingPrice:  pkrAmount.min(1),
  currentStock:  z.number().int().min(0).default(0),
  minStockLevel: z.number().int().min(0).default(10),
  expiresAt:     z.string().optional(),
  supplierName:  z.string().max(100).optional(),
  supplierPhone: phoneNumber.optional(),
});
export type AddInventoryItemInput = z.infer<typeof addInventoryItemSchema>;

export const restockSchema = z.object({
  inventoryItemId: z.string(),
  quantity:        z.number().int().min(1, "Quantity must be at least 1"),
  purchasePrice:   pkrAmount.optional(), // Can update cost on restock
  notes:           z.string().optional(),
});
export type RestockInput = z.infer<typeof restockSchema>;

export const createSaleSchema = z.object({
  branchId:  z.string(),
  bookingId: z.string().optional(),
  type:      z.enum(["ROOM_ATTACHED", "WALK_IN"]),
  items:     z.array(
    z.object({
      inventoryItemId: z.string(),
      quantity:        z.number().int().min(1),
    })
  ).min(1, "At least one item is required"),
  notes: z.string().optional(),
});
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

// ─── Expense ──────────────────────────────────────────────────

export const createExpenseSchema = z.object({
  branchId: z.string(),
  category: z.string(),  // ExpenseCategory enum value
  title:    z.string().min(2).max(200),
  amount:   pkrAmount.min(1),
  description: z.string().max(500).optional(),
  paidAt:   z.string().optional(), // ISO date string
});
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

// ─── Offer ────────────────────────────────────────────────────

export const createOfferSchema = z
  .object({
    name:          z.string().min(2).max(100),
    description:   z.string().max(500).optional(),
    code:          z.string().max(20).toUpperCase().optional(),
    discountType:  z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    discountValue: pkrAmount.min(1),
    roomTypes:     z.array(z.nativeEnum(RoomType)).default([]),
    minNights:     z.number().int().min(1).optional(),
    maxUses:       z.number().int().min(1).optional(),
    startsAt:      z.string(),
    expiresAt:     z.string(),
    branchId:      z.string().optional(),
  })
  .refine(
    (d) => {
      if (d.discountType === "PERCENTAGE") {
        return d.discountValue <= 100;
      }
      return true;
    },
    { message: "Percentage discount cannot exceed 100%", path: ["discountValue"] }
  );
export type CreateOfferInput = z.infer<typeof createOfferSchema>;

// ─── Review ───────────────────────────────────────────────────

export const createReviewSchema = z.object({
  bookingId: z.string().optional(),
  branchId:  z.string(),
  rating:    z.number().int().min(1).max(5),
  title:     z.string().max(100).optional(),
  body:      z.string().min(10, "Review must be at least 10 characters").max(2000),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
