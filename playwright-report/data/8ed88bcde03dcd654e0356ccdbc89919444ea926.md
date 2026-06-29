# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking-flow.spec.ts >> step 1 — searching for rooms proceeds to step 2
- Location: e2e\booking-flow.spec.ts:30:5

# Error details

```
TimeoutError: locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for getByLabel(/check.in/i).first()

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
  15  |   await expect(page.getByLabel(/check.in/i).first()).toBeVisible();
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
> 37  |   await page.getByLabel(/check.in/i).first().fill(checkIn);
      |                                              ^ TimeoutError: locator.fill: Timeout 30000ms exceeded.
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
  116 |   await input.fill("BK-2024-XXXYYY");
  117 |   const btn = page.getByRole("button", { name: /look up|find|search/i }).first();
  118 |   await expect(btn).toBeEnabled({ timeout: 3_000 });
  119 |   await btn.click();
  120 |   // Should show either "not found" or a result — not crash
  121 |   await expect(
  122 |     page.getByText(/not found|no booking|invalid|check-in|booking reference/i).first()
  123 |   ).toBeVisible({ timeout: 8_000 });
  124 | });
  125 | 
```