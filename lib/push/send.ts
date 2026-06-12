import webpush, { PushSubscription as WebPushSub } from "web-push";
import prisma from "@/lib/db/prisma";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

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

export async function sendPushToAllStaff(payload: PushPayload) {
  const subs = await prisma.pushSubscription.findMany({
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
