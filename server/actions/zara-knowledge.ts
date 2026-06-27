"use server";

import { requirePermission } from "@/lib/auth/session";
import { getKnowledge, saveKnowledge, type ZaraKnowledge } from "@/lib/agent/knowledge";

export async function getZaraKnowledge() {
  await requirePermission("settings:ai");
  return getKnowledge();
}

export async function saveZaraKnowledge(data: ZaraKnowledge) {
  await requirePermission("settings:ai");
  await saveKnowledge(data);
  return { success: true };
}
