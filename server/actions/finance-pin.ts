"use server";

// ============================================================
// server/actions/finance-pin.ts
// Unlock / lock the Finance section with the 4-digit PIN.
// ============================================================

import { requirePermission } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import {
  checkFinancePin,
  setUnlockCookie,
  clearUnlockCookie,
  isFinancePinConfigured,
} from "@/lib/auth/finance-pin";

export interface UnlockResult {
  success: boolean;
  error?: string;
}

/**
 * Verify the Finance PIN and open a short-lived unlock window.
 *
 * The caller must already be an authenticated user with finance access —
 * the PIN is a second factor, not the first one.
 */
export async function unlockFinance(pin: string): Promise<UnlockResult> {
  const user = await requirePermission("finance:read");

  if (!isFinancePinConfigured()) {
    // Nothing to verify against; the section is already open.
    return { success: true };
  }

  // A 4-digit PIN is only 10,000 combinations — throttle guesses hard.
  if (!rateLimit(`finance-pin:${user.id}`, 5, 10 * 60 * 1000)) {
    return {
      success: false,
      error: "Too many incorrect attempts. Please wait 10 minutes and try again.",
    };
  }

  if (!checkFinancePin(String(pin ?? "").trim())) {
    return { success: false, error: "Incorrect PIN." };
  }

  setUnlockCookie(user.id);
  return { success: true };
}

/** Re-lock Finance immediately (e.g. before handing the screen over). */
export async function lockFinance(): Promise<{ success: boolean }> {
  await requirePermission("finance:read");
  clearUnlockCookie();
  return { success: true };
}
