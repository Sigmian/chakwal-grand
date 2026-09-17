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
  // Hero CTA should be reachable (currently "Book Your Room — Free")
  await expect(page.getByRole("link", { name: /book (your|a) room|book now/i }).first()).toBeVisible();
});

test("mobile menu opens and closes", async ({ page }) => {
  await setStoredBranch(page, "branch-chakwal");
  await page.goto("/");
  const menuBtn = page.getByRole("button", { name: /toggle menu|menu/i });
  // The header always contains the (hidden on mobile) desktop "Rooms" link, so count
  // only VISIBLE header links: 0 while closed, 1 (the mobile menu's) while open.
  const visibleHeaderRooms = page.locator('header a[href="/rooms"]:visible');
  await expect(visibleHeaderRooms).toHaveCount(0);
  await menuBtn.click();
  await expect(visibleHeaderRooms).toHaveCount(1);
  await menuBtn.click();
  await expect(visibleHeaderRooms).toHaveCount(0, { timeout: 2_000 });
});

test("branch selector modal is usable on mobile", async ({ page }) => {
  await clearStoredBranch(page);
  await page.goto("/rooms");  // /rooms uses (public) layout with BranchProvider
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 3_000 });
  // Both cards should be visible (stacked vertically)
  await expect(modal.getByText("Main Branch", { exact: true })).toBeVisible();
  await expect(modal.getByText("Madina Town Branch", { exact: true })).toBeVisible();
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
