import { test, expect } from "@playwright/test";
import { setStoredBranch } from "./helpers";

test.beforeEach(async ({ page }) => {
  await setStoredBranch(page, "branch-chakwal");
});

test("homepage loads and shows hero", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/Chakwal Guest House/i);
  await expect(page.getByRole("link", { name: /book now/i }).first()).toBeVisible();
});

test("navigation links are present", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
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
  const phoneLink = page.locator('a[href^="tel:"]').first();
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
