"use client";

// ============================================================
// features/pos/components/ReceiptEditor.tsx
// Guest Orders POS — New Receipt / Edit Receipt screen.
//
// Built for reception speed:
//   Enter            → next field (qty/rate text is pre-selected, just type)
//   Enter on a rate  → in the last row: adds a new row and focuses its name
//   Enter on an empty last row → jumps to Delivery Charges
//   Ctrl/⌘ + Enter   → Generate Receipt
// Totals update on every keystroke from the same math the server re-runs.
// ============================================================

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Plus, Trash2, Loader2, CheckCircle2, ReceiptText, RotateCcw, Eye, ChevronDown, Keyboard, Lock,
} from "lucide-react";
import { cn } from "@/utils";
import { computeReceipt, formatAmount, formatPKRBill, amountInWords } from "@/lib/pos/receipt-math";
import { createGuestReceipt, updateGuestReceipt, type GuestReceiptInput } from "@/server/actions/guest-receipts";
import { ReceiptPaper, receiptDate, receiptTime, type ReceiptView } from "./ReceiptPaper";
import { PrintControls, ReceiptPrintPortal, printReceipt, usePrintSize } from "./receipt-print";
import { downloadReceiptPdf } from "../lib/receipt-pdf";

// ─── Types ────────────────────────────────────────────────────
export interface PosContext {
  cashierName: string;
  isSuperAdmin: boolean;
  defaultBranchId: string;
  branches: { id: string; name: string; address: string; phone: string | null }[];
  stays: { bookingId: string; branchId: string; roomNo: string; guestName: string }[];
}

export interface EditorInitial {
  branchId?: string;
  bookingId?: string | null;
  roomNo?: string | null;
  guestName?: string | null;
  notes?: string | null;
  items: { name: string; qty: number; rate: number }[];
  deliveryCharges?: number;
  otherCharges?: number;
  discount?: number;
  customerCharged?: number | null;
  vendorCost?: number | null;
}

interface Row { key: number; name: string; qty: string; rate: string }
interface Saved { id: string; receiptNo: string; createdAt: string }

type Props =
  | { mode: "create"; context: PosContext; initial?: EditorInitial; duplicateOf?: string }
  | {
      mode: "edit"; context: PosContext; initial: EditorInitial;
      receiptId: string; receiptNo: string; createdAt: string; createdByName: string;
    };

let rowKey = 0;
const newRow = (r?: Partial<Row>): Row => ({ key: ++rowKey, name: "", qty: "1", rate: "", ...r });
const str = (n: number | null | undefined) => (n === null || n === undefined || n === 0 ? "" : String(n));
const nextFrame = () => new Promise<void>((res) => requestAnimationFrame(() => requestAnimationFrame(() => res())));

const field = "w-full rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/15 disabled:opacity-70";
const label = "block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1";

