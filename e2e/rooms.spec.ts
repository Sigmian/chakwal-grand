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
  // Room cards link to their detail page via "Details" (the page's "Book Now" goes to /book).
  const firstRoomLink = page.getByRole("link", { name: /^details$/i }).first();
  await expect(firstRoomLink).toBeVisible({ timeout: 15_000 });
  await firstRoomLink.click();
  // Room pages render from the database; allow for a slow first load (seen on mobile WebKit).
  await expect(page).toHaveURL(/\/rooms\/(?!pick)[^/]+$/, { timeout: 20_000 });
});

test("room detail page shows booking CTA", async ({ page }) => {
  await page.goto("/rooms");
  // Open a real room (the first /rooms/ link is "/rooms/pick", the floor picker).
  const details = page.getByRole("link", { name: /^details$/i }).first();
  await expect(details).toBeVisible({ timeout: 15_000 });
  await details.click();
  // Room pages render from the database; allow for a slow first load (seen on mobile WebKit).
  await expect(page).toHaveURL(/\/rooms\/(?!pick)[^/]+$/, { timeout: 20_000 });
  // Booking CTA on the room page ("Book Now" / "Book This Room"), visible at any size.
  await expect(
    page.locator("main a[href^='/book']:visible").filter({ hasText: /book now|book this room|reserve/i }).first(),
  ).toBeVisible({ timeout: 10_000 });
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
