"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import {
  CalendarDays, Users, Building2, BedDouble,
  User, Phone, CreditCard, ChevronRight, ChevronLeft,
  Loader2, AlertCircle, Search, Star, Home, Crown,
  Snowflake, Sunrise, Moon, Check, Tag, X,
} from "lucide-react";
import { getAvailableRooms, createPublicBooking, lookupGuestByPhone, validatePromoCode } from "@/server/actions/public";
import { cn, formatPKR } from "@/utils";

interface Branch { id: string; name: string; city: string }
interface Room   {
  id: string; number: string; name: string; type: string;
  pricePerNight: any; maxAdults: number; amenities: string[];
  description?: string | null;
  images?: { url: string; isCover: boolean }[];
}

const today    = new Date().toISOString().split("T")[0];
const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];

const inputCls = "w-full bg-surface-base border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/60 focus:ring-1 focus:ring-gold-500/20 transition-all";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

const TYPE_ICON: Record<string, typeof BedDouble> = {
  STANDARD: BedDouble, DELUXE: Star, SUITE: Home, FAMILY: Users, VIP: Crown,
};

export function BookingForm({ branches }: { branches: Branch[] }) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  // If arriving from room picker, roomId is pre-set — skip to step 3 after room loads
  const preselectedRoomId = searchParams.get("roomId");

  const [step, setStep] = useState(preselectedRoomId ? 3 : 1);
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

  // Auto-load pre-selected room from picker
  useEffect(() => {
    if (!preselectedRoomId) return;
    getAvailableRooms(
      searchParams.get("branchId") || branches[0]?.id || "",
      searchParams.get("checkIn")  || today,
      searchParams.get("checkOut") || tomorrow,
      Number(searchParams.get("adults")) || 2,
    ).then((result) => {
      const match = (result as Room[]).find((r) => r.id === preselectedRoomId);
      if (match) setSelectedRoom(match);
    }).catch(() => {/* ignore */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [guest, setGuest] = useState({
    name: "", phone: "", cnic: "", email: "", notes: "", promoCode: "",
    estimatedArrival: "",
  });

  const [structuredReqs, setStructuredReqs] = useState({
    acPreference:  false,
    extraBed:      false,
    earlyCheckIn:  false,
    lateCheckout:  false,
  });

  const [returningPhone, setReturningPhone] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupDone, setLookupDone] = useState(false);

  // Promo code validation state
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoResult, setPromoResult] = useState<{
    discountAmount: number; discountLabel: string; offerName: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const lookupGuest = async () => {
    if (!returningPhone.trim()) return;
    setLookingUp(true);
    try {
      const res = await lookupGuestByPhone(returningPhone.trim());
      if (res.found) {
        setGuest((g) => ({ ...g, name: res.name, phone: res.phone, email: res.email, cnic: res.cnic }));
        setLookupDone(true);
        toast.success(`Welcome back, ${res.name}! Details filled in.`);
      } else {
        toast.info("No previous booking found with that number. Please fill in your details.");
      }
    } catch {
      toast.error("Lookup failed. Please fill in your details manually.");
    } finally {
      setLookingUp(false);
    }
  };


  const nights = Math.max(1,
    Math.ceil((new Date(dates.checkOut).getTime() - new Date(dates.checkIn).getTime()) / 86_400_000)
  );

  const setD = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setDates(f => ({ ...f, [k]: k === "adults" || k === "children" ? Number(e.target.value) : e.target.value }));

  const setG = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setGuest(f => ({ ...f, [k]: e.target.value }));
    // Reset promo state when code field changes
    if (k === "promoCode") { setPromoResult(null); setPromoError(null); }
  };

  const applyPromo = async () => {
    const code = guest.promoCode.trim().toUpperCase();
    if (!code) { setPromoError("Please enter a promo code."); return; }
    const baseAmount = Number(selectedRoom?.pricePerNight ?? 0) * nights;
    setPromoValidating(true);
    setPromoResult(null);
    setPromoError(null);
    try {
      const res = await validatePromoCode(code, nights, baseAmount);
      if (res.valid) {
        setPromoResult({ discountAmount: res.discountAmount, discountLabel: res.discountLabel, offerName: res.offerName });
      } else {
        setPromoError(res.error);
      }
    } catch {
      setPromoError("Could not validate code. Please try again.");
    } finally {
      setPromoValidating(false);
    }
  };

  const removePromo = () => {
    setGuest(g => ({ ...g, promoCode: "" }));
    setPromoResult(null);
    setPromoError(null);
  };

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
      const hasStructured = Object.values(structuredReqs).some(Boolean);
      const res = await createPublicBooking({
        roomId:              selectedRoom.id,
        branchId:            dates.branchId,
        checkIn:             dates.checkIn,
        checkOut:            dates.checkOut,
        adults:              dates.adults,
        children:            dates.children,
        name:                guest.name,
        phone:               guest.phone,
        cnic:                guest.cnic || undefined,
        email:               guest.email || undefined,
        notes:               guest.notes || undefined,
        promoCode:           guest.promoCode.trim().toUpperCase() || undefined,
        estimatedArrival:    guest.estimatedArrival || undefined,
        structuredRequests:  hasStructured ? { ...structuredReqs, other: guest.notes || "" } : undefined,
      });
      if (res.success && res.ref) {
        router.push(`/booking-confirmation/${res.ref}`);
      } else {
        toast.error(res.error ?? "Booking failed. Please try again.");
      }
    });
  };

  const branch = branches.find(b => b.id === dates.branchId);

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
                {step > n ? <Check className="w-3 h-3" /> : n}
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
              <label htmlFor="book-branch" className={labelCls}>Branch Location</label>
              <select id="book-branch" value={dates.branchId} onChange={setD("branchId")} className={inputCls}>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name} — {b.city}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="book-checkin" className={labelCls}>Check-In Date</label>
              <input id="book-checkin" type="date" value={dates.checkIn} min={today} onChange={setD("checkIn")} className={inputCls} />
            </div>

            <div>
              <label htmlFor="book-checkout" className={labelCls}>Check-Out Date</label>
              <input id="book-checkout" type="date" value={dates.checkOut} min={dates.checkIn || today} onChange={setD("checkOut")} className={inputCls} />
            </div>

            <div>
              <label htmlFor="book-adults" className={labelCls}>Adults</label>
              <select id="book-adults" value={dates.adults} onChange={setD("adults")} className={inputCls}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Adult{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="book-children" className={labelCls}>Children</label>
              <select id="book-children" value={dates.children} onChange={setD("children")} className={inputCls}>
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

            {dates.checkIn && dates.checkOut && new Date(dates.checkOut) <= new Date(dates.checkIn) && (
              <div className="sm:col-span-2 flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">Check-out must be at least one night after check-in.</p>
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
            <button
              onClick={searchRooms}
              disabled={searching || !dates.branchId || !dates.checkIn || !dates.checkOut || new Date(dates.checkOut) <= new Date(dates.checkIn)}
              className="flex items-center gap-2 px-8 py-3 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {searching ? <><Loader2 className="w-4 h-4 animate-spin" />Searching…</>
                         : <><Search className="w-4 h-4" />Search Available Rooms</>}
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
                      {room.images?.[0] ? (
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 relative">
                          <Image src={room.images[0].url} alt={room.name} fill className="object-cover" sizes="80px" />
                        </div>
                      ) : (
                        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0",
                          isSelected ? "bg-gold-500/20" : "bg-accent"
                        )}>
                          {(() => { const Icon = TYPE_ICON[room.type] ?? BedDouble; return <Icon className="w-6 h-6 text-gold-400" />; })()}
                        </div>
                      )}
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
      {step === 3 && !selectedRoom && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading room details…</p>
          </div>
        </div>
      )}

      {step === 3 && selectedRoom && (
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
            <div className="lg:col-span-3 space-y-4">
              {/* Returning guest shortcut */}
              <div className="card-luxury rounded-2xl p-4 border border-border/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Returning Guest? Auto-fill your details
                </p>
                <div className="flex gap-2">
                  <input
                    value={returningPhone}
                    onChange={(e) => setReturningPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && lookupGuest()}
                    placeholder="Enter your phone number"
                    className={inputCls + " flex-1"}
                  />
                  <button
                    onClick={lookupGuest}
                    disabled={lookingUp}
                    className="flex items-center gap-1.5 px-4 py-2 bg-accent border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-gold-500/30 transition-all disabled:opacity-60"
                  >
                    {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {lookingUp ? "Looking up…" : "Find Me"}
                  </button>
                </div>
                {lookupDone && (
                  <p className="inline-flex items-center gap-1 text-xs text-emerald-400 mt-2"><Check className="w-3.5 h-3.5" /> Details filled in — edit any field below</p>
                )}
              </div>

              <div className="card-luxury rounded-2xl p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label htmlFor="guest-name" className={labelCls}><User className="w-3 h-3 inline mr-1" />Full Name *</label>
                  <input id="guest-name" value={guest.name} onChange={setG("name")} placeholder="Ahmed Ali Khan" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="guest-phone" className={labelCls}><Phone className="w-3 h-3 inline mr-1" />Phone Number *</label>
                  <input id="guest-phone" value={guest.phone} onChange={setG("phone")} placeholder="0300-1234567" className={inputCls} />
                </div>
                <div>
                  <label htmlFor="guest-cnic" className={labelCls}><CreditCard className="w-3 h-3 inline mr-1" />CNIC (Optional)</label>
                  <input id="guest-cnic" value={guest.cnic} onChange={setG("cnic")} placeholder="35202-1234567-8" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="guest-email" className={labelCls}>Email (Optional)</label>
                  <input id="guest-email" type="email" value={guest.email} onChange={setG("email")} placeholder="you@email.com" className={inputCls} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="guest-arrival" className={labelCls}>Estimated Arrival Time (Optional)</label>
                  <select id="guest-arrival" value={guest.estimatedArrival} onChange={setG("estimatedArrival")} className={inputCls}>
                    <option value="">Select arrival time…</option>
                    {["12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM","11:00 PM","After midnight"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted-foreground mt-1">Standard check-in is 2:00 PM. Let us know so we can prepare your room on time.</p>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Special Requests (Optional)</label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {([
                      ["acPreference", Snowflake, "AC Preference"],
                      ["extraBed",     BedDouble,  "Extra Bed"],
                      ["earlyCheckIn", Sunrise,    "Early Check-in"],
                      ["lateCheckout", Moon,       "Late Check-out"],
                    ] as [keyof typeof structuredReqs, typeof Snowflake, string][]).map(([key, Icon, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStructuredReqs(r => ({ ...r, [key]: !r[key] }))}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-all",
                          structuredReqs[key]
                            ? "bg-gold-500/15 border-gold-500/50 text-gold-400"
                            : "bg-surface-base border-border text-muted-foreground hover:border-border/80"
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span>{label}</span>
                        {structuredReqs[key] && <Check className="ml-auto w-3.5 h-3.5 text-gold-400" />}
                      </button>
                    ))}
                  </div>
                  <textarea value={guest.notes} onChange={setG("notes")} rows={2} placeholder="Any other requests or notes…"
                    className={inputCls + " resize-none"} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="guest-promo" className={labelCls}>
                    <Tag className="w-3 h-3 inline mr-1" />Promo Code (Optional)
                  </label>
                  {promoResult ? (
                    /* Applied state */
                    <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-emerald-400">{guest.promoCode.toUpperCase()} applied!</p>
                        <p className="text-xs text-muted-foreground">{promoResult.offerName} · {promoResult.discountLabel}</p>
                      </div>
                      <button
                        onClick={removePromo}
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                        title="Remove promo code"
                      >
                        <X className="w-3.5 h-3.5 text-emerald-400" />
                      </button>
                    </div>
                  ) : (
                    /* Input state */
                    <div className="flex gap-2">
                      <input
                        id="guest-promo"
                        value={guest.promoCode}
                        onChange={setG("promoCode")}
                        onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                        placeholder="e.g. NEW20"
                        className={cn(
                          inputCls, "flex-1 font-mono tracking-widest uppercase",
                          promoError ? "border-red-500/50 focus:border-red-500/60" : ""
                        )}
                      />
                      <button
                        onClick={applyPromo}
                        disabled={promoValidating || !guest.promoCode.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        {promoValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                        {promoValidating ? "Checking…" : "Apply"}
                      </button>
                    </div>
                  )}
                  {promoError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{promoError}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-1">Weekly stays (7+ nights) and monthly stays (30+ nights) get automatic discounts — no code needed.</p>
                </div>
              </div>
              </div>
            </div>

            {/* Booking summary */}
            <div className="lg:col-span-2">
              <div className="card-luxury rounded-2xl p-6 sticky top-28">
                <h3 className="font-bold text-foreground mb-4">Booking Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 pb-3 border-b border-border">
                    <div className="w-10 h-10 rounded-xl bg-gold-500/15 flex items-center justify-center flex-shrink-0">
                      {(() => { const Icon = TYPE_ICON[selectedRoom?.type ?? "STANDARD"] ?? BedDouble; return <Icon className="w-5 h-5 text-gold-400" />; })()}
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
                  {guest.estimatedArrival && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. Arrival</span>
                      <span className="font-medium text-foreground">{guest.estimatedArrival}</span>
                    </div>
                  )}
                  {Object.values(structuredReqs).some(Boolean) && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {structuredReqs.acPreference && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-gold-500/10 border border-gold-500/20 rounded-full text-gold-400"><Snowflake className="w-3 h-3" /> AC</span>}
                      {structuredReqs.extraBed     && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-gold-500/10 border border-gold-500/20 rounded-full text-gold-400"><BedDouble className="w-3 h-3" /> Extra Bed</span>}
                      {structuredReqs.earlyCheckIn && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-gold-500/10 border border-gold-500/20 rounded-full text-gold-400"><Sunrise className="w-3 h-3" /> Early In</span>}
                      {structuredReqs.lateCheckout && <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-gold-500/10 border border-gold-500/20 rounded-full text-gold-400"><Moon className="w-3 h-3" /> Late Out</span>}
                    </div>
                  )}
                  <div className="border-t border-border pt-3 mt-3 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Room rate</span>
                      <span>{formatPKR(Number(selectedRoom?.pricePerNight ?? 0))} / night</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Subtotal ({nights} night{nights > 1 ? "s" : ""})</span>
                      <span>{formatPKR(Number(selectedRoom?.pricePerNight ?? 0) * nights)}</span>
                    </div>
                    {promoResult && (
                      <div className="flex justify-between text-xs text-emerald-400">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          Discount ({guest.promoCode.toUpperCase()})
                        </span>
                        <span>- {formatPKR(promoResult.discountAmount)}</span>
                      </div>
                    )}
                    <div className={cn(
                      "flex justify-between items-center pt-2 border-t border-border/60",
                      promoResult ? "border-emerald-500/20" : ""
                    )}>
                      <span className="text-sm font-semibold text-foreground">Total</span>
                      <div className="text-right">
                        {promoResult && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatPKR(Number(selectedRoom?.pricePerNight ?? 0) * nights)}
                          </p>
                        )}
                        <span className="font-bold text-gold-400 text-lg font-serif">
                          {formatPKR(Math.max(0, Number(selectedRoom?.pricePerNight ?? 0) * nights - (promoResult?.discountAmount ?? 0)))}
                        </span>
                      </div>
                    </div>
                    <p className="inline-flex items-center gap-1 text-xs text-emerald-400/90"><Check className="w-3.5 h-3.5" /> Pay in cash on arrival — no online payment</p>
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
