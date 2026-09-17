// ============================================================
// app/(dashboard)/settings/system/page.tsx
// System Health — is each integration configured on THIS deployment, is the
// owner's WhatsApp window open, and did owner alerts actually arrive?
// Shows presence (yes/no) only — never any key values.
// ============================================================

import { CheckCircle2, XCircle, AlertTriangle, MessageCircle, Mic, Bell, Bot, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared";
import { requirePermission } from "@/lib/auth/session";
import prisma from "@/lib/db/prisma";
import { ownerLastInbound, ownerNumber, OWNER_ALERT_TEMPLATE } from "@/lib/alerts/owner-alert";
import { cn } from "@/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "System Health" };

const has = (k: string) => !!process.env[k]?.trim();

const PKT = "Asia/Karachi";
const when = (d: Date) => d.toLocaleString("en-GB", { timeZone: PKT, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
const ago = (d: Date) => {
  const h = (Date.now() - d.getTime()) / 3_600_000;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min ago`;
  if (h < 48) return `${Math.round(h)} h ago`;
  return `${Math.round(h / 24)} days ago`;
};

function Row({ ok, label, detail, warn }: { ok: boolean; label: string; detail: string; warn?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0">
      {ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-400" />
        : warn ? <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
        : <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  DELIVERED: "border-green-500/30 bg-green-500/10 text-green-400",
  SENT: "border-blue-500/30 bg-blue-500/10 text-blue-400",
  PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  FAILED: "border-red-500/30 bg-red-500/10 text-red-400",
};

export default async function SystemHealthPage() {
  await requirePermission("settings:branch");

  const [lastInbound, alerts] = await Promise.all([
    ownerLastInbound(),
    prisma.ownerAlert.findMany({ orderBy: { createdAt: "desc" }, take: 25 }),
  ]);

  const waReady = has("WHATSAPP_API_TOKEN") && has("WHATSAPP_PHONE_NUMBER_ID");
  const voiceReady = has("OPENAI_API_KEY");
  const pushReady = has("NEXT_PUBLIC_VAPID_PUBLIC_KEY") && has("VAPID_PRIVATE_KEY") && has("VAPID_EMAIL");
  const windowOpen = !!lastInbound && Date.now() - lastInbound.getTime() < 23.5 * 3_600_000;
  const undelivered = alerts.filter((a) => a.status === "FAILED" || a.status === "PENDING");
  const templateMissing = alerts.some((a) => a.windowClosed && a.status === "FAILED" && /132001|template/i.test(a.lastError ?? ""));
  const owner = ownerNumber();

  return (
    <div className="space-y-5 animate-fade-in">
      <PageHeader title="System Health" subtitle="Integrations on this deployment, and whether owner alerts really arrive" />

      {undelivered.length > 0 && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          <p className="font-semibold">{undelivered.length} owner alert{undelivered.length === 1 ? " was" : "s were"} not delivered to WhatsApp.</p>
          <p className="mt-1 text-red-300/80">
            {windowOpen
              ? "The WhatsApp window is open — they will be re-sent the next time a message comes in, or at the morning report."
              : `Send any message (e.g. "hi") to the Zara bot from ${owner ? `+${owner}` : "the owner's number"} — pending alerts are re-sent automatically the moment it arrives.`}
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-luxury p-5">
          <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Bot className="h-4 w-4 text-gold-400" /> Integrations</h2>
          <Row ok={waReady} label="WhatsApp sending" detail={waReady ? "WHATSAPP_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID are set." : "Missing WHATSAPP_API_TOKEN and/or WHATSAPP_PHONE_NUMBER_ID — the bot cannot reply or alert."} />
          <Row ok={has("WHATSAPP_APP_SECRET")} label="Webhook signature check" detail={has("WHATSAPP_APP_SECRET") ? "WHATSAPP_APP_SECRET is set." : "WHATSAPP_APP_SECRET missing — incoming WhatsApp messages are rejected."} />
          <Row ok={has("ANTHROPIC_API_KEY")} label="Zara AI replies" detail={has("ANTHROPIC_API_KEY") ? "ANTHROPIC_API_KEY is set." : "ANTHROPIC_API_KEY missing — Zara cannot answer."} />
          <Row
            ok={voiceReady}
            label="Voice notes & photos"
            detail={voiceReady
              ? "OPENAI_API_KEY is set — voice notes are transcribed and photos understood."
              : "OPENAI_API_KEY is NOT set on this deployment. Guests who send a voice note are asked to type instead, and staff get a “call them back” push. Add the key in Vercel → Project → Settings → Environment Variables, then redeploy."}
          />
          <Row ok={pushReady} label="Browser push alerts" detail={pushReady ? "VAPID keys are set." : "VAPID keys missing — staff push alerts are off."} />
          <Row ok={has("OWNER_WHATSAPP") && has("MANAGER_PIN")} warn={!has("OWNER_WHATSAPP")} label="Owner number & manager PIN"
            detail={has("OWNER_WHATSAPP") ? "OWNER_WHATSAPP is set; alerts go to that number." : `OWNER_WHATSAPP not set — alerts go to the business number +${owner}.`} />
          <Row ok={has("CRON_SECRET")} label="Scheduled jobs" detail={has("CRON_SECRET") ? "CRON_SECRET is set (morning report, reminders)." : "CRON_SECRET missing — scheduled jobs are rejected."} />
        </div>

        <div className="card-luxury p-5">
          <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><MessageCircle className="h-4 w-4 text-gold-400" /> Owner WhatsApp alerts</h2>
          <Row
            ok={windowOpen}
            warn={!windowOpen}
            label={windowOpen ? "24-hour window is OPEN" : "24-hour window is CLOSED"}
            detail={lastInbound
              ? `The owner's number last messaged the bot ${ago(lastInbound)} (${when(lastInbound)}). ${windowOpen ? "Alerts go out as normal WhatsApp messages." : "WhatsApp blocks normal messages until the owner messages the bot again."}`
              : "No message from the owner's number has been recorded yet. Send the bot any message to open the window."}
          />
          <Row
            ok={!templateMissing}
            warn={templateMissing}
            label={`Fallback template “${OWNER_ALERT_TEMPLATE}”`}
            detail={templateMissing
              ? `Not approved in Meta yet, so alerts can't be delivered while the window is closed. In Meta Business Manager → WhatsApp → Message templates, create a UTILITY template named ${OWNER_ALERT_TEMPLATE} (English) whose body is exactly: {{1}}`
              : `Used automatically when the window is closed. If alerts fail with a template error, create a UTILITY template named ${OWNER_ALERT_TEMPLATE} (English) with body {{1}} in Meta Business Manager.`}
          />
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface-highlight/60 p-3 text-xs text-muted-foreground">
            <Bell className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold-400" />
            <span>Every alert is also pushed to staff browsers and shown on the dashboard, so an urgent complaint is never only on WhatsApp.</span>
          </div>
          <div className="mt-2 flex items-start gap-2 rounded-xl bg-surface-highlight/60 p-3 text-xs text-muted-foreground">
            <Mic className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold-400" />
            <span>Voice notes: {voiceReady ? "working." : "not set up — see Integrations."}</span>
          </div>
        </div>
      </div>

      <div className="card-luxury overflow-hidden">
        <div className="px-5 pt-5">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><Clock className="h-4 w-4 text-gold-400" /> Recent owner alerts</h2>
          <p className="mt-1 text-xs text-muted-foreground">SENT = accepted by WhatsApp · DELIVERED = confirmed on the phone · FAILED = not received (will be retried)</p>
        </div>
        {alerts.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No owner alerts yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="mt-3 w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-y border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-2.5 font-semibold">When</th>
                  <th className="px-3 py-2.5 font-semibold">Type</th>
                  <th className="px-3 py-2.5 font-semibold">Message</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="border-b border-border/50 last:border-0 align-top">
                    <td className="px-5 py-2.5 whitespace-nowrap text-muted-foreground">{when(a.createdAt)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-foreground">{a.kind === "HIGH_COMPLAINT" ? "🚨 Complaint" : "🌅 Morning report"}</td>
                    <td className="px-3 py-2.5 max-w-[320px] text-xs text-muted-foreground">{a.message.replace(/\*/g, "").slice(0, 140)}{a.message.length > 140 ? "…" : ""}</td>
                    <td className="px-3 py-2.5">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold", STATUS_STYLE[a.status] ?? STATUS_STYLE.PENDING)}>{a.status}</span>
                      <p className="mt-1 text-[10px] text-muted-foreground">{a.channel ?? "—"} · {a.attempts} attempt{a.attempts === 1 ? "" : "s"}</p>
                    </td>
                    <td className="px-3 py-2.5 max-w-[260px] text-[11px] text-muted-foreground">
                      {a.lastError ?? (a.deliveredAt ? `Delivered ${when(a.deliveredAt)}` : "")}
                      {a.windowClosed && <p className="text-amber-400">WhatsApp window was closed</p>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
