"use client";

import { useRef } from "react";
import { Printer, Download } from "lucide-react";

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

export function BookingInvoice({ invoice }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win || !ref.current) return;
    win.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.bookingRef}</title>
          <style>
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
          </style>
        </head>
        <body>
          ${ref.current.innerHTML}
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const fmt = (n: number) => `PKR ${n.toLocaleString("en-PK")}`;

  return (
    <div className="card-luxury rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Invoice</h3>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-semibold rounded-lg hover:bg-gold-500/20 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
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
