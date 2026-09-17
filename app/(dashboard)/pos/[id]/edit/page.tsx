// ============================================================
// app/(dashboard)/pos/[id]/edit/page.tsx
// Edit an ACTIVE receipt. Managers: any time. Creator: same day only.
// The receipt number, branch, date and cashier never change.
// ============================================================

import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/shared";
import { requirePermission } from "@/lib/auth/session";
import { getGuestReceipt, getPosContext } from "@/server/actions/guest-receipts";
import { ReceiptEditor } from "@/features/pos/components/ReceiptEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit Receipt · POS" };

export default async function EditReceiptPage({ params }: { params: { id: string } }) {
  await requirePermission("pos:receipts:create");
  const receipt = await getGuestReceipt(params.id);
  if (!receipt) notFound();
  if (!receipt.canEdit) redirect(`/pos/${receipt.id}`);
  const context = await getPosContext();

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title={`Edit ${receipt.receiptNo}`} subtitle="Changes are recorded in the audit trail with your name" />
      <ReceiptEditor
        mode="edit"
        context={context}
        receiptId={receipt.id}
        receiptNo={receipt.receiptNo}
        createdAt={receipt.createdAt}
        createdByName={receipt.createdByName}
        initial={{
          branchId: receipt.branchId,
          bookingId: receipt.bookingId,
          roomNo: receipt.roomNo,
          guestName: receipt.guestName,
          notes: receipt.notes,
          items: receipt.items.map((i) => ({ name: i.name, qty: i.qty, rate: i.rate, inventoryItemId: i.inventoryItemId })),
          deliveryCharges: receipt.deliveryCharges,
          otherCharges: receipt.otherCharges,
          discount: receipt.discount,
          customerCharged: receipt.editValues?.customerCharged ?? null,
          vendorCost: receipt.editValues?.vendorCost ?? null,
        }}
      />
    </div>
  );
}
