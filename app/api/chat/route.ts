// ============================================================
// Web Chat API — /api/chat
//
// Stateless: client (ChatWidget) sends the full message history
// each request. No DB session needed — the browser holds state.
//
// Uses the same shared agent core as the WhatsApp bot so both
// channels get live DB data (real room prices, availability)
// instead of hardcoded values.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { getSystemPrompt, runAgentLoop, type MessageParam } from "@/lib/agent/core";
import { siteConfig } from "@/config/site";
import { rateLimit } from "@/lib/rate-limit";

// Keep at most 20 messages (10 turns) to cap token usage.
// The client holds the full visible history for display; we only
// need recent context for the model.
const MAX_WEB_HISTORY = 20;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!rateLimit(`web-chat:${ip}`, 20, 60_000)) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment before sending more." },
      { status: 429 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: `AI chat is not configured. Please call us at ${siteConfig.phone}.` },
      { status: 503 },
    );
  }

  let messages: MessageParam[];
  try {
    const body = await req.json();
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    // Accept only user/assistant text turns from the client.
    // Tool-use turns are internal — the client never sees or sends them.
    messages = (body.messages as Array<{ role: string; content: string }>)
      .filter((m) => m.role === "user" || m.role === "assistant")
      .filter((m) => typeof m.content === "string" && m.content.trim())
      .slice(-MAX_WEB_HISTORY)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const { reply } = await runAgentLoop(messages, await getSystemPrompt("web"), "web");
    return NextResponse.json({ message: reply });
  } catch (err) {
    console.error("[chat/route] error:", err);
    return NextResponse.json(
      { error: `Something went wrong. Please try again or call ${siteConfig.phone}.` },
      { status: 500 },
    );
  }
}
