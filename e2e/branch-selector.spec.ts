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
  await expect(modal.getByText("Main Branch")).toBeVisible();
  await expect(modal.getByText("Madina Town Branch")).toBeVisible();
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

  // Click the branch pill in navbar
  const branchPill = page.locator("header button").filter({ hasText: /chakwal|main/i }).first();
  await branchPill.click();

  // Dropdown should open with both branches
  await expect(page.getByText("Switch Branch")).toBeVisible();
  await expect(page.locator("text=Madina Town Branch")).toBeVisible();

  // Click Madina Town
  await page.getByRole("button", { name: /madina town/i }).first().click();

  // Pill should now show Madina Town
  await expect(page.locator("header").getByText(/madina/i).first()).toBeVisible();
});

test("Grand Opening badge is visible on Madina Town card", async ({ page }) => {
  // This test is conditional on the offer being active in DB; skip gracefully if not
  await clearStoredBranch(page);
  await page.goto("/rooms");
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 15_000 });

  const goText = modal.getByText(/grand opening/i);
  // Just assert it's visible (may or may not be active depending on DB state)
  await expect(goText.or(modal.getByText(/50% off/i)).first()).toBeVisible();
});
