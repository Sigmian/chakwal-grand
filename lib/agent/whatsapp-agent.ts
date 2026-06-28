// ============================================================
// WhatsApp AI Agent — session manager
// Wraps the shared core agent with DB-backed per-phone sessions.
// Sessions expire after 30 min idle; last 30 messages kept.
//
// Manager mode:
//   Owner sends "/manager <PIN>" → authenticated as manager.
//   Manager session uses MANAGER_TOOLS + manager system prompt.
//   Manager sends "/exit" → drops back to guest mode.
//   Manager session auto-expires after 60 min idle.
// ============================================================

import prisma from "@/lib/db/prisma";
import { getSystemPrompt, runAgentLoop, type MessageParam } from "./core";
import { getManagerSystemPrompt, runManagerLoop } from "./manager-core";

// Normalise to E.164-ish digits only for storage
function toE164Digits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 11)  return "92" + digits.slice(1);
  return digits;
}

// Save unknown WhatsApp numbers immediately on first contact
// so they appear in the phone directory even if they never book.
async function ensureContactSaved(fromPhone: string): Promise<void> {
  const e164 = toE164Digits(fromPhone);
  const existing = await prisma.customer.findFirst({
    where: { phone: { contains: e164.slice(-10) } },
    select: { id: true },
  });
  if (existing) return;

  await prisma.customer.create({
    data: {
      phone:     e164,
      name:      "WhatsApp Contact",
      companyId: "company-001",
    },
  });
  console.log(`[Directory] New contact saved: ${e164}`);
}

const SESSION_TTL_MS  = 30 * 60 * 1000; // 30 min idle → new guest session
const MANAGER_TTL_MS  = 60 * 60 * 1000; // 60 min idle → manager session expires
const MAX_HISTORY     = 30;

// ── Manager PIN check ──────────────────────────────────────────
// PIN stored in MANAGER_PIN env var. Must be ≥4 chars.
// Owner number stored in OWNER_WHATSAPP env var — only that number
// can enter manager mode (extra security layer).
function isOwnerPhone(phone: string): boolean {
  const ownerRaw = process.env.OWNER_WHATSAPP;
  if (!ownerRaw) return true; // not configured → allow any (backward compat)
  const owner  = ownerRaw.replace(/\D/g, "");
  const caller = phone.replace(/\D/g, "");
  return caller.endsWith(owner.slice(-10));
}

function checkManagerPin(text: string): boolean {
  const pin = process.env.MANAGER_PIN;
  if (!pin || pin.length < 4) return false;
  const match = text.trim().match(/^\/manager\s+(.+)$/i);
  return !!match && match[1].trim() === pin.trim();
}

// Manager session state stored in DB metadata field on WhatsAppSession.
// We reuse the existing `messages` column; mode stored separately in a
// lightweight SiteContent row so we don't need a schema migration.
const MANAGER_MODE_KEY = (phone: string) => `manager_mode:${phone}`;

async function isManagerMode(phone: string): Promise<boolean> {
  const row = await prisma.siteContent.findUnique({
    where: { key: MANAGER_MODE_KEY(phone) },
  });
  if (!row) return false;
  // Auto-expire manager session after MANAGER_TTL_MS
  const ts = Number(row.value);
  if (Date.now() - ts > MANAGER_TTL_MS) {
    await prisma.siteContent.delete({ where: { key: MANAGER_MODE_KEY(phone) } }).catch(() => {});
    return false;
  }
  return true;
}

async function setManagerMode(phone: string, active: boolean): Promise<void> {
  const key = MANAGER_MODE_KEY(phone);
  if (active) {
    await prisma.siteContent.upsert({
      where:  { key },
      create: { key, value: String(Date.now()), type: "text" },
      update: { value: String(Date.now()) },
    });
  } else {
    await prisma.siteContent.delete({ where: { key } }).catch(() => {});
  }
}

// ── Main entry point ───────────────────────────────────────────

