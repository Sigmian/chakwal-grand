# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: rooms.spec.ts >> rooms page loads and shows room listings
- Location: e2e\rooms.spec.ts:8:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/\/\s*night|per night/i).first()
Expected: visible
Timeout: 30000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 30000ms
  - waiting for getByText(/\/\s*night|per night/i).first()

```

```yaml
- img
- paragraph: Something Went Wrong
- heading "Unexpected Error" [level=1]
- paragraph: We encountered an unexpected issue. Please try again, or contact us if the problem persists.
- button "Try Again":
  - img
  - text: Try Again
- link "Go Home":
  - /url: /
  - img
  - text: Go Home
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { setStoredBranch, futureDate } from "./helpers";
  3  | 
  4  | test.beforeEach(async ({ page }) => {
  5  |   await setStoredBranch(page, "branch-chakwal");
  6  | });
  7  | 
  8  | test("rooms page loads and shows room listings", async ({ page }) => {
  9  |   await page.goto("/rooms");
  10 |   await expect(page).toHaveTitle(/rooms/i);
  11 |   // At least one room card should exist
> 12 |   await expect(page.getByText(/\/\s*night|per night/i).first()).toBeVisible({ timeout: 30_000 });
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  13 | });
  14 | 
  15 | test("room card shows price and amenities", async ({ page }) => {
  16 |   await page.goto("/rooms");
  17 |   const firstCard = page.locator('[data-testid="room-card"], .card-luxury').first();
  18 |   await expect(firstCard).toBeVisible({ timeout: 5_000 });
  19 |   // Verify price is shown
  20 |   await expect(page.getByText(/PKR|₨/i).first()).toBeVisible();
  21 | });
  22 | 
  23 | test("clicking room card navigates to room detail", async ({ page }) => {
  24 |   await page.goto("/rooms");
  25 |   const firstRoomLink = page.getByRole("link", { name: /view details|book now|from pkr/i }).first();
  26 |   if (await firstRoomLink.isVisible()) {
  27 |     await firstRoomLink.click();
  28 |     await expect(page).toHaveURL(/\/rooms\//);
  29 |   }
  30 | });
  31 | 
  32 | test("room detail page shows booking CTA", async ({ page }) => {
  33 |   await page.goto("/rooms");
  34 |   // Get first room link
  35 |   const links = await page.$$("a[href^='/rooms/']");
  36 |   if (links.length > 0) {
  37 |     await links[0].click();
  38 |     await expect(page.getByRole("link", { name: /book now|reserve/i })).toBeVisible({ timeout: 5_000 });
  39 |   }
  40 | });
  41 | 
  42 | test("Madina Town rooms show Grand Opening discount when active", async ({ page }) => {
  43 |   await setStoredBranch(page, "branch-madina");
  44 |   await page.goto("/rooms");
  45 |   // If the offer is active, a strikethrough price should appear
  46 |   const strikethrough = page.locator("s, del, .line-through").first();
  47 |   // This test is conditional — don't fail if offer is expired
  48 |   const isVisible = await strikethrough.isVisible({ timeout: 3_000 }).catch(() => false);
  49 |   if (isVisible) {
  50 |     await expect(strikethrough).toBeVisible();
  51 |   }
  52 | });
  53 | 
```