// ============================================================
// app/(dashboard)/finance/layout.tsx
// PIN gate for every page under /finance.
//
// While locked the children are never rendered, so no financial
// data is fetched or sent to the browser at all.
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { isFinanceUnlocked, UNLOCK_MINUTES } from "@/lib/auth/finance-pin";
import { FinancePinGate } from "@/features/finance/components/FinancePinGate";

export const dynamic = "force-dynamic";

export default async function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requirePermission("finance:read");

  if (!isFinanceUnlocked(user.id)) {
    return <FinancePinGate minutes={UNLOCK_MINUTES} />;
  }

  return <>{children}</>;
}
