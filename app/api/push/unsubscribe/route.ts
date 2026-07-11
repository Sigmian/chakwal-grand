import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint } = await req.json() as { endpoint: string };

  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: user.id },
    });
  } else {
    // Remove ALL subscriptions for this user
    await prisma.pushSubscription.deleteMany({ where: { userId: user.id } });
  }

  return NextResponse.json({ ok: true });
}
