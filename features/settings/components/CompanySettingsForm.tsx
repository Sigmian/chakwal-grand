// ============================================================
// features/settings/components/CompanySettingsForm.tsx
// Editable company information form
// ============================================================

"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Save, Building2, Phone, Mail, MapPin, Globe } from "lucide-react";
import { cn } from "@/utils";
import { updateCompanyAction } from "@/server/actions/settings";

interface Company {
  id:       string;
  name:     string;
  tagline?: string | null;
  email?:   string | null;
  phone?:   string | null;
  whatsapp?:string | null;
  address?: string | null;
  city?:    string | null;
  currency: string;
  timezone: string;
}

interface Props { company: Company }

const FieldGroup = ({ label, children, icon: Icon }: { label: string; children: React.ReactNode; icon: React.ElementType }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </label>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className="w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all"
  />
);

export function CompanySettingsForm({ company }: Props) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name:     company.name,
    tagline:  company.tagline ?? "",
    email:    company.email   ?? "",
    phone:    company.phone   ?? "",
    whatsapp: company.whatsapp?? "",
    address:  company.address ?? "",
    city:     company.city    ?? "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateCompanyAction(company.id, form);
      if (res.success) toast.success("Company settings saved");
      else toast.error("Failed to save settings");
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <FieldGroup label="Company Name" icon={Building2}>
          <Input value={form.name} onChange={set("name")} placeholder="Chakwal Grand Guest House" />
        </FieldGroup>
        <FieldGroup label="Tagline" icon={Globe}>
          <Input value={form.tagline} onChange={set("tagline")} placeholder="Luxury stays in Pakistan" />
        </FieldGroup>
        <FieldGroup label="Email" icon={Mail}>
          <Input value={form.email} onChange={set("email")} placeholder="info@chakwalgrand.pk" type="email" />
        </FieldGroup>
        <FieldGroup label="Phone" icon={Phone}>
          <Input value={form.phone} onChange={set("phone")} placeholder="+92 300 1234567" />
        </FieldGroup>
        <FieldGroup label="WhatsApp" icon={Phone}>
          <Input value={form.whatsapp} onChange={set("whatsapp")} placeholder="+92 300 1234567" />
        </FieldGroup>
        <FieldGroup label="City" icon={MapPin}>
          <Input value={form.city} onChange={set("city")} placeholder="Chakwal" />
        </FieldGroup>
      </div>
      <FieldGroup label="Address" icon={MapPin}>
        <Input value={form.address} onChange={set("address")} placeholder="Full street address" />
      </FieldGroup>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