export function ReceiptEditor(props: Props) {
  const { context, mode } = props;
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = usePrintSize();

  const init = props.initial;
  const [branchId, setBranchId] = useState(init?.branchId || context.defaultBranchId);
  const [roomNo, setRoomNo] = useState(init?.roomNo ?? "");
  const [guestName, setGuestName] = useState(init?.guestName ?? "");
  const [bookingId, setBookingId] = useState<string | null>(init?.bookingId ?? null);
  const [notes, setNotes] = useState(init?.notes ?? "");
  const [rows, setRows] = useState<Row[]>(() =>
    init?.items?.length
      ? init.items.map((i) => newRow({ name: i.name, qty: String(i.qty), rate: String(i.rate) }))
      : [newRow()],
  );
  const [delivery, setDelivery] = useState(str(init?.deliveryCharges));
  const [other, setOther] = useState(str(init?.otherCharges));
  const [discount, setDiscount] = useState(str(init?.discount));
  const [customerCharged, setCustomerCharged] = useState(str(init?.customerCharged));
  const [vendorCost, setVendorCost] = useState(
    init?.vendorCost === null || init?.vendorCost === undefined ? "" : String(init.vendorCost),
  );
  const [accountingOpen, setAccountingOpen] = useState(!!(init?.vendorCost || init?.customerCharged));

  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState<"save" | "print" | "pdf" | null>(null);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [now, setNow] = useState(() => new Date().toISOString());
  const [focusTarget, setFocusTarget] = useState<{ row: number; col: "name" } | null>(null);
  const autoGuest = useRef<string | null>(null);

  const locked = mode === "create" && !!saved;
  const branch = context.branches.find((b) => b.id === branchId) ?? context.branches[0];
  const branchStays = context.stays.filter((s) => s.branchId === branchId);

  // Live clock for a draft; frozen once saved.
  useEffect(() => {
    if (mode !== "create" || saved) return;
    const t = setInterval(() => setNow(new Date().toISOString()), 20_000);
    return () => clearInterval(t);
  }, [mode, saved]);

  // Focus requested row after it renders.
  useEffect(() => {
    if (!focusTarget) return;
    const el = formRef.current?.querySelector<HTMLInputElement>(`[data-row="${focusTarget.row}"][data-col="${focusTarget.col}"]`);
    el?.focus();
    setFocusTarget(null);
  }, [focusTarget, rows.length]);

  // Warn before leaving with an unsaved bill.
  const dirty = !saved && rows.some((r) => r.name.trim() || r.rate.trim());
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  // ── Live math (same function the server runs) ──
  const input: GuestReceiptInput = {
    branchId,
    bookingId,
    roomNo,
    guestName,
    notes,
    items: rows.map((r) => ({ name: r.name, qty: r.qty, rate: r.rate })),
    deliveryCharges: delivery,
    otherCharges: other,
    discount,
    customerCharged,
    vendorCost,
  };
  const c = useMemo(() => computeReceipt(input), [JSON.stringify(input)]); // eslint-disable-line react-hooks/exhaustive-deps

  const preview: ReceiptView = {
    receiptNo: mode === "edit" ? props.receiptNo : saved?.receiptNo ?? null,
    createdAt: mode === "edit" ? props.createdAt : saved?.createdAt ?? now,
    status: "ACTIVE",
    branchName: branch?.name ?? "",
    branchAddress: branch?.address ?? "",
    branchPhone: branch?.phone ?? null,
    roomNo: roomNo.trim() || null,
    guestName: guestName.trim() || null,
    cashier: mode === "edit" ? props.createdByName : context.cashierName,
    notes: notes.trim() || null,
    items: c.items.filter((i) => i.name),
    subtotal: c.subtotal,
    deliveryCharges: c.deliveryCharges,
    otherCharges: c.otherCharges,
    discount: c.discount,
    total: c.total,
  };

  // ── Row editing ──
  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addRow = () => {
    setRows((prev) => [...prev, newRow()]);
    setFocusTarget({ row: rows.length, col: "name" });
  };
  const removeRow = (i: number) => {
    setRows((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.length ? next : [newRow()];
    });
    setFocusTarget({ row: Math.max(0, Math.min(i, rows.length - 2)), col: "name" });
  };
  const rowInvalid = (r: Row, col: "name" | "qty" | "rate") => {
    if (!attempted || (!r.name.trim() && !r.rate.trim())) return false;
    if (col === "name") return !r.name.trim();
    if (col === "rate") return !r.rate.trim() || Number.isNaN(Number(r.rate.replace(/,/g, ""))) || Number(r.rate.replace(/,/g, "")) < 0;
    const q = r.qty.trim() === "" ? 1 : Number(r.qty);
    return Number.isNaN(q) || q <= 0;
  };

  // ── Room picker: an in-house room fills the guest name ──
  const onRoomChange = (value: string) => {
    setRoomNo(value);
    const stay = branchStays.find((s) => s.roomNo.toLowerCase() === value.trim().toLowerCase());
    setBookingId(stay?.bookingId ?? null);
    if (stay && (!guestName.trim() || guestName === autoGuest.current)) {
      setGuestName(stay.guestName);
      autoGuest.current = stay.guestName;
    }
  };

  // ── Keyboard flow ──
  const focusNext = (from: HTMLElement) => {
    const fields = Array.from(formRef.current?.querySelectorAll<HTMLElement>("[data-pos-field]:not(:disabled)") ?? []);
    const next = fields[fields.indexOf(from) + 1];
    if (next) {
      next.focus();
      if (next instanceof HTMLInputElement) next.select();
    }
  };
  const focusField = (name: string) => {
    const el = formRef.current?.querySelector<HTMLInputElement>(`[data-field="${name}"]`);
    el?.focus();
    el?.select();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    const t = e.target as HTMLElement;
    if (t.tagName === "BUTTON" || t.tagName === "A") return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      void (mode === "edit" ? saveEdit() : generate());
      return;
    }
    if (!t.hasAttribute("data-pos-field")) return;
    e.preventDefault();
    const col = t.dataset.col;
    const row = Number(t.dataset.row);
    const last = row === rows.length - 1;
    if (col === "name" && last && !rows[row]?.name.trim() && rows.length > 1) return focusField("delivery");
    if (col === "rate" && last) {
      if (rows[row]?.name.trim()) return addRow();
      return focusField("delivery");
    }
    focusNext(t);
  };

  // ── Save / print / PDF ──
  async function persist(): Promise<Saved | null> {
    if (saved) return saved;
    setAttempted(true);
    if (c.errors.length) {
      toast.error(c.errors[0]);
      return null;
    }
    const res = await createGuestReceipt(input);
    if (!res.success || !res.id || !res.receiptNo) {
      toast.error(res.error ?? "Could not save the receipt.");
      return null;
    }
    const s = { id: res.id, receiptNo: res.receiptNo, createdAt: res.createdAt ?? new Date().toISOString() };
    setSaved(s);
    toast.success(`Receipt ${res.receiptNo} saved`);
    router.refresh();
    return s;
  }

  async function generate() {
    if (busy || saved) return;
    setBusy("save");
    try { await persist(); } finally { setBusy(null); }
  }

  async function onPrint() {
    if (busy) return;
    setBusy("print");
    try {
      const s = await persist();
      if (!s) return;
      await nextFrame(); // let the print copy pick up the new receipt number
      await printReceipt(size);
    } finally { setBusy(null); }
  }

  async function onSavePdf() {
    if (busy) return;
    setBusy("pdf");
    try {
      const s = await persist();
      if (!s) return;
      await downloadReceiptPdf({ ...preview, receiptNo: s.receiptNo, createdAt: s.createdAt }, size);
    } catch {
      toast.error("Could not create the PDF.");
    } finally { setBusy(null); }
  }

  async function saveEdit() {
    if (mode !== "edit" || busy) return;
    setAttempted(true);
    if (c.errors.length) { toast.error(c.errors[0]); return; }
    setBusy("save");
    try {
      const res = await updateGuestReceipt(props.receiptId, input);
      if (!res.success) { toast.error(res.error ?? "Could not save changes."); return; }
      toast.success(`Receipt ${props.receiptNo} updated`);
      router.push(`/pos/${props.receiptId}`);
      router.refresh();
    } finally { setBusy(null); }
  }

  function startNew() {
    setSaved(null);
    setAttempted(false);
    setRoomNo(""); setGuestName(""); setBookingId(null); setNotes("");
    setRows([newRow()]);
    setDelivery(""); setOther(""); setDiscount("");
    setCustomerCharged(""); setVendorCost(""); setAccountingOpen(false);
    autoGuest.current = null;
    setNow(new Date().toISOString());
    if (props.mode === "create" && props.duplicateOf) router.replace("/pos/new");
    setTimeout(() => focusField("room"), 0);
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
      <ReceiptPrintPortal receipt={preview} size={size} />

      {/* ═══ FORM ═══ */}
      <div ref={formRef} onKeyDown={onKeyDown} className="space-y-4 min-w-0">
        {saved && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Receipt {saved.receiptNo} generated &amp; saved</p>
              <p className="text-xs text-muted-foreground">Print it, save a PDF copy, or start the next bill.</p>
            </div>
            <Link href={`/pos/${saved.id}`} className="flex items-center gap-1.5 text-xs font-semibold text-gold-400 hover:text-gold-300">
              <Eye className="h-3.5 w-3.5" /> Open receipt
            </Link>
          </div>
        )}

        {/* Header fields */}
        <fieldset disabled={locked} className="card-luxury p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <span className={label}>Receipt No.</span>
              <p className="flex h-[38px] items-center rounded-xl border border-dashed border-border px-3 text-sm font-semibold text-foreground">
                {preview.receiptNo ?? <span className="text-muted-foreground font-normal">Auto on generate</span>}
              </p>
            </div>
            <div>
              <span className={label}>Date</span>
              <p className="flex h-[38px] items-center px-1 text-sm text-foreground">{receiptDate(preview.createdAt)}</p>
            </div>
            <div>
              <span className={label}>Time</span>
              <p className="flex h-[38px] items-center px-1 text-sm text-foreground">{receiptTime(preview.createdAt)}</p>
            </div>
            <div>
              <span className={label}>Cashier</span>
              <p className="flex h-[38px] items-center gap-1.5 px-1 text-sm text-foreground truncate">
                <Lock className="h-3 w-3 text-muted-foreground" /> {preview.cashier}
              </p>
            </div>

            <div className="col-span-2 md:col-span-1">
              <label className={label} htmlFor="pos-branch">Branch</label>
              {context.isSuperAdmin && mode === "create" ? (
                <select
                  id="pos-branch" data-pos-field className={field} value={branchId}
                  onChange={(e) => { setBranchId(e.target.value); setBookingId(null); }}
                >
                  {context.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              ) : (
                <p className="flex h-[38px] items-center px-1 text-sm text-foreground truncate">{branch?.name}</p>
              )}
            </div>
            <div>
              <label className={label} htmlFor="pos-room">Room No.</label>
              <input
                id="pos-room" data-pos-field data-field="room" className={field} autoFocus={mode === "create"}
                list="pos-room-list" value={roomNo} onChange={(e) => onRoomChange(e.target.value)}
                placeholder={branchStays.length ? "Pick or type" : "e.g. 102"} maxLength={20} autoComplete="off"
              />
              <datalist id="pos-room-list">
                {branchStays.map((s) => <option key={s.bookingId} value={s.roomNo}>{s.guestName}</option>)}
              </datalist>
            </div>
            <div className="col-span-2 md:col-span-2">
              <label className={label} htmlFor="pos-guest">Guest Name <span className="normal-case font-normal">(optional)</span></label>
              <input
                id="pos-guest" data-pos-field className={field} value={guestName} maxLength={80} autoComplete="off"
                onChange={(e) => { setGuestName(e.target.value); autoGuest.current = null; }} placeholder="Guest name"
              />
            </div>
          </div>
        </fieldset>

        {/* Items */}
        <fieldset disabled={locked} className="card-luxury p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Items</h3>
            <span className="hidden items-center gap-1.5 text-[11px] text-muted-foreground md:flex">
              <Keyboard className="h-3.5 w-3.5" /> Enter = next · Ctrl+Enter = {mode === "edit" ? "save" : "generate"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="w-8 pb-2 font-semibold">#</th>
                  <th className="pb-2 font-semibold">Item Name</th>
                  <th className="w-20 pb-2 font-semibold">Qty</th>
                  <th className="w-28 pb-2 font-semibold">Rate (PKR)</th>
                  <th className="w-28 pb-2 text-right font-semibold">Amount</th>
                  <th className="w-9 pb-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  // Same shared math as the totals — one line on its own.
                  const amount = r.name.trim() || r.rate.trim()
                    ? computeReceipt({ items: [{ name: r.name || "-", qty: r.qty, rate: r.rate || 0 }] }).items[0]?.amount ?? null
                    : null;
                  return (
                    <tr key={r.key} className="align-top">
                      <td className="py-1 pr-2 pt-3 text-xs text-muted-foreground">{i + 1}</td>
                      <td className="py-1 pr-2">
                        <input
                          data-pos-field data-row={i} data-col="name" value={r.name} maxLength={80} autoComplete="off"
                          onChange={(e) => setRow(i, { name: e.target.value })}
                          placeholder={i === 0 ? "e.g. Chicken Karahi" : "Item name"}
                          className={cn(field, rowInvalid(r, "name") && "border-red-500/60")}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          data-pos-field data-row={i} data-col="qty" value={r.qty} inputMode="decimal" autoComplete="off"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setRow(i, { qty: e.target.value })}
                          className={cn(field, "text-right tabular-nums", rowInvalid(r, "qty") && "border-red-500/60")}
                        />
                      </td>
                      <td className="py-1 pr-2">
                        <input
                          data-pos-field data-row={i} data-col="rate" value={r.rate} inputMode="decimal" autoComplete="off"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setRow(i, { rate: e.target.value })}
                          placeholder="0"
                          className={cn(field, "text-right tabular-nums", rowInvalid(r, "rate") && "border-red-500/60")}
                        />
                      </td>
                      <td className="py-1 pr-2 pt-3 text-right font-semibold tabular-nums text-foreground">
                        {amount === null ? <span className="text-muted-foreground/50">—</span> : formatAmount(amount)}
                      </td>
                      <td className="py-1 pt-1.5">
                        <button
                          type="button" tabIndex={-1} onClick={() => removeRow(i)} aria-label={`Delete line ${i + 1}`}
                          className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button" onClick={addRow}
            className="mt-2 flex items-center gap-1.5 rounded-xl border border-dashed border-gold-500/40 px-3 py-2 text-sm font-semibold text-gold-400 hover:bg-gold-500/10"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </fieldset>

        {/* Charges + totals */}
        <fieldset disabled={locked} className="card-luxury p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid grid-cols-3 gap-3 content-start">
              <div>
                <label className={label} htmlFor="pos-delivery">Delivery</label>
                <input id="pos-delivery" data-pos-field data-field="delivery" inputMode="decimal" className={cn(field, "text-right tabular-nums")}
                  value={delivery} onChange={(e) => setDelivery(e.target.value)} onFocus={(e) => e.target.select()} placeholder="0" />
              </div>
              <div>
                <label className={label} htmlFor="pos-other">Other</label>
                <input id="pos-other" data-pos-field inputMode="decimal" className={cn(field, "text-right tabular-nums")}
                  value={other} onChange={(e) => setOther(e.target.value)} onFocus={(e) => e.target.select()} placeholder="0" />
              </div>
              <div>
                <label className={label} htmlFor="pos-discount">Discount</label>
                <input id="pos-discount" data-pos-field inputMode="decimal" className={cn(field, "text-right tabular-nums")}
                  value={discount} onChange={(e) => setDiscount(e.target.value)} onFocus={(e) => e.target.select()} placeholder="0" />
              </div>
              <div className="col-span-3">
                <label className={label} htmlFor="pos-notes">Notes <span className="normal-case font-normal">(optional, printed)</span></label>
                <input id="pos-notes" data-pos-field className={field} value={notes} maxLength={300}
                  onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Ordered from Al-Madina Restaurant" />
              </div>
            </div>

            <div className="rounded-xl bg-surface-highlight/60 p-4 text-sm">
              <div className="flex justify-between py-0.5"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{formatAmount(c.subtotal)}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-muted-foreground">+ Delivery / Other</span><span className="tabular-nums">{formatAmount(c.deliveryCharges + c.otherCharges)}</span></div>
              <div className="flex justify-between py-0.5"><span className="text-muted-foreground">− Discount</span><span className="tabular-nums">{formatAmount(c.discount)}</span></div>
              <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2">
                <span className="font-bold text-foreground">Grand Total</span>
                <span className="text-2xl font-bold font-serif text-gold-400 tabular-nums">{formatPKRBill(c.total)}</span>
              </div>
              <p className="mt-1 text-right text-[11px] text-muted-foreground">{amountInWords(c.total)}</p>
            </div>
          </div>

          {/* Internal accounting — never printed */}
          <div className="mt-4 rounded-xl border border-border">
            <button
              type="button" onClick={() => setAccountingOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-left"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Internal accounting <span className="normal-case font-normal">— not printed on the receipt</span>
              </span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", accountingOpen && "rotate-180")} />
            </button>
            {accountingOpen && (
              <div className="grid grid-cols-1 gap-3 border-t border-border px-4 py-3 sm:grid-cols-3">
                <div>
                  <label className={label} htmlFor="pos-charged">Customer Charged</label>
                  <input id="pos-charged" data-pos-field inputMode="decimal" className={cn(field, "text-right tabular-nums")}
                    value={customerCharged} onChange={(e) => setCustomerCharged(e.target.value)} onFocus={(e) => e.target.select()}
                    placeholder={formatAmount(c.total)} />
                </div>
                <div>
                  <label className={label} htmlFor="pos-vendor">Outside Vendor Cost</label>
                  <input id="pos-vendor" data-pos-field inputMode="decimal" className={cn(field, "text-right tabular-nums")}
                    value={vendorCost} onChange={(e) => setVendorCost(e.target.value)} onFocus={(e) => e.target.select()}
                    placeholder="Paid to restaurant/shop" />
                </div>
                <div>
                  <span className={label}>Guest House Profit</span>
                  <p className={cn(
                    "flex h-[38px] items-center justify-end rounded-xl px-3 text-base font-bold tabular-nums",
                    c.vendorCost === null ? "text-muted-foreground" : c.profit >= 0 ? "text-green-400 bg-green-500/10" : "text-red-400 bg-red-500/10",
                  )}>
                    {c.vendorCost === null ? "Enter vendor cost" : formatPKRBill(c.profit)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </fieldset>

        {attempted && c.errors.length > 0 && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">
            <ul className="list-disc space-y-0.5 pl-4">{c.errors.slice(0, 6).map((e) => <li key={e}>{e}</li>)}</ul>
          </div>
        )}

        {/* Actions */}
        <div className="card-luxury flex flex-wrap items-center gap-2 p-3">
          {mode === "edit" ? (
            <>
              <button type="button" onClick={() => void saveEdit()} disabled={!!busy}
                className="flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-bold text-background disabled:opacity-60">
                {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Save Changes
              </button>
              <Link href={`/pos/${props.receiptId}`} className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
                Discard
              </Link>
            </>
          ) : (
            <>
              <button type="button" onClick={() => void generate()} disabled={!!busy || !!saved}
                className="flex items-center gap-2 rounded-xl bg-gold-gradient px-5 py-2.5 text-sm font-bold text-background disabled:opacity-60">
                {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : <ReceiptText className="h-4 w-4" />}
                {saved ? "Generated" : "Generate Receipt"}
              </button>
              <PrintControls
                size={size} onSizeChange={setSize}
                onPrint={() => void onPrint()} onSavePdf={() => void onSavePdf()}
                busy={busy === "print" || busy === "pdf" ? busy : null}
                disabled={busy === "save"}
              />
              <button type="button" onClick={startNew} disabled={!!busy}
                className="ml-auto flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50">
                <RotateCcw className="h-4 w-4" /> New Receipt
              </button>
            </>
          )}
        </div>
      </div>

      {/* ═══ LIVE PREVIEW ═══ */}
      <div className="min-w-0">
        <div className="xl:sticky xl:top-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live preview · {size === "a4" ? "A4" : "80mm thermal"}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-border bg-[#e9e7e1] p-3 shadow-inner">
            <div className="mx-auto w-fit shadow-xl">
              <ReceiptPaper receipt={preview} size={size} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
