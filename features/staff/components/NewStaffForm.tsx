"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStaffMember } from "@/server/actions/staff";
import { siteConfig } from "@/config/site";
import {
  Save, Loader2, User, Mail, Phone, CreditCard, Clock, MapPin,
  FileText, Shield, Info,
} from "lucide-react";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABELS: Record<string, string> = {
  MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun",
};
const ROLES = [
  { value: "RECEPTIONIST",    label: "Receptionist" },
  { value: "BRANCH_MANAGER",  label: "Branch Manager" },
  { value: "HOUSEKEEPING",    label: "Housekeeping" },
  { value: "INVENTORY_STAFF", label: "Inventory Staff" },
];

/** Friendly public branch name (falls back to the DB name). */
const branchName = (id: string, fallback: string) =>
  siteConfig.branches.find(b => b.id === id)?.name ?? fallback;

interface Branch { id: string; name: string; city: string }

interface Props {
  branches: Branch[];
  defaultBranchId?: string | null;
}

export function NewStaffForm({ branches, defaultBranchId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name:        "",
    email:       "",
    role:        "RECEPTIONIST",
    branchId:    defaultBranchId ?? branches[0]?.id ?? "",
    phone:       "",
    cnic:        "",
    designation: "",
    salary:      "",
    shiftStart:  "",
    shiftEnd:    "",
    workingDays: ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as string[],
    notes:       "",
  });

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  function toggleDay(day: string) {
    setForm(f => ({
      ...f,
      workingDays: f.workingDays.includes(day)
        ? f.workingDays.filter(d => d !== day)
        : [...f.workingDays, day],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.branchId) { setError("Please select a branch."); return; }

    startTransition(async () => {
      try {
        const salary = form.salary ? parseFloat(form.salary) : undefined;
        const res = await createStaffMember({
          name:        form.name.trim(),
          email:       form.email.trim(),
          role:        form.role as "BRANCH_MANAGER" | "RECEPTIONIST" | "HOUSEKEEPING" | "INVENTORY_STAFF",
          branchId:    form.branchId,
          phone:       form.phone.trim()       || undefined,
          cnic:        form.cnic.trim()        || undefined,
          designation: form.designation.trim() || undefined,
          salary:      salary && !isNaN(salary) ? salary : undefined,
          shiftStart:  form.shiftStart || undefined,
          shiftEnd:    form.shiftEnd   || undefined,
          workingDays: form.workingDays.length ? form.workingDays : undefined,
          notes:       form.notes.trim() || undefined,
        });
        router.push(`/staff/${res.staffId}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to create staff member";
        // Surface the common case in plain language
        setError(/unique|already exists|P2002/i.test(msg)
          ? "That email is already in use by another user."
          : msg);
      }
    });
  }

  const labelCls = "block text-xs text-muted-foreground mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Info */}
      <section className="card-luxury p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-gold-400" /> Personal Info
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="s-name" className={labelCls}>Full Name *</label>
            <input
              id="s-name"
              className="input-luxury w-full"
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g. Ahmed Raza"
              minLength={2}
              required
            />
          </div>
          <div>
            <label htmlFor="s-phone" className={labelCls}>
              <Phone className="w-3 h-3 inline mr-1" />Phone
            </label>
            <input
              id="s-phone"
              className="input-luxury w-full"
              value={form.phone}
              onChange={e => set("phone", e.target.value)}
              placeholder="+92 300 0000000"
            />
          </div>
          <div>
            <label htmlFor="s-designation" className={labelCls}>Designation</label>
            <input
              id="s-designation"
              className="input-luxury w-full"
              value={form.designation}
              onChange={e => set("designation", e.target.value)}
              placeholder="e.g. Front Desk Officer"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="s-cnic" className={labelCls}>CNIC (without dashes)</label>
            <input
              id="s-cnic"
              className="input-luxury w-full font-mono"
              value={form.cnic}
              onChange={e => set("cnic", e.target.value)}
              placeholder="3610012345678"
              maxLength={13}
            />
          </div>
        </div>
      </section>

      {/* Login & Access */}
      <section className="card-luxury p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-gold-400" /> Login & Access
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor="s-email" className={labelCls}>
              <Mail className="w-3 h-3 inline mr-1" />Email (login) *
            </label>
            <input
              id="s-email"
              type="email"
              className="input-luxury w-full"
              value={form.email}
              onChange={e => set("email", e.target.value)}
              placeholder="name@chakwalgrand.pk"
              required
            />
          </div>

          <div>
            <label htmlFor="s-role" className={labelCls}>Role *</label>
            <select
              id="s-role"
              className="input-luxury w-full"
              value={form.role}
              onChange={e => set("role", e.target.value)}
            >
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="s-branch" className={labelCls}>
              <MapPin className="w-3 h-3 inline mr-1" />Branch *
            </label>
            <select
              id="s-branch"
              className="input-luxury w-full"
              value={form.branchId}
              onChange={e => set("branchId", e.target.value)}
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{branchName(b.id, b.name)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-gold-500/5 border border-gold-500/20">
          <Info className="w-3.5 h-3.5 text-gold-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            The account is created without a usable password — set one for them from
            their profile before they sign in for the first time.
          </p>
        </div>
      </section>

      {/* Salary */}
      <section className="card-luxury p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5 text-gold-400" /> Salary
        </h3>
        <div className="sm:max-w-xs">
          <label htmlFor="s-salary" className={labelCls}>Monthly Salary (PKR)</label>
          <input
            id="s-salary"
            type="number"
            className="input-luxury w-full"
            value={form.salary}
            onChange={e => set("salary", e.target.value)}
            placeholder="e.g. 25000"
            min="0"
          />
        </div>
      </section>

      {/* Duty Hours */}
      <section className="card-luxury p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gold-400" /> Duty Hours
        </h3>

        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <div>
            <label htmlFor="s-start" className={labelCls}>Shift Start</label>
            <input
              id="s-start"
              type="time"
              className="input-luxury w-full font-mono"
              value={form.shiftStart}
              onChange={e => set("shiftStart", e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="s-end" className={labelCls}>Shift End</label>
            <input
              id="s-end"
              type="time"
              className="input-luxury w-full font-mono"
              value={form.shiftEnd}
              onChange={e => set("shiftEnd", e.target.value)}
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">Working Days</p>
          <div className="flex gap-1.5 flex-wrap">
            {DAYS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  form.workingDays.includes(d)
                    ? "bg-gold-500/20 text-gold-400 border-gold-500/40"
                    : "bg-accent text-muted-foreground border-border/50 hover:border-gold-500/30"
                }`}
              >
                {DAY_LABELS[d]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notes */}
      <section className="card-luxury p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-gold-400" /> Notes
        </h3>
        <textarea
          className="input-luxury w-full resize-none"
          rows={3}
          value={form.notes}
          onChange={e => set("notes", e.target.value)}
          placeholder="Internal notes about this staff member…"
        />
      </section>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push("/staff")}
          className="px-5 py-2.5 text-sm font-semibold rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-gold-500/30 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-60"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {pending ? "Creating…" : "Create Staff Member"}
        </button>
      </div>
    </form>
  );
}
