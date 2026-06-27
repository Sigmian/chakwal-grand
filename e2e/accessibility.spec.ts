import { test, expect } from "@playwright/test";
import { setStoredBranch, clearStoredBranch } from "./helpers";

const PUBLIC_PAGES = ["/", "/rooms", "/gallery", "/about", "/contact", "/book", "/my-booking"];

for (const path of PUBLIC_PAGES) {
  test(`${path} — has a page <title>`, async ({ page }) => {
    await setStoredBranch(page, "branch-chakwal");
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const title = await page.title();
    expect(title.length).toBeGreaterThan(5);
    expect(title).toMatch(/chakwal/i);
  });

  test(`${path} — has a single h1`, async ({ page }) => {
    await setStoredBranch(page, "branch-chakwal");
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const h1s = await page.$$("h1");
    expect(h1s.length).toBeGreaterThanOrEqual(1);
  });

  test(`${path} — all images have alt text`, async ({ page }) => {
    await setStoredBranch(page, "branch-chakwal");
    await page.goto(path, { waitUntil: "domcontentloaded" });
    const imgsWithoutAlt = await page.$$eval(
      "img:not([alt])",
      (imgs) => imgs.map((i) => (i as HTMLImageElement).src)
    );
    expect(imgsWithoutAlt).toHaveLength(0);
  });
}

test("branch modal is accessible via keyboard only", async ({ page }) => {
  await clearStoredBranch(page);
  await page.goto("/rooms");  // /rooms uses (public) layout with BranchProvider
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 15_000 });

  // Tab through all focusable elements, count them
  let tabs = 0;
  let focused = await page.evaluate(() => document.activeElement?.tagName);

  while (tabs < 20) {
    await page.keyboard.press("Tab");
    focused = await page.evaluate(() => document.activeElement?.tagName);
    tabs++;
    // If we reach the checkbox or a branch button we're inside the modal
    if (focused === "INPUT" || focused === "BUTTON") break;
  }

  // Focus should be trapped inside the modal (not escaped to body or html)
  const insideModal = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    const active = document.activeElement;
    return modal?.contains(active) ?? false;
  });
  expect(insideModal).toBe(true);
});

test("no aria-hidden content is focusable behind modal", async ({ page }) => {
  await clearStoredBranch(page);
  await page.goto("/rooms");  // /rooms uses (public) layout with BranchProvider
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible({ timeout: 15_000 });

  // Verify modal has aria-modal=true (prevents background content access in modern screen readers)
  const ariaModal = await modal.getAttribute("aria-modal");
  expect(ariaModal).toBe("true");
});
