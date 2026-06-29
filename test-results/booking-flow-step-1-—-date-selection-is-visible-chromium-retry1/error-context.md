# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking-flow.spec.ts >> step 1 — date selection is visible
- Location: e2e\booking-flow.spec.ts:13:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByLabel(/check.in/i).first()
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByLabel(/check.in/i).first()

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
  1   | import { test, expect } from "@playwright/test";
  2   | import { setStoredBranch, futureDate } from "./helpers";
  3   | 
  4   | test.beforeEach(async ({ page }) => {
  5   |   await setStoredBranch(page, "branch-chakwal");
  6   | });
  7   | 
  8   | test("booking page loads at /book", async ({ page }) => {
  9   |   await page.goto("/book");
  10  |   await expect(page).toHaveTitle(/book|reservation/i);
  11  | });
  12  | 
  13  | test("step 1 — date selection is visible", async ({ page }) => {
  14  |   await page.goto("/book");
> 15  |   await expect(page.getByLabel(/check.in/i).first()).toBeVisible();
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  16  |   await expect(page.getByLabel(/check.out/i).first()).toBeVisible();
  17  | });
  18  | 
  19  | test("step 1 — past dates are blocked", async ({ page }) => {
  20  |   await page.goto("/book");
  21  |   const checkIn = page.getByLabel(/check.in/i).first();
  22  |   const min = await checkIn.getAttribute("min");
  23  |   // min attribute should be today or later (no past dates)
  24  |   if (min) {
  25  |     const today = new Date().toISOString().split("T")[0];
  26  |     expect(min >= today).toBe(true);
  27  |   }
  28  | });
  29  | 
  30  | test("step 1 — searching for rooms proceeds to step 2", async ({ page }) => {
  31  |   await page.goto("/book");
  32  | 
  33  |   // Fill valid dates
  34  |   const checkIn  = futureDate(7);
  35  |   const checkOut = futureDate(9);
  36  | 
  37  |   await page.getByLabel(/check.in/i).first().fill(checkIn);
  38  |   await page.getByLabel(/check.out/i).first().fill(checkOut);
  39  | 
  40  |   // Click search
  41  |   const searchBtn = page.getByRole("button", { name: /search|find rooms|continue/i }).first();
  42  |   await searchBtn.click();
  43  | 
  44  |   // Step 2 should appear (room selection or "no rooms" fallback)
  45  |   await expect(
  46  |     page.getByText(/select a room|no rooms|available/i).first()
  47  |   ).toBeVisible({ timeout: 8_000 });
  48  | });
  49  | 
  50  | test("promo code field rejects internal AUTO_ codes", async ({ page }) => {
  51  |   await page.goto("/book");
  52  | 
  53  |   // Navigate to step 3 by filling required info (mock)
  54  |   const checkIn  = futureDate(1);
  55  |   const checkOut = futureDate(3);
  56  |   await page.getByLabel(/check.in/i).first().fill(checkIn);
  57  |   await page.getByLabel(/check.out/i).first().fill(checkOut);
  58  |   const searchBtn = page.getByRole("button", { name: /search|find rooms|continue/i }).first();
  59  |   await searchBtn.click();
  60  |   await page.waitForTimeout(2000);
  61  | 
  62  |   // Try to find promo field
  63  |   const promoInput = page.getByPlaceholder(/promo|code/i);
  64  |   if (await promoInput.isVisible()) {
  65  |     await promoInput.fill("AUTO_GRANDOPEN50");
  66  |     const applyBtn = page.getByRole("button", { name: /apply/i });
  67  |     if (await applyBtn.isVisible()) {
  68  |       await applyBtn.click();
  69  |       await expect(page.getByText(/invalid|expired/i)).toBeVisible({ timeout: 3_000 });
  70  |     }
  71  |   }
  72  | });
  73  | 
  74  | test("booking form shows correct total in summary", async ({ page }) => {
  75  |   await page.goto("/book");
  76  |   const checkIn  = futureDate(7);
  77  |   const checkOut = futureDate(9);
  78  |   await page.getByLabel(/check.in/i).first().fill(checkIn);
  79  |   await page.getByLabel(/check.out/i).first().fill(checkOut);
  80  |   await page.getByRole("button", { name: /search|find rooms|continue/i }).first().click();
  81  | 
  82  |   // Wait for rooms
  83  |   const firstSelectBtn = page.getByRole("button", { name: /select|choose/i }).first();
  84  |   if (await firstSelectBtn.isVisible({ timeout: 6_000 })) {
  85  |     await firstSelectBtn.click();
  86  |     // Summary should show a total
  87  |     await expect(page.getByText(/total/i)).toBeVisible({ timeout: 3_000 });
  88  |     await expect(page.getByText(/PKR|₨/i).first()).toBeVisible();
  89  |   }
  90  | });
  91  | 
  92  | test("booking confirmation page is accessible with valid ref", async ({ page }) => {
  93  |   // This is a smoke test — we don't create a real booking, just check the page handles invalid ref gracefully
  94  |   await page.goto("/booking-confirmation/INVALID-REF");
  95  |   // Should either show "not found" or redirect — not a 500 error
  96  |   const body = await page.textContent("body");
  97  |   expect(body).not.toContain("Internal Server Error");
  98  |   expect(body).not.toContain("Application error");
  99  | });
  100 | 
  101 | test("my-booking lookup page loads", async ({ page }) => {
  102 |   await page.goto("/my-booking");
  103 |   await expect(page.getByPlaceholder(/booking reference|BK-/i)).toBeVisible();
  104 | });
  105 | 
  106 | test("my-booking submit button is disabled when input is empty", async ({ page }) => {
  107 |   await page.goto("/my-booking");
  108 |   const btn = page.getByRole("button", { name: /look up|find|search/i }).first();
  109 |   // Button should be disabled when no reference is entered
  110 |   await expect(btn).toBeDisabled({ timeout: 5_000 });
  111 | });
  112 | 
  113 | test("my-booking accepts a reference and shows result or error", async ({ page }) => {
  114 |   await page.goto("/my-booking");
  115 |   const input = page.getByPlaceholder(/booking reference|BK-/i);
```