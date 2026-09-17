// Run: npx tsx lib/pos/receipt-math.test.mts
import {
  computeReceipt, amountInWords, numberToWords, formatReceiptNo, formatPKRBill, formatQty,
} from "./receipt-math.ts";

let pass = 0, fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  got=${JSON.stringify(got)}${ok ? "" : ` want=${JSON.stringify(want)}`}`);
  ok ? pass++ : fail++;
};

// ── The reference bill: 7 lines = PKR 1,040 ──
const ref = computeReceipt({
  items: [
    { name: "Kabab", qty: 1, rate: 160 },
    { name: "Roti", qty: 1, rate: 30 },
    { name: "Karahi", qty: 1, rate: 360 },
    { name: "Chaye", qty: 1, rate: 100 },
    { name: "Water", qty: 1, rate: 100 },
    { name: "Sprite Mint 500ml", qty: 1, rate: 120 },
    { name: "Delivery Charges", qty: 1, rate: 170 },
  ],
});
eq("ref no errors", ref.errors, []);
eq("ref subtotal", ref.subtotal, 1040);
eq("ref total", ref.total, 1040);
eq("ref words", amountInWords(ref.total), "Pak Rupees One Thousand Forty Only");
eq("ref PKR format", formatPKRBill(ref.total), "PKR 1,040/-");
eq("ref customerCharged defaults to total", ref.customerCharged, 1040);
eq("ref vendorCost blank → null", ref.vendorCost, null);

// ── Amount = qty × rate; charges, discount ──
const b = computeReceipt({
  items: [{ name: "Roti", qty: 4, rate: 30 }, { name: "Karahi", qty: 2, rate: 360 }],
  deliveryCharges: 150, otherCharges: "50", discount: 20,
});
eq("line amount qty×rate", b.items.map((i) => i.amount), [120, 720]);
eq("subtotal", b.subtotal, 840);
eq("grand total = sub + delivery + other − discount", b.total, 1020);

// ── Floating-point safety (0.1+0.2 class of bugs) ──
const fp = computeReceipt({ items: [{ name: "a", qty: 3, rate: 0.1 }, { name: "b", qty: 1, rate: 0.2 }] });
eq("paisa math: 3×0.10 + 0.20 = 0.50", fp.total, 0.5);
const half = computeReceipt({ items: [{ name: "Chicken (kg)", qty: 1.5, rate: 899.99 }] });
eq("1.5 × 899.99 = 1349.99 (rounded half-up to paisa)", half.total, 1349.99);

// ── Accounting ──
const acc = computeReceipt({ items: [{ name: "Food", qty: 1, rate: 1040 }], vendorCost: 870 });
eq("profit = charged − vendor", acc.profit, 170);
const acc2 = computeReceipt({ items: [{ name: "Food", qty: 1, rate: 1040 }], customerCharged: 1000, vendorCost: 870 });
eq("custom charged overrides total for profit", acc2.profit, 130);
eq("total still 1040 when charged differs", acc2.total, 1040);

// ── Validation ──
eq("blank spare rows ignored", computeReceipt({ items: [{ name: "Tea", qty: 1, rate: 50 }, { name: "", qty: "", rate: "" }] }).errors, []);
eq("no items", computeReceipt({ items: [] }).errors, ["Add at least one item."]);
eq("missing rate", computeReceipt({ items: [{ name: "Tea", qty: 1, rate: "" }] }).errors.includes("Line 1: rate is required."), true);
eq("negative rate", computeReceipt({ items: [{ name: "Tea", qty: 1, rate: -5 }] }).errors.includes("Line 1: rate must be 0 or more."), true);
eq("zero qty", computeReceipt({ items: [{ name: "Tea", qty: 0, rate: 5 }] }).errors.includes("Line 1: quantity must be more than 0."), true);
eq("junk amount", computeReceipt({ items: [{ name: "Tea", qty: 1, rate: "abc" }] }).errors.includes("Line 1: rate must be 0 or more."), true);
eq("discount > bill", computeReceipt({ items: [{ name: "Tea", qty: 1, rate: 50 }], discount: 60 }).errors.includes("Discount cannot be more than the bill amount."), true);
eq("3 decimals rejected", computeReceipt({ items: [{ name: "Tea", qty: 1, rate: 1.005 }] }).errors.includes("Line 1: rate can have at most 2 decimals."), true);
eq("negative vendor cost", computeReceipt({ items: [{ name: "Tea", qty: 1, rate: 50 }], vendorCost: -1 }).errors.includes("Outside vendor cost cannot be negative."), true);
eq("commas accepted", computeReceipt({ items: [{ name: "Room service", qty: 1, rate: "1,500" }] }).total, 1500);

// ── Words (Pakistani lakh/crore) ──
eq("0", amountInWords(0), "Pak Rupees Zero Only");
eq("15", numberToWords(15), "Fifteen");
eq("100", numberToWords(100), "One Hundred");
eq("999", numberToWords(999), "Nine Hundred Ninety Nine");
eq("1,000", numberToWords(1000), "One Thousand");
eq("21,305", numberToWords(21305), "Twenty One Thousand Three Hundred Five");
eq("1,50,000", numberToWords(150000), "One Lakh Fifty Thousand");
eq("12,34,567", numberToWords(1234567), "Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven");
eq("1 crore", numberToWords(10000000), "One Crore");
eq("paisa", amountInWords(10.5), "Pak Rupees Ten and Fifty Paisa Only");

// ── Formatting ──
eq("receipt no", formatReceiptNo(124), "CGH-000124");
eq("PKR with paisa", formatPKRBill(1040.5), "PKR 1,040.50/-");
eq("qty trims zeros", [formatQty(1), formatQty(2.5), formatQty(0.25)], ["1", "2.5", "0.25"]);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
