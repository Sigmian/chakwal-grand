// ============================================================
// lib/pos/receipt-math.ts
// Pure money logic for Guest Orders POS receipts. Imported by BOTH the
// browser (live totals while typing) and the server (authoritative totals
// that get saved), so the two can never disagree.
//
// All arithmetic runs in integer PAISA (1 PKR = 100 paisa) — no floating-
// point drift like 0.1 + 0.2 = 0.30000000000000004 can reach a bill.
// ============================================================

export const MAX_MONEY = 10_000_000;          // PKR 1 crore per field
export const MAX_QTY = 10_000;
export const MAX_ITEMS = 100;
export const MAX_ITEM_NAME = 80;

export interface ReceiptItemInput {
  name: string;
  qty: number | string;
  rate: number | string;
  /** Set when the line is guest-house stock (whole quantities, inventory price). */
  inventoryItemId?: string | null;
  /** Purchase price per unit of a stock line (server-supplied). */
  unitCost?: number | string | null;
}

export interface ReceiptInput {
  items: ReceiptItemInput[];
  deliveryCharges?: number | string | null;
  otherCharges?: number | string | null;
  discount?: number | string | null;
  /** What the guest actually paid; blank = the receipt total. */
  customerCharged?: number | string | null;
  /** What CGH paid the outside restaurant/shop; blank = not entered yet. */
  vendorCost?: number | string | null;
}

export interface ComputedItem {
  position: number;
  name: string;
  qty: number;
  rate: number;
  amount: number;
  inventoryItemId: string | null;
  unitCost: number | null;
}

export interface ComputedReceipt {
  items: ComputedItem[];
  subtotal: number;
  deliveryCharges: number;
  otherCharges: number;
  discount: number;
  total: number;
  customerCharged: number;
  vendorCost: number | null;
  /** Σ purchase cost of guest-house stock lines. */
  stockCost: number;
  /** Σ amount of stock lines, before any bill-level discount. */
  stockSubtotal: number;
  profit: number;
  errors: string[];
}

