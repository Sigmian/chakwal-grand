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

/**
 * Clear the stored branch so the modal appears — on the FIRST load only.
 * An init script runs on every navigation, so an unconditional removeItem
 * also wiped the choice on reload and made "remember my choice" look broken.
 * sessionStorage survives a reload in the same tab, so it gates this to once.
 */
export async function clearStoredBranch(page: Page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("__cgh_branch_cleared")) return;
    localStorage.removeItem("cgh_branch");
    sessionStorage.setItem("__cgh_branch_cleared", "1");
  });
}

/** Future date helpers */
export function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split("T")[0];
}

/**
 * On phone-sized layouts the navbar links, branch switcher and header phone
 * number live inside the hamburger menu. Open it when that toggle is showing;
 * on desktop the toggle is hidden (md:hidden) and this is a no-op.
 */
export async function openMobileMenuIfPresent(page: Page) {
  const toggle = page.getByRole("button", { name: /toggle menu/i });
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
    await page.locator("header a[href='/rooms']:visible").first().waitFor({ timeout: 5_000 });
  }
}
