// ============================================================
// lib/hr/config.ts
// Server-only bridge between the HrSettings table and the pure
// engine config. Import from server actions, never a client.
// ============================================================

import prisma from "@/lib/db/prisma";
import { toHrConfig, type HrConfig } from "./settings";

/** Load a company's HR config, falling back to defaults when unset. */
export async function getHrConfig(companyId: string): Promise<HrConfig> {
  const row = await prisma.hrSettings.findUnique({ where: { companyId } });
  return toHrConfig(row);
}

/** Get-or-create the HrSettings row so the admin always has one to edit. */
export async function ensureHrSettings(companyId: string) {
  return prisma.hrSettings.upsert({
    where: { companyId },
    update: {},
    create: { companyId },
  });
}
