# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.ts >> all touch targets in navbar are adequately sized
- Location: e2e\mobile.spec.ts:54:5

# Error details

```
TimeoutError: locator.boundingBox: Timeout 30000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /toggle menu|menu/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - img [ref=e5]
    - paragraph [ref=e7]: Something Went Wrong
    - heading "Unexpected Error" [level=1] [ref=e8]
    - paragraph [ref=e9]: We encountered an unexpected issue. Please try again, or contact us if the problem persists.
    - generic [ref=e10]:
      - button "Try Again" [ref=e11] [cursor=pointer]:
        - img [ref=e12]
        - text: Try Again
      - link "Go Home" [ref=e17] [cursor=pointer]:
        - /url: /
        - img [ref=e18]
        - text: Go Home
  - region "Notifications alt+T"
  - alert [ref=e21]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { setStoredBranch, clearStoredBranch } from "./helpers";
  3  | 
  4  | // Mobile viewport — override only geometry, not browser engine (keeps Chromium)
  5  | test.use({
  6  |   viewport:        { width: 390, height: 844 },
  7  |   deviceScaleFactor: 3,
  8  |   isMobile:        true,
  9  |   hasTouch:        true,
  10 | });
  11 | 
  12 | test("homepage is usable on mobile", async ({ page }) => {
  13 |   await setStoredBranch(page, "branch-chakwal");
  14 |   await page.goto("/");
  15 |   // Hamburger menu should be visible
  16 |   await expect(page.getByRole("button", { name: /toggle menu|menu/i })).toBeVisible();
  17 |   // Hero CTA should be reachable
  18 |   await expect(page.getByRole("link", { name: /book now/i }).first()).toBeVisible();
  19 | });
  20 | 
  21 | test("mobile menu opens and closes", async ({ page }) => {
  22 |   await setStoredBranch(page, "branch-chakwal");
  23 |   await page.goto("/");
  24 |   const menuBtn = page.getByRole("button", { name: /toggle menu|menu/i });
  25 |   await menuBtn.click();
  26 |   // The mobile nav menu contains a Rooms link — use exact match to avoid other page links
  27 |   const mobileRoomsLink = page.locator('a[href="/rooms"]').first();
  28 |   await expect(mobileRoomsLink).toBeVisible();
  29 |   await menuBtn.click();
  30 |   await expect(mobileRoomsLink).not.toBeVisible({ timeout: 2_000 });
  31 | });
  32 | 
  33 | test("branch selector modal is usable on mobile", async ({ page }) => {
  34 |   await clearStoredBranch(page);
  35 |   await page.goto("/rooms");  // /rooms uses (public) layout with BranchProvider
  36 |   const modal = page.getByRole("dialog");
  37 |   await expect(modal).toBeVisible({ timeout: 3_000 });
  38 |   // Both cards should be visible (stacked vertically)
  39 |   await expect(modal.getByText("Main Branch")).toBeVisible();
  40 |   await expect(modal.getByText("Madina Town Branch")).toBeVisible();
  41 |   // Select button should be tappable (≥44px)
  42 |   const btn = modal.getByRole("button", { name: /select this branch/i }).first();
  43 |   const box = await btn.boundingBox();
  44 |   if (box) expect(box.height).toBeGreaterThanOrEqual(40); // practical minimum
  45 | });
  46 | 
  47 | test("booking form is usable on mobile", async ({ page }) => {
  48 |   await setStoredBranch(page, "branch-chakwal");
  49 |   await page.goto("/book");
  50 |   await expect(page.getByLabel(/check.in/i).first()).toBeVisible();
  51 |   await expect(page.getByLabel(/check.out/i).first()).toBeVisible();
  52 | });
  53 | 
  54 | test("all touch targets in navbar are adequately sized", async ({ page }) => {
  55 |   await setStoredBranch(page, "branch-chakwal");
  56 |   await page.goto("/");
  57 |   const menuBtn = page.getByRole("button", { name: /toggle menu|menu/i });
> 58 |   const box = await menuBtn.boundingBox();
     |                             ^ TimeoutError: locator.boundingBox: Timeout 30000ms exceeded.
  59 |   if (box) {
  60 |     expect(box.width).toBeGreaterThanOrEqual(40);
  61 |     expect(box.height).toBeGreaterThanOrEqual(40);
  62 |   }
  63 | });
  64 | 
```