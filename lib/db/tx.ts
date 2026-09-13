// ============================================================
// lib/db/tx.ts
// Serializable transaction helper with automatic retry.
//
// On the Neon pooler (PgBouncer, transaction mode) an interactive
// Serializable transaction can intermittently fail with a serialization
// error (P2034) or a transient connection error ("Transaction not found…").
// These are safe to retry — the transaction rolled back and nothing was
// committed — so we re-run it a few times before giving up. Genuine
// business conflicts are thrown as plain Errors inside the callback and
// propagate immediately (they carry no transient signature).
// ============================================================

import type { Prisma } from "@prisma/client";
import prisma from "./prisma";

function isTransient(err: unknown): boolean {
  const code = (err as { code?: string })?.code;
  if (code === "P2034") return true; // serialization failure / write conflict
  const msg = (err as Error)?.message ?? "";
  return /transaction not found|closed transaction|could not serialize|deadlock detected|connection (closed|reset|terminated)|obtained before disconnecting/i.test(msg);
}

export async function runSerializable<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  retries = 3,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await prisma.$transaction(fn, { isolationLevel: "Serializable" });
    } catch (err) {
      lastErr = err;
      if (!isTransient(err) || attempt === retries) throw err;
      // Small increasing backoff before retrying.
      await new Promise((r) => setTimeout(r, 40 * (attempt + 1)));
    }
  }
  throw lastErr;
}
