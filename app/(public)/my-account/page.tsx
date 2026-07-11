import type { Metadata } from "next";
import { cookies } from "next/headers";
import prisma from "@/lib/db/prisma";
import { CustomerOTPLogin } from "@/features/public/components/CustomerOTPLogin";
import { CustomerAccount, type CustomerAccountData } from "@/features/public/components/CustomerAccount";

export const metadata: Metadata = {
  title: "My Account | Chakwal Guest House",
  description: "Sign in to view your bookings, loyalty tier and benefits at Chakwal Guest House.",
  robots: { index: false },
};

type Tier = "Bronze" | "Silver" | "Gold" | "Platinum";

const TIER_THRESHOLDS: Array<{ tier: Tier; min: number; benefits: string }> = [
  { tier: "Bronze",   min: 0,  benefits: "Welcome to the CGH family!" },
  { tier: "Silver",   min: 10, benefits: "10% off your next stay — mention at check-in" },
  { tier: "Gold",     min: 30, benefits: "Free room upgrade when available · Early check-in 11am" },
  { tier: "Platinum", min: 60, benefits: "Dedicated phone line · Late checkout 2pm · Complimentary breakfast" },
];

function deriveTier(nights: number) {
  let current = TIER_THRESHOLDS[0];
  for (const t of TIER_THRESHOLDS) {
    if (nights >= t.min) current = t;
  }
  const currentIdx = TIER_THRESHOLDS.findIndex((t) => t.tier === current.tier);
  const next = TIER_THRESHOLDS[currentIdx + 1] ?? null;
  return {
    tier: current.tier,
    benefits: current.benefits,
    currentTierMin: current.min,
    nextTier: next ? next.tier : null,
    nextTierMin: next ? next.min : null,
    nightsToNextTier: next ? Math.max(0, next.min - nights) : null,
  };
}

export default async function MyAccountPage() {
  const token = cookies().get("cgh_customer_session")?.value;

  let session = null as null | Awaited<ReturnType<typeof loadSession>>;
  if (token) {
    session = await loadSession(token);
  }

  if (!session) {
    return <CustomerOTPLogin />;
  }

  const { customer } = session;

  const lifetimeNights = customer.bookings
    .filter((b) => b.status === "CHECKED_OUT")
    .reduce((sum, b) => sum + (b.nights ?? 0), 0);

  const tierInfo = deriveTier(lifetimeNights);

  const data: CustomerAccountData = {
    name: customer.name,
    phone: customer.phone,
    lifetimeNights,
    ...tierInfo,
    bookings: customer.bookings
      .slice()
      .sort((a, b) => b.checkInDate.getTime() - a.checkInDate.getTime())
      .map((b) => ({
        id: b.id,
        bookingRef: b.bookingRef,
        roomName: b.room?.name ?? "—",
        branchName: b.room?.branch?.name ?? "—",
        checkInDate: b.checkInDate.toISOString(),
        checkOutDate: b.checkOutDate.toISOString(),
        nights: b.nights,
        status: b.status,
        totalAmount: Number(b.totalAmount),
      })),
  };

  return <CustomerAccount data={data} />;
}

async function loadSession(token: string) {
  const session = await prisma.customerSession.findUnique({
    where: { token },
    include: {
      customer: {
        include: {
          bookings: {
            include: {
              room: { include: { branch: true } },
            },
          },
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    // Opportunistically prune the expired row so the CustomerSession table
    // doesn't grow unbounded (each stale-cookie visit cleans up after itself).
    await prisma.customerSession.delete({ where: { id: session.id } }).catch(() => {/* already gone */});
    return null;
  }
  return session;
}
