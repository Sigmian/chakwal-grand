// ============================================================
// app/(dashboard)/pos/history/page.tsx
// Guest Orders POS → Receipt History
// ============================================================

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { requirePermission } from "@/lib/auth/session";
import { listGuestReceipts, type ReceiptFilters } from "@/server/actions/guest-receipts";
import { ReceiptHistory } from "@/features/pos/components/ReceiptHistory";

export const dynamic = "force-dynamic";
export const metadata = { title: "Receipt History · POS" };

const KEYS = ["q", "from", "to", "room", "guest", "staff", "branch", "status", "page"] as const;

export default async function ReceiptHistoryPage({
  searchParams,
}: { searchParams: Record<string, string | string[] | undefined> }) {
  await requirePermission("pos:receipts:read");
  const filters: ReceiptFilters = {};
  for (const k of KEYS) {
    const v = searchParams[k];
    const s = Array.isArray(v) ? v[0] : v;
    if (s && s.length <= 100) filters[k] = s;
  }
  const data = await listGuestReceipts(filters);

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader
        title="Receipt History"
        subtitle="Every Guest Orders POS bill — cancelled receipts stay on record"
        actions={
          <Link href="/pos/new" className="flex items-center gap-2 rounded-xl bg-gold-gradient px-4 py-2 text-sm font-bold text-background">
            <Plus className="h-4 w-4" /> New Receipt
          </Link>
        }
      />
      <ReceiptHistory data={data} filters={filters} />
    </div>
  );
}
