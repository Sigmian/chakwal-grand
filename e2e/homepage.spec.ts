import { test, expect } from "@playwright/test";
import { setStoredBranch, openMobileMenuIfPresent } from "./helpers";

test.beforeEach(async ({ page }) => {
  await setStoredBranch(page, "branch-chakwal");
});

test("homepage loads and shows hero", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Chakwal Guest House/i);
  // Desktop navbar says "Book Now"; the hero CTA (all sizes) says "Book Your Room — Free".
  await expect(page.locator("a[href='/book']:visible").filter({ hasText: /book now|book your room|book a room/i }).first()).toBeVisible();
});

test("navigation links are present", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openMobileMenuIfPresent(page);
  const nav = page.getByRole("navigation");
  await expect(nav.getByRole("link", { name: "Rooms" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Gallery" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Contact" })).toBeVisible();
});

test("skip to main content link is in the public layout", async ({ page }) => {
  // Skip link is in the (public) layout — test on /about which uses that layout
  await page.goto("/about", { waitUntil: "domcontentloaded" });
  const skipLink = page.locator('a[href="#main-content"]');
  await expect(skipLink).toBeAttached();
});

test("phone number in header links to tel:", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await openMobileMenuIfPresent(page);
  // The header renders both a desktop and a mobile phone link; one is hidden per layout.
  const phoneLink = page.locator('header a[href^="tel:"]:visible').first();
  await expect(phoneLink).toBeVisible();
});

test("rooms section renders featured rooms", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  // Wait for rooms to appear (server-rendered)
  await expect(page.getByText(/\/\s*night|per night/i).first()).toBeVisible({ timeout: 15_000 });
});

test("no console errors on homepage", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (msg) => { if (msg.type() === "error") errors.push(msg.text()); });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  expect(errors.filter(e => !e.includes("favicon"))).toHaveLength(0);
});
