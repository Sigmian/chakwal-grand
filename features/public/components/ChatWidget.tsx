"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { MessageCircle, X, Send, Bot, Loader2, Phone, ChevronDown } from "lucide-react";
import { cn } from "@/utils";
import { siteConfig } from "@/config/site";

const ZARA_WHATSAPP   = "https://wa.me/923372699997";
const MANAGER_WHATSAPP = `https://wa.me/${siteConfig.whatsapp}`;

interface Message {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const SUGGESTIONS = [
  "What are your room rates?",
  "Do you have A/C rooms?",
  "How do I book a room?",
  "What's included in the room?",
];

const WELCOME: Message = {
  role: "assistant",
  content: "Assalam o Alaikum! 👋 I'm Zara, your booking assistant at Chakwal Guest House. I can help you with room rates, availability, and booking. What would you like to know?",
  ts: Date.now(),
};

export function ChatWidget() {
  const [open, setOpen]         = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput]       = useState("");
  const [isPending, start]      = useTransition();
  const [error, setError]       = useState("");
  const [unread, setUnread]     = useState(0);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  const send = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || isPending) return;
    setInput("");
    setError("");

    const userMsg: Message = { role: "user", content: msg, ts: Date.now() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);

    start(async () => {
      try {
        const res = await fetch("/api/chat", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({
            messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setError(data.error ?? "Something went wrong.");
          return;
        }
        const reply: Message = { role: "assistant", content: data.message, ts: Date.now() };
        setMessages(prev => [...prev, reply]);
        if (!open) setUnread(n => n + 1);
      } catch {
        setError("Connection failed. Please try again.");
      }
    });
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">

        {/* Options popup */}
        {showOptions && !open && (
          <div className="absolute bottom-16 right-0 w-72 bg-surface-elevated border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="bg-gold-gradient px-4 py-3 flex items-center justify-between">
              <div>
                <p className="font-bold text-background text-sm">Chakwal Guest House</p>
                <p className="text-background/70 text-[11px]">How can we help you?</p>
              </div>
              <button onClick={() => setShowOptions(false)} className="w-7 h-7 rounded-lg bg-background/15 flex items-center justify-center text-background hover:bg-background/25 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Option 1 — Zara */}
            <a
              href={ZARA_WHATSAPP}
              target="_blank"
              rel="noreferrer"
              onClick={() => setShowOptions(false)}
              className="flex items-center gap-3 px-4 py-4 hover:bg-surface-base transition-colors border-b border-border group"
            >
              <div className="w-10 h-10 rounded-full bg-[#25D366]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#25D366]/25 transition-colors">
                <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">Contact Zara</p>
                <p className="text-muted-foreground text-xs">Available 24/7 · Instant reply</p>
              </div>
              <div className="w-5 h-5 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </a>

            {/* Option 2 — Manager */}
            <a
              href={MANAGER_WHATSAPP}
              target="_blank"
              rel="noreferrer"
              onClick={() => setShowOptions(false)}
              className="flex items-center gap-3 px-4 py-4 hover:bg-surface-base transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-gold-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-gold-500/25 transition-colors">
                <Phone className="w-5 h-5 text-gold-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm">Talk to Manager</p>
                <p className="text-muted-foreground text-xs">For special requests & inquiries</p>
              </div>
            </a>
          </div>
        )}

        <button
          onClick={() => {
            if (open) { setOpen(false); }
            else { setShowOptions(v => !v); }
          }}
          className={cn(
            "relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300",
            "bg-gold-gradient hover:shadow-gold-lg hover:scale-105 active:scale-95",
          )}
          aria-label="Chat with us"
        >
          {(open || showOptions)
            ? <X className="w-6 h-6 text-background" />
            : <MessageCircle className="w-6 h-6 text-background" />
          }
          {!open && !showOptions && unread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </button>

        {/* Pulse ring */}
        {!open && !showOptions && (
          <span className="absolute inset-0 rounded-full bg-gold-500/30 animate-ping pointer-events-none" />
        )}
      </div>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-24px)] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-border animate-fade-in"
          style={{ height: "500px" }}>

          {/* Header */}
          <div className="bg-gold-gradient px-4 py-3 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-full bg-background/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-background" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-background text-sm leading-tight">Zara</p>
              <p className="text-background/70 text-[10px]">Chakwal Guest House · Typically replies instantly</p>
            </div>
            <div className="flex items-center gap-2">
              <a href={`tel:${siteConfig.phoneE164}`}
                className="w-8 h-8 rounded-lg bg-background/15 flex items-center justify-center text-background hover:bg-background/25 transition-colors"
                title="Call us">
                <Phone className="w-3.5 h-3.5" />
              </a>
              <button onClick={() => setOpen(false)} aria-label="Close chat" className="w-8 h-8 rounded-lg bg-background/15 flex items-center justify-center text-background hover:bg-background/25 transition-colors">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-surface-base p-4 space-y-3 scroll-smooth">

            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-2 items-end", m.role === "user" ? "flex-row-reverse" : "flex-row")}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center flex-shrink-0 mb-0.5">
                    <Bot className="w-3.5 h-3.5 text-gold-400" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[75%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-gold-gradient text-background rounded-br-sm"
                    : "bg-surface-elevated border border-border text-foreground rounded-bl-sm"
                )}>
                  {m.content}
                </div>
              </div>
            ))}

            {isPending && (
              <div className="flex gap-2 items-end">
                <div className="w-7 h-7 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-gold-400" />
                </div>
                <div className="bg-surface-elevated border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-gold-400/60 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2 text-center">
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only show on first message) */}
          {messages.length === 1 && !isPending && (
            <div className="px-3 py-2 bg-surface-base border-t border-border flex-shrink-0">
              <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-semibold">Quick questions</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-surface-elevated border border-border text-muted-foreground hover:text-gold-400 hover:border-gold-500/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 bg-surface-elevated border-t border-border flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about rooms, rates, booking…"
              disabled={isPending}
              className="flex-1 bg-surface-base border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-500/50 focus:ring-1 focus:ring-gold-500/20 transition-all disabled:opacity-60"
            />
            <button
              onClick={() => send()}
              disabled={isPending || !input.trim()}
              className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center text-background hover:shadow-gold-sm transition-all disabled:opacity-50 flex-shrink-0"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          {/* Powered by */}
          <div className="text-center py-1.5 bg-surface-elevated border-t border-border/50 flex-shrink-0">
            <p className="text-[9px] text-muted-foreground/50">Powered by Claude AI · Responses may not be 100% accurate</p>
          </div>
        </div>
      )}
    </>
  );
}
