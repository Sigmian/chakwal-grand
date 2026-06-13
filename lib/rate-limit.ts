// Simple in-memory rate limiter for server actions.
// Resets on server restart — suitable for single-instance Next.js deployments.

interface Entry { count: number; resetAt: number }

const store = new Map<string, Entry>();

export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (entry.count >= max) return false; // blocked

  entry.count++;
  return true; // allowed
}

// Periodically clean up expired keys (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
}
