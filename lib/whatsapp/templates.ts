// ============================================================
// WhatsApp Template Message Sender
// Sends pre-approved Meta HSM templates to guests.
// All templates must be approved in Meta Business Manager first.
// ============================================================

const WHATSAPP_API_URL = "https://graph.facebook.com/v19.0";

function toE164(phone: string): string {
  const digits = phone.replace(/[\s\-().+]/g, "");
  if (digits.startsWith("03") && digits.length === 11) return "92" + digits.slice(1);
  if (digits.startsWith("92") && digits.length === 12) return digits;
  if (digits.length === 10) return "92" + digits;
  return digits;
}

// Strip BOM and zero-width chars that corrupt HTTP Authorization headers
const clean = (s: string | undefined) =>
  s ? s.replace(/^﻿/, "").replace(/[​-‍﻿]/g, "").trim() : s;

function getCredentials() {
  const token   = clean(process.env.WHATSAPP_API_TOKEN);
  const phoneId = clean(process.env.WHATSAPP_PHONE_NUMBER_ID);
  return { token, phoneId, ready: !!(token && phoneId) };
}

async function sendTemplate(
  toPhone: string,
  templateName: string,
  bodyParams: string[],
  buttonParam?: string, // dynamic URL suffix for url-type buttons
): Promise<{ ok: boolean; error?: string }> {
  const { token, phoneId, ready } = getCredentials();
  if (!ready) return { ok: false, error: "WhatsApp not configured" };

  const components: object[] = [];

  if (bodyParams.length > 0) {
    components.push({
      type:       "body",
      parameters: bodyParams.map(text => ({ type: "text", text })),
    });
  }

  // Dynamic URL button (index 0) — used by cgh_booking_confirmed "View Booking"
  if (buttonParam) {
    components.push({
      type:       "button",
      sub_type:   "url",
      index:      "0",
      parameters: [{ type: "text", text: buttonParam }],
    });
  }

  const res = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to:   toE164(toPhone),
      type: "template",
      template: {
        name:     templateName,
        language: { code: "en" },
        components,
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: `Meta ${res.status}: ${err}` };
  }
  return { ok: true };
}

// ── Public senders ────────────────────────────────────────────

export async function sendBookingConfirmed(p: {
  phone:             string;
  guestName:         string;
  bookingRef:        string;
  roomName:          string;
  branchName:        string;
  checkIn:           string; // "28 June 2026"
  checkOut:          string;
  nights:            number;
  totalAmount:       number;
  estimatedArrival?: string; // "3:00 PM" — guest preferred arrival time
}) {
  // Combine date + arrival time. If no time selected, say "anytime (flexible)"
  const checkInWithTime = p.estimatedArrival
    ? `${p.checkIn} at ${p.estimatedArrival}`
    : `${p.checkIn} (anytime — you're welcome whenever!)`;

  return sendTemplate(
    p.phone,
    "cgh_booking_confirmed_v3",
    [
      p.guestName,
      p.bookingRef,
      p.roomName,
      p.branchName,
      checkInWithTime,
      p.checkOut,
      String(p.nights),
      Number(p.totalAmount).toLocaleString("en-PK"),
    ],
    p.bookingRef, // dynamic URL suffix: /booking-confirmation/{bookingRef}
  );
}

export async function sendCheckinReminder(p: {
  phone:      string;
  guestName:  string;
  bookingRef: string;
  checkIn:    string; // "28 June 2026"
  address:    string;
}) {
  return sendTemplate(
    p.phone,
    "cgh_checkin_reminder",
    [p.guestName, p.bookingRef, p.checkIn, p.address],
  );
}

export async function sendCheckoutReminder(p: {
  phone:      string;
  guestName:  string;
  bookingRef: string;
}) {
  return sendTemplate(
    p.phone,
    "cgh_checkout_reminder",
    [p.guestName, p.bookingRef],
  );
}

export async function sendReviewRequest(p: {
  phone:      string;
  guestName:  string;
  reviewUrl:  string;
}) {
  return sendTemplate(
    p.phone,
    "cgh_review_request",
    [p.guestName, p.reviewUrl],
  );
}

export async function sendWinback(p: {
  phone:     string;
  guestName: string;
}) {
  return sendTemplate(
    p.phone,
    "cgh_winback",
    [p.guestName],
  );
}