const isBlank = (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

/** Parse a user-entered amount. Returns NaN for junk so validation can flag it. */
export function parseAmount(v: unknown): number {
  if (isBlank(v)) return 0;
  const s = typeof v === "string" ? v.replace(/,/g, "").trim() : v;
  const n = typeof s === "number" ? s : Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** At most 2 decimal places (paisa precision). */
const hasMax2dp = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6;
const toPaisa = (n: number) => Math.round(n * 100);
const fromPaisa = (p: number) => p / 100;

/**
 * Compute every figure on a receipt and validate it. Rows with neither a name
 * nor a rate are treated as empty spare rows and ignored.
 */
export function computeReceipt(input: ReceiptInput): ComputedReceipt {
  const errors: string[] = [];
  const items: ComputedItem[] = [];
  let subtotalP = 0;
  let stockCostP = 0;
  let stockSubtotalP = 0;

  const rows = input.items ?? [];
  if (rows.length > MAX_ITEMS) errors.push(`A receipt can have at most ${MAX_ITEMS} items.`);

  rows.forEach((row, i) => {
    const name = (row.name ?? "").trim();
    const rateBlank = isBlank(row.rate);
    if (!name && rateBlank) return; // spare empty row

    const line = i + 1;
    const qty = isBlank(row.qty) ? 1 : parseAmount(row.qty);
    const rate = parseAmount(row.rate);

    if (!name) errors.push(`Line ${line}: item name is required.`);
    if (name.length > MAX_ITEM_NAME) errors.push(`Line ${line}: item name is too long (max ${MAX_ITEM_NAME}).`);
    if (Number.isNaN(qty) || qty <= 0) errors.push(`Line ${line}: quantity must be more than 0.`);
    else if (qty > MAX_QTY) errors.push(`Line ${line}: quantity is too large.`);
    else if (!hasMax2dp(qty)) errors.push(`Line ${line}: quantity can have at most 2 decimals.`);
    else if (row.inventoryItemId && !Number.isInteger(qty)) errors.push(`Line ${line}: stock items need a whole-number quantity.`);
    if (rateBlank) errors.push(`Line ${line}: rate is required.`);
    else if (Number.isNaN(rate) || rate < 0) errors.push(`Line ${line}: rate must be 0 or more.`);
    else if (rate > MAX_MONEY) errors.push(`Line ${line}: rate is too large.`);
    else if (!hasMax2dp(rate)) errors.push(`Line ${line}: rate can have at most 2 decimals.`);

    const safeQty = Number.isFinite(qty) && qty > 0 ? qty : 0;
    const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : 0;
    // qty in hundredths × rate in paisa ÷ 100 → paisa, rounded half-up.
    const amountP = Math.round((toPaisa(safeQty) * toPaisa(safeRate)) / 100);
    subtotalP += amountP;
    const inventoryItemId = row.inventoryItemId || null;
    const unitCostRaw = inventoryItemId ? parseAmount(row.unitCost) : NaN;
    const unitCost = inventoryItemId && Number.isFinite(unitCostRaw) && unitCostRaw >= 0 ? unitCostRaw : null;
    if (inventoryItemId) {
      stockSubtotalP += amountP;
      if (unitCost !== null) stockCostP += Math.round((toPaisa(safeQty) * toPaisa(unitCost)) / 100);
    }
    items.push({ position: items.length + 1, name, qty: safeQty, rate: safeRate, amount: fromPaisa(amountP), inventoryItemId, unitCost });
  });

  if (items.length === 0) errors.push("Add at least one item.");

  const money = (v: unknown, label: string) => {
    const n = parseAmount(v);
    if (Number.isNaN(n)) { errors.push(`${label} is not a valid amount.`); return 0; }
    if (n < 0) { errors.push(`${label} cannot be negative.`); return 0; }
    if (n > MAX_MONEY) { errors.push(`${label} is too large.`); return 0; }
    if (!hasMax2dp(n)) { errors.push(`${label} can have at most 2 decimals.`); return 0; }
    return toPaisa(n);
  };

  const deliveryP = money(input.deliveryCharges, "Delivery charges");
  const otherP = money(input.otherCharges, "Other charges");
  const discountP = money(input.discount, "Discount");

  const grossP = subtotalP + deliveryP + otherP;
  if (discountP > grossP) errors.push("Discount cannot be more than the bill amount.");
  const totalP = Math.max(0, grossP - discountP);

  const chargedP = isBlank(input.customerCharged) ? totalP : money(input.customerCharged, "Customer charged");
  const vendorBlank = isBlank(input.vendorCost);
  const vendorP = vendorBlank ? null : money(input.vendorCost, "Outside vendor cost");
  const profitP = chargedP - (vendorP ?? 0) - stockCostP;

  return {
    items,
    subtotal: fromPaisa(subtotalP),
    deliveryCharges: fromPaisa(deliveryP),
    otherCharges: fromPaisa(otherP),
    discount: fromPaisa(discountP),
    total: fromPaisa(totalP),
    customerCharged: fromPaisa(chargedP),
    vendorCost: vendorP === null ? null : fromPaisa(vendorP),
    stockCost: fromPaisa(stockCostP),
    stockSubtotal: fromPaisa(stockSubtotalP),
    profit: fromPaisa(profitP),
    errors,
  };
}

/**
 * Revenue to book for the stock part of a receipt: the stock lines' amount less
 * their proportional share of the bill-level discount (charges are the guest
 * house's own service, so the discount is shared across everything billed).
 * Returned in rupees, rounded to the paisa. This is what the inventory Sale
 * records, so Finance counts exactly what the guest paid for stock.
 */
export function allocateStockRevenue(c: Pick<ComputedReceipt, "stockSubtotal" | "subtotal" | "deliveryCharges" | "otherCharges" | "discount">): number {
  const stockP = toPaisa(c.stockSubtotal);
  const grossP = toPaisa(c.subtotal) + toPaisa(c.deliveryCharges) + toPaisa(c.otherCharges);
  if (stockP <= 0 || grossP <= 0) return 0;
  const shareP = Math.round((toPaisa(c.discount) * stockP) / grossP);
  return fromPaisa(Math.max(0, stockP - shareP));
}

// ─── Receipt number ───────────────────────────────────────────
export const formatReceiptNo = (seq: number) => `CGH-${String(seq).padStart(6, "0")}`;

// ─── Display formatting ───────────────────────────────────────
/** "1,040" or "1,040.50" — paisa shown only when present. */
export function formatAmount(n: number): string {
  const hasPaisa = Math.round(n * 100) % 100 !== 0;
  return n.toLocaleString("en-PK", {
    minimumFractionDigits: hasPaisa ? 2 : 0,
    maximumFractionDigits: 2,
  });
}

/** "PKR 1,040/-" */
export const formatPKRBill = (n: number) => `PKR ${formatAmount(n)}/-`;

/** Quantity without trailing zeros: 1, 2.5, 0.25 */
export const formatQty = (n: number) => String(Number(n.toFixed(2)));

// ─── Amount in words (Pakistani system: Thousand / Lakh / Crore) ──
const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function belowHundred(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`;
}

function belowThousand(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", r ? belowHundred(r) : ""].filter(Boolean).join(" ");
}

/** Whole number → words, e.g. 1040 → "One Thousand Forty", 150000 → "One Lakh Fifty Thousand". */
export function numberToWords(n: number): string {
  n = Math.floor(Math.abs(n));
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1000);
  const rest = n % 1000;
  if (crore) parts.push(`${numberToWords(crore)} Crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} Lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} Thousand`);
  if (rest) parts.push(belowThousand(rest));
  return parts.join(" ");
}

/** 1040 → "Pak Rupees One Thousand Forty Only"; 10.5 → "Pak Rupees Ten and Fifty Paisa Only". */
export function amountInWords(amount: number): string {
  const paisaTotal = Math.round(Math.abs(amount) * 100);
  const rupees = Math.floor(paisaTotal / 100);
  const paisa = paisaTotal % 100;
  const words = `Pak Rupees ${numberToWords(rupees)}${paisa ? ` and ${belowHundred(paisa)} Paisa` : ""} Only`;
  return words;
}
