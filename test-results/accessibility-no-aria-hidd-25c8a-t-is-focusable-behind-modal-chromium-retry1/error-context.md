# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.ts >> no aria-hidden content is focusable behind modal
- Location: e2e\accessibility.spec.ts:60:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('dialog')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByRole('dialog')

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
  2  | import { setStoredBranch, clearStoredBranch } from "./helpers";
  3  | 
  4  | const PUBLIC_PAGES = ["/", "/rooms", "/gallery", "/about", "/contact", "/book", "/my-booking"];
  5  | 
  6  | for (const path of PUBLIC_PAGES) {
  7  |   test(`${path} — has a page <title>`, async ({ page }) => {
  8  |     await setStoredBranch(page, "branch-chakwal");
  9  |     await page.goto(path, { waitUntil: "domcontentloaded" });
  10 |     const title = await page.title();
  11 |     expect(title.length).toBeGreaterThan(5);
  12 |     expect(title).toMatch(/chakwal/i);
  13 |   });
  14 | 
  15 |   test(`${path} — has a single h1`, async ({ page }) => {
  16 |     await setStoredBranch(page, "branch-chakwal");
  17 |     await page.goto(path, { waitUntil: "domcontentloaded" });
  18 |     const h1s = await page.$$("h1");
  19 |     expect(h1s.length).toBeGreaterThanOrEqual(1);
  20 |   });
  21 | 
  22 |   test(`${path} — all images have alt text`, async ({ page }) => {
  23 |     await setStoredBranch(page, "branch-chakwal");
  24 |     await page.goto(path, { waitUntil: "domcontentloaded" });
  25 |     const imgsWithoutAlt = await page.$$eval(
  26 |       "img:not([alt])",
  27 |       (imgs) => imgs.map((i) => (i as HTMLImageElement).src)
  28 |     );
  29 |     expect(imgsWithoutAlt).toHaveLength(0);
  30 |   });
  31 | }
  32 | 
  33 | test("branch modal is accessible via keyboard only", async ({ page }) => {
  34 |   await clearStoredBranch(page);
  35 |   await page.goto("/rooms");  // /rooms uses (public) layout with BranchProvider
  36 |   const modal = page.getByRole("dialog");
  37 |   await expect(modal).toBeVisible({ timeout: 15_000 });
  38 | 
  39 |   // Tab through all focusable elements, count them
  40 |   let tabs = 0;
  41 |   let focused = await page.evaluate(() => document.activeElement?.tagName);
  42 | 
  43 |   while (tabs < 20) {
  44 |     await page.keyboard.press("Tab");
  45 |     focused = await page.evaluate(() => document.activeElement?.tagName);
  46 |     tabs++;
  47 |     // If we reach the checkbox or a branch button we're inside the modal
  48 |     if (focused === "INPUT" || focused === "BUTTON") break;
  49 |   }
  50 | 
  51 |   // Focus should be trapped inside the modal (not escaped to body or html)
  52 |   const insideModal = await page.evaluate(() => {
  53 |     const modal = document.querySelector('[role="dialog"]');
  54 |     const active = document.activeElement;
  55 |     return modal?.contains(active) ?? false;
  56 |   });
  57 |   expect(insideModal).toBe(true);
  58 | });
  59 | 
  60 | test("no aria-hidden content is focusable behind modal", async ({ page }) => {
  61 |   await clearStoredBranch(page);
  62 |   await page.goto("/rooms");  // /rooms uses (public) layout with BranchProvider
  63 |   const modal = page.getByRole("dialog");
> 64 |   await expect(modal).toBeVisible({ timeout: 15_000 });
     |                       ^ Error: expect(locator).toBeVisible() failed
  65 | 
  66 |   // Verify modal has aria-modal=true (prevents background content access in modern screen readers)
  67 |   const ariaModal = await modal.getAttribute("aria-modal");
  68 |   expect(ariaModal).toBe("true");
  69 | });
  70 | 
```