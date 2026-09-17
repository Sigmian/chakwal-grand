// Run: npx tsx lib/alerts/owner-alert.test.mts
// Exercises the REAL owner-alert service against a simulated Meta Graph API
// and an in-memory stand-in for the database — no WhatsApp messages are sent
// and the live database is never touched.

let pass = 0, fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`);
  ok ? pass++ : fail++;
};

// ── In-memory database stand-in (only what owner-alert.ts uses) ──
type Row = Record<string, any>;
const site = new Map<string, Row>();
let alerts: Row[] = [];
let seq = 0;
const matches = (r: Row, where: Row = {}): boolean =>
  Object.entries(where).every(([k, v]) => {
    if (k === "OR") return (v as Row[]).some((w) => matches(r, w));
    if (v && typeof v === "object" && !(v instanceof Date)) {
      if ("in" in v) return v.in.includes(r[k]);
      if ("lt" in v) return r[k] < v.lt;
      if ("gte" in v) return r[k] >= v.gte;
    }
    return r[k] === v;
  });
const apply = (r: Row, data: Row) => {
  for (const [k, v] of Object.entries(data)) r[k] = v && typeof v === "object" && "increment" in v ? (r[k] ?? 0) + v.increment : v;
  r.updatedAt = new Date();
  return r;
};
(globalThis as any).prisma = {
  siteContent: {
    findUnique: async ({ where }: Row) => site.get(where.key) ?? null,
    upsert: async ({ where, update, create }: Row) => {
      const cur = site.get(where.key);
      const next = cur ? { ...cur, ...update } : { ...create };
      site.set(where.key, next);
      return next;
    },
  },
  ownerAlert: {
    create: async ({ data }: Row) => {
      const r = { id: `a${++seq}`, status: "PENDING", attempts: 0, windowClosed: false, channel: null, wamid: null, lastError: null, createdAt: new Date(), ...data };
      alerts.push(r);
      return r;
    },
    update: async ({ where, data }: Row) => apply(alerts.find((a) => a.id === where.id)!, data),
    findUnique: async ({ where }: Row) => alerts.find((a) => (where.wamid ? a.wamid === where.wamid : a.id === where.id)) ?? null,
    findMany: async ({ where, take }: Row) => alerts.filter((a) => matches(a, where)).slice(0, take ?? 999),
  },
};

// ── Simulated Meta Graph API ──
type Reply = { status: number; body: Row } | "network";
let script: Reply[] = [];
let calls: Row[] = [];
(globalThis as any).fetch = async (url: string, init: Row) => {
  calls.push({ url, body: JSON.parse(init.body) });
  const next = script.shift() ?? { status: 200, body: { messages: [{ id: `wamid.auto${calls.length}` }] } };
  if (next === "network") throw new Error("ECONNRESET");
  return { ok: next.status < 400, status: next.status, json: async () => next.body, text: async () => JSON.stringify(next.body) };
};
const ok = (id: string): Reply => ({ status: 200, body: { messages: [{ id }] } });
const metaErr = (status: number, code: number, details: string): Reply => ({ status, body: { error: { code, message: "err", error_data: { details } } } });

process.env.WHATSAPP_API_TOKEN = "test-token";
process.env.WHATSAPP_PHONE_NUMBER_ID = "111222333";
process.env.OWNER_WHATSAPP = "+92 300 1112223";

const svc = await import("./owner-alert.ts");
const reset = () => { alerts = []; site.clear(); calls = []; script = []; };

// 1 ── Window closed & template not approved → FAILED, visible, no text attempt
reset();
script = [metaErr(404, 132001, "Template name does not exist in the translation")];
let r = await svc.raiseOwnerAlert({ kind: "HIGH_COMPLAINT", message: "🚨 *HIGH*\nGuest: Ali\n\"AC broken\"" });
eq("closed window: status FAILED", r.status, "FAILED");
eq("closed window: tried template only (1 call)", calls.length, 1);
eq("closed window: request was a template", calls[0].body.type, "template");
eq("closed window: template name", calls[0].body.template.name, "cgh_owner_alert");
eq("closed window: sent to owner number digits", calls[0].body.to, "923001112223");
eq("template param has no newlines or asterisks", /[\n*]/.test(calls[0].body.template.components[0].parameters[0].text), false);
eq("closed window: flagged windowClosed", alerts[0].windowClosed, true);
eq("closed window: error recorded with Meta code", /132001/.test(alerts[0].lastError), true);

// 2 ── Owner messages the bot → window opens → flush re-delivers as text
script = [ok("wamid.A")];
await svc.recordOwnerInbound();
eq("window open after owner inbound", await svc.ownerWindowOpen(), true);
let f = await svc.flushOwnerAlerts();
eq("flush re-sent the pending alert", f, { tried: 1, sent: 1 });
eq("flush used free-form text inside window", calls.at(-1)!.body.type, "text");
eq("alert now SENT via text with wamid", [alerts[0].status, alerts[0].channel, alerts[0].wamid], ["SENT", "text", "wamid.A"]);

// 3 ── Meta later reports the text FAILED (131047) → immediate template retry
script = [ok("wamid.B")];
await svc.handleOwnerAlertStatus({ id: "wamid.A", status: "failed", errors: [{ code: 131047, title: "Re-engagement message" }] });
eq("async 131047 → retried through template", calls.at(-1)!.body.type, "template");
eq("…and is SENT via template with new wamid", [alerts[0].status, alerts[0].channel, alerts[0].wamid], ["SENT", "template", "wamid.B"]);

// 4 ── Delivery receipt → DELIVERED
await svc.handleOwnerAlertStatus({ id: "wamid.B", status: "delivered" });
eq("delivered receipt marks DELIVERED", alerts[0].status, "DELIVERED");
eq("unknown wamid is ignored", await svc.handleOwnerAlertStatus({ id: "wamid.other", status: "delivered" }), false);

// 5 ── Window believed open but Meta rejects synchronously with 131047 → template fallback
reset();
await svc.recordOwnerInbound();
script = [metaErr(400, 131047, "More than 24 hours have passed"), ok("wamid.C")];
r = await svc.raiseOwnerAlert({ kind: "HIGH_COMPLAINT", message: "x" });
eq("sync 131047 → template fallback succeeds", [r.status, alerts[0].channel, calls.map((c) => c.body.type)], ["SENT", "template", ["text", "template"]]);

// 6 ── Transient 500 then success → one quick retry
reset();
await svc.recordOwnerInbound();
script = [{ status: 500, body: { error: { code: 1, message: "Service unavailable" } } }, ok("wamid.D")];
r = await svc.raiseOwnerAlert({ kind: "DAILY_REPORT", message: "report" });
eq("transient 500 retried once and SENT", [r.status, calls.length, alerts[0].attempts], ["SENT", 2, 1]);

// 7 ── Persistent network failure → FAILED (kept for re-delivery), not thrown
reset();
await svc.recordOwnerInbound();
script = ["network", "network"];
r = await svc.raiseOwnerAlert({ kind: "HIGH_COMPLAINT", message: "x" });
eq("network down → FAILED without throwing", [r.status, /Network error/.test(alerts[0].lastError)], ["FAILED", true]);

// 8 ── Missing credentials → FAILED with clear reason, no request made
reset();
delete process.env.WHATSAPP_API_TOKEN;
r = await svc.raiseOwnerAlert({ kind: "HIGH_COMPLAINT", message: "x" });
eq("not configured → FAILED, no network call", [r.status, calls.length, /not configured/.test(alerts[0].lastError)], ["FAILED", 0, true]);
process.env.WHATSAPP_API_TOKEN = "test-token";

// 9 ── Flush only re-sends alerts that are still relevant
reset();
await svc.recordOwnerInbound();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);
alerts = [
  { id: "old-report", kind: "DAILY_REPORT", message: "m", status: "FAILED", attempts: 1, createdAt: hoursAgo(21) },
  { id: "recent-report", kind: "DAILY_REPORT", message: "m", status: "FAILED", attempts: 1, createdAt: hoursAgo(5) },
  { id: "complaint-70h", kind: "HIGH_COMPLAINT", message: "m", status: "FAILED", attempts: 2, createdAt: hoursAgo(70) },
  { id: "complaint-maxed", kind: "HIGH_COMPLAINT", message: "m", status: "FAILED", attempts: 8, createdAt: hoursAgo(1) },
  { id: "done", kind: "HIGH_COMPLAINT", message: "m", status: "DELIVERED", attempts: 1, createdAt: hoursAgo(1) },
];
f = await svc.flushOwnerAlerts();
const sentIds = alerts.filter((a) => a.status === "SENT").map((a) => a.id).sort();
eq("flush: skips stale report, maxed-out and delivered; re-sends the rest", sentIds, ["complaint-70h", "recent-report"]);

// 10 ── Undelivered list for the dashboard bell
reset();
alerts = [
  { id: "f1", kind: "HIGH_COMPLAINT", status: "FAILED", createdAt: hoursAgo(1) },
  { id: "p-new", kind: "HIGH_COMPLAINT", status: "PENDING", createdAt: new Date() },
  { id: "p-old", kind: "HIGH_COMPLAINT", status: "PENDING", createdAt: hoursAgo(1) },
  { id: "d1", kind: "HIGH_COMPLAINT", status: "DELIVERED", createdAt: hoursAgo(1) },
];
const und = (await svc.getUndeliveredOwnerAlerts()).map((a: Row) => a.id).sort();
eq("undelivered = failed + pending older than 5 min", und, ["f1", "p-old"]);

// 11 ── Helpers
eq("template param flattening", svc.toTemplateParam("*A*\nB\n\nC   D"), "A · B · C D");
eq("template param length cap", svc.toTemplateParam("x".repeat(2000)).length, 1000);
eq("owner number matches local format", svc.isOwnerNumber("0300-1112223"), true);
eq("owner number matches +92 format", svc.isOwnerNumber("+923001112223"), true);
eq("other numbers don't match", svc.isOwnerNumber("03001112224"), false);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
