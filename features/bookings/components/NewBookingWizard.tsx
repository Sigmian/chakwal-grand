// ============================================================
// features/bookings/components/NewBookingWizard.tsx
// Multi-step booking creation form
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Calendar, Users, ArrowRight, ArrowLeft } from "lucide-react";
import { createBooking } from "@/server/actions/bookings";
import { createBookingSchema, type CreateBookingInput } from "@/lib/validation/schemas";
import { formatPKR, getNights, ROOM_TYPE_CONFIG } from "@/utils";

const STEPS = [
  { id: 1, label: "Dates & Branch" },
  { id: 2, label: "Select Room"    },
  { id: 3, label: "Guest Info"     },
  { id: 4, label: "Confirmation"   },
];

export function NewBookingWizard({ branches, rooms }: {
  branches: Array<{ id: string; name: string; city: string }>;
  rooms:    Array<{ id: string; number: string; name: string; type: string; pricePerNight: number; maxAdults: number; images: Array<{ url: string }> }>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [selectedRoom, setSelectedRoom] = useState<typeof rooms[0] | null>(null);

  const form = useForm<CreateBookingInput>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: { adultCount: 1, childCount: 0, source: "walk_in" },
  });

  const { watch, setValue, formState: { errors } } = form;
  const values = watch();

  const nights = values.checkInDate && values.checkOutDate
    ? getNights(values.checkInDate, values.checkOutDate)
    : 0;

  const onSubmit = (data: CreateBookingInput) => {
    startTransition(async () => {
      const result = await createBooking(data);
      if (result.success) {
        toast.success(`Booking ${result.data?.bookingRef} created successfully!`);
        router.push(`/bookings/${result.data?.id}`);
      } else {
        toast.error(result.error ?? "Failed to create booking");
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, idx) => (
          <div key={s.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.id  ? "bg-gold-gradient text-background"
                : step === s.id ? "bg-gold-500/20 text-gold-400 border-2 border-gold-500/50 animate-pulse-gold"
                : "bg-accent/50 text-muted-foreground border border-border"
              }`}>
                {step > s.id ? <Check className="w-3.5 h-3.5" /> : s.id}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${step === s.id ? "text-gold-400" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 transition-all ${step > s.id ? "bg-gold-gradient" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="card-luxury rounded-2xl p-6">
        <AnimatePresence mode="wait">

          {/* Step 1: Dates */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-lg font-bold text-foreground font-serif">Select Branch &amp; Dates</h2>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Branch</label>
                <select
                  {...form.register("branchId")}
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20"
                >
                  <option value="">Select a branch...</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name} — {b.city}</option>
                  ))}
                </select>
                {errors.branchId && <p className="text-red-400 text-xs mt-1">{errors.branchId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Check-in</label>
                  <input type="date" {...form.register("checkInDate")} min={new Date().toISOString().split("T")[0]}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20"
                  />
                  {errors.checkInDate && <p className="text-red-400 text-xs mt-1">{errors.checkInDate.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Check-out</label>
                  <input type="date" {...form.register("checkOutDate")} min={values.checkInDate || new Date().toISOString().split("T")[0]}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20"
                  />
                  {errors.checkOutDate && <p className="text-red-400 text-xs mt-1">{errors.checkOutDate.message}</p>}
                </div>
              </div>

              {nights > 0 && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gold-500/10 border border-gold-500/20">
                  <Calendar className="w-4 h-4 text-gold-400" />
                  <span className="text-sm text-gold-300 font-medium">{nights} night{nights !== 1 ? "s" : ""} selected</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Guests</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><Users className="w-3 h-3" /> Adults</p>
                    <select {...form.register("adultCount", { valueAsNumber: true })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-gold-500/60">
                      {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Children</p>
                    <select {...form.register("childCount", { valueAsNumber: true })}
                      className="w-full bg-surface-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-gold-500/60">
                      {[0,1,2,3,4].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!values.branchId || !values.checkInDate || !values.checkOutDate}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gold-gradient text-background font-semibold text-sm rounded-xl disabled:opacity-50 hover:shadow-gold-sm transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Room selection */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <h2 className="text-lg font-bold text-foreground font-serif">Choose a Room</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {rooms.filter(() => true).map((room) => {
                  const isSelected = selectedRoom?.id === room.id;
                  const total      = room.pricePerNight * nights;
                  return (
                    <button key={room.id} type="button"
                      onClick={() => { setSelectedRoom(room); setValue("roomId", room.id); }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected ? "border-gold-500/60 bg-gold-500/10" : "border-border bg-accent/20 hover:border-border/80"
                      }`}>
                      {room.images[0] && (
                        <img src={room.images[0].url} alt={room.name} className="w-16 h-12 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{room.name}</p>
                        <p className="text-xs text-muted-foreground">#{room.number} · {room.type} · up to {room.maxAdults} adults</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gold-400">{formatPKR(room.pricePerNight)}/night</p>
                        {nights > 0 && <p className="text-xs text-muted-foreground">{formatPKR(total)} total</p>}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-gold-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button type="button" onClick={() => setStep(3)} disabled={!selectedRoom}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold-gradient text-background font-semibold text-sm rounded-xl disabled:opacity-50">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Guest info */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-lg font-bold text-foreground font-serif">Guest Information</h2>
              {[
                { label: "Full Name",        name: "guestName"  as const, type: "text",  ph: "Muhammad Ahmad" },
                { label: "Phone Number",     name: "guestPhone" as const, type: "tel",   ph: "+92-300-0000000" },
                { label: "Email (optional)", name: "guestEmail" as const, type: "email", ph: "guest@email.com" },
                { label: "CNIC (optional)", name: "guestCnic"  as const, type: "text",  ph: "XXXXX-XXXXXXX-X" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{f.label}</label>
                  <input type={f.type} placeholder={f.ph} {...form.register(f.name)}
                    className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Special Requests</label>
                <textarea {...form.register("specialRequests")} rows={2} placeholder="Any special requirements..."
                  className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold-500/60 focus:ring-2 focus:ring-gold-500/20 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button type="button" onClick={() => setStep(4)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold-gradient text-background font-semibold text-sm rounded-xl">
                  Review Booking <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-lg font-bold text-foreground font-serif">Confirm Booking</h2>
              <div className="space-y-3 bg-accent/30 rounded-xl p-4">
                {[
                  ["Room",      selectedRoom?.name ?? "—"],
                  ["Check-in",  values.checkInDate],
                  ["Check-out", values.checkOutDate],
                  ["Nights",    `${nights} night${nights !== 1 ? "s" : ""}`],
                  ["Guest",     values.guestName],
                  ["Phone",     values.guestPhone],
                  ["Total",     formatPKR((selectedRoom?.pricePerNight ?? 0) * nights)],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">{k}</span>
                    <span className={`text-sm font-semibold ${k === "Total" ? "text-gold-400" : "text-foreground"}`}>{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)} className="flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button type="button" onClick={form.handleSubmit(onSubmit)} disabled={isPending}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold-gradient text-background font-semibold text-sm rounded-xl disabled:opacity-60 hover:shadow-gold-md transition-all">
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <>Confirm Booking <Check className="w-4 h-4" /></>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
