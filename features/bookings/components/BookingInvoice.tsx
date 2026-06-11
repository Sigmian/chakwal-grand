"use client";

import { useRef, useState } from "react";
import { Printer, Download, Loader2 } from "lucide-react";

interface InvoiceData {
  bookingRef:    string;
  customerName:  string;
  customerPhone: string;
  roomName:      string;
  roomNumber:    string;
  roomType:      string;
  branchName:    string;
  branchAddress?: string;
  checkIn:       string;
  checkOut:      string;
  nights:        number;
  pricePerNight: number;
  totalAmount:   number;
  confirmedAt:   string;
}

interface Props {
  invoice: InvoiceData;
}

const INVOICE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', sans-serif; color: #111; background: #fff; }
  .page { max-width: 720px; margin: 0 auto; padding: 40px; }
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
  table td { font-size: 13px; padding: 10px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top; }
  .total-row td { font-size: 15px; font-weight: 700; color: #0a1628; border-bottom: none; padding-top: 14px; }
  .total-row td:last-child { color: #C9A84C; }
  .status-badge { display: inline-block; background: #dcfce7; color: #16a34a; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 3px 10px; border-radius: 20px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #999; }
  .footer strong { color: #C9A84C; }
`;

export function BookingInvoice({ invoice }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

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
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const gold  = [201, 168, 76]  as [number, number, number];
      const dark  = [10,  22,  40]  as [number, number, number];
      const gray  = [100, 100, 100] as [number, number, number];
      const light = [245, 245, 245] as [number, number, number];

      const W = doc.internal.pageSize.getWidth();
      let y = 20;

      // Header bar
      doc.setFillColor(...gold);
      doc.rect(0, 0, W, 2, "F");

      // Company name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...dark);
      doc.text("Chakwal Grand Guest House", 20, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(invoice.branchName + (invoice.branchAddress ? ` · ${invoice.branchAddress}` : ""), 20, y + 6);
      doc.text("Tel: 0334-7742767  |  www.staychakwal.de", 20, y + 11);

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

      // Guest info section
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

      // Stay details section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text("BOOKING DETAILS", 20, y);
      y += 5;

      const details = [
        ["Room", `${invoice.roomName} (#${invoice.roomNumber})`],
        ["Room Type", invoice.roomType],
        ["Check-In", invoice.checkIn],
        ["Check-Out", invoice.checkOut],
        ["Nights", String(invoice.nights)],
        ["Branch", invoice.branchName],
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

      autoTable(doc, {
        startY: y,
        head: [["Description", "Nights", "Rate / Night", "Amount"]],
        body: [
          [
            `${invoice.roomName} — ${invoice.roomType}`,
            String(invoice.nights),
            `PKR ${invoice.pricePerNight.toLocaleString("en-PK")}`,
            `PKR ${(invoice.pricePerNight * invoice.nights).toLocaleString("en-PK")}`,
          ],
        ],
        foot: [["", "", "Total Amount Due", `PKR ${invoice.totalAmount.toLocaleString("en-PK")}`]],
        headStyles:  { fillColor: dark, textColor: [255,255,255], fontSize: 9, fontStyle: "bold" },
        footStyles:  { fillColor: light, textColor: dark, fontSize: 11, fontStyle: "bold" },
        bodyStyles:  { fontSize: 10, textColor: dark },
        columnStyles: { 3: { halign: "right" }, 2: { halign: "right" }, 1: { halign: "center" } },
        margin: { left: 20, right: 20 },
        theme: "grid",
      });

      const finalY = (doc as any).lastAutoTable.finalY + 10;

      // Footer
      doc.setFillColor(...gold);
      doc.rect(0, doc.internal.pageSize.getHeight() - 20, W, 20, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("Payment: Cash on Arrival  |  CNIC required at check-in", W / 2, doc.internal.pageSize.getHeight() - 12, { align: "center" });
      doc.text("Thank you for choosing Chakwal Grand Guest House!", W / 2, doc.internal.pageSize.getHeight() - 6, { align: "center" });

      doc.save(`Invoice-${invoice.bookingRef}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    } finally {
      setDownloading(false);
    }
  };

  const fmt = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;

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
            <h1>Chakwal Grand Guest House</h1>
            <p>{invoice.branchName}{invoice.branchAddress ? ` · ${invoice.branchAddress}` : ""}</p>
            <p>Tel: 0334-7742767</p>
          </div>
          <div className="invoice-meta">
            <div className="badge">Tax Invoice</div>
            <h2>{invoice.bookingRef}</h2>
            <p>Date: {invoice.confirmedAt}</p>
            <p><span className="status-badge">CONFIRMED</span></p>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Guest Information</div>
          <div className="grid-2">
            <div className="field">
              <label>Guest Name</label>
              <p>{invoice.customerName}</p>
            </div>
            <div className="field">
              <label>Phone</label>
              <p>{invoice.customerPhone}</p>
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-title">Booking Details</div>
          <div className="grid-2">
            <div className="field">
              <label>Room</label>
              <p>{invoice.roomName} (#{invoice.roomNumber})</p>
            </div>
            <div className="field">
              <label>Room Type</label>
              <p>{invoice.roomType}</p>
            </div>
            <div className="field">
              <label>Check-In</label>
              <p>{invoice.checkIn}</p>
            </div>
            <div className="field">
              <label>Check-Out</label>
              <p>{invoice.checkOut}</p>
            </div>
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
                <td style={{ textAlign: "right" }}>{fmt(invoice.pricePerNight * invoice.nights)}</td>
              </tr>
              <tr className="total-row">
                <td colSpan={3}>Total Amount Due</td>
                <td style={{ textAlign: "right" }}>{fmt(invoice.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="footer">
          <p>Payment: <strong>Cash on Arrival</strong> · CNIC required at check-in</p>
          <p style={{ marginTop: "6px" }}>Thank you for choosing <strong>Chakwal Grand Guest House</strong> — we look forward to your stay!</p>
          <p style={{ marginTop: "6px" }}>www.staychakwal.de · WhatsApp: 0334-7742767</p>
        </div>
      </div>

      {/* On-screen preview */}
      <div className="bg-surface-elevated rounded-xl p-4 border border-border/50 text-xs space-y-3">
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
        <div className="h-px bg-border/50" />
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground font-bold">Total</span>
          <span className="font-bold text-gold-400 text-sm">PKR {invoice.totalAmount.toLocaleString("en-PK")}</span>
        </div>
      </div>
    </div>
  );
}
