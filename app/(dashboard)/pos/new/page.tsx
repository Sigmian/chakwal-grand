// ============================================================
// app/(dashboard)/pos/new/page.tsx
// Guest Orders POS → New Receipt  (?from=<id> duplicates a receipt)
// ============================================================

import Link from "next/link";
import { History } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { requirePermission } from "@/lib/auth/session";
import { getGuestReceipt, getPosContext } from "@/server/actions/guest-receipts";
import { ReceiptEditor, type EditorInitial } from "@/features/pos/components/ReceiptEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New Receipt · POS" };

export default async function NewReceiptPage({ searchParams }: { searchParams: { from?: string } }) {
  await requirePermission("pos:receipts:create");
  const context = await getPosContext();

  let initial: EditorInitial | undefined;
  let duplicateOf: string | undefined;
  if (searchParams.from) {
    const src = await getGuestReceipt(searchParams.from);
    if (src) {
      duplicateOf = src.receiptNo;
      initial = {
        branchId: src.branchId,
        roomNo: src.roomNo,
        guestName: src.guestName,
        notes: src.notes,
        items: src.items.map((i) => ({ name: i.name, qty: i.qty, rate: i.rate })),
        deliveryCharges: src.deliveryCharges,
        otherCharges: src.otherCharges,
        discount: src.discount,
        vendorCost: src.accounting?.vendorCost ?? null,
      };
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="New Receipt"
        subtitle={
          duplicateOf
            ? `Guest Orders POS · copy of ${duplicateOf} — a new receipt number is issued on generate`
            : "Guest Orders POS · type any item and rate, then generate and print"
        }
        actions={
          <Link
            href="/pos/history"
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:border-gold-500/40 hover:text-foreground"
          >
            <History className="h-4 w-4" /> Receipt History
          </Link>
        }
      />
      <ReceiptEditor mode="create" context={context} initial={initial} duplicateOf={duplicateOf} />
    </div>
  );
}
