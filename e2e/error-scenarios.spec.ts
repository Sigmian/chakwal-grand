import { test, expect } from "@playwright/test";
import { setStoredBranch, futureDate } from "./helpers";

test.beforeEach(async ({ page }) => {
  await setStoredBranch(page, "branch-chakwal");
});

test("404 page renders gracefully", async ({ page }) => {
  await page.goto("/this-page-does-not-exist-at-all");
  // Should show a 404 page, not a 500 crash
  const body = await page.textContent("body");
  expect(body).not.toContain("Application error");
  expect(body).not.toContain("Internal Server Error");
});

test("booking with invalid promo code shows user-friendly error", async ({ page }) => {
  await page.goto("/book");
  const checkIn  = futureDate(3);
  const checkOut = futureDate(5);
  await page.getByLabel(/check.in/i).first().fill(checkIn);
  await page.getByLabel(/check.out/i).first().fill(checkOut);
  await page.getByRole("button", { name: /search|find rooms|continue/i }).first().click();
  await page.waitForTimeout(2000);

  const promoInput = page.getByPlaceholder(/promo|code/i);
  if (await promoInput.isVisible()) {
    await promoInput.fill("INVALID_CODE_XYZ");
    const applyBtn = page.getByRole("button", { name: /apply/i });
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      // Should show a human-readable error, not a JSON error or crash
      await expect(page.getByText(/invalid|expired|not found/i).first()).toBeVisible({ timeout: 3_000 });
      const errorText = await page.getByText(/invalid|expired|not found/i).first().textContent();
      // Error should NOT contain stack traces or technical info
      expect(errorText).not.toContain("prisma");
      expect(errorText).not.toContain("TypeError");
      expect(errorText).not.toContain("at Object.");
    }
  }
});

test("check-out before check-in is blocked", async ({ page }) => {
  await page.goto("/book");
  const tomorrow = futureDate(1);
  const today    = futureDate(0);
  await page.getByLabel(/check.in/i).first().fill(tomorrow);
  await page.getByLabel(/check.out/i).first().fill(today);
  const searchBtn = page.getByRole("button", { name: /search|find rooms|continue/i }).first();
  // Button should be disabled OR form should not advance
  const isDisabled = await searchBtn.isDisabled({ timeout: 2_000 }).catch(() => false);
  if (isDisabled) {
    // Button correctly disabled — validation is working
    return;
  }
  await searchBtn.click();
  // If button was enabled, form must NOT advance to step 2
  expect(page.url().includes("step=2")).toBe(false);
});

test("missing required guest fields show validation", async ({ page }) => {
  await page.goto("/book");
  const checkIn  = futureDate(7);
  const checkOut = futureDate(9);
  await page.getByLabel(/check.in/i).first().fill(checkIn);
  await page.getByLabel(/check.out/i).first().fill(checkOut);
  await page.getByRole("button", { name: /search|find rooms|continue/i }).first().click();
  await page.waitForTimeout(2000);

  // Skip room selection and try to submit booking immediately
  const submitBtn = page.getByRole("button", { name: /confirm booking|book now/i });
  if (await submitBtn.isVisible()) {
    await submitBtn.click();
    // Required field validation should prevent submission
    const nameField = page.getByLabel(/name/i).first();
    const validity = await nameField.evaluate((el: HTMLInputElement) => el.validationMessage);
    expect(validity.length).toBeGreaterThan(0);
  }
});
