"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Pencil, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { updateCustomerCnic } from "@/server/actions/customers";
import { cn } from "@/utils";

interface Props {
  customerId: string;
  cnic:       string | null;
  cnicImage:  string | null;
}

const inputCls = "w-full bg-surface-base border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50 transition-colors";

export function CnicPanel({ customerId, cnic, cnicImage }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [cnicVal, setCnicVal] = useState(cnic ?? "");

  const handleSave = () => {
    startTransition(async () => {
      const res = await updateCustomerCnic(customerId, cnicVal);
      if (res.success) {
        toast.success("CNIC updated");
        setEditing(false);
        router.refresh();
      } else {
        toast.error(res.error ?? "Failed to update CNIC");
      }
    });
  };

  const isVerified = !!cnic;

  return (
    <div className="card-luxury rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center",
            isVerified ? "bg-green-500/15" : "bg-amber-500/10"
          )}>
            <ShieldCheck className={cn("w-4 h-4", isVerified ? "text-green-400" : "text-amber-400")} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Identity Verification</p>
            <p className={cn("text-xs", isVerified ? "text-green-400" : "text-amber-400")}>
              {isVerified ? "CNIC on file" : "Not yet verified"}
            </p>
          </div>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-3">
          {cnic ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">CNIC Number</p>
                <p className="text-sm font-mono font-semibold text-foreground">{cnic}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400">CNIC not recorded</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Guest can show CNIC at reception, or enter the number below.
                </p>
              </div>
            </div>
          )}
          {cnicImage && (
            <a
              href={cnicImage}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-gold-400 hover:underline"
            >
              View uploaded CNIC photo →
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
              CNIC Number (e.g. 37405-1234567-9)
            </label>
            <input
              value={cnicVal}
              onChange={e => setCnicVal(e.target.value)}
              placeholder="XXXXX-XXXXXXX-X"
              className={inputCls}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gold-gradient text-background text-xs font-bold rounded-xl disabled:opacity-60"
            >
              {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setCnicVal(cnic ?? ""); }}
              className="px-3 py-2 border border-border text-muted-foreground text-xs rounded-xl hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
