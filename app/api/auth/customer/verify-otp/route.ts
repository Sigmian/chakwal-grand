import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomUUID } from "crypto";
import prisma from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rate-limit";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s\-().+]/g, "");
  if (digits.startsWith("03") && digits.length === 11) {
    return "92" + digits.slice(1);
  }
  return digits;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone: string = typeof body?.phone === "string" ? body.phone : "";
    const otp: string = typeof body?.otp === "string" ? body.otp.trim() : "";

    if (!rawPhone.trim() || !otp) {
      return NextResponse.json({ error: "Phone and OTP are required." }, { status: 400 });
    }

    const phone = normalizePhone(rawPhone);
    const localVariant = phone.startsWith("92") ? "0" + phone.slice(2) : null;

    // In-memory rate limit — a cheap first layer (best-effort on serverless).
    const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`otp-verify-ip:${ip}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 },
      );
    }

    const MAX_ATTEMPTS = 5;

    // Find the current active code for this phone. The DB-backed attempt counter
    // below is the real brute-force guard — it holds across serverless instances,
    // unlike the in-memory limiter above.
    const record = await prisma.customerOTP.findFirst({
      where: { phone, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      // Burn the code so no further guesses are possible on it.
      await prisma.customerOTP.update({ where: { id: record.id }, data: { used: true } });
      return NextResponse.json(
        { error: "Too many incorrect attempts. Please request a new code." },
        { status: 429 },
      );
    }

    if (record.otp !== otp) {
      // Wrong guess — count it, and burn the code once the cap is hit.
      const attempts = record.attempts + 1;
      await prisma.customerOTP.update({
        where: { id: record.id },
        data:  { attempts, used: attempts >= MAX_ATTEMPTS ? true : undefined },
      });
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    // Correct code — atomically claim it (updateMany count===1 means we won the
    // race against a concurrent verify of the same code).
    const claim = await prisma.customerOTP.updateMany({
      where: { id: record.id, used: false },
      data:  { used: true },
    });

    if (claim.count === 0) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 });
    }

    // Must match the SAME set of phone variants send-otp uses, otherwise the
    // OTP gets consumed above but the lookup 404s → permanent lockout.
    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone },
          ...(localVariant ? [{ phone: localVariant }] : []),
          { phone: rawPhone.trim() },
        ],
      },
    });

    if (!customer) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.customerSession.create({
      data: {
        customerId: customer.id,
        token,
        expiresAt,
      },
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set("cgh_customer_session", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (err) {
    console.error("[Customer OTP verify] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
