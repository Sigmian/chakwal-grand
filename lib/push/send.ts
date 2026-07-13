import webpush, { PushSubscription as WebPushSub } from "web-push";
import prisma from "@/lib/db/prisma";

const VAPID_EMAIL      = process.env.VAPID_EMAIL;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_EMAIL && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn("[push/send] VAPID keys not configured — push notifications disabled");
}

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: Record<string, unknown>;
};

type DbSub = { endpoint: string; p256dh: string; auth: string };

function toWebPushSub(s: DbSub): WebPushSub {
  return { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
}

async function cleanExpired(subs: DbSub[], results: PromiseSettledResult<unknown>[]) {
  const expired: string[] = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const err = r.reason as { statusCode?: number };
      if (err.statusCode === 410 || err.statusCode === 404) {
        expired.push(subs[i].endpoint);
      }
    }
  });
  if (expired.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: expired } } });
  }
}

export async function sendPushToAllStaff(payload: PushPayload, companyId?: string) {
  if (!VAPID_EMAIL || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  const scopedCompanyId = companyId ?? process.env.COMPANY_ID ?? "company-001";
  const subs = await prisma.pushSubscription.findMany({
    where:   { user: { companyId: scopedCompanyId } },
    include: { user: { select: { isActive: true } } },
  });

  const active = subs.filter((s) => s.user.isActive);
  if (active.length === 0) return;

  const results = await Promise.allSettled(
    active.map((sub) => webpush.sendNotification(toWebPushSub(sub), JSON.stringify(payload)))
  );
  await cleanExpired(active, results);
}

export async function sendPushToBranch(branchId: string, payload: PushPayload) {
  if (!VAPID_EMAIL || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return;
  const subs = await prisma.pushSubscription.findMany({
    where: {
      user: {
        isActive: true,
        staffMember: { branchId },
      },
    },
  });

  if (subs.length === 0) return;

  const results = await Promise.allSettled(
    subs.map((sub) => webpush.sendNotification(toWebPushSub(sub), JSON.stringify(payload)))
  );
  await cleanExpired(subs, results);
}
