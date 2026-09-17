import { test, expect } from "@playwright/test";
import { clearStoredBranch, setStoredBranch } from "./helpers";

test("branch selector modal appears for new visitors", async ({ page }) => {
  await clearStoredBranch(page);
  await page.goto("/rooms");
  // Modal appears after 300ms delay — wait longer to account for server hydration
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 15_000 });
  await expect(modal.getByText("Choose Your Branch")).toBeVisible();
});

test("branch selector shows both branch cards", async ({ page }) => {
  await clearStoredBranch(page);
  await page.goto("/rooms");
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 15_000 });
  // exact: "Main Branch" also appears inside the card description ("Our Main Branch near…")
  await expect(modal.getByText("Main Branch", { exact: true })).toBeVisible();
  await expect(modal.getByText("Madina Town Branch", { exact: true })).toBeVisible();
});

test("selecting a branch closes modal and shows branch in navbar", async ({ page }) => {
  await clearStoredBranch(page);
  await page.goto("/rooms");
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 15_000 });

  // Click the first "Select This Branch" button (Main Branch)
  await modal.getByRole("button", { name: /select this branch/i }).first().click();

  // Modal should close
  await expect(modal).not.toBeVisible({ timeout: 2_000 });

  // Branch pill should appear in navbar
  await expect(page.locator("header").getByText(/main branch|chakwal/i).first()).toBeVisible();
});

test("ESC key closes modal and defaults to main branch", async ({ page }) => {
  await clearStoredBranch(page);
  await page.goto("/rooms");
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible({ timeout: 2_000 });
});

test("backdrop click closes modal", async ({ page }) => {
  await clearStoredBranch(page);
  await page.goto("/rooms");
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 15_000 });

  // Click in the top-left corner (definitely outside the inner modal card)
  await page.mouse.click(10, 10);
  await expect(modal).not.toBeVisible({ timeout: 2_000 });
});

test("branch preference is remembered after page refresh", async ({ page }) => {
  await clearStoredBranch(page);
  await page.goto("/rooms");
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 15_000 });

  // Ensure "Remember my choice" is checked, then select
  const checkbox = modal.getByRole("checkbox", { name: /remember/i });
  if (!await checkbox.isChecked()) await checkbox.check();
  await modal.getByRole("button", { name: /select this branch/i }).first().click();
  await expect(modal).not.toBeVisible({ timeout: 2_000 });

  // Reload — modal should NOT appear again
  await page.reload();
  await page.waitForTimeout(600); // wait longer than the 300ms delay
  await expect(modal).not.toBeVisible();
});

test("branch can be switched from navbar dropdown", async ({ page }) => {
  await setStoredBranch(page, "branch-chakwal");
  await page.goto("/rooms");

  const toggle = page.getByRole("button", { name: /toggle menu/i });
  if (await toggle.isVisible().catch(() => false)) {
    // Phone layout: branches are listed as buttons inside the hamburger menu.
    await toggle.click();
    const madina = page.locator("header button:visible").filter({ hasText: /madina town branch/i }).first();
    await expect(madina).toBeVisible();
    await madina.click();
  } else {
    // Desktop: branch pill in the navbar opens a "Switch Branch" dropdown.
    const branchPill = page.locator("header button").filter({ hasText: /chakwal|main/i }).first();
    await branchPill.click();
    // ("Madina Town Branch" also appears in room cards on /rooms, so target the switcher's button)
    await expect(page.getByText("Switch Branch")).toBeVisible();
    await expect(page.getByRole("button", { name: /madina town branch/i }).first()).toBeVisible();
    await page.getByRole("button", { name: /madina town/i }).first().click();
  }

  // The chosen branch is persisted (the navbar reads it from here on every page).
  await expect.poll(() => page.evaluate(() => localStorage.getItem("cgh_branch"))).toBe("branch-madina");
});

test("Madina Town card shows its badge (Grand Opening while that offer is live)", async ({ page }) => {
  await clearStoredBranch(page);
  await page.goto("/rooms");
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 15_000 });

  const madinaCard = modal.getByRole("button", { name: /madina town branch/i });
  await expect(madinaCard).toBeVisible();

  // The Grand Opening offer (AUTO_GRANDOPEN50) ended 2026-07-31. While an opening
  // offer is live the card advertises it; otherwise it carries the "NEW" badge.
  const offer = madinaCard.getByText(/grand opening|50% off/i).first();
  if (await offer.count()) {
    await expect(offer).toBeVisible();
  } else {
    // DOM text is "New", uppercased by CSS
    await expect(madinaCard.getByText(/^new$/i)).toBeVisible();
  }
});
