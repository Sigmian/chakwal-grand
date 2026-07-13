"server-only";

import { timingSafeEqual } from "crypto";

/**
 * Validate the Authorization: Bearer <CRON_SECRET> header using a
 * constant-time comparison to prevent timing-oracle attacks.
 */
export function isCronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed when secret is unset

  const authHeader = req.headers.get("authorization") ?? "";
  const expected   = `Bearer ${secret}`;

  // Compare as UTF-8 byte buffers of equal length to be timing-safe.
  // If lengths differ we still do a dummy compare to avoid early-exit leak.
  const a = Buffer.from(authHeader, "utf8");
  const b = Buffer.from(expected,    "utf8");

  if (a.length !== b.length) {
    // Lengths differ — do a dummy compare to burn constant time, then deny.
    timingSafeEqual(b, b);
    return false;
  }

  return timingSafeEqual(a, b);
}
