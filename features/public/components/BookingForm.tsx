"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays, Users, Building2, BedDouble,
  User, Phone, CreditCard, ChevronRight, ChevronLeft,
  CheckCircle2, Loader2, AlertCircle, Download,
} from "lucide-react";
import { getAvailableRooms, createPublicBooking } from "@/server/actions/public";
import { cn, formatPKR } from "@/utils";

interface Branch { id: string; name: string; city: string }
interface Room   {
  id: string; number: string; name: string; type: string;
  pricePerNight: any; maxAdults: number; amenities: string[];
  description?: string | null;
}

const today    = new Date().toISOString().split("T")[0];
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];

const inputCls = "w-full bg-surface-base border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/20 transition-all";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

const TYPE_ICON: Record<string, string> = {
  STANDARD: "🛏️", DELUXE: "⭐", SUITE: "🏠", FAMILY: "👨‍👩‍👧", VIP: "👑",
};

export function BookingForm({ branches }: { branches: Branch[] }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [isPending, start] = useTransition();
  const [rooms, setRooms]   = useState<Room[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  const [dates, setDates] = useState({
    branchId: searchParams.get("branchId") || branches[0]?.id || "",
    checkIn:  searchParams.get("checkIn")  || today,
    checkOut: searchParams.get("checkOut") || tomorrow,
    adults:   Number(searchParams.get("adults"))   || 2,
    children: Number(searchParams.get("children")) || 0,
  });

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const [guest, setGuest] = useState({
    name: "", phone: "", cnic: "", email: "", notes: "", promoCode: "",
  });

  const [bookingRef, setBookingRef]         = useState("");
  const [confirmedTotal, setConfirmedTotal] = useState(0);
  const [confirmedDiscount, setConfirmedDiscount] = useState(0);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const nights = Math.max(1,
    Math.ceil((new Date(dates.checkOut).getTime() - new Date(dates.checkIn).getTime()) / 86_400_000)
  );

  const setD = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDates(f => ({ ...f, [k]: k === "adults" || k === "children" ? Number(e.target.value) : e.target.value }));

  const setG = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setGuest(f => ({ ...f, [k]: e.target.value }));

  const searchRooms = async () => {
    if (!dates.branchId || !dates.checkIn || !dates.checkOut) {
      toast.error("Please fill in all search fields"); return;
    }
    if (new Date(dates.checkIn) >= new Date(dates.checkOut)) {
      toast.error("Check-out must be after check-in"); return;
    }
    setSearching(true);
    setSearchDone(false);
    try {
      const result = await getAvailableRooms(dates.branchId, dates.checkIn, dates.checkOut, dates.adults);
      setRooms(result as Room[]);
      setSearchDone(true);
      if (result.length > 0) setStep(2);
    } catch {
      toast.error("Failed to search rooms. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const confirmBooking = () => {
    if (!guest.name.trim())  { toast.error("Please enter your name");  return; }
    if (!guest.phone.trim()) { toast.error("Please enter your phone number"); return; }
    if (!selectedRoom)       { toast.error("Please select a room");    return; }

    start(async () => {
      const res = await createPublicBooking({
        roomId:    selectedRoom.id,
        branchId:  dates.branchId,
        checkIn:   dates.checkIn,
        checkOut:  dates.checkOut,
        adults:    dates.adults,
        children:  dates.children,
        name:      guest.name,
        phone:     guest.phone,
        cnic:      guest.cnic || undefined,
        email:     guest.email || undefined,
        notes:     guest.notes || undefined,
        promoCode: guest.promoCode.trim().toUpperCase() || undefined,
      });
      if (res.success && res.ref) {
        setBookingRef(res.ref);
        const base = Number(selectedRoom?.pricePerNight ?? 0) * nights;
        const disc = res.discountAmount ?? 0;
        setConfirmedDiscount(disc);
        setConfirmedTotal(base - disc);
        setStep(4);
      } else {
        toast.error(res.error ?? "Booking failed. Please try again.");
      }
    });
  };

  const branch = branches.find(b => b.id === dates.branchId);

  // ─── Receipt PDF generator ───────────────────────────────
  const downloadReceipt = async () => {
    setReceiptLoading(true);
    try {
      const { default: jsPDF }   = await import("jspdf");
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

      // Hotel name
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(...dark);
      doc.text("Chakwal Grand Guest House", 20, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text(`${branch?.name ?? "Chakwal"} · Tel: 0334-7742767 · www.staychakwal.de`, 20, y + 6);

      // UNPAID badge (right side)
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
      doc.text(bookingRef, 20, y);
      y += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...gray);
      doc.text(`Issued: ${new Date().toLocaleDateString("en-PK", { day:"numeric", month:"long", year:"numeric" })}`, 20, y);
      y += 12;

      // Guest info section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text("GUEST INFORMATION", 20, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(guest.name, 20, y);
      doc.setTextColor(...gray);
      doc.text(`Phone: ${guest.phone}`, 20, y + 5);
      y += 14;

      // Stay details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text("BOOKING DETAILS", 20, y);
      y += 5;

      const checkInFmt  = new Date(dates.checkIn).toLocaleDateString("en-PK",  { weekday:"short", day:"numeric", month:"long", year:"numeric" });
      const checkOutFmt = new Date(dates.checkOut).toLocaleDateString("en-PK", { weekday:"short", day:"numeric", month:"long", year:"numeric" });

      const details = [
        ["Room",      `${selectedRoom?.name ?? "—"} (${dates.branchId ? branch?.name : ""})`],
        ["Check-In",  checkInFmt],
        ["Check-Out", checkOutFmt],
        ["Duration",  `${nights} night${nights > 1 ? "s" : ""}`],
        ["Guests",    `${dates.adults} adult${dates.adults > 1 ? "s" : ""}${dates.children ? " + " + dates.children + " child" : ""}`],
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

      // Charges table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...gold);
      doc.text("CHARGES", 20, y);
      y += 4;

      const base = Number(selectedRoom?.pricePerNight ?? 0) * nights;
      const tableBody: string[][] = [
        [`${selectedRoom?.name} — ${nights} night${nights > 1 ? "s" : ""}`, `PKR ${Number(selectedRoom?.pricePerNight ?? 0).toLocaleString("en-PK")}`, String(nights), `PKR ${base.toLocaleString("en-PK")}`],
      ];
      if (confirmedDiscount > 0) {
        tableBody.push(["Discount Applied", "", "", `- PKR ${confirmedDiscount.toLocaleString("en-PK")}`]);
      }

      autoTable(doc, {
        startY: y,
        head:   [["Description", "Rate/Night", "Nights", "Amount"]],
        body:   tableBody,
        foot:   [["", "", "Total Due", `PKR ${confirmedTotal.toLocaleString("en-PK")}`]],
        headStyles: { fillColor: dark, textColor: [255,255,255], fontSize: 9, fontStyle: "bold" },
        footStyles: { fillColor: [245,245,245], textColor: dark, fontSize: 11, fontStyle: "bold" },
        bodyStyles: { fontSize: 10, textColor: dark },
        columnStyles: { 0: { cellWidth: 70 }, 3: { halign: "right" }, 2: { halign: "center" }, 1: { halign: "right" } },
        margin: { left: 20, right: 20 },
        theme:  "grid",
      });

      const finalY = (doc as any).lastAutoTable.finalY + 8;

      // Payment status box
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(239, 68, 68);
      doc.setLineWidth(0.5);
      doc.roundedRect(20, finalY, W - 40, 16, 3, 3, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(239, 68, 68);
      doc.text("⚠  PAYMENT PENDING — Please pay PKR " + confirmedTotal.toLocaleString("en-PK") + " in cash on arrival", W / 2, finalY + 10, { align: "center" });

      // Footer bar
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFillColor(...gold);
      doc.rect(0, pageH - 20, W, 20, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text("Check-in: 2:00 PM  ·  Check-out: 12:00 PM  ·  CNIC required at check-in", W / 2, pageH - 12, { align: "center" });
      doc.text("Thank you for choosing Chakwal Grand Guest House  ·  www.staychakwal.de", W / 2, pageH - 6,  { align: "center" });

      doc.save(`Receipt-${bookingRef}.pdf`);
    } catch (err) {
      console.error("Receipt error", err);
      toast.error("Could not generate receipt. Please screenshot this page.");
    } finally {
      setReceiptLoading(false);
    }
  };

  // ─── Step 4: Confirmation ────────────────────────────────
  if (step === 4) {
    return (
      <div className="max-w-lg mx-auto text-center py-8 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold font-serif text-foreground mb-2">Booking Confirmed!</h2>
        <p className="text-muted-foreground mb-8">Your booking request has been received. We'll confirm within 30 minutes via phone.</p>

        <div className="card-luxury rounded-2xl p-6 text-left space-y-4 mb-8">
          <div className="text-center pb-4 border-b border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Booking Reference</p>
            <p className="text-3xl font-bold font-serif text-gold-400">{bookingRef}</p>
          </div>
          {[
            ["Guest",     guest.name],
            ["Phone",     guest.phone],
            ["Room",      selectedRoom?.name ?? "—"],
            ["Branch",    branch?.name ?? "—"],
            ["Check-in",  new Date(dates.checkIn).toLocaleDateString("en-PK",  { weekday: "short", day: "numeric", month: "long", year: "numeric" })],
            ["Check-out", new Date(dates.checkOut).toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "long", year: "numeric" })],
            ["Nights",    `${nights} night${nights > 1 ? "s" : ""}`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-semibold text-foreground text-right max-w-[55%]">{v}</span>
            </div>
          ))}
          {confirmedDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-semibold text-emerald-400">- {formatPKR(confirmedDiscount)}</span>
            </div>
          )}
          <div className="border-t border-border/50 pt-3 flex justify-between text-sm">
            <span className="font-bold text-foreground">Total Due</span>
            <span className="font-bold text-gold-400 text-base">{formatPKR(confirmedTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Payment</span>
            <span className="font-semibold text-amber-400">Cash on arrival</span>
          </div>
          <div className="mt-1 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-center">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">⚠ UNPAID — Pay on Arrival</span>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm text-amber-400 text-left mb-6">
          <p className="font-semibold mb-1">📌 Important Notes:</p>
          <ul className="space-y-1 text-amber-400/80 text-xs">
            <li>• Advance bookings are preferred — call to confirm early</li>
            <li>• Check-in time: 2:00 PM · Check-out time: 12:00 PM</li>
            <li>• A/C available 12 hours daily</li>
            <li>• Bring your original CNIC on arrival</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={downloadReceipt}
            disabled={receiptLoading}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-lg transition-all disabled:opacity-60"
          >
            {receiptLoading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Download className="w-4 h-4" />}
            {receiptLoading ? "Generating…" : "Download Receipt (PDF)"}
          </button>
          <a href={`https://wa.me/923347742767?text=Booking Reference: ${bookingRef} — Please confirm my booking.`}
            target="_blank" rel="noreferrer"
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-sm font-semibold rounded-xl hover:bg-[#25D366]/25 transition-colors">
            WhatsApp Confirmation
          </a>
          <button onClick={() => router.push("/")}
            className="px-5 py-2.5 border border-border text-sm text-muted-foreground rounded-xl hover:bg-accent transition-colors">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress steps */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {[
          { n: 1, label: "Search" },
          { n: 2, label: "Choose Room" },
          { n: 3, label: "Your Details" },
        ].map(({ n, label }, idx) => (
          <div key={n} className="flex items-center gap-2">
            {idx > 0 && <div className={cn("w-12 h-px", step > idx ? "bg-gold-500" : "bg-border")} />}
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
              step === n ? "bg-gold-500/20 border border-gold-500/40 text-gold-400"
              : step > n ? "bg-green-500/15 border border-green-500/30 text-green-400"
              : "bg-surface-elevated border border-border text-muted-foreground"
            )}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold",
                step > n ? "bg-green-500 text-white" : step === n ? "bg-gold-500 text-background" : "bg-border text-muted-foreground"
              )}>
                {step > n ? "✓" : n}
              </span>
              <span className="hidden sm:block">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── Step 1: Search ─────────────────────────────────── */}
      {step === 1 && (
        <div className="card-luxury rounded-2xl p-8 animate-fade-in">
          <h2 className="text-xl font-bold font-serif text-foreground mb-6">Find Available Rooms</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            <div className="sm:col-span-2">
              <label className={labelCls}>Branch Location</label>
              <select value={dates.branchId} onChange={setD("branchId")} className={inputCls}>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Check-In Date</label>
              <input type="date" value={dates.checkIn} min={today} onChange={setD("checkIn")} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Check-Out Date</label>
              <input type="date" value={dates.checkOut} min={dates.checkIn || today} onChange={setD("checkOut")} className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Adults</label>
              <select value={dates.adults} onChange={setD("adults")} className={inputCls}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Adult{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Children</label>
              <select value={dates.children} onChange={setD("children")} className={inputCls}>
                {[0,1,2,3,4].map(n => <option key={n} value={n}>{n} {n === 1 ? "Child" : "Children"}</option>)}
              </select>
            </div>

            {dates.checkIn && dates.checkOut && new Date(dates.checkOut) > new Date(dates.checkIn) && (
              <div className="sm:col-span-2 bg-gold-500/5 border border-gold-500/15 rounded-xl px-4 py-3">
                <p className="text-sm text-muted-foreground">
                  <span className="text-gold-400 font-semibold">{nights} night{nights > 1 ? "s" : ""}</span>
                  {" "}· {branch?.name} · {dates.adults} adult{dates.adults > 1 ? "s" : ""}{dates.children > 0 ? `, ${dates.children} child${dates.children > 1 ? "ren" : ""}` : ""}
                </p>
              </div>
            )}
          </div>

          {searchDone && rooms.length === 0 && (
            <div className="mt-5 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">No rooms available for the selected dates and branch. Try different dates or another branch.</p>
            </div>
          )}

          <div className="flex justify-end mt-8">
            <button onClick={searchRooms} disabled={searching}
              className="flex items-center gap-2 px-8 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-70">
              {searching ? <><Loader2 className="w-4 h-4 animate-spin" />Searching…</>
                         : <><Building2 className="w-4 h-4" />Search Available Rooms</>}
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Choose Room ─────────────────────────────── */}
      {step === 2 && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground">Choose Your Room</h2>
              <p className="text-sm text-muted-foreground mt-1">{rooms.length} room{rooms.length > 1 ? "s" : ""} available · {nights} night{nights > 1 ? "s" : ""}</p>
            </div>
            <button onClick={() => { setStep(1); setSearchDone(false); }}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>

          <div className="space-y-4">
            {rooms.map(room => {
              const total = Number(room.pricePerNight) * nights;
              const isSelected = selectedRoom?.id === room.id;
              return (
                <div
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={cn(
                    "card-luxury rounded-2xl p-6 cursor-pointer border-2 transition-all hover:-translate-y-0.5",
                    isSelected ? "border-gold-500/60 shadow-gold-md" : "border-transparent hover:border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
                        isSelected ? "bg-gold-500/20" : "bg-accent"
                      )}>
                        {TYPE_ICON[room.type] ?? "🛏️"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-foreground">{room.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-muted-foreground">Room {room.number}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed max-w-lg">{room.description}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {room.amenities.slice(0, 6).map(a => (
                            <span key={a} className="text-[11px] px-2 py-0.5 bg-accent border border-border rounded-lg text-muted-foreground">{a}</span>
                          ))}
                          {room.amenities.length > 6 && (
                            <span className="text-[11px] px-2 py-0.5 bg-accent border border-border rounded-lg text-muted-foreground">+{room.amenities.length - 6} more</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-gold-400 font-serif">{formatPKR(Number(room.pricePerNight))}</p>
                      <p className="text-xs text-muted-foreground">/night</p>
                      <p className="text-sm font-semibold text-foreground mt-2">Total: {formatPKR(total)}</p>
                      <p className="text-xs text-muted-foreground">for {nights} night{nights > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-6">
            <button
              onClick={() => { if (!selectedRoom) { toast.error("Please select a room first"); return; } setStep(3); }}
              className="flex items-center gap-2 px-8 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Guest Details ───────────────────────────── */}
      {step === 3 && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground">Your Details</h2>
              <p className="text-sm text-muted-foreground mt-1">Almost there — just a few details</p>
            </div>
            <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Form */}
            <div className="lg:col-span-3 card-luxury rounded-2xl p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className={labelCls}><User className="w-3 h-3 inline mr-1" />Full Name *</label>
                  <input value={guest.name} onChange={setG("name")} placeholder="Ahmed Ali Khan" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}><Phone className="w-3 h-3 inline mr-1" />Phone Number *</label>
                  <input value={guest.phone} onChange={setG("phone")} placeholder="0300-1234567" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}><CreditCard className="w-3 h-3 inline mr-1" />CNIC (Optional)</label>
                  <input value={guest.cnic} onChange={setG("cnic")} placeholder="35202-1234567-8" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Email (Optional)</label>
                  <input type="email" value={guest.email} onChange={setG("email")} placeholder="you@email.com" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Special Requests (Optional)</label>
                  <textarea value={guest.notes} onChange={setG("notes")} rows={3} placeholder="Any special requirements…"
                    className={inputCls + " resize-none"} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Promo Code (Optional)</label>
                  <input value={guest.promoCode} onChange={setG("promoCode")} placeholder="e.g. WELCOME10"
                    className={inputCls + " font-mono tracking-widest uppercase"} />
                  <p className="text-[10px] text-muted-foreground mt-1">Weekly stays (7+ nights) and monthly stays (30+ nights) get automatic discounts — no code needed.</p>
                </div>
              </div>
            </div>

            {/* Booking summary */}
            <div className="lg:col-span-2">
              <div className="card-luxury rounded-2xl p-6 sticky top-28">
                <h3 className="font-bold text-foreground mb-4">Booking Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center text-xl flex-shrink-0">
                      {TYPE_ICON[selectedRoom?.type ?? "STANDARD"]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{selectedRoom?.name}</p>
                      <p className="text-xs text-muted-foreground">{branch?.name}</p>
                    </div>
                  </div>
                  {[
                    ["Check-in",  new Date(dates.checkIn).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })],
                    ["Check-out", new Date(dates.checkOut).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })],
                    ["Duration",  `${nights} night${nights > 1 ? "s" : ""}`],
                    ["Guests",    `${dates.adults} adult${dates.adults > 1 ? "s" : ""}${dates.children ? ` + ${dates.children} child${dates.children > 1 ? "ren" : ""}` : ""}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-foreground">{v}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{formatPKR(Number(selectedRoom?.pricePerNight))} × {nights} nights</span>
                      <span className="font-bold text-gold-400 text-base font-serif">
                        {formatPKR(Number(selectedRoom?.pricePerNight ?? 0) * nights)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Payment: Cash on arrival</p>
                  </div>
                </div>

                <button
                  onClick={confirmBooking}
                  disabled={isPending}
                  className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-70"
                >
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Confirming…</>
                             : <>Confirm Booking <ChevronRight className="w-4 h-4" /></>}
                </button>

                <p className="text-center text-xs text-muted-foreground mt-3">
                  No payment required online · Pay on arrival
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
