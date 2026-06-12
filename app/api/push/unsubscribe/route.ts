import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import prisma from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint } = await req.json() as { endpoint: string };

  if (endpoint) {
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: session.user.id },
    });
  } else {
    // Remove ALL subscriptions for this user
    await prisma.pushSubscription.deleteMany({ where: { userId: session.user.id } });
  }

  return NextResponse.json({ ok: true });
}
