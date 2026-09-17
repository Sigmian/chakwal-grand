// ============================================================
// app/(dashboard)/pos/[id]/page.tsx
// View a saved receipt (?print=1 opens the print dialog — "Print Again").
// ============================================================

import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared";
import { requirePermission } from "@/lib/auth/session";
import { getGuestReceipt } from "@/server/actions/guest-receipts";
import { ReceiptViewer } from "@/features/pos/components/ReceiptViewer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Receipt · POS" };

export default async function ReceiptPage({
  params, searchParams,
}: { params: { id: string }; searchParams: { print?: string } }) {
  await requirePermission("pos:receipts:read");
  const receipt = await getGuestReceipt(params.id);
  if (!receipt) notFound();

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title={`Receipt ${receipt.receiptNo}`}
        subtitle={`${receipt.branchName}${receipt.status === "CANCELLED" ? " · CANCELLED" : ""}`}
      />
      <ReceiptViewer receipt={receipt} autoPrint={searchParams.print === "1"} />
    </div>
  );
}
