"use client";

import { useState } from "react";
import { Send, MessageCircle } from "lucide-react";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", phone: "", subject: "", message: "" });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Hi, I'm ${form.name} (${form.phone}).%0A*Subject:* ${form.subject}%0A%0A${form.message}`;
    window.open(`https://wa.me/923347742767?text=${text}`, "_blank", "noreferrer");
  };

  const isValid = form.name.trim() && form.message.trim();

  return (
    <form onSubmit={handleWhatsApp} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Your Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={set("name")}
            placeholder="Enter your name"
            required
            className="w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold-500/50 transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Phone Number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={set("phone")}
            placeholder="03XX-XXXXXXX"
            className="w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold-500/50 transition-colors"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Subject</label>
        <select
          value={form.subject}
          onChange={set("subject")}
          className="w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:border-gold-500/50 transition-colors"
        >
          <option value="">Select a topic…</option>
          <option value="Room Booking Inquiry">Room Booking Inquiry</option>
          <option value="Group / Event Booking">Group / Event Booking</option>
          <option value="Pricing & Availability">Pricing & Availability</option>
          <option value="Existing Booking Issue">Existing Booking Issue</option>
          <option value="General Question">General Question</option>
          <option value="Feedback / Suggestion">Feedback / Suggestion</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Message *</label>
        <textarea
          value={form.message}
          onChange={set("message")}
          placeholder="How can we help you?"
          required
          rows={4}
          className="w-full bg-surface-base border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-gold-500/50 transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className="w-full flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white text-sm font-bold rounded-xl hover:bg-[#1ebe5c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <MessageCircle className="w-4 h-4" />
        Send via WhatsApp
        <Send className="w-4 h-4" />
      </button>
      <p className="text-xs text-muted-foreground text-center">
        This will open WhatsApp with your message pre-filled. We respond within minutes.
      </p>
    </form>
  );
}
