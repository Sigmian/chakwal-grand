// ============================================================
// WhatsApp AI Agent — Meta Cloud API Webhook
//
// GET  /api/whatsapp  → Meta webhook verification handshake
// POST /api/whatsapp  → Incoming messages from guests
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { processWhatsAppMessage } from "@/lib/agent/whatsapp-agent";
import { checkRateLimit } from "@/lib/agent/rate-limiter";

export const maxDuration = 60; // Vercel: allow up to 60s for AI processing

// ── BOM / zero-width char cleaner ────────────────────────────
// PowerShell pipe adds a UTF-8 BOM that breaks HTTP headers.
const clean = (s: string | undefined) =>
  s ? s.replace(/^﻿/, "").replace(/[​-‍﻿]/g, "").trim() : s;

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

// ── In-memory dedup + coalesce ────────────────────────────────
// Dedup:    prevents double-processing when Meta retries the same message
// Coalesce: short buffer prevents race condition when two messages arrive
//           within milliseconds of each other (same session, concurrent writes)
const processedIds  = new Set<string>();           // message IDs seen this process lifetime
const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>(); // phone → timer

// Clean up old message IDs periodically so the Set doesn't grow forever.
// Meta retries within ~30 seconds, so 5-minute memory is sufficient.
setInterval(() => { processedIds.clear(); }, 5 * 60 * 1000);

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

  // ── A1: Ack Meta immediately ──────────────────────────────
  // Return 200 right away so Meta doesn't retry (it waits ~5s then retries).
  // We kick off processing as a floating Promise — Vercel keeps the function
  // alive as long as work is in flight even after the response is sent.
  processInBackground(body).catch((err) => {
    console.error("[WhatsApp Background Error]", err);
  });

  return NextResponse.json({ status: "ok" });
}

// ── Background processor ──────────────────────────────────────
async function processInBackground(body: Record<string, unknown>) {
  try {
    const entry   = (body.entry   as unknown[])?.[0] as Record<string, unknown>;
    const changes = (entry?.changes as unknown[])?.[0] as Record<string, unknown>;
    const value   = changes?.value as Record<string, unknown>;
    const msgs    = value?.messages as Array<Record<string, unknown>>;

    // Ignore status updates (delivered/read receipts)
    if (!msgs?.length) return;

    const msg = msgs[0];

    // ── A5: Use the real Meta-verified sender phone ───────────
    // `msg.from` is set by Meta's infrastructure — not user-supplied.
    // This is the authoritative sender phone for all identity checks.
    const from = msg.from as string;
    if (!from) return;

    // ── A6: Per-phone rate limiting ───────────────────────────
    const rateResult = checkRateLimit(from);
    if (!rateResult.allowed) {
      if (rateResult.hard) {
        // Silently drop — the sender is clearly abusing the bot
        console.warn(`[WhatsApp RateLimit Hard] ${from} — dropping message silently`);
        return;
      }
      // Soft limit — reply once with a polite notice
      const minutesLeft = Math.ceil(rateResult.retryAfterMs / 60_000);
      await sendReply(
        from,
        `Apka bohot saare messages aa rahe hain. Thodi der ke liye ruk jaein — approximately ${minutesLeft} minute baad dobara try karein. Shukriya! 🙏`,
      );
      return;
    }

    // ── A3: Idempotency — dedupe by WhatsApp message ID ──────
    const msgId = msg.id as string | undefined;
    if (msgId) {
      if (processedIds.has(msgId)) {
        console.log(`[WhatsApp Dedup] Skipping already-processed message ${msgId}`);
        return;
      }
      processedIds.add(msgId);
    }

    // ── A4: Coalesce rapid messages (50ms debounce) ───────────
    // If multiple messages arrive from the same number in quick succession,
    // cancel the previous timer and wait — we process only the latest text.
    // This prevents concurrent DB writes that would overwrite the session.
    await new Promise<void>((resolve) => {
      if (pendingTimers.has(from)) {
        clearTimeout(pendingTimers.get(from)!);
      }
      const t = setTimeout(() => {
        pendingTimers.delete(from);
        resolve();
      }, 50);
      pendingTimers.set(from, t);
    });

    // Extract user text
    let text: string | undefined;

    if (msg.type === "text") {
      text = (msg.text as Record<string, string>)?.body?.trim();
    } else if (msg.type === "audio" || msg.type === "voice") {
      if (!process.env.OPENAI_API_KEY) {
        await sendReply(from, "Voice messages abhi available nahi hain. Please text mein likhein, main zaroor help karungi!");
        return;
      }
      const media = (msg.audio ?? msg.voice) as { id: string } | undefined;
      if (media?.id) {
        try {
          text = await transcribeAudio(media.id);
        } catch (err) {
          console.error("[WhatsApp Voice Transcribe Error]", err);
          await sendReply(from, "Voice message samajh nahi aaya, maafi chahti hoon. Dobara bhejein ya text mein likhein.");
          return;
        }
      }
    } else {
      // Image, document, sticker, location etc.
      await sendReply(from, "Ji, please send a text or voice message and I'll help you right away.");
      return;
    }

    if (!text) return;

    // ── A2: Graceful crash fallback ───────────────────────────
    // Any uncaught error inside processWhatsAppMessage gets a polite reply
    // instead of leaving the guest with silence.
    let reply: string;
    try {
      reply = await processWhatsAppMessage(from, text);
    } catch (err) {
      console.error("[WhatsApp Agent Error]", err);
      reply =
        "Maafi chahta hoon, abhi technical issue aa rahi hai. " +
        "Please thodi der mein dobara try karein ya call karein: 0334-7742767";
    }

    await sendReply(from, reply);

  } catch (err) {
    console.error("[WhatsApp Webhook Error]", err);
  }
}

// ── Send reply via Meta Cloud API ─────────────────────────────
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
  form.append("language", ""); // empty = auto-detect (Urdu/English/Punjabi)

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
