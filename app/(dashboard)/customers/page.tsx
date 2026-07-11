// ============================================================
// app/(dashboard)/customers/page.tsx
// Customer directory — searchable table with loyalty tiers
// ============================================================

import Link from "next/link";
import { Users, Star, Crown, Plus } from "lucide-react";
import { requirePermission } from "@/lib/auth/session";
import { getCustomers } from "@/server/actions/branches";
import { hasPermission } from "@/lib/auth/permissions";
import {
  PageHeader, EmptyState, Badge,
} from "@/components/shared";
import {
  cn, formatPKR, formatDate, LOYALTY_TIER_CONFIG,
} from "@/utils";
import { LoyaltyTier } from "@/types";

export const metadata = { title: "Customers" };

const LOYALTY_BADGE_VARIANT: Record<LoyaltyTier, "gold" | "slate" | "orange" | "purple"> = {
  [LoyaltyTier.BRONZE]: "orange",
  [LoyaltyTier.SILVER]: "slate",
  [LoyaltyTier.GOLD]:   "gold",
  [LoyaltyTier.VIP]:    "purple",
};

export default async function CustomersPage() {
  const user      = await requirePermission("customers:read");
  const { data: customers } = await getCustomers();

  const vipCount    = customers.filter((c) => c.isVIP).length;
  const blacklisted = customers.filter((c) => c.isBlacklisted).length;
  const avgSpend    = customers.length > 0
    ? customers.reduce((s, c) => s + Number(c.totalSpending), 0) / customers.length
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} registered customers`}
        actions={
          hasPermission(user.role, "customers:create") ? (
            <Link
              href="/customers/new"
              className="flex items-center gap-2 px-4 py-2.5 bg-gold-gradient text-background text-sm font-semibold rounded-xl hover:shadow-gold-md transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </Link>
          ) : undefined
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Customers", value: customers.length.toString(), icon: Users,  color: "text-foreground" },
          { label: "VIP Guests",      value: vipCount.toString(),         icon: Crown,  color: "text-gold-400"  },
          { label: "Avg. Spend",      value: formatPKR(avgSpend),         icon: Star,   color: "text-green-400" },
          { label: "Blacklisted",     value: blacklisted.toString(),      icon: Users,  color: "text-red-400"   },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card-luxury p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="flex items-center gap-2 mt-2">
              <Icon className={cn("w-4 h-4", color)} />
              <span className={cn("text-xl font-bold font-serif", color)}>{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {customers.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title="No customers yet"
          body="Customers are created automatically when you make a booking, or add them manually."
        />
      ) : (
        <div className="card-luxury overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th className="hidden sm:table-cell">Contact</th>
                  <th>Loyalty</th>
                  <th className="hidden md:table-cell">Visits</th>
                  <th>Spent</th>
                  <th className="hidden lg:table-cell">Last Visit</th>
                  <th className="hidden sm:table-cell">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const tierCfg = LOYALTY_TIER_CONFIG[customer.loyaltyTier as LoyaltyTier];
                  return (
                    <tr key={customer.id} className="group">
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center text-background text-xs font-bold flex-shrink-0">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                              {customer.name}
                              {customer.isVIP && <Crown className="w-3 h-3 text-gold-400" />}
                            </p>
                            {/* Mobile-only: show phone inline */}
                            <p className="text-xs text-muted-foreground font-mono sm:hidden">{customer.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        <p className="text-sm text-foreground font-mono">{customer.phone}</p>
                        {customer.email && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">{customer.email}</p>
                        )}
                      </td>
                      <td>
                        <Badge variant={LOYALTY_BADGE_VARIANT[customer.loyaltyTier as LoyaltyTier]}>
                          {tierCfg.icon} {tierCfg.label}
                        </Badge>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-sm font-semibold text-foreground">{customer.totalVisits}</span>
                      </td>
                      <td>
                        <span className="text-sm font-semibold text-gold-400 whitespace-nowrap">
                          {formatPKR(Number(customer.totalSpending))}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(customer.lastVisitAt)}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        {customer.isBlacklisted ? (
                          <Badge variant="red">Blacklisted</Badge>
                        ) : customer.isVIP ? (
                          <Badge variant="gold">VIP</Badge>
                        ) : (
                          <Badge variant="green">Active</Badge>
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-xs text-gold-400 hover:text-gold-300 font-semibold"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
