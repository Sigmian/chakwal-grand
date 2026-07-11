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

    // Brute-force guard: cap OTP verify attempts.
    const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`otp-verify-ip:${ip}`, 10, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 },
      );
    }
    if (!rateLimit(`otp-verify-phone:${phone}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 },
      );
    }

    // Atomic claim of the OTP: updateMany + count returned = 1 means WE won the race.
    // This blocks two concurrent verify calls from both authenticating with the same code.
    const claim = await prisma.customerOTP.updateMany({
      where: {
        phone,
        otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
      data: { used: true },
    });

    if (claim.count === 0) {
      return NextResponse.json(
        { error: "Invalid or expired code." },
        { status: 400 },
      );
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
