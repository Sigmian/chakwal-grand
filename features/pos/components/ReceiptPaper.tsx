// ============================================================
// features/pos/components/ReceiptPaper.tsx
// The customer-facing receipt. Used for the live preview, the saved
// receipt view, the print copy and (mirrored) the PDF. It never shows
// internal accounting (vendor cost / profit).
// ============================================================

import { siteConfig } from "@/config/site";
import { amountInWords, formatAmount, formatPKRBill, formatQty } from "@/lib/pos/receipt-math";

export type PrintSize = "a4" | "thermal";

export interface ReceiptView {
  receiptNo: string | null;          // null while still a draft
  createdAt: string;                 // ISO
  status?: "ACTIVE" | "CANCELLED";
  branchName: string;
  branchAddress: string;
  branchPhone?: string | null;
  roomNo?: string | null;
  guestName?: string | null;
  cashier: string;
  notes?: string | null;
  items: { name: string; qty: number; rate: number; amount: number }[];
  subtotal: number;
  deliveryCharges: number;
  otherCharges: number;
  discount: number;
  total: number;
}

const PKT = "Asia/Karachi";
export const receiptDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { timeZone: PKT, day: "2-digit", month: "short", year: "numeric" });
export const receiptTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-US", { timeZone: PKT, hour: "2-digit", minute: "2-digit", hour12: true });

export function roomGuestLabel(r: Pick<ReceiptView, "roomNo" | "guestName">) {
  const room = r.roomNo ? `Room ${r.roomNo}` : "";
  return [room, r.guestName ?? ""].filter(Boolean).join(" / ") || "—";
}

export function ReceiptPaper({ receipt: r, size }: { receipt: ReceiptView; size: PrintSize }) {
  const phone = r.branchPhone || siteConfig.phone;
  return (
    <div className={`cgh-receipt size-${size}`}>
      {r.status === "CANCELLED" && <div className="r-void"><span>CANCELLED</span></div>}

      <div className="r-center">
        {/* Plain <img> (not next/image) so it is guaranteed to be loaded when printing. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="r-logo" src="/images/logo.png" alt="Chakwal Guest House" />
        <div className="r-brand">CHAKWAL GUEST HOUSE</div>
        <div className="r-tagline">{siteConfig.tagline}</div>
        <div className="r-heading"><span>Guest Order Receipt</span></div>
      </div>

      {/* Pairs flow down columns on A4 (Receipt/Date/Time | Branch/Room/Cashier), one column on 80mm. */}
      <dl className="r-meta">
        <div><dt>Receipt No</dt><dd>{r.receiptNo ?? "Assigned on save"}</dd></div>
        <div><dt>Date</dt><dd>{receiptDate(r.createdAt)}</dd></div>
        <div><dt>Time</dt><dd>{receiptTime(r.createdAt)}</dd></div>
        <div><dt>Branch</dt><dd>{r.branchName}</dd></div>
        <div><dt>Room / Guest</dt><dd>{roomGuestLabel(r)}</dd></div>
        <div><dt>Cashier</dt><dd>{r.cashier}</dd></div>
      </dl>

      <table className="r-items">
        <thead>
          <tr>
            <th className="idx">#</th>
            <th>Item</th>
            <th className="num">Qty</th>
            <th className="num">Rate</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {r.items.length === 0 ? (
            <tr><td colSpan={5} className="r-center" style={{ color: "#8a91a0", padding: "4mm 0" }}>No items yet</td></tr>
          ) : r.items.map((it, i) => (
            <tr key={i}>
              <td className="idx">{i + 1}</td>
              <td>{it.name}</td>
              <td className="num">{formatQty(it.qty)}</td>
              <td className="num">{formatAmount(it.rate)}</td>
              <td className="num">{formatAmount(it.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="r-sums">
        <div className="row"><span>Subtotal</span><span>{formatAmount(r.subtotal)}</span></div>
        {r.deliveryCharges > 0 && <div className="row muted"><span>Delivery Charges</span><span>{formatAmount(r.deliveryCharges)}</span></div>}
        {r.otherCharges > 0 && <div className="row muted"><span>Other Charges</span><span>{formatAmount(r.otherCharges)}</span></div>}
        {r.discount > 0 && <div className="row muted"><span>Discount</span><span>− {formatAmount(r.discount)}</span></div>}
      </div>

      <div className="r-total"><span className="label">TOTAL</span><span className="value">{formatPKRBill(r.total)}</span></div>

      <div className="r-payable">
        <div>Amount Payable : <b>{formatPKRBill(r.total)}</b></div>
        <div className="r-words">({amountInWords(r.total)})</div>
      </div>

      {r.notes && <div className="r-notes">Note: {r.notes}</div>}

      <div className="r-center">
        <div className="r-thanks">Thank You</div>
        <div className="r-for">For choosing Chakwal Guest House</div>
      </div>

      <div className="r-foot">
        <span>{r.branchAddress}</span>
        <span className="phone">{phone}</span>
      </div>
      <div className="r-center r-sign">— Chakwal Guest House —</div>
    </div>
  );
}
