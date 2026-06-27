"use client";

import { useState, useTransition } from "react";
import { Bot, Plus, Trash2, Save, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { saveZaraKnowledge } from "@/server/actions/zara-knowledge";
import type { ZaraKnowledge, ZaraBranch, ZaraPromotion, ZaraAttraction } from "@/lib/agent/knowledge";
import { toast } from "sonner";

interface Props {
  initial: ZaraKnowledge;
}

function SectionToggle({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-surface-highlight hover:bg-surface-elevated transition-colors"
      >
        <div className="text-left">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-foreground uppercase tracking-wider">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = "w-full bg-surface-base border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all";
const textareaCls = `${inputCls} resize-y min-h-[80px]`;

export function ZaraKnowledgeForm({ initial }: Props) {
  const [data, setData]     = useState<ZaraKnowledge>(initial);
  const [isPending, start]  = useTransition();

  const set = <K extends keyof ZaraKnowledge>(key: K, value: ZaraKnowledge[K]) =>
    setData(d => ({ ...d, [key]: value }));

  // ── Policies array helpers ─────────────────────────────────
  const addPolicy = () => set("otherPolicies", [...data.otherPolicies, ""]);
  const setPolicy = (i: number, v: string) =>
    set("otherPolicies", data.otherPolicies.map((p, idx) => idx === i ? v : p));
  const removePolicy = (i: number) =>
    set("otherPolicies", data.otherPolicies.filter((_, idx) => idx !== i));

  // ── Branches ───────────────────────────────────────────────
  const setBranch = (i: number, field: keyof ZaraBranch, v: string) =>
    set("branches", data.branches.map((b, idx) => idx === i ? { ...b, [field]: v } : b));
  const addBranch = () =>
    set("branches", [...data.branches, { name: "", city: "", address: "" }]);
  const removeBranch = (i: number) =>
    set("branches", data.branches.filter((_, idx) => idx !== i));

  // ── Promotions ─────────────────────────────────────────────
  const setPromo = (i: number, field: keyof ZaraPromotion, v: string | number) =>
    set("promotions", data.promotions.map((p, idx) => idx === i ? { ...p, [field]: v } : p));
  const addPromo = () =>
    set("promotions", [...data.promotions, { code: "", minNights: 1, discountPct: 10, description: "" }]);
  const removePromo = (i: number) =>
    set("promotions", data.promotions.filter((_, idx) => idx !== i));

  // ── Attractions ────────────────────────────────────────────
  const setAttraction = (i: number, field: keyof ZaraAttraction, v: string | number) =>
    set("attractions", data.attractions.map((a, idx) => idx === i ? { ...a, [field]: v } : a));
  const addAttraction = () =>
    set("attractions", [...data.attractions, { name: "", distanceKm: 0, description: "" }]);
  const removeAttraction = (i: number) =>
    set("attractions", data.attractions.filter((_, idx) => idx !== i));

  const handleSave = () => {
    start(async () => {
      try {
        await saveZaraKnowledge(data);
        toast.success("Zara's knowledge updated! Changes live within 5 minutes.");
      } catch {
        toast.error("Failed to save. Please try again.");
      }
    });
  };

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-500/15 flex items-center justify-center">
            <Bot className="w-4 h-4 text-gold-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Zara's Knowledge Base</p>
            <p className="text-xs text-muted-foreground">Edit what Zara knows — no redeploy needed. Changes go live within 5 minutes.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-xs font-semibold rounded-lg hover:shadow-gold-sm transition-all disabled:opacity-60"
        >
          {isPending
            ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...</>
            : <><Save className="w-3.5 h-3.5" /> Save Changes</>}
        </button>
      </div>

      {/* Business Info */}
      <SectionToggle title="Business Hours & Policies" subtitle="Check-in, payment, CNIC, WiFi etc.">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Check-in Time">
            <input className={inputCls} value={data.checkIn}
              onChange={e => set("checkIn", e.target.value)} placeholder="2:00 PM" />
          </Field>
          <Field label="Check-out Time">
            <input className={inputCls} value={data.checkOut}
              onChange={e => set("checkOut", e.target.value)} placeholder="12:00 PM" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="AC Hours Daily">
            <input className={inputCls} type="number" min={0} max={24}
              value={data.acHoursDaily}
              onChange={e => set("acHoursDaily", Number(e.target.value))} />
          </Field>
          <Field label="Payment Policy">
            <input className={inputCls} value={data.paymentPolicy}
              onChange={e => set("paymentPolicy", e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone">
            <input className={inputCls} value={data.phone}
              onChange={e => set("phone", e.target.value)} />
          </Field>
          <Field label="Website">
            <input className={inputCls} value={data.website}
              onChange={e => set("website", e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Google Review URL">
            <input className={inputCls} value={data.googleReviewUrl}
              onChange={e => set("googleReviewUrl", e.target.value)} />
          </Field>
          <Field label="Review Incentive (what Zara tells guests)">
            <input className={inputCls} value={data.googleReviewIncentive}
              onChange={e => set("googleReviewIncentive", e.target.value)} />
          </Field>
        </div>

        <Field label="Other Policies" hint="Shown to guests when they ask about facilities">
          <div className="space-y-2">
            {data.otherPolicies.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputCls} value={p} onChange={e => setPolicy(i, e.target.value)} placeholder="e.g. Free parking on premises" />
                <button type="button" onClick={() => removePolicy(i)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addPolicy}
              className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add policy
            </button>
          </div>
        </Field>
      </SectionToggle>

      {/* Branches */}
      <SectionToggle title="Branches" subtitle="Locations Zara mentions to guests">
        <div className="space-y-3">
          {data.branches.map((b, i) => (
            <div key={i} className="p-4 bg-surface-highlight rounded-xl border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Branch {i + 1}</p>
                {data.branches.length > 1 && (
                  <button type="button" onClick={() => removeBranch(i)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} value={b.name} placeholder="Branch name"
                  onChange={e => setBranch(i, "name", e.target.value)} />
                <input className={inputCls} value={b.city} placeholder="City"
                  onChange={e => setBranch(i, "city", e.target.value)} />
              </div>
              <input className={inputCls} value={b.address} placeholder="Full address"
                onChange={e => setBranch(i, "address", e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={addBranch}
            className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add branch
          </button>
        </div>
      </SectionToggle>

      {/* Promotions */}
      <SectionToggle title="Promotions & Discount Codes" subtitle="Codes Zara recommends based on stay length">
        <div className="space-y-3">
          {data.promotions.map((p, i) => (
            <div key={i} className="p-4 bg-surface-highlight rounded-xl border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Promo {i + 1}</p>
                <button type="button" onClick={() => removePromo(i)}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input className={inputCls} value={p.code} placeholder="Code e.g. WEEKLY14"
                  onChange={e => setPromo(i, "code", e.target.value.toUpperCase())} />
                <input className={inputCls} type="number" min={1} value={p.minNights} placeholder="Min nights"
                  onChange={e => setPromo(i, "minNights", Number(e.target.value))} />
                <input className={inputCls} type="number" min={1} max={100} value={p.discountPct} placeholder="Discount %"
                  onChange={e => setPromo(i, "discountPct", Number(e.target.value))} />
              </div>
              <input className={inputCls} value={p.description} placeholder="What Zara says to guest about this promo"
                onChange={e => setPromo(i, "description", e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={addPromo}
            className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add promotion
          </button>
        </div>
      </SectionToggle>

      {/* Attractions */}
      <SectionToggle title="Nearby Attractions" subtitle="Places Zara recommends when guests ask about things to do">
        <div className="space-y-3">
          {data.attractions.map((a, i) => (
            <div key={i} className="p-4 bg-surface-highlight rounded-xl border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attraction {i + 1}</p>
                <button type="button" onClick={() => removeAttraction(i)}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <input className={inputCls} value={a.name} placeholder="Attraction name"
                    onChange={e => setAttraction(i, "name", e.target.value)} />
                </div>
                <input className={inputCls} type="number" min={0} value={a.distanceKm} placeholder="Distance (km)"
                  onChange={e => setAttraction(i, "distanceKm", Number(e.target.value))} />
              </div>
              <textarea className={textareaCls} value={a.description} placeholder="Short description Zara will use"
                onChange={e => setAttraction(i, "description", e.target.value)} />
            </div>
          ))}
          <button type="button" onClick={addAttraction}
            className="flex items-center gap-1.5 text-xs text-gold-400 hover:text-gold-300 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add attraction
          </button>
        </div>
      </SectionToggle>

      {/* Free-text blocks */}
      <SectionToggle title="Local Knowledge" subtitle="Food, weather, and transport — Zara uses these when guests ask">
        <Field label="Local Food" hint="What to eat near the guest house">
          <textarea className={textareaCls} value={data.localFood}
            onChange={e => set("localFood", e.target.value)} />
        </Field>
        <Field label="Weather Guide" hint="Seasonal guidance for guests planning their visit">
          <textarea className={textareaCls} value={data.weatherGuide}
            onChange={e => set("weatherGuide", e.target.value)} />
        </Field>
        <Field label="How to Reach Us" hint="Transport options from major cities">
          <textarea className={textareaCls} value={data.transportGuide}
            onChange={e => set("transportGuide", e.target.value)} />
        </Field>
      </SectionToggle>

      {/* Custom notes */}
      <SectionToggle title="Custom Notes" subtitle="Anything extra — temporary closures, special offers, seasonal info, event announcements">
        <Field label="Owner Notes" hint="Zara will use this in conversations. Update anytime — no redeploy needed.">
          <textarea
            className={`${textareaCls} min-h-[120px]`}
            value={data.customNotes}
            placeholder="e.g. Room 201 is under renovation until 15 July. Eid special: free breakfast for 3+ night bookings this week."
            onChange={e => set("customNotes", e.target.value)}
          />
        </Field>
      </SectionToggle>

      {/* Save button (bottom) */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-lg hover:shadow-gold-sm transition-all disabled:opacity-60"
        >
          {isPending
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</>
            : <><Save className="w-4 h-4" /> Save All Changes</>}
        </button>
      </div>
    </div>
  );
}
