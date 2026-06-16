// ============================================================
// WhatsApp AI Agent — Meta Cloud API Webhook
//
// GET  /api/whatsapp  → Meta webhook verification handshake
// POST /api/whatsapp  → Incoming messages from guests
//
// Required env vars:
//   WHATSAPP_WEBHOOK_VERIFY_TOKEN  — any secret string you choose
//   WHATSAPP_API_TOKEN             — Meta permanent access token
//   WHATSAPP_PHONE_NUMBER_ID       — Meta phone number ID
//   ANTHROPIC_API_KEY              — Claude API key
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { processWhatsAppMessage } from "@/lib/agent/whatsapp-agent";

// ── Webhook verification (Meta calls this once when you set up the webhook) ──
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
  // Acknowledge Meta immediately — must respond within 5 seconds
  // or Meta will retry (causing duplicate replies)
  const rawBody = await req.text();

  // Process asynchronously after returning 200
  setImmediate(async () => {
    try {
      const body = JSON.parse(rawBody) as Record<string, unknown>;

      // Only handle whatsapp_business_account events
      if (body.object !== "whatsapp_business_account") return;

      const entry   = (body.entry   as unknown[])?.[0] as Record<string, unknown>;
      const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
      const value   = changes?.value as Record<string, unknown>;
      const msgs    = value?.messages as Array<Record<string, unknown>>;

      // Ignore status updates (delivered/read receipts) — only handle messages
      if (!msgs?.length) return;

      const msg = msgs[0];

      // Only handle text messages for now
      if (msg.type !== "text") {
        await sendWhatsApp(
          msg.from as string,
          "Ji, I can only read text messages. Please type your question.",
        );
        return;
      }

      const from = msg.from as string;
      const text = (msg.text as Record<string, string>)?.body?.trim();
      if (!from || !text) return;

      const reply = await processWhatsAppMessage(from, text);
      await sendWhatsApp(from, reply);
    } catch (err) {
      console.error("[WhatsApp Webhook]", err);
    }
  });

  return NextResponse.json({ status: "ok" });
}

// ── Helper: send a text message via Meta Cloud API ────────────
async function sendWhatsApp(to: string, text: string): Promise<void> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token   = process.env.WHATSAPP_API_TOKEN;

  if (!phoneId || !token) {
    console.error("[WhatsApp] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_API_TOKEN");
    return;
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      method:  "POST",
      headers: {
        Authorization: `Bearer ${token}`,
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
