"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Save, Loader2, User, Phone, Mail, MapPin } from "lucide-react";
import { createCustomer } from "@/server/actions/customers";
import { RoomType } from "@/types";
import { cn } from "@/utils";

const inputCls = "w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5";

const ROOM_TYPES = [
  { value: RoomType.STANDARD, label: "Standard" },
  { value: RoomType.DELUXE,   label: "Deluxe"   },
  { value: RoomType.SUITE,    label: "Suite"     },
  { value: RoomType.FAMILY,   label: "Family"    },
  { value: RoomType.VIP,      label: "VIP"       },
];

export function NewCustomerForm() {
  const router = useRouter();
  const [isPending, start] = useTransition();

  const [form, setForm] = useState({
    name:             "",
    phone:            "",
    email:            "",
    cnic:             "",
    nationality:      "Pakistani",
    city:             "",
    preferredRoomType: "" as RoomType | "",
    specialRequests:  "",
    notes:            "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = () => {
    if (!form.name.trim())  { toast.error("Name is required");  return; }
    if (!form.phone.trim()) { toast.error("Phone is required"); return; }

    start(async () => {
      const res = await createCustomer(form);
      if (res.success) {
        toast.success(`${form.name} added as a customer`);
        router.push(`/customers/${res.customerId}`);
      } else {
        toast.error(res.error ?? "Failed to add customer");
      }
    });
  };

  return (
    <div className="max-w-2xl space-y-5">
      {/* Personal info */}
      <div className="card-luxury p-6 space-y-5">
        <h2 className="flex items-center gap-2.5 text-sm font-bold text-foreground">
          <div className="w-7 h-7 rounded-lg bg-gold-500/15 flex items-center justify-center">
            <User className="w-4 h-4 text-gold-400" />
          </div>
          Personal Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Full Name *</label>
            <input value={form.name} onChange={set("name")} placeholder="e.g. Ahmed Ali Khan" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone *</label>
            <input value={form.phone} onChange={set("phone")} placeholder="+92-300-1234567" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input type="email" value={form.email} onChange={set("email")} placeholder="guest@example.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>CNIC</label>
            <input value={form.cnic} onChange={set("cnic")} placeholder="35202-1234567-8" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input value={form.city} onChange={set("city")} placeholder="Chakwal" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Nationality</label>
            <input value={form.nationality} onChange={set("nationality")} placeholder="Pakistani" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="card-luxury p-6 space-y-5">
        <h2 className="flex items-center gap-2.5 text-sm font-bold text-foreground">
          <div className="w-7 h-7 rounded-lg bg-gold-500/15 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-gold-400" />
          </div>
          Preferences & Notes
        </h2>

        <div>
          <label className={labelCls}>Preferred Room Type</label>
          <select value={form.preferredRoomType} onChange={set("preferredRoomType")} className={inputCls}>
            <option value="">No preference</option>
            {ROOM_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Special Requests</label>
          <textarea value={form.specialRequests} onChange={set("specialRequests")} rows={3}
            placeholder="Any special requirements or preferences…" className={inputCls + " resize-none"} />
        </div>

        <div>
          <label className={labelCls}>Staff Notes</label>
          <textarea value={form.notes} onChange={set("notes")} rows={2}
            placeholder="Internal notes visible only to staff…" className={inputCls + " resize-none"} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Link href="/customers"
          className="px-5 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          Cancel
        </Link>
        <button onClick={handleSubmit} disabled={isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-gold-gradient text-background text-sm font-bold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-60">
          {isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</>
            : <><Save className="w-4 h-4" />Add Customer</>
          }
        </button>
      </div>
    </div>
  );
}
