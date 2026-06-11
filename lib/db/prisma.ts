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

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
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
