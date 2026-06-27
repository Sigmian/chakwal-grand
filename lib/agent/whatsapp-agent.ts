// ============================================================
// WhatsApp AI Agent — session manager
// Wraps the shared core agent with DB-backed per-phone sessions.
// Sessions expire after 30 min idle; last 30 messages kept.
// ============================================================

import prisma from "@/lib/db/prisma";
import { getSystemPrompt, runAgentLoop, type MessageParam } from "./core";

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes idle = new session
const MAX_HISTORY    = 30;              // ~15 conversation turns in context

export async function processWhatsAppMessage(
  fromPhone: string,
  userText: string,
): Promise<string> {
  // Load session — reset if idle > 30 min
  const session = await prisma.whatsAppSession.findUnique({
    where: { phone: fromPhone },
  });

  const isStale =
    session && Date.now() - session.updatedAt.getTime() > SESSION_TTL_MS;

  const history: MessageParam[] = !session || isStale
    ? []
    : (session.messages as unknown as MessageParam[]).slice(-MAX_HISTORY);

  // Inject sender phone on first turn so tools like lookup_customer
  // and log_complaint always have the authoritative number without asking.
  const isFirstTurn = history.length === 0;
  const userTurn    = isFirstTurn
    ? `[Sender WhatsApp phone: +${fromPhone}]\n${userText}`
    : userText;

  const messages: MessageParam[] = [
    ...history,
    { role: "user", content: userTurn },
  ];

  const { reply, messages: finalMessages } = await runAgentLoop(
    messages,
    await getSystemPrompt("whatsapp"),
    fromPhone,
  );

  // Persist updated conversation — trim before writing so the JSON
  // column never grows beyond MAX_HISTORY entries for long-term users.
  const trimmed = finalMessages.slice(-MAX_HISTORY);
  await prisma.whatsAppSession.upsert({
    where:  { phone: fromPhone },
    create: { phone: fromPhone, messages: trimmed as object[] },
    update: { messages: trimmed as object[] },
  });

  return reply;
}
