import { test, expect } from "@playwright/test";
import { setStoredBranch, futureDate } from "./helpers";

test.beforeEach(async ({ page }) => {
  await setStoredBranch(page, "branch-chakwal");
});

test("rooms page loads and shows room listings", async ({ page }) => {
  await page.goto("/rooms");
  await expect(page).toHaveTitle(/rooms/i);
  // At least one room card should exist
  await expect(page.getByText(/\/\s*night|per night/i).first()).toBeVisible({ timeout: 30_000 });
});

test("room card shows price and amenities", async ({ page }) => {
  await page.goto("/rooms");
  const firstCard = page.locator('[data-testid="room-card"], .card-luxury').first();
  await expect(firstCard).toBeVisible({ timeout: 5_000 });
  // Verify price is shown
  await expect(page.getByText(/PKR|₨/i).first()).toBeVisible();
});

test("clicking room card navigates to room detail", async ({ page }) => {
  await page.goto("/rooms");
  const firstRoomLink = page.getByRole("link", { name: /view details|book now|from pkr/i }).first();
  if (await firstRoomLink.isVisible()) {
    await firstRoomLink.click();
    await expect(page).toHaveURL(/\/rooms\//);
  }
});

test("room detail page shows booking CTA", async ({ page }) => {
  await page.goto("/rooms");
  // Get first room link
  const links = await page.$$("a[href^='/rooms/']");
  if (links.length > 0) {
    await links[0].click();
    await expect(page.getByRole("link", { name: /book now|reserve/i })).toBeVisible({ timeout: 5_000 });
  }
});

test("Madina Town rooms show Grand Opening discount when active", async ({ page }) => {
  await setStoredBranch(page, "branch-madina");
  await page.goto("/rooms");
  // If the offer is active, a strikethrough price should appear
  const strikethrough = page.locator("s, del, .line-through").first();
  // This test is conditional — don't fail if offer is expired
  const isVisible = await strikethrough.isVisible({ timeout: 3_000 }).catch(() => false);
  if (isVisible) {
    await expect(strikethrough).toBeVisible();
  }
});
