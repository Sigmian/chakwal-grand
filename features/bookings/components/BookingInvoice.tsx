"use client";

import { useRef, useState } from "react";
import { Printer, Download, Loader2 } from "lucide-react";
import { cn } from "@/utils";
import { siteConfig } from "@/config/site";

interface InvoiceData {
  bookingRef:     string;
  customerName:   string;
  customerPhone:  string;
  roomName:       string;
  roomNumber:     string;
  roomType:       string;
  branchName:     string;
  branchAddress?: string;
  checkIn:        string;
  checkOut:       string;
  nights:         number;
  pricePerNight:  number;
  baseAmount:     number;
  discountAmount: number;
  extraCharges:   number;
  taxAmount:      number;
  totalAmount:    number;
  paidAmount:     number;
  confirmedAt:    string;
}

interface Props {
  invoice: InvoiceData;
}

const INVOICE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; color: #111; background: #fff; }
  .page { max-width: 720px; margin: 0 auto; padding: 40px; position: relative; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #C9A84C; padding-bottom: 24px; margin-bottom: 24px; }
  .logo-area h1 { font-size: 22px; font-weight: 700; color: #0a1628; }
  .logo-area p { font-size: 12px; color: #666; margin-top: 2px; }
  .invoice-meta { text-align: right; }
  .invoice-meta .badge { display: inline-block; background: #C9A84C; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; margin-bottom: 8px; }
  .invoice-meta h2 { font-size: 18px; font-weight: 700; color: #0a1628; }
  .invoice-meta p { font-size: 12px; color: #666; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #C9A84C; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .field label { font-size: 10px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; }
  .field p { font-size: 13px; font-weight: 600; color: #111; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #999; text-align: left; padding: 8px 0; border-bottom: 1px solid #eee; }
  table td { font-size: 13px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
  .subtotal-row td { color: #666; font-size: 12px; }
  .discount-row td { color: #16a34a; font-size: 12px; }
  .total-row td { font-size: 15px; font-weight: 700; color: #0a1628; border-top: 2px solid #C9A84C; border-bottom: none; padding-top: 12px; }
  .total-row td:last-child { color: #C9A84C; }
  .paid-row td { font-size: 13px; color: #16a34a; border-bottom: none; }
  .balance-row td { font-size: 14px; font-weight: 700; color: #dc2626; border-bottom: none; }
  .payment-status { margin-top: 20px; text-align: right; }
  .status-stamp { display: inline-block; border: 4px solid #16a34a; color: #16a34a; font-size: 28px; font-weight: 900; letter-spacing: 6px; padding: 6px 20px; border-radius: 6px; transform: rotate(-8deg); opacity: 0.85; }
  .status-stamp.partial { border-color: #d97706; color: #d97706; font-size: 18px; letter-spacing: 2px; }
  .status-stamp.pending { border-color: #dc2626; color: #dc2626; font-size: 18px; letter-spacing: 2px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
  .footer strong { color: #C9A84C; }
`;

export function BookingInvoice({ invoice }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const balanceDue  = Math.max(0, invoice.totalAmount - invoice.paidAmount);
  const isFullyPaid = balanceDue === 0 && invoice.paidAmount > 0;
  const isPartial   = invoice.paidAmount > 0 && balanceDue > 0;
  const isPending   = invoice.paidAmount === 0;

  const fmt = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;

  const paymentStatusLabel = isFullyPaid ? "PAID" : isPartial ? "PARTIAL PAYMENT" : "PAYMENT PENDING";
  const paymentStampClass  = isFullyPaid ? "status-stamp" : isPartial ? "status-stamp partial" : "status-stamp pending";

  const getInvoiceHTML = () => ref.current?.innerHTML ?? "";

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<html><head><title>Invoice ${invoice.bookingRef}</title><style>${INVOICE_STYLES}</style></head><body>${getInvoiceHTML()}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { default: jsPDF }      = await import("jspdf");
      const { default: autoTable }  = await import("jspdf-autotable");

      const doc   = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const gold  = [201, 168, 76]  as [number, number, number];
      const dark  = [10,  22,  40]  as [number, number, number];
      const gray  = [100, 100, 100] as [number, number, number];
      const green = [22,  163, 74]  as [number, number, number];
      const red   = [220, 38,  38]  as [number, number, number];
      const amber = [217, 119, 6]   as [number, number, number];
      const light = [245, 245, 245] as [number, number, number];

      const W = doc.internal.pageSize.getWidth();
      let y = 20;

      // Gold top bar
      doc.setFillColor(...gold);
      doc.rect(0, 0, W, 2, "F");

      // Company name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...dark);
      doc.text("Chakwal Guest House", 20, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(invoice.branchName + (invoice.branchAddress ? ` · ${invoice.branchAddress}` : ""), 20, y + 6);
      doc.text(`Tel: ${siteConfig.phone}  |  ${siteConfig.url.replace("https://", "")}`, 20, y + 11);

      // Invoice badge (right)
      doc.setFillColor(...gold);
      doc.roundedRect(W - 60, y - 8, 40, 8, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("TAX INVOICE", W - 40, y - 2, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...dark);
      doc.text(invoice.bookingRef, W - 20, y + 5, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(`Date: ${invoice.confirmedAt}`, W - 20, y + 11, { align: "right" });

      // Divider
      y += 20;
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.8);
      doc.line(20, y, W - 20, y);
      y += 8;

      // Guest info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text("GUEST INFORMATION", 20, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(invoice.customerName, 20, y);
      doc.setTextColor(...gray);
      doc.text(`Phone: ${invoice.customerPhone}`, 20, y + 5);
      y += 14;

      // Booking details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text("BOOKING DETAILS", 20, y);
      y += 5;

      const details = [
        ["Room",      `${invoice.roomName} (#${invoice.roomNumber})`],
        ["Room Type", invoice.roomType],
        ["Check-In",  invoice.checkIn],
        ["Check-Out", invoice.checkOut],
        ["Nights",    String(invoice.nights)],
        ["Branch",    invoice.branchName],
      ];
      details.forEach(([label, val], i) => {
        const col = i % 2 === 0 ? 20 : W / 2;
        if (i % 2 === 0 && i > 0) y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...gray);
        doc.text(label, col, y);
        doc.setFontSize(10);
        doc.setTextColor(...dark);
        doc.text(val, col, y + 5);
      });
      y += 16;

      // Charges table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text("CHARGES", 20, y);
      y += 4;

      const tableBody: string[][] = [
        [`${invoice.roomName} — ${invoice.roomType}`, String(invoice.nights), fmt(invoice.pricePerNight), fmt(invoice.baseAmount)],
      ];
      if (invoice.discountAmount > 0)
        tableBody.push(["Discount", "", "", `(${fmt(invoice.discountAmount)})`]);
      if (invoice.extraCharges > 0)
        tableBody.push(["Extra Charges / Room Service", "", "", fmt(invoice.extraCharges)]);
      if (invoice.taxAmount > 0)
        tableBody.push(["Tax", "", "", fmt(invoice.taxAmount)]);

      autoTable(doc, {
        startY: y,
        head: [["Description", "Nights", "Rate / Night", "Amount"]],
        body: tableBody,
        foot: [["", "", "TOTAL AMOUNT", fmt(invoice.totalAmount)]],
        headStyles:   { fillColor: dark, textColor: [255,255,255], fontSize: 9, fontStyle: "bold" },
        footStyles:   { fillColor: light, textColor: dark, fontSize: 11, fontStyle: "bold" },
        bodyStyles:   { fontSize: 10, textColor: dark },
        columnStyles: { 3: { halign: "right" }, 2: { halign: "right" }, 1: { halign: "center" } },
        margin: { left: 20, right: 20 },
        theme: "grid",
      });

      let fy = (doc as any).lastAutoTable.finalY + 6;

      // Payment section
      if (invoice.paidAmount > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...green);
        doc.text(`Amount Paid: ${fmt(invoice.paidAmount)}`, W - 20, fy, { align: "right" });
        fy += 7;
      }

      if (balanceDue > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...red);
        doc.text(`Balance Due: ${fmt(balanceDue)}`, W - 20, fy, { align: "right" });
        fy += 10;
      }

      // Payment stamp
      const stampColor  = isFullyPaid ? green : isPartial ? amber : red;
      const stampText   = isFullyPaid ? "PAID" : isPartial ? "PARTIAL PAYMENT" : "PAYMENT PENDING";
      const stampFontSz = isFullyPaid ? 28 : 18;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(stampFontSz);
      doc.setTextColor(...stampColor);
      const stampX = W - 20;
      const stampY = fy + 6;
      doc.text(stampText, stampX, stampY, { align: "right" });

      // Draw border around stamp
      const txtW = doc.getTextWidth(stampText);
      doc.setDrawColor(...stampColor);
      doc.setLineWidth(1.2);
      doc.roundedRect(stampX - txtW - 6, stampY - stampFontSz * 0.4, txtW + 12, stampFontSz * 0.55, 2, 2);

      fy += stampFontSz * 0.6 + 10;

      // Footer
      doc.setFillColor(...gold);
      doc.rect(0, doc.internal.pageSize.getHeight() - 20, W, 20, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("Payment: Cash · CNIC required at check-in", W / 2, doc.internal.pageSize.getHeight() - 12, { align: "center" });
      doc.text("Thank you for choosing Chakwal Guest House!", W / 2, doc.internal.pageSize.getHeight() - 6, { align: "center" });

      doc.save(`Invoice-${invoice.bookingRef}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="card-luxury rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Invoice</h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-border text-muted-foreground text-xs font-semibold rounded-lg hover:text-foreground hover:bg-accent transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-semibold rounded-lg hover:bg-gold-500/20 disabled:opacity-50 transition-colors"
          >
            {downloading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Download className="w-3.5 h-3.5" />
            }
            {downloading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* Hidden printable invoice */}
      <div ref={ref} className="page" style={{ display: "none" }}>
        <div className="header">
          <div className="logo-area">
            <h1>Chakwal Guest House</h1>
            <p>{invoice.branchName}{invoice.branchAddress ? ` · ${invoice.branchAddress}` : ""}</p>
            <p>Tel: {siteConfig.phone}  |  {siteConfig.url.replace("https://", "")}</p>
          </div>
          <div className="invoice-meta">
            <div className="badge">Tax Invoice</div>
            <h2>{invoice.bookingRef}</h2>
            <p>Date: {invoice.confirmedAt}</p>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Guest Information</div>
          <div className="grid-2">
            <div className="field"><label>Guest Name</label><p>{invoice.customerName}</p></div>
            <div className="field"><label>Phone</label><p>{invoice.customerPhone}</p></div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Booking Details</div>
          <div className="grid-2">
            <div className="field"><label>Room</label><p>{invoice.roomName} (#{invoice.roomNumber})</p></div>
            <div className="field"><label>Room Type</label><p>{invoice.roomType}</p></div>
            <div className="field"><label>Check-In</label><p>{invoice.checkIn}</p></div>
            <div className="field"><label>Check-Out</label><p>{invoice.checkOut}</p></div>
            <div className="field"><label>Nights</label><p>{invoice.nights}</p></div>
            <div className="field"><label>Branch</label><p>{invoice.branchName}</p></div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Charges</div>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Nights</th>
                <th>Rate/Night</th>
                <th style={{ textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{invoice.roomName} — {invoice.roomType}</td>
                <td>{invoice.nights}</td>
                <td>{fmt(invoice.pricePerNight)}</td>
                <td style={{ textAlign: "right" }}>{fmt(invoice.baseAmount)}</td>
              </tr>
              {invoice.discountAmount > 0 && (
                <tr className="discount-row">
                  <td colSpan={3}>Discount</td>
                  <td style={{ textAlign: "right" }}>({fmt(invoice.discountAmount)})</td>
                </tr>
              )}
              {invoice.extraCharges > 0 && (
                <tr className="subtotal-row">
                  <td colSpan={3}>Extra Charges / Room Service</td>
                  <td style={{ textAlign: "right" }}>{fmt(invoice.extraCharges)}</td>
                </tr>
              )}
              {invoice.taxAmount > 0 && (
                <tr className="subtotal-row">
                  <td colSpan={3}>Tax</td>
                  <td style={{ textAlign: "right" }}>{fmt(invoice.taxAmount)}</td>
                </tr>
              )}
              <tr className="total-row">
                <td colSpan={3}>TOTAL AMOUNT</td>
                <td style={{ textAlign: "right" }}>{fmt(invoice.totalAmount)}</td>
              </tr>
              {invoice.paidAmount > 0 && (
                <tr className="paid-row">
                  <td colSpan={3}>Amount Paid</td>
                  <td style={{ textAlign: "right" }}>{fmt(invoice.paidAmount)}</td>
                </tr>
              )}
              {balanceDue > 0 && (
                <tr className="balance-row">
                  <td colSpan={3}><strong>Balance Due</strong></td>
                  <td style={{ textAlign: "right", color: "#dc2626" }}><strong>{fmt(balanceDue)}</strong></td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Payment stamp */}
          <div className="payment-status">
            <div className={paymentStampClass}>{paymentStatusLabel}</div>
          </div>
        </div>

        <div className="footer">
          <p>Payment: <strong>Cash</strong> · CNIC required at check-in</p>
          <p style={{ marginTop: "6px" }}>Thank you for choosing <strong>Chakwal Guest House</strong> — we look forward to your stay!</p>
          <p style={{ marginTop: "6px" }}>{siteConfig.url.replace("https://", "")} · WhatsApp: {siteConfig.phone}</p>
        </div>
      </div>

      {/* On-screen preview card */}
      <div className="bg-surface-elevated rounded-xl p-4 border border-border/50 text-xs space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Booking Ref</span>
          <span className="font-bold text-foreground font-mono">{invoice.bookingRef}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Guest</span>
          <span className="font-semibold text-foreground">{invoice.customerName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Room</span>
          <span className="font-semibold text-foreground">{invoice.roomName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Nights</span>
          <span className="font-semibold text-foreground">{invoice.nights}</span>
        </div>

        {/* Charges breakdown */}
        <div className="h-px bg-border/50 my-1" />
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Room Rate</span>
          <span className="text-foreground">{fmt(invoice.baseAmount)}</span>
        </div>
        {invoice.discountAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Discount</span>
            <span className="text-emerald-400">({fmt(invoice.discountAmount)})</span>
          </div>
        )}
        {invoice.extraCharges > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Extra / Services</span>
            <span className="text-foreground">{fmt(invoice.extraCharges)}</span>
          </div>
        )}
        {invoice.taxAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Tax</span>
            <span className="text-foreground">{fmt(invoice.taxAmount)}</span>
          </div>
        )}

        {/* Total */}
        <div className="h-px bg-border/50 my-1" />
        <div className="flex justify-between items-center">
          <span className="font-bold text-foreground">Total</span>
          <span className="font-bold text-gold-400 text-sm">{fmt(invoice.totalAmount)}</span>
        </div>

        {/* Paid */}
        {invoice.paidAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Paid</span>
            <span className="font-semibold text-emerald-400">{fmt(invoice.paidAmount)}</span>
          </div>
        )}

        {/* Balance or PAID stamp */}
        {isFullyPaid ? (
          <div className="flex justify-center pt-1">
            <span className="px-5 py-1 border-2 border-emerald-500 text-emerald-500 font-black text-base tracking-widest rounded rotate-[-4deg] inline-block">
              PAID
            </span>
          </div>
        ) : balanceDue > 0 ? (
          <div className="flex justify-between items-center pt-1">
            <span className={cn("font-bold", isPartial ? "text-amber-400" : "text-red-400")}>
              {isPartial ? "Balance Due" : "Payment Pending"}
            </span>
            <span className={cn("font-bold text-sm", isPartial ? "text-amber-400" : "text-red-400")}>
              {fmt(balanceDue)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
