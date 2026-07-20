// ============================================================
// lib/db/prisma.ts
// Prisma client singleton
//
// In development, Next.js hot-reload creates new module
// instances constantly. Without this singleton pattern,
// you'd exhaust the PostgreSQL connection pool in minutes.
// ============================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Ensure a sane client-side connection pool. Without an explicit
// `connection_limit`, Prisma defaults to `num_cpus * 2 + 1` — as low as 5 on
// small hosts — which the dashboard's parallel `Promise.all` queries exhaust,
// producing "Timed out fetching a new connection from the connection pool".
// The host is a Neon pooler (PgBouncer), so a higher per-instance limit and a
// longer wait are safe. Only appended when not already present in the URL.
function withPoolParams(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "10");
    if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "20");
    return u.toString();
  } catch {
    return url; // leave untouched if it isn't a parseable URL
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: withPoolParams(process.env.DATABASE_URL) } },
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
    errorFormat: "pretty",
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
