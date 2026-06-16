// ============================================================
// WhatsApp AI Agent — Core agentic loop
// Model: Claude Haiku (fast + cheap, ~$0.001 per conversation)
// Sessions: stored in DB, expire after 30 min idle
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import prisma from "@/lib/db/prisma";
import { AGENT_TOOLS, executeAgentTool } from "./tools";
import { siteConfig } from "@/config/site";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes idle = new session
const MAX_HISTORY    = 30;              // ~15 conversation turns kept in context

// ── System prompt ─────────────────────────────────────────────
// Tight rules: short replies, never ask >1 question, do the work
const SYSTEM = `You are a booking assistant for Chakwal Grand Guest House — a premium guest house chain in Punjab, Pakistan.

PERSONALITY: Brief, warm, professional. Reply = one idea, done.
Never say "please wait" or "let me check" — just act and give the result.

REPLY RULES:
- Maximum 4 lines per reply (except when listing rooms)
- Reply in the SAME language the customer uses: Urdu, English, or mix
- Use "Ji" naturally in Urdu. Use "Dear" or name in English
- Never ask more than ONE question per reply
- Format prices as PKR X,XXX (e.g. PKR 2,500/night)
- After booking: always show the ref in *bold* and the confirmation link

BOOKING FLOW — collect ONE field at a time, in this order:
1. Check-in date
2. Check-out date
3. Number of adults (ask children only if they mention family/kids)
4. Call search_rooms → show options with price → customer picks
5. Guest full name
6. Guest phone number
→ Call create_booking immediately. No re-confirmation needed.

BUSINESS INFO (answer from memory — no tool needed):
- Check-in: 2:00 PM | Check-out: 12:00 PM
- Payment: Cash on arrival. No card/online payment
- AC available ${siteConfig.acHoursDaily} hours daily
- CNIC required at check-in (original)
- Free WiFi + hot water in all rooms
- Phone: ${siteConfig.phone}
- Website: ${siteConfig.url}
- Review → 10% cashback on next stay: ${siteConfig.social.googleBusinessUrl}

BRANCHES:
• Chakwal — Near District Courts, Talagang Road
• Kallar Kahar — Lake View Road, Near Salt Mine
• Sargodha — University Road, Near Peoples Colony

WHAT YOU CAN DO:
✓ Show available rooms and prices for any dates
✓ Create bookings (fully automated)
✓ Look up any booking by reference number
✓ Cancel bookings (verify by phone)
✓ Answer any question about the property`;

type MessageParam = Anthropic.MessageParam;

// ── Main entry point ──────────────────────────────────────────

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

  const messages: MessageParam[] = [
    ...history,
    { role: "user", content: userText },
  ];

  // ── Agentic loop ──────────────────────────────────────────
  let response = await anthropic.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system:     SYSTEM,
    tools:      AGENT_TOOLS,
    messages,
  });

  while (response.stop_reason === "tool_use") {
    const assistantMsg: MessageParam = {
      role:    "assistant",
      content: response.content,
    };

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      let result: unknown;
      try {
        result = await executeAgentTool(
          block.name,
          block.input as Record<string, unknown>,
        );
      } catch (err) {
        console.error(`[Agent Tool Error] ${block.name}:`, err);
        result = { error: "Tool failed — " + String(err) };
      }

      toolResults.push({
        type:        "tool_result",
        tool_use_id: block.id,
        content:     JSON.stringify(result),
      });
    }

    messages.push(assistantMsg);
    messages.push({ role: "user", content: toolResults });

    response = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:     SYSTEM,
      tools:      AGENT_TOOLS,
      messages,
    });
  }

  // ── Extract text reply ────────────────────────────────────
  const reply = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  // ── Persist conversation ──────────────────────────────────
  const finalHistory: MessageParam[] = [
    ...messages,
    { role: "assistant", content: response.content },
  ];

  await prisma.whatsAppSession.upsert({
    where:  { phone: fromPhone },
    create: { phone: fromPhone, messages: finalHistory as object[] },
    update: { messages: finalHistory as object[] },
  });

  return reply || "Ji, how can I help you?";
}
