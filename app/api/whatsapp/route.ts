// ============================================================
// WhatsApp AI Agent — Meta Cloud API Webhook
//
// GET  /api/whatsapp  → Meta webhook verification handshake
// POST /api/whatsapp  → Incoming messages from guests
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { processWhatsAppMessage } from "@/lib/agent/whatsapp-agent";

export const maxDuration = 60; // Vercel: allow up to 60s for AI processing

// ── Webhook verification ──────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode      === "subscribe" &&
    token     === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN &&
    challenge
  ) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

// ── Incoming message handler ──────────────────────────────────
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ status: "ok" }); // always 200 to Meta
  }

  // Only handle whatsapp_business_account events
  if (body.object !== "whatsapp_business_account") {
    return NextResponse.json({ status: "ok" });
  }

  try {
    const entry   = (body.entry   as unknown[])?.[0] as Record<string, unknown>;
    const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
    const value   = changes?.value as Record<string, unknown>;
    const msgs    = value?.messages as Array<Record<string, unknown>>;

    // Ignore status updates (delivered/read receipts)
    if (!msgs?.length) return NextResponse.json({ status: "ok" });

    const msg  = msgs[0];
    const from = msg.from as string;
    if (!from) return NextResponse.json({ status: "ok" });

    // Only handle text messages
    if (msg.type !== "text") {
      await sendReply(from, "Ji, please send a text message and I'll help you right away.");
      return NextResponse.json({ status: "ok" });
    }

    const text = (msg.text as Record<string, string>)?.body?.trim();
    if (!text) return NextResponse.json({ status: "ok" });

    // Process synchronously — Haiku is fast (~1-2s), well within Meta's 5s window
    const reply = await processWhatsAppMessage(from, text);
    await sendReply(from, reply);

  } catch (err) {
    console.error("[WhatsApp Webhook Error]", err);
  }

  return NextResponse.json({ status: "ok" });
}

// ── Send reply via Meta Cloud API ─────────────────────────────
async function sendReply(to: string, text: string): Promise<void> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token   = process.env.WHATSAPP_API_TOKEN;

  if (!phoneId || !token) {
    console.error("[WhatsApp] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_API_TOKEN env vars");
    return;
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text, preview_url: false },
      }),
    },
  );

  if (!res.ok) {
    const err = await res.text();
    console.error(`[WhatsApp Send Error] ${res.status}: ${err}`);
  }
}
