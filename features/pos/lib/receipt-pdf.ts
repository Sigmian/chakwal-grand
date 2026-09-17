// ============================================================
// features/pos/lib/receipt-pdf.ts
// "Save Receipt" — a real PDF (A4 or 80mm roll) mirroring ReceiptPaper,
// built client-side with jsPDF (already a project dependency). The page
// is drawn twice: once to measure, once at the exact roll length.
// Customer-facing only — never includes vendor cost or profit.
// ============================================================


import type { jsPDF as JsPDF } from "jspdf";
import { siteConfig } from "@/config/site";
import { amountInWords, formatAmount, formatPKRBill, formatQty } from "@/lib/pos/receipt-math";
import { receiptDate, receiptTime, roomGuestLabel, type PrintSize, type ReceiptView } from "../components/ReceiptPaper";

const NAVY: [number, number, number] = [11, 23, 51];
const GOLD: [number, number, number] = [184, 134, 43];
const BROWN: [number, number, number] = [122, 90, 28];
const MUTED: [number, number, number] = [91, 100, 119];

// Standard PDF fonts only cover Latin-1; swap the few typographic characters we use.
const safe = (s: string) => s.replace(/[−–]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

/**
 * The logo PNG has transparency, which jsPDF renders as a faint smear. Flatten
 * it onto white via a canvas and embed a JPEG instead (also far smaller).
 */
async function loadLogo(): Promise<string | null> {
  try {
    const img = new Image();
    img.src = "/images/logo.png";
    await img.decode();
    const px = 360;
    const canvas = document.createElement("canvas");
    canvas.width = px;
    canvas.height = px;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, px, px);
    ctx.drawImage(img, 0, 0, px, px);
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch {
    return null;
  }
}

function draw(doc: JsPDF, r: ReceiptView, size: PrintSize, logo: string | null): number {
  const a4 = size === "a4";
  const x0 = a4 ? 30 : 4;
  const w = a4 ? 150 : 72;
  const x1 = x0 + w;
  const cx = x0 + w / 2;
  const fs = a4 ? 10 : 7.6;           // base font size (pt)
  const lh = a4 ? 5 : 3.6;            // base line height (mm)
  const pageBottom = a4 ? 282 : Infinity;
  let y = a4 ? 14 : 5;

  const color = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const font = (style: "normal" | "bold" | "italic" | "bolditalic", size: number, family = "helvetica") => {
    doc.setFont(family, style);
    doc.setFontSize(size);
  };
  /** jsPDF's align:"center" ignores charSpace — centre letter-spaced text ourselves. */
  const centered = (text: string, y0: number, charSpace = 0) => {
    const width = doc.getTextWidth(text) + charSpace * Math.max(0, text.length - 1);
    doc.text(text, cx - width / 2, y0, { charSpace });
  };
  const breakPage = (need: number) => {
    if (y + need > pageBottom) { doc.addPage(); y = 16; }
  };

  // ── Header ──
  const logoSize = a4 ? 24 : 16;
  if (logo) {
    doc.addImage(logo, "JPEG", cx - logoSize / 2, y, logoSize, logoSize);
    y += logoSize + (a4 ? 3 : 2);
  }
  color(NAVY); font("bold", a4 ? 20 : 13, "times");
  doc.text("CHAKWAL GUEST HOUSE", cx, y + (a4 ? 5 : 3.5), { align: "center" });
  y += a4 ? 9 : 6;
  color(GOLD); font("normal", fs * 0.72);
  centered(safe(siteConfig.tagline).toUpperCase(), y, a4 ? 0.8 : 0.3);
  y += a4 ? 5 : 3.5;

  const pillW = a4 ? 50 : 34, pillH = a4 ? 8.5 : 6;
  doc.setFillColor(...NAVY);
  doc.roundedRect(cx - pillW / 2, y, pillW, pillH, 1.5, 1.5, "F");
  doc.setTextColor(255, 255, 255); font("bold", a4 ? 13 : 9.5);
  centered("POS BILL", y + pillH / 2 + (a4 ? 1.6 : 1.2), a4 ? 2 : 1.2);
  y += pillH + (a4 ? 6 : 4.5);

  // ── Meta ──
  const meta: [string, string][] = [
    ["Receipt No", r.receiptNo ?? "-"],
    ["Date", receiptDate(r.createdAt)],
    ["Time", receiptTime(r.createdAt)],
    ["Branch", r.branchName],
    ["Room / Guest", roomGuestLabel(r)],
    ["Cashier", r.cashier],
  ];
  font("normal", fs);
  if (a4) {
    // Left column: Receipt No / Date / Time — right column: Branch / Room / Cashier.
    // Each row advances by its tallest wrapped value so nothing overlaps.
    const colX = [x0, x0 + 78];
    for (let row = 0; row < 3; row++) {
      const pairs = [meta[row], meta[row + 3]];
      font("bold", fs);
      const wrapped = pairs.map((pair) => doc.splitTextToSize(safe(pair[1]), 46) as string[]);
      pairs.forEach((pair, c) => {
        color(MUTED); font("normal", fs); doc.text(pair[0], colX[c], y);
        color(NAVY); font("bold", fs); doc.text(wrapped[c], colX[c] + 26, y);
      });
      y += lh * Math.max(...wrapped.map((w) => w.length)) + 0.6;
    }
  } else {
    for (const [k, v] of meta) {
      color(MUTED); font("normal", fs); doc.text(k, x0, y);
      color(NAVY); font("bold", fs);
      const lines = doc.splitTextToSize(safe(v), w - 20);
      doc.text(lines, x0 + 20, y);
      y += lh * Math.max(1, lines.length);
    }
  }
  y += 1.5;

  // ── Items ──
  const col = a4
    ? { idx: x0 + 2, item: x0 + 10, itemW: 72, qty: x0 + 100, rate: x0 + 125, amt: x1 - 2 }
    : { idx: x0 + 1, item: x0 + 5, itemW: 30, qty: x0 + 42, rate: x0 + 56.5, amt: x1 - 0.8 };
  const headH = a4 ? 7.5 : 5.5;
  doc.setFillColor(...NAVY);
  doc.rect(x0, y, w, headH, "F");
  doc.setTextColor(255, 255, 255); font("bold", fs * 0.95);
  const hy = y + headH / 2 + (a4 ? 1.3 : 1);
  doc.text("#", col.idx, hy);
  doc.text("Item", col.item, hy);
  doc.text("Qty", col.qty, hy, { align: "right" });
  doc.text("Rate", col.rate, hy, { align: "right" });
  doc.text("Amount", col.amt, hy, { align: "right" });
  y += headH + lh * 0.95;

  font("normal", fs);
  r.items.forEach((it, i) => {
    const nameLines = doc.splitTextToSize(safe(it.name), col.itemW);
    const rowH = lh * nameLines.length + (a4 ? 1.6 : 1.2);
    breakPage(rowH);
    color(MUTED); doc.text(String(i + 1), col.idx, y);
    color(NAVY);
    doc.text(nameLines, col.item, y);
    doc.text(formatQty(it.qty), col.qty, y, { align: "right" });
    doc.text(formatAmount(it.rate), col.rate, y, { align: "right" });
    doc.text(formatAmount(it.amount), col.amt, y, { align: "right" });
    const lineY = y + lh * (nameLines.length - 1) + (a4 ? 1.8 : 1.3);
    doc.setDrawColor(217, 220, 227);
    doc.setLineDashPattern([0.4, 0.6], 0);
    doc.line(x0, lineY, x1, lineY);
    doc.setLineDashPattern([], 0);
    y += rowH;
  });

  // ── Sums ──
  y += 1;
  breakPage(40);
  const sumRow = (label: string, value: string, muted = false) => {
    color(muted ? MUTED : NAVY); font("normal", fs);
    doc.text(label, x0 + 1.5, y);
    doc.text(value, x1 - 1.5, y, { align: "right" });
    y += lh;
  };
  sumRow("Subtotal", formatAmount(r.subtotal));
  if (r.deliveryCharges > 0) sumRow("Delivery Charges", formatAmount(r.deliveryCharges), true);
  if (r.otherCharges > 0) sumRow("Other Charges", formatAmount(r.otherCharges), true);
  if (r.discount > 0) sumRow("Discount", `- ${formatAmount(r.discount)}`, true);

  const totH = a4 ? 11 : 8;
  doc.setFillColor(241, 237, 227);
  doc.rect(x0, y - lh * 0.4, w, totH, "F");
  color(BROWN); font("bold", a4 ? 16 : 11.5);
  const ty = y - lh * 0.4 + totH / 2 + (a4 ? 2 : 1.4);
  doc.text("TOTAL", x0 + 2, ty);
  doc.text(formatPKRBill(r.total), x1 - 2, ty, { align: "right" });
  y += totH + (a4 ? 3 : 2);

  // ── Amount payable ──
  font("normal", fs * 0.9);
  const words = doc.splitTextToSize(`(${amountInWords(r.total)})`, w - 6);
  const payH = lh * (1 + words.length) + (a4 ? 4 : 3);
  breakPage(payH);
  doc.setFillColor(243, 244, 247);
  doc.roundedRect(x0, y - lh * 0.2, w, payH, 1.2, 1.2, "F");
  color(NAVY); font("bold", fs * 1.05);
  doc.text(`Amount Payable : ${formatPKRBill(r.total)}`, cx, y + lh * 0.9, { align: "center" });
  font("normal", fs * 0.9);
  doc.text(words, cx, y + lh * 1.95, { align: "center" });
  y += payH + (a4 ? 3 : 2);

  if (r.notes) {
    color(MUTED); font("italic", fs * 0.9);
    const n = doc.splitTextToSize(safe(`Note: ${r.notes}`), w);
    breakPage(lh * n.length);
    doc.text(n, x0, y);
    y += lh * n.length + 1;
  }

  // ── Thank you + footer ──
  breakPage(30);
  color(GOLD); font("bolditalic", a4 ? 28 : 18, "times");
  y += a4 ? 8 : 5.5;
  doc.text("Thank You", cx, y, { align: "center" });
  y += a4 ? 5.5 : 4;
  color(NAVY); font("normal", fs * 0.72);
  centered("FOR CHOOSING CHAKWAL GUEST HOUSE", y, a4 ? 0.5 : 0.2);
  y += a4 ? 5 : 3.5;

  doc.setDrawColor(217, 220, 227);
  doc.line(x0, y, x1, y);
  y += lh;
  const phone = r.branchPhone || siteConfig.phone;
  font("normal", fs * 0.85); color(NAVY);
  if (a4) {
    doc.text(safe(r.branchAddress), x0, y, { maxWidth: w - 40 });
    font("bold", fs * 0.9);
    doc.text(phone, x1, y, { align: "right" });
    y += lh + 1;
  } else {
    const addr = doc.splitTextToSize(safe(r.branchAddress), w);
    doc.text(addr, cx, y, { align: "center" });
    y += lh * addr.length;
    font("bold", fs * 0.9);
    doc.text(phone, cx, y, { align: "center" });
    y += lh;
  }
  font("bold", fs * 0.7);
  centered("CHAKWAL GUEST HOUSE", y + 1, a4 ? 1.5 : 0.8);
  y += lh;

  if (r.status === "CANCELLED") {
    doc.setTextColor(192, 38, 45); font("bold", a4 ? 44 : 26);
    doc.text("CANCELLED", cx - (a4 ? 38 : 22), a4 ? 150 : y / 2, { angle: 28 });
  }

  return y;
}

export async function downloadReceiptPdf(r: ReceiptView, size: PrintSize) {
  const [{ default: jsPDF }, logo] = await Promise.all([import("jspdf"), loadLogo()]);
  let doc: JsPDF;
  if (size === "thermal") {
    const probe = new jsPDF({ unit: "mm", format: [80, 2000] });
    const endY = draw(probe, r, size, logo);
    doc = new jsPDF({ unit: "mm", format: [80, Math.ceil(endY + 6)] });
  } else {
    doc = new jsPDF({ unit: "mm", format: "a4" });
  }
  draw(doc, r, size, logo);
  doc.setProperties({ title: `Chakwal Guest House — ${r.receiptNo ?? "Receipt"}` });
  doc.save(`${r.receiptNo ?? "CGH-receipt"}${size === "thermal" ? "-80mm" : ""}.pdf`);
}
