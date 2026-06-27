// ============================================================
// WhatsApp Cloud API integration (Meta / WhatsApp Business)
//
// Setup (one-time):
//   1. Create a Meta Developer account at developers.facebook.com
//   2. Create an app → Add "WhatsApp" product
//   3. Go to WhatsApp > API Setup
//   4. Copy "Phone number ID" → WHATSAPP_PHONE_NUMBER_ID
//   5. Copy "Temporary access token" (or generate a permanent one)
//      → WHATSAPP_API_TOKEN
//   6. Add env vars to Vercel + .env.local
//
// Free tier: up to 1,000 conversations/month to any number.
// Pakistan numbers must be in E.164 format: 923001234567
// ============================================================

import { siteConfig } from "@/config/site";

const WHATSAPP_API_URL = "https://graph.facebook.com/v19.0";

function toE164(phone: string): string {
  // Strip spaces, dashes, parentheses
  const digits = phone.replace(/[\s\-().+]/g, "");
  // Pakistan local format 03xx → 923xx
  if (digits.startsWith("03") && digits.length === 11) {
    return "92" + digits.slice(1);
  }
  // Already includes country code
  if (digits.startsWith("92") && digits.length === 12) return digits;
  // Fallback: prepend 92
  if (digits.length === 10) return "92" + digits;
  return digits;
}

export interface BookingWhatsAppPayload {
  phone:        string;
  guestName:    string;
  bookingRef:   string;
  roomName:     string;
  branchName:   string;
  checkInDate:  Date;
  checkOutDate: Date;
  nights:       number;
  totalAmount:  number;
  branchAddress: string;
  confirmationUrl: string;
}

export async function sendBookingWhatsApp(payload: BookingWhatsAppPayload): Promise<void> {
  const token   = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  // Silently skip if not configured — booking still succeeds
  if (!token || !phoneId) {
    console.log("[WhatsApp] Not configured — skipping confirmation message");
    return;
  }

  const to = toE164(payload.phone);

  const ciStr = payload.checkInDate.toLocaleDateString("en-PK", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });
  const coStr = payload.checkOutDate.toLocaleDateString("en-PK", {
    day: "numeric", month: "short", year: "numeric",
  });

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(payload.branchAddress)}`;

  const message =
    `السلام علیکم ${payload.guestName}! 🌟\n\n` +
    `✅ *Booking Confirmed — Chakwal Guest House*\n\n` +
    `📋 *Booking Ref:* ${payload.bookingRef}\n` +
    `🏨 *Room:* ${payload.roomName}\n` +
    `📍 *Branch:* ${payload.branchName}\n` +
    `📅 *Check-in:* ${ciStr} at 2:00 PM\n` +
    `📅 *Check-out:* ${coStr} at 12:00 PM\n` +
    `🌙 *Duration:* ${payload.nights} night${payload.nights > 1 ? "s" : ""}\n` +
    `💰 *Total Due:* PKR ${payload.totalAmount.toLocaleString("en-PK")} (cash on arrival)\n\n` +
    `📌 *Important:*\n` +
    `• Bring your original CNIC\n` +
    `• A/C available 12 hours daily\n` +
    `• Call us: ${siteConfig.phone}\n\n` +
    `🗺️ *Location:* ${mapsUrl}\n\n` +
    `📄 *View Booking:* ${payload.confirmationUrl}\n\n` +
    `جزاک اللہ خیراً — Chakwal Guest House Team`;

  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message, preview_url: false },
  };

  const res = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API error ${res.status}: ${err}`);
  }
}

// Send a single image message. `link` must be a public HTTPS URL.
// WhatsApp rejects non-HTTPS or localhost URLs.
export async function sendWhatsAppImage(
  toPhone: string,
  imageUrl: string,
  caption?: string,
): Promise<void> {
  const token   = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return;

  const res = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to:   toE164(toPhone),
      type: "image",
      image: {
        link:    imageUrl,
        caption: caption ?? "",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp image send error ${res.status}: ${err}`);
  }
}

// Send up to `maxImages` images sequentially with a small gap between each
// so WhatsApp delivers them in order.
export async function sendWhatsAppImages(
  toPhone: string,
  images: { url: string; caption?: string }[],
  maxImages = 3,
): Promise<{ sent: number }> {
  const token   = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { sent: 0 };

  const toSend = images.slice(0, maxImages);
  let sent = 0;

  for (const img of toSend) {
    try {
      await sendWhatsAppImage(toPhone, img.url, img.caption);
      sent++;
      // Small delay so Meta delivers in order
      if (sent < toSend.length) await new Promise(r => setTimeout(r, 400));
    } catch (err) {
      console.error("[WhatsApp] Image send failed:", err);
    }
  }

  return { sent };
}
