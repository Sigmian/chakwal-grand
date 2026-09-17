// ============================================================
// lib/alerts/owner-alert.ts
// Durable, tracked WhatsApp alerts to the owner (urgent complaints, the
// morning report).
//
// Why this exists — Meta's rules for WhatsApp Cloud API:
//  • Free-form text reaches a number ONLY within 24h of that number last
//    messaging the bot. Outside the window, only an approved TEMPLATE works.
//  • A window-closed rejection usually does NOT fail the send request: Meta
//    accepts it (HTTP 200) and reports the failure later through the status
//    webhook (error 131047). A "200 OK" is therefore not delivery.
//
// So every alert is stored, sent the way the window allows (text inside it,
// template `cgh_owner_alert` outside it), tracked by Meta message id until the
// status webhook confirms DELIVERED or FAILED, and re-delivered when possible
// — most usefully the moment the owner next messages the bot (window opens).
// ============================================================

import prisma from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";

export type OwnerAlertKind = "HIGH_COMPLAINT" | "DAILY_REPORT";

/** Name of the Meta utility template used outside the 24h window (body: {{1}}). */
export const OWNER_ALERT_TEMPLATE = "cgh_owner_alert";

const GRAPH = "https://graph.facebook.com/v19.0";
const OWNER_INBOUND_KEY = "wa:owner-last-inbound";
const WINDOW_MS = 23.5 * 60 * 60 * 1000; // a little under 24h, to be safe
const MAX_ATTEMPTS = 8;
/** How long an undelivered alert is still worth re-sending. */
const MAX_AGE_MS: Record<OwnerAlertKind, number> = {
  HIGH_COMPLAINT: 72 * 60 * 60 * 1000,
  DAILY_REPORT: 20 * 60 * 60 * 1000,
};
const WINDOW_CLOSED_CODES = new Set([131047]); // re-engagement required

const clean = (s: string | undefined) => (s ? s.replace(/^﻿/, "").replace(/[​-‍﻿]/g, "").trim() : undefined);
const digits = (s: string) => s.replace(/\D/g, "");

/** The owner's WhatsApp number (OWNER_WHATSAPP, else the business number). */
export function ownerNumber(): string {
  return digits(clean(process.env.OWNER_WHATSAPP) || siteConfig.whatsapp);
}

export function isOwnerNumber(phone: string): boolean {
  const owner = ownerNumber();
  return !!owner && digits(phone).endsWith(owner.slice(-10));
}

function credentials() {
  const token = clean(process.env.WHATSAPP_API_TOKEN);
  const phoneId = clean(process.env.WHATSAPP_PHONE_NUMBER_ID);
  return token && phoneId ? { token, phoneId } : null;
}

// ─── 24h window tracking ──────────────────────────────────────
/** Call whenever the owner's number sends the bot a message. */
export async function recordOwnerInbound(at = new Date()) {
  await prisma.siteContent.upsert({
    where: { key: OWNER_INBOUND_KEY },
    update: { value: at.toISOString() },
    create: { key: OWNER_INBOUND_KEY, value: at.toISOString(), type: "text" },
  });
}

export async function ownerLastInbound(): Promise<Date | null> {
  const row = await prisma.siteContent.findUnique({ where: { key: OWNER_INBOUND_KEY } });
  const d = row ? new Date(row.value) : null;
  return d && !isNaN(d.getTime()) ? d : null;
}

export async function ownerWindowOpen(): Promise<boolean> {
  const last = await ownerLastInbound();
  return !!last && Date.now() - last.getTime() < WINDOW_MS;
}

// ─── Meta send ────────────────────────────────────────────────
interface SendResult { ok: boolean; wamid?: string; code?: number; error?: string; transient?: boolean }

