// ============================================================
// Zara Knowledge Layer
//
// Business content that changes without a code deploy lives here:
//   - Business hours, payment, policies
//   - Branch list with addresses
//   - Active promotions / discount codes
//   - Nearby attractions and travel guide
//   - Owner's custom free-text notes (anything extra)
//
// Stored as JSON in the SiteContent table (existing model, no migration).
// Cached in-process for 5 minutes so every WhatsApp message does NOT
// hit the database. Cache is invalidated on save via invalidateCache().
// ============================================================

import prisma from "@/lib/db/prisma";
import { siteConfig } from "@/config/site";

// ── Types ─────────────────────────────────────────────────────

export interface ZaraBranch {
  name:    string;
  city:    string;
  address: string;
}

export interface ZaraPromotion {
  code:        string;
  minNights:   number;
  discountPct: number;
  description: string;  // shown to guest: "7+ raatein ke liye 14% off"
}

export interface ZaraAttraction {
  name:        string;
  distanceKm:  number;
  description: string;  // 1-2 sentences for Zara to use
}

export interface ZaraKnowledge {
  checkIn:              string;       // "2:00 PM"
  checkOut:             string;       // "12:00 PM"
  paymentPolicy:        string;       // free text
  acHoursDaily:         number;
  otherPolicies:        string[];     // ["CNIC required", "Free WiFi", ...]
  phone:                string;
  website:              string;
  googleReviewUrl:      string;
  googleReviewIncentive: string;      // "10% cashback on next stay"
  // Payment accounts
  bankAccountTitle:     string;
  bankAccountNumber:    string;
  bankName:             string;
  bankBranchName:       string;
  bankBranchCode:       string;
  bankIBAN:             string;
  easypaisaNumber:      string;
  easypaisaName:        string;
  branches:             ZaraBranch[];
  promotions:           ZaraPromotion[];
  attractions:          ZaraAttraction[];
  localFood:            string;       // free text block
  weatherGuide:         string;       // free text block
  transportGuide:       string;       // free text block
  customNotes:          string;       // owner adds anything extra here
}

// ── Hardcoded defaults ────────────────────────────────────────
// Used when the DB row doesn't exist yet (first run, or key missing).
// These match what was previously baked into the system prompt.

export const DEFAULT_KNOWLEDGE: ZaraKnowledge = {
  checkIn:    siteConfig.checkInTime,
  checkOut:   siteConfig.checkOutTime,
  paymentPolicy: "Cash on arrival, bank transfer, ya Easypaisa — teeno accepted hain.",
  acHoursDaily:  siteConfig.acHoursDaily,

  bankAccountTitle:  "Hassan Ali",
  bankAccountNumber: "339361342",
  bankName:          "UBL (United Bank Limited)",
  bankBranchName:    "UBL Odhewal Branch",
  bankBranchCode:    "2603",
  bankIBAN:          "PK14UNIL0109000339361342",
  easypaisaNumber:   "03340005838",
  easypaisaName:     "Hassan Ali",
  otherPolicies: [
    "CNIC original zaroor lao check-in pe",
    "Free WiFi tamaam rooms mein",
    "24/7 hot water",
    "Free parking on premises",
    "24/7 front desk aur room service",
  ],
  phone:                siteConfig.phone,
  website:              siteConfig.url,
  googleReviewUrl:      siteConfig.social.googleReviewUrl,
  googleReviewIncentive: "Google review dene pe agla stay 10% sasta",

  branches: [
    { name: "Main Branch",         city: "Chakwal", address: "Near District Courts, Talagang Road, Chakwal" },
    { name: "Madina Town Branch",  city: "Chakwal", address: "Madina Town, Chakwal" },
  ],

  promotions: [
    { code: "WEEKLY14",  minNights: 7,  discountPct: 14, description: "7 ya zyada raatein: WEEKLY14 code se 14% off" },
    { code: "MONTHLY40", minNights: 30, discountPct: 40, description: "30 ya zyada raatein: MONTHLY40 se 40% off, bahut badi saving" },
  ],

  attractions: [
    { name: "Katas Raj Temples",  distanceKm: 40, description: "Qadeem Hindu pilgrimage site, free entry, subah best. ~1 ghanta drive." },
    { name: "Kallar Kahar Lake",  distanceKm: 40, description: "Namkeen jheel, bandaron ka mela, picnic ke liye mashoor. ~50 min drive." },
    { name: "Khewra Salt Mine",   distanceKm: 70, description: "Duniya ki 2nd largest salt mine. Tour PKR 500, andar namak ki masjid bhi hai. ~1.5 ghante." },
    { name: "Tilla Jogian",       distanceKm: 60, description: "Pahadon mein qadeem temple, hiking aur panoramic views." },
    { name: "Pharwala Fort",      distanceKm: 50, description: "Mughal zamane ka qila, historical visit." },
    { name: "Choa Saidan Shah",   distanceKm: 30, description: "Purana colonial hill station, thanda mausam." },
  ],

  localFood: `Talagang Road pe bahut achay tandoor aur karahi restaurants hain.
Mashoor local dishes: Sajji aur Chapli Kebab.
Hamare paas in-house restaurant nahi, lekin room mein khana mangwa sakte hain.`,

  weatherGuide: `Best time: October se March — mild, 10 se 25 degree.
April se June: garam, 20 se 38 degree — AC room lena.
July se September: Monsoon, garmi bhi nammi bhi — definitely AC room lo.`,

  transportGuide: `Car se: M-2 Motorway, Balkassar/Kallar Kahar Interchange, phir Chakwal ~30 min.
Daewoo Express: Lahore/Pindi se Chakwal stop, phir rickshaw 10 min.
Coaster vans: Pindi se Chakwal har 30 minute chalti hain.`,

  customNotes: "",
};

