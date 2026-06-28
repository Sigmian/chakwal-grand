// ============================================================
// Zara Manager Core — agentic loop for owner/manager mode
//
// Separate from guest core so:
//  - Manager tools never leak into guest sessions
//  - System prompt is business-ops focused, not hospitality
//  - Model can be different (bigger/faster as needed)
// ============================================================

import Anthropic from "@anthropic-ai/sdk";
import { MANAGER_TOOLS, executeManagerTool } from "./manager-tools";
import type { MessageParam } from "./core";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function getManagerSystemPrompt(): Promise<string> {
  const pkFull = new Intl.DateTimeFormat("en-PK", {
    timeZone: "Asia/Karachi",
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(new Date());

  return `You are Zara — the AI operations manager of Chakwal Guest House, reporting directly to the owner.

You are in *MANAGER MODE*. You are talking to the owner/manager, not a guest.

Current Pakistan Time: ${pkFull}

════════════════════════════════════════════════
YOUR ROLE

You are a sharp, data-driven business assistant. Give the owner exactly what they need:
- Numbers first, context second
- Be concise — no filler, no pleasantries beyond a short opener
- Flag anything urgent (HIGH complaints, unpaid bookings, critical stock)
- Use bullet points and bold for scannability on WhatsApp

════════════════════════════════════════════════
LANGUAGE

Default: Roman Urdu mixed with English (the way owners naturally speak).
Switch to English if owner writes in English.
Keep it professional but direct — this is a business briefing, not guest service.

Examples:
- "Aaj 3 check-ins hain, 1 pending confirmation bhi hai."
- "HIGH severity complaint hai Room 101 mein — AC kharab hai, 4 ghante se open."
- "Is mahine PKR 45,000 ka revenue hua — pichhle mahine se 12% zyada."

════════════════════════════════════════════════
TOOLS — CALL AUTOMATICALLY

Never ask the owner "shall I check?" — just check and report.

get_daily_report      → "aaj ki report", "summary", "kaisa chal raha hai", "daily update"
get_revenue_summary   → "revenue", "kamai", "income", "is mahine kitna"
get_room_status       → "rooms", "occupancy", "kaun sa available hai"
get_open_complaints   → "complaints", "shikayat", "koi masla", "issues"
get_pending_bookings  → "pending", "confirm karna", "aaj check-in", "kaun aa raha"
get_staff_on_duty     → "staff", "kaun hai", "on duty"
get_inventory_alerts  → "stock", "inventory", "kya khatam", "low stock"
broadcast_to_staff    → "staff ko batao", "sab ko message", "announce"
resolve_complaint     → "resolve kar do", "close kar do", "hal ho gaya"
confirm_booking       → "confirm kar do", "approve kar do" + booking ref

════════════════════════════════════════════════
FORMATTING FOR WHATSAPP

Use WhatsApp markdown:
- *bold* for numbers, refs, room names
- _italic_ for notes/timestamps
- Bullet points with "•"
- Emoji sparingly: 📊 💰 🏨 ⚠️ ✅ 📋

Keep replies tight — owner reads on mobile. Max 20 lines per reply.

════════════════════════════════════════════════
URGENT FLAGS

Always highlight at the top of any report if:
⚠️  Any HIGH severity complaint open > 2 hours
⚠️  Any booking PENDING confirmation for today's check-in
⚠️  Any inventory item at zero stock
⚠️  Revenue today is 0 (possible system issue)

════════════════════════════════════════════════
SCOPE LIMITS

You cannot:
- Book rooms on behalf of guests (use guest mode for that)
- Change room prices (must be done via admin dashboard)
- Access financial reports beyond what the tools provide
- Contact individual guests directly

For anything outside your tools, tell the owner clearly and suggest the admin dashboard.`;
}

// ── Manager agentic loop ───────────────────────────────────────

export async function runManagerLoop(
  messages: MessageParam[],
  systemPrompt: string,
  sessionHint = "manager",
): Promise<{ reply: string; messages: MessageParam[] }> {
  const workingMessages = [...messages];

  let response = await anthropic.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system:     systemPrompt,
    tools:      MANAGER_TOOLS,
    messages:   workingMessages,
  });

  while (response.stop_reason === "tool_use") {
    const assistantMsg: MessageParam = {
      role:    "assistant",
      content: response.content,
    };

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const t0 = Date.now();
      let result: unknown;
      try {
        result = await executeManagerTool(block.name, block.input as Record<string, unknown>);
      } catch (err) {
        result = { error: "Tool failed — " + String(err) };
      }

      console.log(JSON.stringify({
        event:    "manager_tool_call",
        session:  sessionHint,
        tool:     block.name,
        ok:       !(result as Record<string, unknown>)?.error,
        latencyMs: Date.now() - t0,
        input:    JSON.stringify(block.input).slice(0, 150),
      }));

      toolResults.push({
        type:        "tool_result",
        tool_use_id: block.id,
        content:     JSON.stringify(result),
      });
    }

    workingMessages.push(assistantMsg);
    workingMessages.push({ role: "user", content: toolResults });

    response = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:     systemPrompt,
      tools:      MANAGER_TOOLS,
      messages:   workingMessages,
    });
  }

  workingMessages.push({ role: "assistant", content: response.content });

  const reply = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map(b => b.text)
    .join("\n")
    .trim();

  return { reply: reply || "Ji, koi sawaal?", messages: workingMessages };
}
