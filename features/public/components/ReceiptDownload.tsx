"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { siteConfig } from "@/config/site";

interface Props {
  bookingRef:      string;
  guestName:       string;
  guestPhone:      string;
  roomName:        string;
  roomNumber:      string;
  branchName:      string;
  checkIn:         string; // YYYY-MM-DD
  checkOut:        string;
  nights:          number;
  adults:          number;
  children:        number;
  pricePerNight:   number;
  discountAmount:  number;
  totalAmount:     number;
}

export function ReceiptDownload(props: Props) {
  const [loading, setLoading] = useState(false);

  const download = async () => {
    setLoading(true);
    try {
      const { default: jsPDF }     = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc  = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const gold = [201, 168, 76]  as [number, number, number];
      const dark = [10,  22,  40]  as [number, number, number];
      const gray = [100, 100, 100] as [number, number, number];
      const W    = doc.internal.pageSize.getWidth();
      let   y    = 20;

      // Top gold stripe
      doc.setFillColor(...gold);
      doc.rect(0, 0, W, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...dark);
      doc.text("Chakwal Guest House", 20, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(`${props.branchName} · Tel: ${siteConfig.phone} · ${siteConfig.url.replace("https://", "")}`, 20, y + 6);

      // UNPAID badge
      doc.setFillColor(239, 68, 68);
      doc.roundedRect(W - 55, y - 8, 35, 9, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("UNPAID", W - 37.5, y - 1.5, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text("Pay on arrival · Cash only", W - 20, y + 5, { align: "right" });

      y += 16;
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.7);
      doc.line(20, y, W - 20, y);
      y += 8;

      // Booking ref
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text("BOOKING REFERENCE", 20, y);
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(...dark);
      doc.text(props.bookingRef, 20, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      doc.text(`Issued: ${new Date().toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}`, 20, y);
      y += 12;

      // Guest info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text("GUEST INFORMATION", 20, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(props.guestName, 20, y);
      doc.setTextColor(...gray);
      doc.text(`Phone: ${props.guestPhone}`, 20, y + 5);
      y += 14;

      // Booking details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text("BOOKING DETAILS", 20, y);
      y += 5;

      const ciStr = new Date(props.checkIn).toLocaleDateString("en-PK",  { weekday: "short", day: "numeric", month: "long", year: "numeric" });
      const coStr = new Date(props.checkOut).toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
      const guests = `${props.adults} adult${props.adults > 1 ? "s" : ""}${props.children ? " + " + props.children + " child" : ""}`;

      const details = [
        ["Room",      `${props.roomName} (Room ${props.roomNumber})`],
        ["Branch",    props.branchName],
        ["Check-In",  ciStr],
        ["Check-Out", coStr],
        ["Duration",  `${props.nights} night${props.nights > 1 ? "s" : ""}`],
        ["Guests",    guests],
      ];
      details.forEach(([label, val], i) => {
        const col = i % 2 === 0 ? 20 : W / 2;
        if (i % 2 === 0 && i > 0) y += 9;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...gray);
        doc.text(label, col, y);
        doc.setFontSize(10);
        doc.setTextColor(...dark);
        doc.text(val, col, y + 5);
      });
      y += 18;

      // Charges
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text("CHARGES", 20, y);
      y += 4;

      const base = props.pricePerNight * props.nights;
      const tableBody: string[][] = [
        [`${props.roomName} — ${props.nights} night${props.nights > 1 ? "s" : ""}`,
          `PKR ${props.pricePerNight.toLocaleString("en-PK")}`,
          String(props.nights),
          `PKR ${base.toLocaleString("en-PK")}`],
      ];
      if (props.discountAmount > 0) {
        tableBody.push(["Discount Applied", "", "", `- PKR ${props.discountAmount.toLocaleString("en-PK")}`]);
      }

      autoTable(doc, {
        startY: y,
        head:   [["Description", "Rate/Night", "Nights", "Amount"]],
        body:   tableBody,
        foot:   [["", "", "Total Due", `PKR ${props.totalAmount.toLocaleString("en-PK")}`]],
        headStyles: { fillColor: dark, textColor: [255, 255, 255], fontSize: 9, fontStyle: "bold" },
        footStyles: { fillColor: [245, 245, 245], textColor: dark, fontSize: 11, fontStyle: "bold" },
        bodyStyles: { fontSize: 10, textColor: dark },
        columnStyles: { 0: { cellWidth: 70 }, 3: { halign: "right" }, 2: { halign: "center" }, 1: { halign: "right" } },
        margin: { left: 20, right: 20 },
        theme: "grid",
      });

      const finalY = (doc as any).lastAutoTable.finalY + 8;

      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(239, 68, 68);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, finalY, W - 40, 20, 3, 3, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(239, 68, 68);
      doc.text("PAYMENT PENDING", W / 2, finalY + 7, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(
        "Please pay PKR " + props.totalAmount.toLocaleString("en-PK") + " in cash on arrival · CNIC required",
        W / 2, finalY + 14, { align: "center" }
      );

      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(...gold);
      doc.rect(0, pageH - 20, W, 20, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("Check-in: Anytime (flexible)  ·  Check-out: 12:00 PM  ·  CNIC required at check-in", W / 2, pageH - 12, { align: "center" });
      doc.text(`Thank you for choosing Chakwal Guest House  ·  ${siteConfig.url.replace("https://", "")}`, W / 2, pageH - 6,  { align: "center" });

      doc.save(`Receipt-${props.bookingRef}.pdf`);
    } catch (err) {
      console.error("Receipt error", err);
      toast.error("Could not generate receipt. Please screenshot this page.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={download}
      disabled={loading}
      className="flex items-center justify-center gap-2 px-6 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-lg transition-all disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {loading ? "Generating…" : "Download Receipt (PDF)"}
    </button>
  );
}
