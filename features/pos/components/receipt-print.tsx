"use client";

// ============================================================
// features/pos/components/receipt-print.tsx
// Printing for POS receipts.
//
// How isolation works: a copy of the receipt is portalled straight into
// <body> (kept off-screen). While printing, body gets `cgh-printing-receipt`,
// and the print CSS hides every other child of <body> — sidebar, header,
// buttons, toasts — so ONLY the receipt reaches the paper. A per-print
// @page rule sets the paper: A4, or an 80mm roll exactly as tall as the
// receipt (margin 0 also suppresses the browser's URL/date header lines).
// ============================================================

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer, FileDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils";
import { ReceiptPaper, type PrintSize, type ReceiptView } from "./ReceiptPaper";
import { PrinterSetupHelp } from "./PrinterSetupHelp";

const SIZE_KEY = "cgh_pos_print_size";
const PAGE_STYLE_ID = "cgh-receipt-page-style";

/** Remembered per device — a reception PC with a thermal printer stays on 80mm. */
export function usePrintSize(): [PrintSize, (s: PrintSize) => void] {
  // Default to 80mm: an 80mm layout on an A4 printer is still a usable strip,
  // whereas an A4 layout sent to a thermal roll prints unreadably small.
  const [size, setSize] = useState<PrintSize>("thermal");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SIZE_KEY);
      if (saved === "a4" || saved === "thermal") setSize(saved);
    } catch { /* storage unavailable */ }
  }, []);
  const update = (s: PrintSize) => {
    setSize(s);
    try { localStorage.setItem(SIZE_KEY, s); } catch { /* ignore */ }
  };
  return [size, update];
}

export function PrintSizeToggle({ size, onChange }: { size: PrintSize; onChange: (s: PrintSize) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-surface-elevated p-0.5 text-xs font-semibold" role="radiogroup" aria-label="Print size">
      {([["a4", "A4"], ["thermal", "80mm Thermal"]] as const).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={size === value}
          onClick={() => onChange(value)}
          className={cn(
            "rounded-lg px-3 py-1.5 transition-colors",
            size === value ? "bg-gold-500/20 text-gold-300" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** Off-screen copy of the receipt that the print CSS reveals. Mount once per page. */
export function ReceiptPrintPortal({ receipt, size }: { receipt: ReceiptView | null; size: PrintSize }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !receipt) return null;
  return createPortal(
    <div className="receipt-print-portal" aria-hidden="true">
      <ReceiptPaper receipt={receipt} size={size} />
    </div>,
    document.body,
  );
}

async function waitForImages(root: Element, timeoutMs = 2000) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.race([
    Promise.all(imgs.map((img) => (img.complete ? Promise.resolve() : new Promise<void>((res) => {
      img.addEventListener("load", () => res(), { once: true });
      img.addEventListener("error", () => res(), { once: true });
    })))),
    new Promise((res) => setTimeout(res, timeoutMs)),
  ]);
}

/**
 * Page height for an 80mm roll: exactly as tall as the receipt, so the roll
 * is cut at the end of the print instead of feeding a blank tail.
 *
 * Clamped on purpose. A measurement can come back absurd if the copy is
 * somehow not laid out (0) or a font blows up (huge); a bad height is the one
 * way this can turn into a stack of near-empty pages, because the browser
 * paginates the receipt across pages of that height. Outside the sane range we
 * fall back to a standard 80 x 297mm roll page, which always prints as one
 * page.
 */
const THERMAL_MIN_MM = 60;      // shorter than the shortest possible receipt
const THERMAL_MAX_MM = 1200;    // 1.2 m of roll — far beyond any real order
const THERMAL_FALLBACK_MM = 297;

export function thermalPageHeightMm(receiptHeightPx: number): number {
  const mm = Math.ceil((receiptHeightPx * 25.4) / 96) + 4; // +4mm slack: rounding must never spill onto a 2nd page
  if (!Number.isFinite(mm) || mm < THERMAL_MIN_MM || mm > THERMAL_MAX_MM) return THERMAL_FALLBACK_MM;
  return mm;
}

/**
 * Print the portalled receipt. Resolves once the print dialog has closed.
 * Call after React has rendered the portal with the latest data.
 */
export async function printReceipt(size: PrintSize) {
  const paper = document.querySelector(".receipt-print-portal .cgh-receipt");
  if (!paper) { toast.error("Receipt is not ready to print yet."); return; }
  await waitForImages(paper);

  const heightMm = thermalPageHeightMm(paper.getBoundingClientRect().height);
  const pageRule = size === "thermal"
    ? `@page { size: 80mm ${heightMm}mm; margin: 0; }`
    : `@page { size: A4 portrait; margin: 0; } body.cgh-printing-receipt > .receipt-print-portal { padding-top: 12mm; }`;

  document.getElementById(PAGE_STYLE_ID)?.remove();
  const style = document.createElement("style");
  style.id = PAGE_STYLE_ID;
  style.media = "print";
  style.textContent = pageRule;
  document.head.appendChild(style);
  document.body.classList.add("cgh-printing-receipt");

  // Two separate clocks on purpose:
  //  • the isolation CSS stays until the print dialog really closes. Chrome
  //    re-renders the preview from the LIVE page whenever the user changes
  //    paper size or margins — exactly what someone does when fighting a
  //    thermal printer — and if the CSS were already gone by then it would
  //    print the whole dashboard onto the roll, page after page.
  //  • the button stops spinning quickly, since `afterprint` is unreliable.
  // Leaving the CSS in place costs nothing on screen: it is print-only.
  const mql = typeof window.matchMedia === "function" ? window.matchMedia("print") : null;
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    clearTimeout(safety);
    window.removeEventListener("afterprint", cleanup);
    mql?.removeEventListener?.("change", onMediaChange);
    document.body.classList.remove("cgh-printing-receipt");
    style.remove();
  };
  const onMediaChange = (e: MediaQueryListEvent) => { if (!e.matches) cleanup(); };
  const safety = setTimeout(cleanup, 120_000); // longer than any print dialog

  window.addEventListener("afterprint", cleanup);
  mql?.addEventListener?.("change", onMediaChange);

  await new Promise<void>((resolve) => {
    const stopSpinner = () => { window.removeEventListener("afterprint", stopSpinner); resolve(); };
    window.addEventListener("afterprint", stopSpinner);
    requestAnimationFrame(() => {
      window.print();           // blocks while the dialog is open in most browsers
      setTimeout(stopSpinner, 1500);
    });
  });
}

/** Print button with the size toggle beside it. */
export function PrintControls({
  size, onSizeChange, onPrint, onSavePdf, disabled, busy, printLabel = "Print Receipt",
}: {
  size: PrintSize;
  onSizeChange: (s: PrintSize) => void;
  onPrint: () => void;
  onSavePdf: () => void;
  disabled?: boolean;
  busy?: "print" | "pdf" | null;
  printLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <PrintSizeToggle size={size} onChange={onSizeChange} />
      <button
        type="button"
        onClick={onPrint}
        disabled={disabled || !!busy}
        className="flex items-center gap-2 rounded-xl border border-gold-500/40 bg-gold-500/10 px-4 py-2 text-sm font-semibold text-gold-300 hover:bg-gold-500/20 disabled:opacity-50"
      >
        {busy === "print" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} {printLabel}
      </button>
      <button
        type="button"
        onClick={onSavePdf}
        disabled={disabled || !!busy}
        className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:border-gold-500/40 hover:text-foreground disabled:opacity-50"
      >
        {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />} Save Receipt
      </button>
      <PrinterSetupHelp />
    </div>
  );
}
