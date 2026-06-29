# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: booking-flow.spec.ts >> promo code field rejects internal AUTO_ codes
- Location: e2e\booking-flow.spec.ts:50:5

# Error details

```
TimeoutError: locator.fill: Timeout 30000ms exceeded.
Call log:
  - waiting for getByLabel(/check.in/i).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - link "Skip to main content" [ref=e2] [cursor=pointer]:
    - /url: "#main-content"
  - generic [ref=e3]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - img [ref=e7]
        - generic [ref=e10]: Offer
      - generic [ref=e12]:
        - generic [ref=e13]: New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de
        - generic [ref=e14]: New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de
      - button "Dismiss announcement" [ref=e15] [cursor=pointer]:
        - img [ref=e16]
    - banner [ref=e19]:
      - navigation [ref=e20]:
        - generic [ref=e21]:
          - link "Chakwal Guest House Chakwal Guest House" [ref=e22] [cursor=pointer]:
            - /url: /
            - img "Chakwal Guest House" [ref=e23]
            - generic [ref=e24]:
              - paragraph [ref=e25]: Chakwal
              - paragraph [ref=e26]: Guest House
          - generic [ref=e27]:
            - link "Home" [ref=e28] [cursor=pointer]:
              - /url: /
            - link "Rooms" [ref=e29] [cursor=pointer]:
              - /url: /rooms
            - link "Gallery" [ref=e30] [cursor=pointer]:
              - /url: /gallery
            - link "Blog" [ref=e31] [cursor=pointer]:
              - /url: /blog
            - link "About" [ref=e32] [cursor=pointer]:
              - /url: /about
            - link "Location" [ref=e33] [cursor=pointer]:
              - /url: /location
            - link "Contact" [ref=e34] [cursor=pointer]:
              - /url: /contact
            - link "My Booking" [ref=e35] [cursor=pointer]:
              - /url: /my-booking
            - link "My Stay" [ref=e36] [cursor=pointer]:
              - /url: /guest/login
          - generic [ref=e37]:
            - link "0334-7742767" [ref=e39] [cursor=pointer]:
              - /url: tel:+923347742767
              - img [ref=e40]
              - generic [ref=e42]: 0334-7742767
            - link "Book Now" [ref=e43] [cursor=pointer]:
              - /url: /book
  - main [ref=e44]:
    - generic [ref=e46]:
      - generic [ref=e47]:
        - paragraph [ref=e48]: Online Booking
        - heading "Book Your Room" [level=1] [ref=e49]
        - paragraph [ref=e50]: Check availability, choose your room, and confirm instantly — no payment required online.
      - generic [ref=e51]:
        - generic [ref=e52]:
          - img [ref=e54]
          - paragraph [ref=e57]: Free cancellation
          - paragraph [ref=e58]: 24h before check-in
        - generic [ref=e59]:
          - img [ref=e61]
          - paragraph [ref=e64]: Pay on arrival
          - paragraph [ref=e65]: No card required
        - generic [ref=e66]:
          - img [ref=e68]
          - paragraph [ref=e72]: Instant confirmation
          - paragraph [ref=e73]: Via call / WhatsApp
        - generic [ref=e74]:
          - img [ref=e76]
          - paragraph [ref=e79]: Best price
          - paragraph [ref=e80]: Direct booking rate
      - img [ref=e82]
  - contentinfo [ref=e84]:
    - generic [ref=e85]:
      - generic [ref=e86]:
        - generic [ref=e87]:
          - generic [ref=e88]:
            - generic [ref=e90]: CGH
            - generic [ref=e91]:
              - paragraph [ref=e92]: Chakwal
              - paragraph [ref=e93]: Guest House
          - paragraph [ref=e94]: Stay Comfortably. Feel at Home.
          - paragraph [ref=e95]: Clean, comfortable and affordable rooms in Chakwal with modern facilities and 24/7 support.
          - generic [ref=e96]:
            - link "WhatsApp" [ref=e97] [cursor=pointer]:
              - /url: https://wa.me/923347742767
              - img [ref=e98]
            - link "Facebook" [ref=e100] [cursor=pointer]:
              - /url: https://www.facebook.com/chakwal.guest
              - img [ref=e101]
            - link "Google Reviews" [ref=e103] [cursor=pointer]:
              - /url: https://share.google/CX27VxrfpI4QQGCTx
              - img [ref=e104]
            - link "Call" [ref=e106] [cursor=pointer]:
              - /url: tel:+923347742767
              - img [ref=e107]
        - generic [ref=e109]:
          - heading "Quick Links" [level=4] [ref=e110]
          - list [ref=e111]:
            - listitem [ref=e112]:
              - link "Home" [ref=e113] [cursor=pointer]:
                - /url: /
            - listitem [ref=e114]:
              - link "Our Rooms" [ref=e115] [cursor=pointer]:
                - /url: /rooms
            - listitem [ref=e116]:
              - link "Book a Room" [ref=e117] [cursor=pointer]:
                - /url: /book
            - listitem [ref=e118]:
              - link "My Booking" [ref=e119] [cursor=pointer]:
                - /url: /my-booking
            - listitem [ref=e120]:
              - link "About Us" [ref=e121] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e122]:
              - link "Contact Us" [ref=e123] [cursor=pointer]:
                - /url: /contact
            - listitem [ref=e124]:
              - link "Our Location" [ref=e125] [cursor=pointer]:
                - /url: /location
            - listitem [ref=e126]:
              - link "Travel Blog" [ref=e127] [cursor=pointer]:
                - /url: /blog
            - listitem [ref=e128]:
              - link "Guest Portal" [ref=e129] [cursor=pointer]:
                - /url: /guest/login
        - generic [ref=e130]:
          - heading "Room Types" [level=4] [ref=e131]
          - list [ref=e132]:
            - listitem [ref=e133]:
              - link "Classic Room — PKR 2,500/night" [ref=e134] [cursor=pointer]:
                - /url: /rooms
            - listitem [ref=e135]:
              - link "Family Room — PKR 2,500/night" [ref=e136] [cursor=pointer]:
                - /url: /rooms
            - listitem [ref=e137]:
              - link "Executive Room — PKR 3,000/night" [ref=e138] [cursor=pointer]:
                - /url: /rooms
            - listitem [ref=e139]:
              - link "Apartment Suite — PKR 3,200/night" [ref=e140] [cursor=pointer]:
                - /url: /rooms
        - generic [ref=e141]:
          - heading "Contact Us" [level=4] [ref=e142]
          - list [ref=e143]:
            - listitem [ref=e144]:
              - img [ref=e145]
              - generic [ref=e147]:
                - link "0334-7742767" [ref=e148] [cursor=pointer]:
                  - /url: tel:+923347742767
                - paragraph [ref=e149]: Call or WhatsApp
            - listitem [ref=e150]:
              - img [ref=e151]
              - paragraph [ref=e154]: Near District Courts, Talagang Road, Chakwal
            - listitem [ref=e155]:
              - img [ref=e156]
              - generic [ref=e159]:
                - paragraph [ref=e160]: 24/7 Available
                - paragraph [ref=e161]: "A/C timing: 12 hours daily"
            - listitem [ref=e162]:
              - img [ref=e163]
              - link "chakwalguesthouse@gmail.com" [ref=e166] [cursor=pointer]:
                - /url: mailto:chakwalguesthouse@gmail.com
      - generic [ref=e167]:
        - paragraph [ref=e168]: © 2026 Chakwal Guest House. All Rights Reserved.
        - generic [ref=e169]:
          - link "Privacy Policy" [ref=e170] [cursor=pointer]:
            - /url: /privacy-policy
          - link "Terms of Use" [ref=e171] [cursor=pointer]:
            - /url: /terms
          - generic [ref=e172]: Check-in 2:00 PM · Check-out 12:00 PM
  - button "Chat with us" [ref=e174] [cursor=pointer]:
    - img [ref=e175]
  - region "Notifications alt+T"
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
> 56  |   await page.getByLabel(/check.in/i).first().fill(checkIn);
      |                                              ^ TimeoutError: locator.fill: Timeout 30000ms exceeded.
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