// ── Cache ──────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  knowledge:  ZaraKnowledge;
  expiresAt:  number;
}

let cache: CacheEntry | null = null;

export function invalidateCache(): void {
  cache = null;
}

// ── DB keys ───────────────────────────────────────────────────

const DB_KEY = "zara_knowledge_v1";

// ── Public API ────────────────────────────────────────────────

export async function getKnowledge(): Promise<ZaraKnowledge> {
  if (cache && Date.now() < cache.expiresAt) {
    return cache.knowledge;
  }

  try {
    const row = await prisma.siteContent.findUnique({ where: { key: DB_KEY } });

    if (row?.value) {
      const parsed = JSON.parse(row.value) as Partial<ZaraKnowledge>;
      // Deep-merge with defaults so new fields added in future deploys
      // always have a value even for old DB rows.
      const knowledge: ZaraKnowledge = { ...DEFAULT_KNOWLEDGE, ...parsed };
      cache = { knowledge, expiresAt: Date.now() + CACHE_TTL_MS };
      return knowledge;
    }
  } catch (err) {
    console.error("[ZaraKnowledge] DB fetch failed, using defaults:", err);
  }

  cache = { knowledge: DEFAULT_KNOWLEDGE, expiresAt: Date.now() + CACHE_TTL_MS };
  return DEFAULT_KNOWLEDGE;
}

export async function saveKnowledge(knowledge: ZaraKnowledge): Promise<void> {
  await prisma.siteContent.upsert({
    where:  { key: DB_KEY },
    create: { key: DB_KEY, value: JSON.stringify(knowledge), type: "json" },
    update: { value: JSON.stringify(knowledge) },
  });
  invalidateCache();
}

// ── Prompt formatter ──────────────────────────────────────────
// Converts the knowledge object into the text block injected into
// Zara's system prompt. Keeping formatting logic here means
// core.ts stays clean and this can be unit-tested independently.

export function formatKnowledgeForPrompt(k: ZaraKnowledge): string {
  const policies = k.otherPolicies.map(p => `- ${p}`).join("\n");

  const branches = k.branches
    .map(b => `${b.name}: ${b.address}`)
    .join("\n");

  const promotions = k.promotions
    .map(p => `- ${p.description} (code: ${p.code})`)
    .join("\n");

  const attractions = k.attractions
    .map(a => `- ${a.name} (${a.distanceKm} km): ${a.description}`)
    .join("\n");

  const custom = k.customNotes?.trim()
    ? `\nOWNER NOTES (important, use these):\n${k.customNotes.trim()}`
    : "";

  return `════════════════════════════════════════════════
BUSINESS INFO

Check-in: ${k.checkIn} | Check-out: ${k.checkOut}
Payment: ${k.paymentPolicy}
AC: ${k.acHoursDaily} ghante daily
Phone: ${k.phone}
Website: ${k.website}
${k.googleReviewIncentive}: ${k.googleReviewUrl}

Policies:
${policies}

PAYMENT ACCOUNTS (share when guest asks how to pay in advance):
Bank Transfer:
  Account Title: ${k.bankAccountTitle}
  Bank: ${k.bankName}
  Account No: ${k.bankAccountNumber}
  Branch: ${k.bankBranchName} (Code: ${k.bankBranchCode})
  IBAN: ${k.bankIBAN}

Easypaisa:
  Number: ${k.easypaisaNumber}
  Name: ${k.easypaisaName}

Payment rules:
- Sirf tab share karo jab guest khud pooche "kaise payment karein" ya "advance dena hai"
- Details exact copy karo — numbers mein koi change mat karo
- Easypaisa sirf mobile number pe — IBAN bank ke liye hai
- Payment ke baad screenshot mangwao confirmation ke liye

BRANCHES:
${branches}

PROMOTIONS (mention naturally when relevant):
${promotions}

════════════════════════════════════════════════
CHAKWAL TRAVEL GUIDE

NEARBY ATTRACTIONS:
${attractions}

LOCAL FOOD:
${k.localFood}

MAUSAM (Weather):
${k.weatherGuide}

KAISE AAYEIN (Transport):
${k.transportGuide}${custom}`;
}
