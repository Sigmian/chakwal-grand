"use client";

import { CalendarDays } from "lucide-react";
import { siteConfig } from "@/config/site";

interface Props {
  bookingRef:   string;
  roomName:     string;
  checkInDate:  string; // ISO date string
  checkOutDate: string;
  branchName:   string;
  address:      string;
}

function formatICSDate(isoDate: string, hour: number, minute: number): string {
  const d = new Date(isoDate);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(hour)}${pad(minute)}00`
  );
}

export function ICSDownload({ bookingRef, roomName, checkInDate, checkOutDate, branchName, address }: Props) {
  const download = () => {
    const dtStart  = formatICSDate(checkInDate,  14, 0);  // 2:00 PM check-in
    const dtEnd    = formatICSDate(checkOutDate, 12, 0);  // 12:00 PM check-out
    const now      = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Chakwal Grand//Booking//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${bookingRef}@${siteConfig.url.replace("https://www.", "")}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:Check-in — ${roomName} · Chakwal Grand`,
      `DESCRIPTION:Booking Reference: ${bookingRef}\\nRoom: ${roomName}\\nBranch: ${branchName}\\nCheck-in: 2:00 PM · Check-out: 12:00 PM\\nBring CNIC on arrival.`,
      `LOCATION:${address}`,
      "STATUS:CONFIRMED",
      "BEGIN:VALARM",
      "TRIGGER:-PT24H",
      "ACTION:DISPLAY",
      `DESCRIPTION:Reminder: Check-in tomorrow at Chakwal Grand — Ref ${bookingRef}`,
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `Booking-${bookingRef}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={download}
      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-surface-elevated border border-border text-sm font-semibold text-foreground rounded-xl hover:border-gold-500/30 hover:bg-accent transition-all"
    >
      <CalendarDays className="w-4 h-4 text-gold-400" />
      Save to Calendar
    </button>
  );
}
