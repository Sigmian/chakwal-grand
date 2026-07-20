"use client";

import { useState } from "react";
import { PaySalaryForm } from "@/features/payroll/components/PaySalaryForm";
import { AdvanceForm }   from "@/features/payroll/components/AdvanceForm";
import { formatPKR, cn } from "@/utils";
import { DollarSign, Banknote, X, Image as ImageIcon } from "lucide-react";

interface Advance {
  id: string;
  amount: number | string;
  reason: string | null;
  notes: string | null;
  givenAt: Date | string;
  status: string;
  signature: string | null;
  deductedAt: Date | string | null;
}

interface Payment {
  id: string;
  month: number;
  year: number;
  grossAmount: number | string;
  advanceDeducted: number | string;
  netAmount: number | string;
  notes: string | null;
  signature: string | null;
  paidAt: Date | string;
}

interface Props {
  staffMemberId: string;
  staffName: string;
  defaultSalary: number;
  pendingAdvances: Advance[];
  payments: Payment[];
  advances: Advance[];
  totalPending: number;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-surface-elevated border border-border rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function SignatureViewer({ sig, label }: { sig: string; label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 transition-colors"
      >
        <ImageIcon className="w-3 h-3" />
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setOpen(false)}>
          <div className="bg-surface-elevated border border-border rounded-2xl p-4 max-w-lg w-full">
            <p className="text-xs text-muted-foreground mb-2">{label}</p>
            <img src={sig} alt="Signature" className="w-full rounded-xl border border-border" />
            <p className="text-xs text-muted-foreground mt-2 text-center">Click anywhere to close</p>
          </div>
        </div>
      )}
    </>
  );
}

export function PayrollClient({ staffMemberId, staffName, defaultSalary, pendingAdvances, payments, advances, totalPending }: Props) {
  const [modal, setModal] = useState<"pay" | "advance" | null>(null);

  function reload() { window.location.reload(); }

  return (
    <>
      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setModal("pay")}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all"
        >
          <DollarSign className="w-4 h-4" />
          Pay Salary
        </button>
        <button
          onClick={() => setModal("advance")}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-500/30 transition-all"
        >
          <Banknote className="w-4 h-4" />
          Give Advance
        </button>
      </div>

      {/* Salary Payments Table */}
      <div className="card-luxury overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground">Salary Payments</h3>
          <span className="text-xs text-muted-foreground">{payments.length} records</span>
        </div>
        {payments.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No salary payments recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Gross</th>
                  <th>Adv. Deducted</th>
                  <th>Net Paid</th>
                  <th>Date</th>
                  <th>Signature</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-semibold text-foreground">{MONTHS[p.month - 1]} {p.year}</td>
                    <td className="text-muted-foreground">{formatPKR(Number(p.grossAmount))}</td>
                    <td>
                      {Number(p.advanceDeducted) > 0
                        ? <span className="text-red-400">− {formatPKR(Number(p.advanceDeducted))}</span>
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="font-bold text-gold-400">{formatPKR(Number(p.netAmount))}</td>
                    <td className="text-muted-foreground text-xs">{new Date(p.paidAt).toLocaleDateString("en-PK")}</td>
                    <td>
                      {p.signature
                        ? <SignatureViewer sig={p.signature} label="View signature" />
                        : <span className="text-xs text-muted-foreground">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advances Table */}
      <div className="card-luxury overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground">Advance History</h3>
          {totalPending > 0 && (
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              Pending: {formatPKR(totalPending)}
            </span>
          )}
        </div>
        {advances.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">No advances recorded</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Deducted On</th>
                  <th>Signature</th>
                </tr>
              </thead>
              <tbody>
                {advances.map((a) => (
                  <tr key={a.id}>
                    <td className="text-xs text-muted-foreground">{new Date(a.givenAt).toLocaleDateString("en-PK")}</td>
                    <td className="font-bold text-amber-400">{formatPKR(Number(a.amount))}</td>
                    <td className="text-sm text-muted-foreground">{a.reason ?? "—"}</td>
                    <td>
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        a.status === "PENDING"  ? "bg-amber-500/10 text-amber-400" :
                        a.status === "DEDUCTED" ? "bg-green-500/10 text-green-400" :
                                                   "bg-gray-500/10 text-gray-400"
                      )}>
                        {a.status}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {a.deductedAt ? new Date(a.deductedAt).toLocaleDateString("en-PK") : "—"}
                    </td>
                    <td>
                      {a.signature
                        ? <SignatureViewer sig={a.signature} label="View signature" />
                        : <span className="text-xs text-muted-foreground">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === "pay" && (
        <Modal title={`Pay Salary — ${staffName}`} onClose={() => setModal(null)}>
          <PaySalaryForm
            staffMemberId={staffMemberId}
            staffName={staffName}
            defaultSalary={defaultSalary}
            pendingAdvances={pendingAdvances}
            onSuccess={() => { setModal(null); reload(); }}
          />
        </Modal>
      )}
      {modal === "advance" && (
        <Modal title={`Give Advance — ${staffName}`} onClose={() => setModal(null)}>
          <AdvanceForm
            staffMemberId={staffMemberId}
            staffName={staffName}
            onSuccess={() => { setModal(null); reload(); }}
          />
        </Modal>
      )}
    </>
  );
}
