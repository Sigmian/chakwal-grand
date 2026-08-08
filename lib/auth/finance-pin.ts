// ============================================================
// lib/auth/finance-pin.ts
// Second-factor PIN lock for the Finance section.
//
// The PIN itself lives in the FINANCE_PIN env var — never in the
// repo and never sent to the browser. Unlocking issues a short-lived
// HMAC-signed cookie bound to the user id, so it cannot be forged or
// reused by another account.
//
// Server-only. Never import from a client component.
// ============================================================

import crypto from "crypto";
import { cookies } from "next/headers";

export const FINANCE_COOKIE = "cgh_fin_unlock";

/** How long one unlock lasts before the PIN is asked again. */
export const UNLOCK_MINUTES = 30;

function signingSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    ""
  );
}

/** True when a PIN has been configured for this deployment. */
export function isFinancePinConfigured(): boolean {
  return Boolean(process.env.FINANCE_PIN && signingSecret());
}

/**
 * Constant-time PIN comparison.
 * Both sides are hashed first so differing lengths can't leak via timing.
 */
export function checkFinancePin(input: string): boolean {
  const expected = process.env.FINANCE_PIN ?? "";
  if (!expected) return false;
  const a = crypto.createHash("sha256").update(String(input)).digest();
  const b = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", signingSecret()).update(payload).digest("hex");
}

function buildToken(userId: string, expiresAt: number): string {
  const payload = `${userId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

/** Validate an unlock token: correct signature, right user, not expired. */
export function isValidToken(token: string | undefined, userId: string): boolean {
  if (!token || !signingSecret()) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [tokenUserId, expRaw, sig] = parts;
  if (tokenUserId !== userId) return false;

  const expiresAt = Number(expRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const expected = sign(`${tokenUserId}.${expRaw}`);
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function setUnlockCookie(userId: string): void {
  const expiresAt = Date.now() + UNLOCK_MINUTES * 60 * 1000;
  cookies().set(FINANCE_COOKIE, buildToken(userId, expiresAt), {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   UNLOCK_MINUTES * 60,
    path:     "/",
  });
}

export function clearUnlockCookie(): void {
  cookies().set(FINANCE_COOKIE, "", { maxAge: 0, path: "/" });
}

/** Is the Finance section currently unlocked for this user? */
export function isFinanceUnlocked(userId: string): boolean {
  // With no PIN configured the section stays open — a missing env var
  // must not lock the owner out of their own books.
  if (!isFinancePinConfigured()) return true;
  return isValidToken(cookies().get(FINANCE_COOKIE)?.value, userId);
}

/**
 * Guard for finance server actions, so the data can't be pulled by calling
 * the action directly while the section is locked.
 */
export function assertFinanceUnlocked(userId: string): void {
  if (!isFinanceUnlocked(userId)) {
    throw new Error("Finance is locked. Enter the PIN to continue.");
  }
}
