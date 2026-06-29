"use client";

import { useState, useTransition } from "react";
import { Search, CheckCircle2, Clock, XCircle, Loader2, Download, MessageCircle, CalendarDays, BedDouble, MapPin, Phone, Users } from "lucide-react";
import { lookupBooking } from "@/server/actions/public";
import { formatPKR } from "@/utils";
import { siteConfig } from "@/config/site";

type BookingData = NonNullable<Awaited<ReturnType<typeof lookupBooking>>["booking"]>;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle2; desc: string }> = {
  PENDING:      { label: "Pending Confirmation", color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20",  icon: Clock,         desc: "Your booking is received. We'll confirm within 30 minutes via phone." },
  CONFIRMED:    { label: "Confirmed",            color: "text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20",icon: CheckCircle2,  desc: "Your booking is confirmed! You can arrive anytime — check-in is flexible." },
  CHECKED_IN:   { label: "Currently Checked In", color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20",    icon: CheckCircle2,  desc: "Welcome! You are currently checked in. Enjoy your stay." },
  CHECKED_OUT:  { label: "Checked Out",          color: "text-muted-foreground", bg: "bg-surface-elevated border-border", icon: CheckCircle2, desc: "We hope you enjoyed your stay at Chakwal Guest House! Visit us again soon." },
  CANCELLED:    { label: "Cancelled",            color: "text-red-400",    bg: "bg-red-500/10 border-red-500/20",      icon: XCircle,       desc: "This booking has been cancelled. Contact us if this was a mistake." },
};

const PAYMENT_COLOR: Record<string, string> = {
  UNPAID:         "text-red-400",
  PARTIAL: "text-amber-400",
  PAID:           "text-emerald-400",
  REFUNDED:       "text-blue-400",
};

export function BookingLookup() {
  const [ref, setRef]         = useState("");
  const [result, setResult]   = useState<{ booking?: BookingData; error?: string } | null>(null);
  const [pending, start]      = useTransition();
  const [receiptLoading, setReceiptLoading] = useState(false);

  const search = () => {
    if (!ref.trim()) return;
    start(async () => {
      const res = await lookupBooking(ref);
      setResult(res as any);
    });
  };

  const downloadReceipt = async (b: BookingData) => {
    setReceiptLoading(true);
    try {
      const { default: jsPDF }     = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const gold = [201, 168, 76]  as [number, number, number];
      const dark = [10, 22, 40]   as [number, number, number];
      const gray = [100, 100, 100] as [number, number, number];
      const W    = doc.internal.pageSize.getWidth();
      let   y    = 20;

      const isPaid = b.paymentStatus === "PAID";
      const badgeColor: [number, number, number] = isPaid ? [22, 163, 74] : [239, 68, 68];
      const badgeLabel = isPaid ? "PAID" : b.paymentStatus === "PARTIAL" ? "PARTIAL" : "UNPAID";

      // Top gold stripe
      doc.setFillColor(...gold);
      doc.rect(0, 0, W, 2, "F");

      // Header
      doc.setFont("helvetica", "bold"); doc.setFontSize(18); doc.setTextColor(...dark);
      doc.text("Chakwal Guest House", 20, y);
      doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...gray);
      doc.text(`${b.branchName}  ·  Tel: ${b.branchPhone ?? siteConfig.phone}  ·  ${siteConfig.url.replace("https://", "")}`, 20, y + 6);

      // Payment badge
      doc.setFillColor(...badgeColor);
      doc.roundedRect(W - 52, y - 8, 32, 9, 2, 2, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
      doc.text(badgeLabel, W - 36, y - 1.5, { align: "center" });
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...gray);
      doc.text(isPaid ? "Payment received" : "Pay on arrival · Cash only", W - 20, y + 6, { align: "right" });

      y += 16;
      doc.setDrawColor(...gold); doc.setLineWidth(0.7); doc.line(20, y, W - 20, y); y += 8;

      // Booking ref + status
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...gold);
      doc.text("BOOKING REFERENCE", 20, y); y += 5;
      doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(...dark);
      doc.text(b.bookingRef, 20, y); y += 5;
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...gray);
      doc.text(`Status: ${STATUS_CONFIG[b.status]?.label ?? b.status}  ·  Booked: ${new Date(b.createdAt).toLocaleDateString("en-PK")}`, 20, y); y += 12;

      // Guest info
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...gold);
      doc.text("GUEST", 20, y); y += 5;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(...dark);
      doc.text(b.guestName, 20, y);
      doc.setTextColor(...gray); doc.text(`Phone: ${b.guestPhone}`, 20, y + 5); y += 14;

      // Stay details
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...gold);
      doc.text("BOOKING DETAILS", 20, y); y += 5;

      const ci = new Date(b.checkIn).toLocaleDateString("en-PK",  { weekday:"short", day:"numeric", month:"long", year:"numeric" });
      const co = new Date(b.checkOut).toLocaleDateString("en-PK", { weekday:"short", day:"numeric", month:"long", year:"numeric" });

      const pairs = [
        ["Room",      `${b.roomName} (Room ${b.roomNumber})`],
        ["Branch",    b.branchName],
        ["Check-In",  ci],
        ["Check-Out", co],
        ["Duration",  `${b.nights} night${b.nights !== 1 ? "s" : ""}`],
        ["Guests",    `${b.adults} adult${b.adults !== 1 ? "s" : ""}${b.children ? ` + ${b.children} child${b.children !== 1 ? "ren" : ""}` : ""}`],
      ];
      pairs.forEach(([label, val], i) => {
        const col = i % 2 === 0 ? 20 : W / 2;
        if (i % 2 === 0 && i > 0) y += 9;
        doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...gray);
        doc.text(label, col, y);
        doc.setFontSize(10); doc.setTextColor(...dark);
        doc.text(val, col, y + 5);
      });
      y += 18;

      // Charges table
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...gold);
      doc.text("CHARGES", 20, y); y += 4;

      const tableBody: string[][] = [
        [`${b.roomName} — ${b.nights} night${b.nights !== 1 ? "s" : ""}`, `PKR ${(b.baseAmount / b.nights).toLocaleString("en-PK")}`, String(b.nights), `PKR ${b.baseAmount.toLocaleString("en-PK")}`],
      ];
      if (b.discountAmount > 0) tableBody.push(["Discount", "", "", `- PKR ${b.discountAmount.toLocaleString("en-PK")}`]);

      autoTable(doc, {
        startY: y,
        head:   [["Description", "Rate/Night", "Nights", "Amount"]],
        body:   tableBody,
        foot:   [
          ["", "", "Total", `PKR ${b.totalAmount.toLocaleString("en-PK")}`],
          ...(b.paidAmount > 0 && b.paidAmount < b.totalAmount ? [["", "", "Paid", `PKR ${b.paidAmount.toLocaleString("en-PK")}`]] : []),
          ...(!isPaid ? [["", "", "Balance Due", `PKR ${(b.totalAmount - b.paidAmount).toLocaleString("en-PK")}`]] : []),
        ],
        headStyles: { fillColor: dark, textColor: [255,255,255], fontSize: 9, fontStyle: "bold" },
        footStyles: { fillColor: [245,245,245], textColor: dark, fontSize: 10, fontStyle: "bold" },
        bodyStyles: { fontSize: 10, textColor: dark },
        columnStyles: { 0: { cellWidth: 70 }, 3: { halign: "right" }, 2: { halign: "center" }, 1: { halign: "right" } },
        margin: { left: 20, right: 20 }, theme: "grid",
      });

      const finalY = (doc as any).lastAutoTable.finalY + 8;

      // Payment callout
      if (!isPaid) {
        doc.setFillColor(254, 242, 242); doc.setDrawColor(239, 68, 68); doc.setLineWidth(0.5);
        doc.roundedRect(20, finalY, W - 40, 14, 3, 3, "FD");
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(239, 68, 68);
        doc.text(`⚠  PAYMENT PENDING — Pay PKR ${(b.totalAmount - b.paidAmount).toLocaleString("en-PK")} in cash on arrival`, W / 2, finalY + 9, { align: "center" });
      } else {
        doc.setFillColor(240, 253, 244); doc.setDrawColor(22, 163, 74); doc.setLineWidth(0.5);
        doc.roundedRect(20, finalY, W - 40, 14, 3, 3, "FD");
        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(22, 163, 74);
        doc.text("✓  PAYMENT RECEIVED — Thank you!", W / 2, finalY + 9, { align: "center" });
      }

      // Footer bar
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(...gold);
      doc.rect(0, pageH - 20, W, 20, "F");
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
      doc.text("Check-in: Anytime (flexible)  ·  Check-out: 12:00 PM  ·  CNIC required at check-in", W / 2, pageH - 12, { align: "center" });
      doc.text(`Thank you for choosing Chakwal Guest House  ·  ${siteConfig.url.replace("https://", "")}`, W / 2, pageH - 6,  { align: "center" });

      doc.save(`Receipt-${b.bookingRef}.pdf`);
    } catch (err) {
      console.error("Receipt error", err);
    } finally {
      setReceiptLoading(false);
    }
  };

  const b = result?.booking;
  const statusCfg = b ? (STATUS_CONFIG[b.status] ?? STATUS_CONFIG.PENDING) : null;
  const StatusIcon = statusCfg?.icon ?? Clock;

  const fmt = (d: string) => new Date(d).toLocaleDateString("en-PK", { weekday:"short", day:"numeric", month:"long", year:"numeric" });

  return (
    <section className="min-h-[70vh] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-3">Self Service</p>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-foreground mb-3">
            Check My Booking
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter the booking reference from your confirmation screen or SMS to view your reservation details.
          </p>
        </div>

        {/* Search box */}
        <div className="card-luxury rounded-2xl p-6 mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Booking Reference
          </label>
          <div className="flex gap-3">
            <input
              value={ref}
              onChange={e => setRef(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="e.g. BK-2026-XXXXXX"
              className="flex-1 bg-surface-base border border-border rounded-xl px-4 py-3 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/20 transition-all uppercase tracking-widest"
            />
            <button
              onClick={search}
              disabled={pending || !ref.trim()}
              className="flex items-center gap-2 px-5 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-lg transition-all disabled:opacity-50"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {pending ? "Looking…" : "Search"}
            </button>
          </div>
          {result?.error && (
            <p className="mt-3 text-sm text-red-400 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              {result.error}
            </p>
          )}
        </div>

        {/* Booking result */}
        {b && statusCfg && (
          <div className="space-y-4 animate-fade-in">
            {/* Status banner */}
            <div className={`rounded-2xl p-5 border flex items-start gap-4 ${statusCfg.bg}`}>
              <StatusIcon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${statusCfg.color}`} />
              <div>
                <p className={`font-bold text-sm ${statusCfg.color}`}>{statusCfg.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{statusCfg.desc}</p>
              </div>
            </div>

            {/* Details card */}
            <div className="card-luxury rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Booking Reference</p>
                  <p className="text-2xl font-bold font-mono text-gold-400 mt-0.5">{b.bookingRef}</p>
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                  b.paymentStatus === "PAID"           ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                  b.paymentStatus === "PARTIAL" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" :
                                                         "bg-red-500/10 border-red-500/20 text-red-400"
                }`}>
                  {b.paymentStatus === "PAID" ? "Paid" : b.paymentStatus === "PARTIAL" ? "Partial" : "Unpaid"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <BedDouble className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Room</p>
                    <p className="font-semibold text-foreground">{b.roomName} — Room {b.roomNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Branch</p>
                    <p className="font-semibold text-foreground">{b.branchName}</p>
                    {b.branchAddress && <p className="text-xs text-muted-foreground">{b.branchAddress}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stay Dates</p>
                    <p className="font-semibold text-foreground">{fmt(b.checkIn)} → {fmt(b.checkOut)}</p>
                    <p className="text-xs text-muted-foreground">{b.nights} night{b.nights !== 1 ? "s" : ""}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Guests</p>
                    <p className="font-semibold text-foreground">
                      {b.adults} adult{b.adults !== 1 ? "s" : ""}
                      {b.children > 0 ? ` + ${b.children} child${b.children !== 1 ? "ren" : ""}` : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bill summary */}
              <div className="border-t border-border pt-4 space-y-2">
                {b.discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-emerald-400 font-semibold">- {formatPKR(b.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-foreground">Total Amount</span>
                  <span className="text-gold-400 text-base">{formatPKR(b.totalAmount)}</span>
                </div>
                {b.paidAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="text-emerald-400 font-semibold">{formatPKR(b.paidAmount)}</span>
                  </div>
                )}
                {b.paymentStatus !== "PAID" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-red-400 font-semibold">Balance Due (on arrival)</span>
                    <span className="text-red-400 font-bold">{formatPKR(b.totalAmount - b.paidAmount)}</span>
                  </div>
                )}
              </div>

              {b.specialRequests && (
                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground mb-1">Special Requests</p>
                  <p className="text-sm text-foreground">{b.specialRequests}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => downloadReceipt(b)}
                disabled={receiptLoading}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-lg transition-all disabled:opacity-60"
              >
                {receiptLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {receiptLoading ? "Generating…" : "Download Receipt"}
              </button>
              <a
                href={`https://wa.me/${siteConfig.phoneE164.replace("+", "")}?text=Hi, I need help with my booking: ${b.bookingRef}`}
                target="_blank" rel="noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold rounded-xl hover:bg-[#25D366]/25 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Support
              </a>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              Need to cancel or modify? Call us at{" "}
              <a href={`tel:${siteConfig.phoneE164}`} className="text-gold-400 hover:underline">{siteConfig.phone}</a>
            </p>
          </div>
        )}

        {/* Empty state */}
        {!result && !pending && (
          <div className="text-center text-muted-foreground py-8">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Your booking reference looks like <span className="font-mono text-gold-400">BK-2026-XXXXXX</span></p>
            <p className="text-xs mt-1">You received it on your booking confirmation screen.</p>
          </div>
        )}
      </div>
    </section>
  );
}
