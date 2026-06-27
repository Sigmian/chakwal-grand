// ============================================================
// Per-phone rate limiter for the WhatsApp webhook.
//
// Limits:
//   - 30 messages per phone per hour  (soft: reply with notice)
//   - 60 messages per phone per hour  (hard: drop silently)
//
// In-process storage is sufficient for a single Vercel instance.
// To scale across instances swap the Map for a Redis INCR+EXPIRE.
// ============================================================

const WINDOW_MS   = 60 * 60 * 1000; // 1 hour
const SOFT_LIMIT  = 30;              // reply with a slow-down notice
const HARD_LIMIT  = 60;              // drop silently

interface Bucket {
  count:     number;
  windowEnd: number;
}

const buckets = new Map<string, Bucket>();

// Evict expired buckets every 10 minutes to prevent unbounded growth.
setInterval(() => {
  const now = Date.now();
  for (const [phone, bucket] of buckets) {
    if (now > bucket.windowEnd) buckets.delete(phone);
  }
}, 10 * 60 * 1000);

export type RateResult =
  | { allowed: true }
  | { allowed: false; hard: boolean; retryAfterMs: number };

export function checkRateLimit(phone: string): RateResult {
  const now = Date.now();
  let bucket = buckets.get(phone);

  if (!bucket || now > bucket.windowEnd) {
    bucket = { count: 0, windowEnd: now + WINDOW_MS };
    buckets.set(phone, bucket);
  }

  bucket.count += 1;

  if (bucket.count > HARD_LIMIT) {
    return { allowed: false, hard: true, retryAfterMs: bucket.windowEnd - now };
  }

  if (bucket.count > SOFT_LIMIT) {
    return { allowed: false, hard: false, retryAfterMs: bucket.windowEnd - now };
  }

  return { allowed: true };
}
