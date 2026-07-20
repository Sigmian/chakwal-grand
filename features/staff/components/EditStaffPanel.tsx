"use client";

import { useState, useTransition } from "react";
import { updateStaffMember } from "@/server/actions/staff";
import { X, Save, Loader2, User, Mail, Phone, CreditCard, Clock, MapPin, FileText, Shield } from "lucide-react";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const DAY_LABELS: Record<string, string> = {
  MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun",
};
const ROLES = [
  { value: "BRANCH_MANAGER",  label: "Branch Manager" },
  { value: "RECEPTIONIST",    label: "Receptionist" },
  { value: "HOUSEKEEPING",    label: "Housekeeping" },
  { value: "INVENTORY_STAFF", label: "Inventory Staff" },
];

interface Branch { id: string; name: string; city: string }

interface StaffData {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  branchId: string;
  phone: string | null;
  cnic: string | null;
  designation: string | null;
  salary: number | null;
  shiftStart: string | null;
  shiftEnd: string | null;
  workingDays: string[];
  notes: string | null;
}

interface Props {
  staff: StaffData;
  branches: Branch[];
  isSuperAdmin: boolean;
  onClose: () => void;
}

export function EditStaffPanel({ staff, branches, isSuperAdmin, onClose }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name:        staff.name,
    email:       staff.email,
    role:        staff.role,
    branchId:    staff.branchId,
    phone:       staff.phone       ?? "",
    cnic:        staff.cnic        ?? "",
    designation: staff.designation ?? "",
    salary:      staff.salary      != null ? String(staff.salary) : "",
    shiftStart:  staff.shiftStart  ?? "",
    shiftEnd:    staff.shiftEnd    ?? "",
    workingDays: staff.workingDays as string[],
    notes:       staff.notes       ?? "",
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
    startTransition(async () => {
      try {
        const salary = form.salary ? parseFloat(form.salary) : undefined;
        await updateStaffMember(staff.id, {
          name:        form.name       || undefined,
          email:       form.email      || undefined,
          role:        form.role       as any || undefined,
          branchId:    form.branchId   || undefined,
          phone:       form.phone      || undefined,
          cnic:        form.cnic       || undefined,
          designation: form.designation || undefined,
          salary:      salary && !isNaN(salary) ? salary : undefined,
          shiftStart:  form.shiftStart || undefined,
          shiftEnd:    form.shiftEnd   || undefined,
          workingDays: form.workingDays.length ? form.workingDays : undefined,
          notes:       form.notes      || undefined,
        });
        setSuccess(true);
        setTimeout(() => { onClose(); window.location.reload(); }, 800);
      } catch (err: any) {
        setError(err?.message ?? "Failed to update staff member");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* panel */}
      <div className="relative z-10 w-full max-w-lg bg-surface-elevated border-l border-border h-full overflow-y-auto shadow-2xl flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-surface-elevated sticky top-0 z-10">
          <div>
            <h2 className="font-bold text-foreground font-serif">Edit Staff Member</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{staff.name}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-5 space-y-6">
          {/* Personal Info */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gold-400" /> Personal Info
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">Full Name</label>
                <input
                  className="input-luxury w-full"
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </label>
                <input
                  className="input-luxury w-full"
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="+92 300 0000000"
                />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs text-muted-foreground mb-1">Designation</label>
                <input
                  className="input-luxury w-full"
                  value={form.designation}
                  onChange={e => set("designation", e.target.value)}
                  placeholder="e.g. Front Desk Officer"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1">CNIC (without dashes)</label>
                <input
                  className="input-luxury w-full font-mono"
                  value={form.cnic}
                  onChange={e => set("cnic", e.target.value)}
                  placeholder="3610012345678"
                  maxLength={13}
                />
              </div>
            </div>
          </section>

          {/* Login & Role */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-gold-400" /> Login & Access
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> Email (login)
                </label>
                <input
                  type="email"
                  className="input-luxury w-full"
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1">Role</label>
                <select
                  className="input-luxury w-full"
                  value={form.role}
                  onChange={e => set("role", e.target.value)}
                >
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Branch
                </label>
                {isSuperAdmin ? (
                  <select
                    className="input-luxury w-full"
                    value={form.branchId}
                    onChange={e => set("branchId", e.target.value)}
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} — {b.city}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input-luxury w-full opacity-60"
                    value={branches.find(b => b.id === form.branchId)?.name ?? form.branchId}
                    readOnly
                  />
                )}
              </div>
            </div>
          </section>

          {/* Salary */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-gold-400" /> Salary
            </h3>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Monthly Salary (PKR)</label>
              <input
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
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold-400" /> Duty Hours
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Shift Start</label>
                <input
                  type="time"
                  className="input-luxury w-full font-mono"
                  value={form.shiftStart}
                  onChange={e => set("shiftStart", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Shift End</label>
                <input
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
          <section className="space-y-3">
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

          {/* Error / Success */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-400">
              Saved successfully!
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2 sticky bottom-0 bg-surface-elevated pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-gold-500/30 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || success}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all disabled:opacity-60"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {pending ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
