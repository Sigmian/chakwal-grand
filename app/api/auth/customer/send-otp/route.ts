import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { randomInt } from "crypto";
import prisma from "@/lib/db/prisma";
import { rateLimit } from "@/lib/rate-limit";

const WHATSAPP_API_URL = "https://graph.facebook.com/v19.0";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s\-().+]/g, "");
  if (digits.startsWith("03") && digits.length === 11) {
    return "92" + digits.slice(1);
  }
  return digits;
}

async function sendOtpWhatsApp(toE164: string, otp: string): Promise<void> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log(`[Customer OTP] WhatsApp not configured — dev OTP for ${toE164}: ${otp}`);
    return;
  }

  const message =
    `Your CGH login code is: *${otp}*\n\n` +
    `This code expires in 10 minutes. Do not share it with anyone.\n\n` +
    `— Chakwal Guest House`;

  const res = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toE164,
      type: "text",
      text: { body: message, preview_url: false },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${err}`);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawPhone: string = typeof body?.phone === "string" ? body.phone : "";

    if (!rawPhone.trim()) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const phone = normalizePhone(rawPhone);

    // Per-IP throttle: 5 sends / hour
    const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
    if (!rateLimit(`otp-send-ip:${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }
    // Per-phone throttle: 3 sends / 10 minutes (avoids WhatsApp spam)
    if (!rateLimit(`otp-send-phone:${phone}`, 3, 10 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a few minutes." },
        { status: 429 },
      );
    }

    // Try to find customer by normalized or common local variants
    const localVariant = phone.startsWith("92") ? "0" + phone.slice(2) : null;

    const customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { phone },
          ...(localVariant ? [{ phone: localVariant }] : []),
          { phone: rawPhone.trim() },
        ],
      },
    });

    // Do NOT leak whether an account exists — return the same 200 either way.
    // We simply don't send an OTP if there's no matching customer.
    if (!customer) {
      return NextResponse.json({ ok: true });
    }

    // Invalidate any still-valid codes for this phone so only the newest OTP
    // works — avoids leaving multiple live codes widening the brute-force window.
    await prisma.customerOTP.updateMany({
      where: { phone, used: false },
      data:  { used: true },
    });

    // Cryptographically-secure 6-digit code
    const otp = randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.customerOTP.create({
      data: { phone, otp, expiresAt },
    });

    try {
      await sendOtpWhatsApp(phone, otp);
    } catch (err) {
      console.error("[Customer OTP] Failed to send WhatsApp:", err);
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Customer OTP send] Error:", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
