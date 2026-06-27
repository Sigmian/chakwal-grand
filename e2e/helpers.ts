import { Page } from "@playwright/test";

export const BRANCH_IDS = {
  main:      "branch-chakwal",
  madina:    "branch-madina",
};

/** Dismiss the branch selector by choosing Main Branch */
export async function selectMainBranch(page: Page) {
  const modal = page.getByRole("dialog");
  if (await modal.isVisible()) {
    await page.getByRole("button", { name: /select this branch/i }).first().click();
  }
}

/** Dismiss the branch selector by choosing Madina Town */
export async function selectMadinaBranch(page: Page) {
  const modal = page.getByRole("dialog");
  if (await modal.isVisible()) {
    await page.getByRole("button", { name: /select this branch/i }).last().click();
  }
}

/** Force a branch into localStorage (bypasses modal) */
export async function setStoredBranch(page: Page, branchId: string) {
  await page.addInitScript((id) => {
    localStorage.setItem("cgh_branch", id);
  }, branchId);
}

/** Clear branch so modal appears */
export async function clearStoredBranch(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem("cgh_branch");
  });
}

/** Future date helpers */
export function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}
