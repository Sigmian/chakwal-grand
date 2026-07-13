import { requirePermission, getScopedBranchId } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { SectionHeader } from "@/components/shared";
import { OffersClient } from "@/features/offers/OffersClient";

export const metadata = { title: "Promo Codes & Offers" };

export default async function OffersPage() {
  const user     = await requirePermission("offers:read");
  const branchId = getScopedBranchId(user);

  const [offers, branches] = await Promise.all([
    prisma.offer.findMany({
      where:   branchId ? { OR: [{ branchId }, { branchId: null }] } : {},
      include: { branch: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    // Managers only see their own branch in the branch selector
    prisma.branch.findMany({
      where:   { isActive: true, ...(branchId ? { id: branchId } : { companyId: user.companyId }) },
      select:  { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Promo Codes & Offers"
        subtitle="Manage discount codes and automatic stay discounts"
      />
      <OffersClient
        offers={offers.map(o => ({
          ...o,
          discountValue: Number(o.discountValue),
          startsAt:  o.startsAt.toISOString(),
          expiresAt: o.expiresAt.toISOString(),
          createdAt: o.createdAt.toISOString(),
          branchId:  o.branchId ?? null,
          branch:    o.branch ? { id: o.branch.id, name: o.branch.name } : null,
        }))}
        branches={branches}
      />
    </div>
  );
}