export async function processWhatsAppMessage(
  fromPhone: string,
  userText:  string,
): Promise<string> {
  ensureContactSaved(fromPhone).catch(err =>
    console.error("[Directory] Failed to save contact:", err),
  );

  const trimmedText = userText.trim();

  // ── /exit — drop manager mode ──────────────────────────────
  if (/^\/exit$/i.test(trimmedText)) {
    const wasManager = await isManagerMode(fromPhone);
    if (wasManager) {
      await setManagerMode(fromPhone, false);
      // Clear manager session history
      await prisma.whatsAppSession.upsert({
        where:  { phone: `manager:${fromPhone}` },
        create: { phone: `manager:${fromPhone}`, messages: [] },
        update: { messages: [] },
      });
      return "✅ Manager mode deactivated. You're now back to guest mode. Khuda Hafiz Ji!";
    }
    return "Aap pehle se guest mode mein hain Ji.";
  }

  // ── /manager <PIN> — activate manager mode ─────────────────
  if (/^\/manager\s+/i.test(trimmedText)) {
    if (!isOwnerPhone(fromPhone)) {
      console.warn(`[Manager] Unauthorized attempt from ${fromPhone}`);
      return ""; // silent drop — don't hint that manager mode exists
    }
    if (checkManagerPin(trimmedText)) {
      await setManagerMode(fromPhone, true);
      // Clear stale manager history on fresh auth
      await prisma.whatsAppSession.upsert({
        where:  { phone: `manager:${fromPhone}` },
        create: { phone: `manager:${fromPhone}`, messages: [] },
        update: { messages: [] },
      });
      console.log(`[Manager] Authenticated: ${fromPhone}`);
      return [
        "🔐 *Manager Mode Active*",
        "",
        "Assalam o Alaikum Ji! Main Zara hoon, aap ka operations assistant.",
        "Aap in cheezon ke baray mein pooch sakte hain:",
        "",
        "📊 *Aaj ki report* — 'aaj ka summary do'",
        "💰 *Revenue* — 'is mahine kitna kamai hua'",
        "🏨 *Room status* — 'rooms ka haal batao'",
        "⚠️ *Complaints* — 'koi open complaints hain?'",
        "📋 *Pending bookings* — 'confirm karne wali bookings'",
        "👥 *Staff* — 'kaun on duty hai aaj'",
        "📦 *Inventory* — 'kya khatam ho raha hai'",
        "📢 *Staff broadcast* — 'sab ko message karo: [text]'",
        "",
        "_/exit likh kar manager mode band karein_",
      ].join("\n");
    }
    // Wrong PIN — silent drop
    console.warn(`[Manager] Wrong PIN attempt from ${fromPhone}`);
    return "";
  }

  // ── Dispatch to correct mode ───────────────────────────────
  const managerMode = await isManagerMode(fromPhone);

  if (managerMode) {
    return processManagerMessage(fromPhone, trimmedText);
  }

  return processGuestMessage(fromPhone, userText);
}

// ── Guest mode (original behaviour) ───────────────────────────

async function processGuestMessage(fromPhone: string, userText: string): Promise<string> {
  const session = await prisma.whatsAppSession.findUnique({
    where: { phone: fromPhone },
  });

  const isStale = session && Date.now() - session.updatedAt.getTime() > SESSION_TTL_MS;

  const history: MessageParam[] = !session || isStale
    ? []
    : (session.messages as unknown as MessageParam[]).slice(-MAX_HISTORY);

  const userTurn = `[Sender WhatsApp phone: +${fromPhone}]\n${userText}`;
  const messages: MessageParam[] = [...history, { role: "user", content: userTurn }];

  const { reply, messages: finalMessages } = await runAgentLoop(
    messages,
    await getSystemPrompt("whatsapp"),
    fromPhone,
  );

  const trimmed = finalMessages.slice(-MAX_HISTORY);
  await prisma.whatsAppSession.upsert({
    where:  { phone: fromPhone },
    create: { phone: fromPhone, messages: trimmed as object[] },
    update: { messages: trimmed as object[] },
  });

  return reply;
}

// ── Manager mode ───────────────────────────────────────────────

async function processManagerMessage(fromPhone: string, userText: string): Promise<string> {
  // Manager session stored under "manager:<phone>" key
  const sessionKey = `manager:${fromPhone}`;
  const session = await prisma.whatsAppSession.findUnique({
    where: { phone: sessionKey },
  });

  const history: MessageParam[] = session
    ? (session.messages as unknown as MessageParam[]).slice(-20)
    : [];

  const messages: MessageParam[] = [...history, { role: "user", content: userText }];

  const { reply, messages: finalMessages } = await runManagerLoop(
    messages,
    await getManagerSystemPrompt(),
    fromPhone,
  );

  // Refresh the TTL timestamp on every manager message
  await setManagerMode(fromPhone, true);

  const trimmed = finalMessages.slice(-20);
  await prisma.whatsAppSession.upsert({
    where:  { phone: sessionKey },
    create: { phone: sessionKey, messages: trimmed as object[] },
    update: { messages: trimmed as object[] },
  });

  return reply;
}
