# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: branch-selector.spec.ts >> branch selector shows both branch cards
- Location: e2e\branch-selector.spec.ts:13:5

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
  1   | import { test, expect } from "@playwright/test";
  2   | import { clearStoredBranch, setStoredBranch } from "./helpers";
  3   | 
  4   | test("branch selector modal appears for new visitors", async ({ page }) => {
  5   |   await clearStoredBranch(page);
  6   |   await page.goto("/rooms");
  7   |   // Modal appears after 300ms delay — wait longer to account for server hydration
  8   |   const modal = page.getByRole("dialog");
  9   |   await expect(modal).toBeVisible({ timeout: 15_000 });
  10  |   await expect(modal.getByText("Choose Your Branch")).toBeVisible();
  11  | });
  12  | 
  13  | test("branch selector shows both branch cards", async ({ page }) => {
  14  |   await clearStoredBranch(page);
  15  |   await page.goto("/rooms");
  16  |   const modal = page.getByRole("dialog");
> 17  |   await expect(modal).toBeVisible({ timeout: 15_000 });
      |                       ^ Error: expect(locator).toBeVisible() failed
  18  |   await expect(modal.getByText("Main Branch")).toBeVisible();
  19  |   await expect(modal.getByText("Madina Town Branch")).toBeVisible();
  20  | });
  21  | 
  22  | test("selecting a branch closes modal and shows branch in navbar", async ({ page }) => {
  23  |   await clearStoredBranch(page);
  24  |   await page.goto("/rooms");
  25  |   const modal = page.getByRole("dialog");
  26  |   await expect(modal).toBeVisible({ timeout: 15_000 });
  27  | 
  28  |   // Click the first "Select This Branch" button (Main Branch)
  29  |   await modal.getByRole("button", { name: /select this branch/i }).first().click();
  30  | 
  31  |   // Modal should close
  32  |   await expect(modal).not.toBeVisible({ timeout: 2_000 });
  33  | 
  34  |   // Branch pill should appear in navbar
  35  |   await expect(page.locator("header").getByText(/main branch|chakwal/i).first()).toBeVisible();
  36  | });
  37  | 
  38  | test("ESC key closes modal and defaults to main branch", async ({ page }) => {
  39  |   await clearStoredBranch(page);
  40  |   await page.goto("/rooms");
  41  |   const modal = page.getByRole("dialog");
  42  |   await expect(modal).toBeVisible({ timeout: 15_000 });
  43  | 
  44  |   await page.keyboard.press("Escape");
  45  |   await expect(modal).not.toBeVisible({ timeout: 2_000 });
  46  | });
  47  | 
  48  | test("backdrop click closes modal", async ({ page }) => {
  49  |   await clearStoredBranch(page);
  50  |   await page.goto("/rooms");
  51  |   const modal = page.getByRole("dialog");
  52  |   await expect(modal).toBeVisible({ timeout: 15_000 });
  53  | 
  54  |   // Click in the top-left corner (definitely outside the inner modal card)
  55  |   await page.mouse.click(10, 10);
  56  |   await expect(modal).not.toBeVisible({ timeout: 2_000 });
  57  | });
  58  | 
  59  | test("branch preference is remembered after page refresh", async ({ page }) => {
  60  |   await clearStoredBranch(page);
  61  |   await page.goto("/rooms");
  62  |   const modal = page.getByRole("dialog");
  63  |   await expect(modal).toBeVisible({ timeout: 15_000 });
  64  | 
  65  |   // Ensure "Remember my choice" is checked, then select
  66  |   const checkbox = modal.getByRole("checkbox", { name: /remember/i });
  67  |   if (!await checkbox.isChecked()) await checkbox.check();
  68  |   await modal.getByRole("button", { name: /select this branch/i }).first().click();
  69  |   await expect(modal).not.toBeVisible({ timeout: 2_000 });
  70  | 
  71  |   // Reload — modal should NOT appear again
  72  |   await page.reload();
  73  |   await page.waitForTimeout(600); // wait longer than the 300ms delay
  74  |   await expect(modal).not.toBeVisible();
  75  | });
  76  | 
  77  | test("branch can be switched from navbar dropdown", async ({ page }) => {
  78  |   await setStoredBranch(page, "branch-chakwal");
  79  |   await page.goto("/rooms");
  80  | 
  81  |   // Click the branch pill in navbar
  82  |   const branchPill = page.locator("header button").filter({ hasText: /chakwal|main/i }).first();
  83  |   await branchPill.click();
  84  | 
  85  |   // Dropdown should open with both branches
  86  |   await expect(page.getByText("Switch Branch")).toBeVisible();
  87  |   await expect(page.locator("text=Madina Town Branch")).toBeVisible();
  88  | 
  89  |   // Click Madina Town
  90  |   await page.getByRole("button", { name: /madina town/i }).first().click();
  91  | 
  92  |   // Pill should now show Madina Town
  93  |   await expect(page.locator("header").getByText(/madina/i).first()).toBeVisible();
  94  | });
  95  | 
  96  | test("Grand Opening badge is visible on Madina Town card", async ({ page }) => {
  97  |   // This test is conditional on the offer being active in DB; skip gracefully if not
  98  |   await clearStoredBranch(page);
  99  |   await page.goto("/rooms");
  100 |   const modal = page.getByRole("dialog");
  101 |   await expect(modal).toBeVisible({ timeout: 15_000 });
  102 | 
  103 |   const goText = modal.getByText(/grand opening/i);
  104 |   // Just assert it's visible (may or may not be active depending on DB state)
  105 |   await expect(goText.or(modal.getByText(/50% off/i)).first()).toBeVisible();
  106 | });
  107 | 
```