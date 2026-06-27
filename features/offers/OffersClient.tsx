"use client";

import { useState, useTransition } from "react";
import { Plus, Tag, Trash2, ToggleLeft, ToggleRight, Copy, Check, Loader2 } from "lucide-react";
import { createOffer, deleteOffer, toggleOffer } from "@/server/actions/offers";

interface Offer {
  id: string;
  name: string;
  code: string | null;
  discountType: string;
  discountValue: number;
  minNights: number | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  startsAt: string;
  expiresAt: string;
  createdAt: string;
  branchId: string | null;
  branch: { id: string; name: string } | null;
}

interface Props {
  offers: Offer[];
  branches: { id: string; name: string }[];
}

export function OffersClient({ offers: initial, branches }: Props) {
  const [offers, setOffers] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied]     = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "", code: "", discountType: "PERCENTAGE", discountValue: "10",
    minNights: "", maxUses: "", branchId: "",
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleCreate = () => {
    startTransition(async () => {
      const res = await createOffer({
        name:          form.name,
        code:          form.code || undefined,
        discountType:  form.discountType,
        discountValue: parseFloat(form.discountValue),
        minNights:     form.minNights ? parseInt(form.minNights) : undefined,
        maxUses:       form.maxUses ? parseInt(form.maxUses) : undefined,
        expiresAt:     new Date(form.expiresAt),
        branchId:      form.branchId || undefined,
      });
      if (res.success && res.offer) {
        const o = res.offer!;
        setOffers(prev => [{
          ...o,
          discountValue: Number(o.discountValue),
          startsAt:  o.startsAt.toISOString(),
          expiresAt: o.expiresAt.toISOString(),
          createdAt: o.createdAt.toISOString(),
          branchId:  o.branchId ?? null,
          branch:    branches.find(b => b.id === o.branchId) ?? null,
        }, ...prev]);
        setShowForm(false);
        setForm({ name: "", code: "", discountType: "PERCENTAGE", discountValue: "10", minNights: "", maxUses: "", branchId: "", expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) });
      }
    });
  };

  const handleToggle = (id: string) => {
    startTransition(async () => {
      await toggleOffer(id);
      setOffers(prev => prev.map(o => o.id === id ? { ...o, isActive: !o.isActive } : o));
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this offer?")) return;
    startTransition(async () => {
      await deleteOffer(id);
      setOffers(prev => prev.filter(o => o.id !== id));
    });
  };

  const AUTO_CODES  = ["WEEKLY14", "MONTHLY40", "AUTO_GRANDOPEN50"];
  const autoOffers  = offers.filter(o => AUTO_CODES.includes(o.code ?? ""));
  const promoOffers = offers.filter(o => !AUTO_CODES.includes(o.code ?? ""));

  return (
    <div className="space-y-8">
      {/* Auto Discounts */}
      <div className="card-luxury rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1">Automatic Stay Discounts</h3>
        <p className="text-xs text-muted-foreground mb-4">Applied automatically based on length of stay — no code needed.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {autoOffers.map(o => (
            <AutoDiscountCard key={o.id} offer={o} onToggle={handleToggle} />
          ))}
        </div>
      </div>

      {/* Promo Codes */}
      <div className="card-luxury rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-1">Promo Codes</h3>
            <p className="text-xs text-muted-foreground">Share codes with customers for discounts.</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-background text-xs font-bold rounded-xl hover:shadow-gold-lg transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Code
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="mb-5 p-4 rounded-xl bg-surface-elevated border border-border space-y-3">
            <p className="text-xs font-bold text-gold-400 uppercase tracking-widest">Create Promo Code</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">Offer Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Summer Discount"
                  className="mt-1 w-full px-3 py-2 text-sm bg-surface-base border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Code (leave blank to auto-generate)</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SUMMER25"
                  className="mt-1 w-full px-3 py-2 text-sm bg-surface-base border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50 font-mono" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Discount Type</label>
                <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm bg-surface-base border border-border rounded-lg text-foreground focus:outline-none focus:border-gold-500/50">
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount (PKR)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Discount Value</label>
                <input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm bg-surface-base border border-border rounded-lg text-foreground focus:outline-none focus:border-gold-500/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Min. Nights (optional)</label>
                <input type="number" value={form.minNights} onChange={e => setForm(f => ({ ...f, minNights: e.target.value }))}
                  placeholder="e.g. 2"
                  className="mt-1 w-full px-3 py-2 text-sm bg-surface-base border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Max Uses (optional)</label>
                <input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                  placeholder="e.g. 50"
                  className="mt-1 w-full px-3 py-2 text-sm bg-surface-base border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Branch (optional)</label>
                <select value={form.branchId} onChange={e => setForm(f => ({ ...f, branchId: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm bg-surface-base border border-border rounded-lg text-foreground focus:outline-none focus:border-gold-500/50">
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Expires On</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 text-sm bg-surface-base border border-border rounded-lg text-foreground focus:outline-none focus:border-gold-500/50" />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={handleCreate} disabled={pending || !form.name || !form.discountValue}
                className="flex items-center gap-2 px-5 py-2 bg-gold-gradient text-background text-xs font-bold rounded-xl disabled:opacity-50">
                {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Create
              </button>
              <button onClick={() => setShowForm(false)} className="px-5 py-2 border border-border text-xs font-semibold text-muted-foreground rounded-xl hover:text-foreground">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {promoOffers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No promo codes yet. Create one above.</p>
          )}
          {promoOffers.map(o => (
            <PromoCodeRow key={o.id} offer={o} copied={copied} onCopy={copyCode} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      </div>
    </div>
  );
}

function AutoDiscountCard({ offer, onToggle }: { offer: Offer; onToggle: (id: string) => void }) {
  const isWeekly      = offer.code === "WEEKLY14";
  const isGrandOpen   = offer.code === "AUTO_GRANDOPEN50";
  const expiry        = new Date(offer.expiresAt);
  const expired       = expiry < new Date();

  const subtitle = isWeekly
    ? "7+ nights · Auto-applied globally"
    : isGrandOpen
    ? `Grand Opening · Auto-applied${offer.branch ? ` at ${offer.branch.name}` : ""}`
    : "30+ nights · Auto-applied globally";

  const accentClass = isGrandOpen
    ? offer.isActive ? "bg-emerald-500/5 border-emerald-500/20" : "bg-surface-elevated border-border"
    : offer.isActive ? "bg-gold-500/5 border-gold-500/20"     : "bg-surface-elevated border-border";

  return (
    <div className={`rounded-xl p-4 border ${accentClass}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-foreground">{offer.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <button onClick={() => onToggle(offer.id)} className="text-muted-foreground hover:text-foreground transition-colors mt-0.5">
          {offer.isActive
            ? <ToggleRight className={`w-6 h-6 ${isGrandOpen ? "text-emerald-400" : "text-gold-400"}`} />
            : <ToggleLeft  className="w-6 h-6" />
          }
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${isGrandOpen ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-gold-500/15 border-gold-500/30 text-gold-400"}`}>
          {offer.discountValue}% OFF
        </span>
        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${offer.isActive && !expired ? "bg-emerald-500/10 text-emerald-400" : "bg-surface-base text-muted-foreground"}`}>
          {expired ? "Expired" : offer.isActive ? "Active" : "Paused"}
        </span>
        {isGrandOpen && !expired && (
          <span className="text-[10px] text-muted-foreground">
            Ends {expiry.toLocaleDateString("en-PK", { day: "numeric", month: "short" })}
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">Used {offer.usedCount} times</p>
    </div>
  );
}

function PromoCodeRow({
  offer, copied, onCopy, onToggle, onDelete,
}: {
  offer: Offer;
  copied: string | null;
  onCopy: (c: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const expiry  = new Date(offer.expiresAt);
  const expired = expiry < new Date();

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface-elevated">
      <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
        <Tag className="w-4 h-4 text-gold-400" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-foreground">{offer.name}</p>
          {offer.code && (
            <button onClick={() => onCopy(offer.code!)}
              className="flex items-center gap-1 font-mono text-xs text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2 py-0.5 rounded-md hover:bg-gold-500/20 transition-colors">
              {copied === offer.code ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {offer.code}
            </button>
          )}
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${offer.isActive && !expired ? "bg-emerald-500/10 text-emerald-400" : "bg-surface-base text-muted-foreground"}`}>
            {expired ? "Expired" : offer.isActive ? "Active" : "Paused"}
          </span>
          {offer.branch && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {offer.branch.name}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {offer.discountType === "PERCENTAGE" ? `${offer.discountValue}% off` : `PKR ${offer.discountValue} off`}
          {offer.minNights ? ` · Min ${offer.minNights} nights` : ""}
          {offer.maxUses ? ` · ${offer.usedCount}/${offer.maxUses} used` : ` · ${offer.usedCount} used`}
          {" · "}Expires {expiry.toLocaleDateString("en-PK")}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => onToggle(offer.id)} className="text-muted-foreground hover:text-foreground transition-colors">
          {offer.isActive
            ? <ToggleRight className="w-5 h-5 text-gold-400" />
            : <ToggleLeft  className="w-5 h-5" />
          }
        </button>
        <button onClick={() => onDelete(offer.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
