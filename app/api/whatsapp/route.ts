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

    // Extract user text — from text message OR transcribed voice/audio note
    let text: string | undefined;

    if (msg.type === "text") {
      text = (msg.text as Record<string, string>)?.body?.trim();
    } else if (msg.type === "audio" || msg.type === "voice") {
      // WhatsApp voice notes & audio attachments
      const media = (msg.audio ?? msg.voice) as { id: string } | undefined;
      if (media?.id) {
        try {
          text = await transcribeAudio(media.id);
        } catch (err) {
          console.error("[WhatsApp Voice Transcribe Error]", err);
          await sendReply(from, "Voice message samajh nahi aaya. Please send as text or try again.");
          return NextResponse.json({ status: "ok" });
        }
      }
    } else {
      // Image, document, sticker, location etc. — politely ask for text
      await sendReply(from, "Ji, please send a text or voice message and I'll help you right away.");
      return NextResponse.json({ status: "ok" });
    }

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
// Strip BOM, zero-width chars, and whitespace — env values pasted via
// some shells (PowerShell pipe) carry a UTF-8 BOM that breaks HTTP headers.
const clean = (s: string | undefined) =>
  s ? s.replace(/^﻿/, "").replace(/[​-‍﻿]/g, "").trim() : s;

async function sendReply(to: string, text: string): Promise<void> {
  const phoneId = clean(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const token   = clean(process.env.WHATSAPP_API_TOKEN);

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

// ── Voice/audio transcription via OpenAI Whisper ─────────────
// Cost: ~$0.006 / min (a 15-second voice note ≈ $0.0001)
async function transcribeAudio(mediaId: string): Promise<string> {
  const token  = clean(process.env.WHATSAPP_API_TOKEN);
  const openai = clean(process.env.OPENAI_API_KEY);
  if (!token)  throw new Error("Missing WHATSAPP_API_TOKEN");
  if (!openai) throw new Error("Missing OPENAI_API_KEY — needed for voice messages");

  // 1) Resolve the media URL from Meta
  const metaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!metaRes.ok) throw new Error(`Meta media lookup failed: ${metaRes.status}`);
  const metaJson = await metaRes.json() as { url?: string; mime_type?: string };
  if (!metaJson.url) throw new Error("Meta returned no media URL");

  // 2) Download the audio bytes (Meta requires auth even on the CDN URL)
  const audioRes = await fetch(metaJson.url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!audioRes.ok) throw new Error(`Audio download failed: ${audioRes.status}`);
  const audioBuf = await audioRes.arrayBuffer();

  // 3) Send to OpenAI Whisper
  const form = new FormData();
  form.append(
    "file",
    new Blob([audioBuf], { type: metaJson.mime_type ?? "audio/ogg" }),
    "voice.ogg",
  );
  form.append("model", "whisper-1");
  // Hint: prefer Urdu/English/Punjabi — but auto-detect within these
  form.append("language", ""); // empty = auto-detect

  const sttRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${openai}` },
    body:    form,
  });
  if (!sttRes.ok) {
    const err = await sttRes.text();
    throw new Error(`Whisper failed ${sttRes.status}: ${err}`);
  }
  const { text } = await sttRes.json() as { text: string };
  return text.trim();
}
