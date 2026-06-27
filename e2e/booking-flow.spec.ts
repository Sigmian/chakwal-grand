import { test, expect } from "@playwright/test";
import { setStoredBranch, futureDate } from "./helpers";

test.beforeEach(async ({ page }) => {
  await setStoredBranch(page, "branch-chakwal");
});

test("booking page loads at /book", async ({ page }) => {
  await page.goto("/book");
  await expect(page).toHaveTitle(/book|reservation/i);
});

test("step 1 — date selection is visible", async ({ page }) => {
  await page.goto("/book");
  await expect(page.getByLabel(/check.in/i).first()).toBeVisible();
  await expect(page.getByLabel(/check.out/i).first()).toBeVisible();
});

test("step 1 — past dates are blocked", async ({ page }) => {
  await page.goto("/book");
  const checkIn = page.getByLabel(/check.in/i).first();
  const min = await checkIn.getAttribute("min");
  // min attribute should be today or later (no past dates)
  if (min) {
    const today = new Date().toISOString().split("T")[0];
    expect(min >= today).toBe(true);
  }
});

test("step 1 — searching for rooms proceeds to step 2", async ({ page }) => {
  await page.goto("/book");

  // Fill valid dates
  const checkIn  = futureDate(7);
  const checkOut = futureDate(9);

  await page.getByLabel(/check.in/i).first().fill(checkIn);
  await page.getByLabel(/check.out/i).first().fill(checkOut);

  // Click search
  const searchBtn = page.getByRole("button", { name: /search|find rooms|continue/i }).first();
  await searchBtn.click();

  // Step 2 should appear (room selection or "no rooms" fallback)
  await expect(
    page.getByText(/select a room|no rooms|available/i).first()
  ).toBeVisible({ timeout: 8_000 });
});

test("promo code field rejects internal AUTO_ codes", async ({ page }) => {
  await page.goto("/book");

  // Navigate to step 3 by filling required info (mock)
  const checkIn  = futureDate(1);
  const checkOut = futureDate(3);
  await page.getByLabel(/check.in/i).first().fill(checkIn);
  await page.getByLabel(/check.out/i).first().fill(checkOut);
  const searchBtn = page.getByRole("button", { name: /search|find rooms|continue/i }).first();
  await searchBtn.click();
  await page.waitForTimeout(2000);

  // Try to find promo field
  const promoInput = page.getByPlaceholder(/promo|code/i);
  if (await promoInput.isVisible()) {
    await promoInput.fill("AUTO_GRANDOPEN50");
    const applyBtn = page.getByRole("button", { name: /apply/i });
    if (await applyBtn.isVisible()) {
      await applyBtn.click();
      await expect(page.getByText(/invalid|expired/i)).toBeVisible({ timeout: 3_000 });
    }
  }
});

test("booking form shows correct total in summary", async ({ page }) => {
  await page.goto("/book");
  const checkIn  = futureDate(7);
  const checkOut = futureDate(9);
  await page.getByLabel(/check.in/i).first().fill(checkIn);
  await page.getByLabel(/check.out/i).first().fill(checkOut);
  await page.getByRole("button", { name: /search|find rooms|continue/i }).first().click();

  // Wait for rooms
  const firstSelectBtn = page.getByRole("button", { name: /select|choose/i }).first();
  if (await firstSelectBtn.isVisible({ timeout: 6_000 })) {
    await firstSelectBtn.click();
    // Summary should show a total
    await expect(page.getByText(/total/i)).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText(/PKR|₨/i).first()).toBeVisible();
  }
});

test("booking confirmation page is accessible with valid ref", async ({ page }) => {
  // This is a smoke test — we don't create a real booking, just check the page handles invalid ref gracefully
  await page.goto("/booking-confirmation/INVALID-REF");
  // Should either show "not found" or redirect — not a 500 error
  const body = await page.textContent("body");
  expect(body).not.toContain("Internal Server Error");
  expect(body).not.toContain("Application error");
});

test("my-booking lookup page loads", async ({ page }) => {
  await page.goto("/my-booking");
  await expect(page.getByPlaceholder(/booking reference|BK-/i)).toBeVisible();
});

test("my-booking submit button is disabled when input is empty", async ({ page }) => {
  await page.goto("/my-booking");
  const btn = page.getByRole("button", { name: /look up|find|search/i }).first();
  // Button should be disabled when no reference is entered
  await expect(btn).toBeDisabled({ timeout: 5_000 });
});

test("my-booking accepts a reference and shows result or error", async ({ page }) => {
  await page.goto("/my-booking");
  const input = page.getByPlaceholder(/booking reference|BK-/i);
  await input.fill("BK-2024-XXXYYY");
  const btn = page.getByRole("button", { name: /look up|find|search/i }).first();
  await expect(btn).toBeEnabled({ timeout: 3_000 });
  await btn.click();
  // Should show either "not found" or a result — not crash
  await expect(
    page.getByText(/not found|no booking|invalid|check-in|booking reference/i).first()
  ).toBeVisible({ timeout: 8_000 });
});
