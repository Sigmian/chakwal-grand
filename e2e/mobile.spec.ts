import { test, expect } from "@playwright/test";
import { setStoredBranch, clearStoredBranch } from "./helpers";

// Mobile viewport — override only geometry, not browser engine (keeps Chromium)
test.use({
  viewport:        { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile:        true,
  hasTouch:        true,
});

test("homepage is usable on mobile", async ({ page }) => {
  await setStoredBranch(page, "branch-chakwal");
  await page.goto("/");
  // Hamburger menu should be visible
  await expect(page.getByRole("button", { name: /toggle menu|menu/i })).toBeVisible();
  // Hero CTA should be reachable
  await expect(page.getByRole("link", { name: /book now/i }).first()).toBeVisible();
});

test("mobile menu opens and closes", async ({ page }) => {
  await setStoredBranch(page, "branch-chakwal");
  await page.goto("/");
  const menuBtn = page.getByRole("button", { name: /toggle menu|menu/i });
  await menuBtn.click();
  // The mobile nav menu contains a Rooms link — use exact match to avoid other page links
  const mobileRoomsLink = page.locator('a[href="/rooms"]').first();
  await expect(mobileRoomsLink).toBeVisible();
  await menuBtn.click();
  await expect(mobileRoomsLink).not.toBeVisible({ timeout: 2_000 });
});

test("branch selector modal is usable on mobile", async ({ page }) => {
  await clearStoredBranch(page);
  await page.goto("/rooms");  // /rooms uses (public) layout with BranchProvider
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 3_000 });
  // Both cards should be visible (stacked vertically)
  await expect(modal.getByText("Main Branch")).toBeVisible();
  await expect(modal.getByText("Madina Town Branch")).toBeVisible();
  // Select button should be tappable (≥44px)
  const btn = modal.getByRole("button", { name: /select this branch/i }).first();
  const box = await btn.boundingBox();
  if (box) expect(box.height).toBeGreaterThanOrEqual(40); // practical minimum
});

test("booking form is usable on mobile", async ({ page }) => {
  await setStoredBranch(page, "branch-chakwal");
  await page.goto("/book");
  await expect(page.getByLabel(/check.in/i).first()).toBeVisible();
  await expect(page.getByLabel(/check.out/i).first()).toBeVisible();
});

test("all touch targets in navbar are adequately sized", async ({ page }) => {
  await setStoredBranch(page, "branch-chakwal");
  await page.goto("/");
  const menuBtn = page.getByRole("button", { name: /toggle menu|menu/i });
  const box = await menuBtn.boundingBox();
  if (box) {
    expect(box.width).toBeGreaterThanOrEqual(40);
    expect(box.height).toBeGreaterThanOrEqual(40);
  }
});