async function postMessage(payload: object): Promise<SendResult> {
  const creds = credentials();
  if (!creds) return { ok: false, error: "WhatsApp is not configured (WHATSAPP_API_TOKEN / WHATSAPP_PHONE_NUMBER_ID missing)" };
  try {
    const res = await fetch(`${GRAPH}/${creds.phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${creds.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to: ownerNumber(), ...payload }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      messages?: { id: string }[];
      error?: { code?: number; message?: string; error_data?: { details?: string } };
    };
    if (res.ok && json.messages?.[0]?.id) return { ok: true, wamid: json.messages[0].id };
    const code = json.error?.code;
    const detail = json.error?.error_data?.details || json.error?.message || `HTTP ${res.status}`;
    return { ok: false, code, error: `Meta ${res.status}${code ? ` (${code})` : ""}: ${detail}`, transient: res.status >= 500 || res.status === 429 };
  } catch (err) {
    return { ok: false, error: `Network error: ${(err as Error).message}`, transient: true };
  }
}

/** One quick retry for transient failures (5xx / 429 / network). Never sleeps long inside a request. */
async function postWithRetry(payload: object): Promise<SendResult> {
  const first = await postMessage(payload);
  if (first.ok || !first.transient) return first;
  await new Promise((r) => setTimeout(r, 1500));
  return postMessage(payload);
}

const sendText = (message: string) =>
  postWithRetry({ type: "text", text: { body: message.slice(0, 4096), preview_url: false } });

/** Template params may not contain newlines/tabs or long space runs, and are capped in length. */
export function toTemplateParam(message: string): string {
  return message
    .replace(/\*/g, "")
    .replace(/[\r\n\t]+/g, " · ")
    .replace(/ {2,}/g, " ")
    .replace(/( · )+/g, " · ")
    .trim()
    .slice(0, 1000);
}

const sendTemplate = (message: string) =>
  postWithRetry({
    type: "template",
    template: {
      name: OWNER_ALERT_TEMPLATE,
      language: { code: "en" },
      components: [{ type: "body", parameters: [{ type: "text", text: toTemplateParam(message) }] }],
    },
  });

// ─── Delivery ─────────────────────────────────────────────────
type AlertRow = { id: string; message: string; attempts: number };

async function deliver(alert: AlertRow, opts: { forceTemplate?: boolean } = {}) {
  const useText = !opts.forceTemplate && (await ownerWindowOpen());
  let channel: "text" | "template" = useText ? "text" : "template";
  let res = useText ? await sendText(alert.message) : await sendTemplate(alert.message);

  // Window closed although we thought it was open → fall back to the template.
  if (!res.ok && useText && res.code !== undefined && WINDOW_CLOSED_CODES.has(res.code)) {
    channel = "template";
    res = await sendTemplate(alert.message);
  }

  if (res.ok) {
    return prisma.ownerAlert.update({
      where: { id: alert.id },
      data: { status: "SENT", channel, wamid: res.wamid, attempts: { increment: 1 }, lastError: null, sentAt: new Date() },
    });
  }
  return prisma.ownerAlert.update({
    where: { id: alert.id },
    data: {
      status: "FAILED",
      channel,
      attempts: { increment: 1 },
      lastError: res.error ?? "Unknown error",
      // Outside the window and the template did not go through (usually: not yet approved in Meta).
      windowClosed: channel === "template",
    },
  });
}

/**
 * Record an owner alert and try to deliver it now. Never throws — a failed
 * alert stays in the table (and on the dashboard) for re-delivery.
 */
export async function raiseOwnerAlert(input: {
  kind: OwnerAlertKind;
  message: string;
  href?: string;
  complaintId?: string;
}): Promise<{ id: string | null; status: string }> {
  try {
    const alert = await prisma.ownerAlert.create({
      data: { kind: input.kind, message: input.message, href: input.href ?? null, complaintId: input.complaintId ?? null },
      select: { id: true, message: true, attempts: true },
    });
    const updated = await deliver(alert);
    return { id: alert.id, status: updated.status };
  } catch (err) {
    console.error("[OwnerAlert] raise failed:", err);
    return { id: null, status: "FAILED" };
  }
}

/**
 * Handle a Meta delivery-status webhook entry. Returns true if it belonged to
 * an owner alert. On an async window-closed failure of a text alert, retries
 * immediately through the template.
 */
export async function handleOwnerAlertStatus(s: {
  id?: string;
  status?: string;
  errors?: { code?: number; title?: string; message?: string; error_data?: { details?: string } }[];
}): Promise<boolean> {
  if (!s.id) return false;
  const alert = await prisma.ownerAlert.findUnique({ where: { wamid: s.id } });
  if (!alert) return false;

  if (s.status === "delivered" || s.status === "read") {
    if (alert.status !== "DELIVERED") {
      await prisma.ownerAlert.update({ where: { id: alert.id }, data: { status: "DELIVERED", deliveredAt: new Date() } });
    }
    return true;
  }
  if (s.status === "failed") {
    const e = s.errors?.[0];
    const code = e?.code;
    const detail = e?.error_data?.details || e?.message || e?.title || "failed";
    const windowClosed = code !== undefined && WINDOW_CLOSED_CODES.has(code);
    await prisma.ownerAlert.update({
      where: { id: alert.id },
      data: { status: "FAILED", lastError: `Meta reported failure${code ? ` (${code})` : ""}: ${detail}`, windowClosed: windowClosed || alert.windowClosed },
    });
    if (windowClosed && alert.channel === "text" && alert.attempts < MAX_ATTEMPTS) {
      await deliver({ id: alert.id, message: alert.message, attempts: alert.attempts }, { forceTemplate: true });
    }
    return true;
  }
  return true; // "sent" etc. — nothing to change
}

/** Re-deliver undelivered alerts that are still relevant. Never throws. */
export async function flushOwnerAlerts(limit = 5): Promise<{ tried: number; sent: number }> {
  try {
    const now = Date.now();
    const oldest = new Date(now - Math.max(...Object.values(MAX_AGE_MS)));
    const due = await prisma.ownerAlert.findMany({
      where: { status: { in: ["PENDING", "FAILED"] }, attempts: { lt: MAX_ATTEMPTS }, createdAt: { gte: oldest } },
      orderBy: { createdAt: "asc" },
      take: 25,
      select: { id: true, kind: true, message: true, attempts: true, createdAt: true },
    });
    const fresh = due
      .filter((a) => now - a.createdAt.getTime() < (MAX_AGE_MS[a.kind as OwnerAlertKind] ?? 0))
      .slice(0, limit);
    let sent = 0;
    for (const a of fresh) {
      const r = await deliver(a);
      if (r.status === "SENT") sent++;
    }
    return { tried: fresh.length, sent };
  } catch (err) {
    console.error("[OwnerAlert] flush failed:", err);
    return { tried: 0, sent: 0 };
  }
}

/** Alerts the owner has NOT received — for the dashboard/header. */
export async function getUndeliveredOwnerAlerts() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return prisma.ownerAlert.findMany({
    where: {
      createdAt: { gte: since },
      OR: [{ status: "FAILED" }, { status: "PENDING", createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } }],
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, kind: true, message: true, href: true, status: true, lastError: true, windowClosed: true, attempts: true, createdAt: true },
  });
}
