import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { endpoint, keys } = body as {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
  }

  // Validate the endpoint is an HTTPS push service URL, not an arbitrary host.
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") throw new Error("not https");
    const KNOWN_PUSH_HOSTS = ["fcm.googleapis.com", "updates.push.services.mozilla.com", "push.apple.com", "web.push.apple.com", "notify.windows.com", "push.microsoft.com", "pushpad.xyz"];
    const isKnownHost = KNOWN_PUSH_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
    if (!isKnownHost) throw new Error("unknown push host");
  } catch {
    return NextResponse.json({ error: "Invalid push endpoint" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}
