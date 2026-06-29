# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: accessibility.spec.ts >> branch modal is accessible via keyboard only
- Location: e2e\accessibility.spec.ts:33:5

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
- link "Skip to main content":
  - /url: "#main-content"
- img
- text: Offer New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de
- button "Dismiss announcement":
  - img
- banner:
  - navigation:
    - link "Chakwal Guest House Chakwal Guest House":
      - /url: /
      - img "Chakwal Guest House"
      - paragraph: Chakwal
      - paragraph: Guest House
    - link "Home":
      - /url: /
    - link "Rooms":
      - /url: /rooms
    - link "Gallery":
      - /url: /gallery
    - link "Blog":
      - /url: /blog
    - link "About":
      - /url: /about
    - link "Location":
      - /url: /location
    - link "Contact":
      - /url: /contact
    - link "My Booking":
      - /url: /my-booking
    - link "My Stay":
      - /url: /guest/login
    - link "0334-7742767":
      - /url: tel:+923347742767
      - img
      - text: 0334-7742767
    - link "Book Now":
      - /url: /book
- main:
  - paragraph: Our Accommodations
  - heading "Find Your Perfect Room" [level=1]
  - paragraph: From cozy classic rooms to spacious family suites — all with complimentary WiFi, hot water, and 24/7 service.
  - link "Choose Your Room by Floor":
    - /url: /rooms/pick
    - img
    - text: Choose Your Room by Floor
    - img
  - paragraph: or browse by category below · tick rooms to compare side-by-side
  - button "Filters":
    - img
    - text: Filters
  - paragraph: 12 rooms found
  - img
  - heading "Classic Rooms" [level=2]
  - img
  - text: 50% OFF available
  - paragraph: 5 rooms · from ₨1,750 / night
  - heading "Classic Room" [level=3]
  - paragraph: Room 203 · Chakwal, Chakwal
  - paragraph: ₨2,500
  - paragraph: / night
  - paragraph: Clean and cosy classic room on the second floor (right wing). Single bed, TV, and attached bathroom with hot water. Our most affordable option for solo travellers.
  - img
  - text: 2 adults
  - img
  - text: WiFi
  - img
  - text: TV
  - img
  - text: Hot Water
  - img
  - text: Attached Bathroom
  - link "Details":
    - /url: /rooms/cmqao4ylp000rgzz2njaqpzkm
  - link "Book →":
    - /url: /book?branchId=branch-chakwal&roomId=cmqao4ylp000rgzz2njaqpzkm
  - button "Compare":
    - img
    - text: Compare
  - img
  - text: Grand Opening — 50% OFF
  - button "View Standard Room gallery":
    - img "Standard room — Chakwal Guest House Madina Town"
    - img
    - text: 2 photos View Gallery
  - heading "Standard Room" [level=3]
  - paragraph: Room 302 · Chakwal Guest House – Madina Town Branch, Chakwal
  - paragraph: ₨3,500
  - paragraph: ₨1,750
  - paragraph: / night
  - paragraph: Comfortable ground floor standard room with attached bathroom and all daily amenities.
  - img
  - text: 2 adults + 1 child
  - img
  - text: Attached Bathroom
  - img
  - text: Daily Amenities
  - img
  - text: WiFi
  - img
  - text: AC
  - img
  - text: Hot Water
  - img
  - text: TV
  - link "Details":
    - /url: /rooms/room-madina-302
  - link "Book →":
    - /url: /book?branchId=branch-madina&roomId=room-madina-302
  - button "Compare":
    - img
    - text: Compare
  - img
  - text: Grand Opening — 50% OFF
  - button "View Standard Room gallery":
    - img "Standard room first floor — Chakwal Guest House Madina Town"
    - img
    - text: 2 photos View Gallery
  - heading "Standard Room" [level=3]
  - paragraph: Room 401 · Chakwal Guest House – Madina Town Branch, Chakwal
  - paragraph: ₨3,500
  - paragraph: ₨1,750
  - paragraph: / night
  - paragraph: First floor standard room with attached bathroom and all daily amenities.
  - img
  - text: 2 adults + 1 child
  - img
  - text: Attached Bathroom
  - img
  - text: Daily Amenities
  - img
  - text: WiFi
  - img
  - text: AC
  - img
  - text: Hot Water
  - img
  - text: TV
  - link "Details":
    - /url: /rooms/room-madina-401
  - link "Book →":
    - /url: /book?branchId=branch-madina&roomId=room-madina-401
  - button "Compare":
    - img
    - text: Compare
  - img
  - text: Grand Opening — 50% OFF
  - button "View Standard Room gallery":
    - img "Standard room first floor — Chakwal Guest House Madina Town"
    - img
    - text: 2 photos View Gallery
  - heading "Standard Room" [level=3]
  - paragraph: Room 402 · Chakwal Guest House – Madina Town Branch, Chakwal
  - paragraph: ₨3,500
  - paragraph: ₨1,750
  - paragraph: / night
  - paragraph: First floor standard room with attached bathroom and all daily amenities.
  - img
  - text: 2 adults + 1 child
  - img
  - text: Attached Bathroom
  - img
  - text: Daily Amenities
  - img
  - text: WiFi
  - img
  - text: AC
  - img
  - text: Hot Water
  - img
  - text: TV
  - link "Details":
    - /url: /rooms/room-madina-402
  - link "Book →":
    - /url: /book?branchId=branch-madina&roomId=room-madina-402
  - button "Compare":
    - img
    - text: Compare
  - img
  - text: Grand Opening — 50% OFF
  - button "View Standard Room gallery":
    - img "Standard room first floor — Chakwal Guest House Madina Town"
    - img
    - text: 2 photos View Gallery
  - heading "Standard Room" [level=3]
  - paragraph: Room 403 · Chakwal Guest House – Madina Town Branch, Chakwal
  - paragraph: ₨3,500
  - paragraph: ₨1,750
  - paragraph: / night
  - paragraph: First floor standard room with attached bathroom and all daily amenities.
  - img
  - text: 2 adults + 1 child
  - img
  - text: Attached Bathroom
  - img
  - text: Daily Amenities
  - img
  - text: WiFi
  - img
  - text: AC
  - img
  - text: Hot Water
  - img
  - text: TV
  - link "Details":
    - /url: /rooms/room-madina-403
  - link "Book →":
    - /url: /book?branchId=branch-madina&roomId=room-madina-403
  - button "Compare":
    - img
    - text: Compare
  - img
  - heading "Family Rooms" [level=2]
  - paragraph: 2 rooms · from ₨2,500 / night
  - button "View Family Room gallery":
    - img "Family Room"
    - text: View Gallery
  - heading "Family Room" [level=3]
  - paragraph: Room 202 · Chakwal, Chakwal
  - paragraph: ₨2,500
  - paragraph: / night
  - paragraph: Comfortable family room on the second floor (right wing). Two beds, TV, and attached bathroom — a practical choice for small families visiting Chakwal.
  - img
  - text: 4 adults + 1 child
  - img
  - text: WiFi
  - img
  - text: TV
  - img
  - text: Hot Water
  - img
  - text: Attached Bathroom
  - link "Details":
    - /url: /rooms/cmqao4yf0000pgzz2vutzrzw4
  - link "Book →":
    - /url: /book?branchId=branch-chakwal&roomId=cmqao4yf0000pgzz2vutzrzw4
  - button "Compare":
    - img
    - text: Compare
  - heading "Family Room" [level=3]
  - paragraph: Room 201 · Chakwal, Chakwal
  - paragraph: ₨2,500
  - paragraph: / night
  - paragraph: Spacious family room on the second floor (left wing) with extra bedding, sitting area, and plenty of space for the whole family. Ideal for family trips to Chakwal.
  - img
  - text: 4 adults + 2 children
  - img
  - text: WiFi
  - img
  - text: TV
  - img
  - text: Hot Water
  - img
  - text: Sitting Area
  - img
  - text: Extra Bedding
  - img
  - text: Attached Bathroom
  - link "Details":
    - /url: /rooms/cmqanujb8000j131modnt6ij8
  - link "Book →":
    - /url: /book?branchId=branch-chakwal&roomId=cmqanujb8000j131modnt6ij8
  - button "Compare":
    - img
    - text: Compare
  - img
  - heading "Executive Rooms" [level=2]
  - paragraph: 3 rooms · from ₨3,000 / night
  - button "View Executive Room gallery":
    - img "Executive Room"
    - text: View Gallery
  - heading "Executive Room" [level=3]
  - paragraph: Room 103 · Chakwal, Chakwal
  - paragraph: ₨3,000
  - paragraph: / night
  - paragraph: Well-appointed executive room on the first floor (right wing). Features a double bed, TV, and attached bathroom with hot water. A great-value option for business or leisure.
  - img
  - text: 2 adults
  - img
  - text: WiFi
  - img
  - text: TV
  - img
  - text: Hot Water
  - img
  - text: Attached Bathroom
  - link "Details":
    - /url: /rooms/cmqao4xyf000lgzz2el0hme7e
  - link "Book →":
    - /url: /book?branchId=branch-chakwal&roomId=cmqao4xyf000lgzz2el0hme7e
  - button "Compare":
    - img
    - text: Compare
  - button "View Executive Room (Non-AC) gallery":
    - img "Executive Room (Non-AC)"
    - text: View Gallery
  - heading "Executive Room (Non-AC)" [level=3]
  - paragraph: Room 101 · Chakwal, Chakwal
  - paragraph: ₨3,000
  - paragraph: / night
  - paragraph: Comfortable executive room on the first floor (left wing). Tastefully furnished with a double bed, work desk, and attached bathroom. No air conditioning — ideal for cooler seasons.
  - img
  - text: 2 adults
  - img
  - text: WiFi
  - img
  - text: TV
  - img
  - text: Hot Water
  - img
  - text: Attached Bathroom
  - img
  - text: Wardrobe
  - img
  - text: Kitchenette
  - img
  - text: City View
  - link "Details":
    - /url: /rooms/cmqanuiph000f131m4qay89y4
  - link "Book →":
    - /url: /book?branchId=branch-chakwal&roomId=cmqanuiph000f131m4qay89y4
  - button "Compare":
    - img
    - text: Compare
  - button "View Executive Room (AC) gallery":
    - img "Executive Room (AC)"
    - text: View Gallery
  - heading "Executive Room (AC)" [level=3]
  - paragraph: Room 102 · Chakwal, Chakwal
  - paragraph: ₨4,000
  - paragraph: / night
  - paragraph: Premium executive room on the first floor (left wing) with full air conditioning. Double bed, work desk, sofa chair, and attached bathroom. Perfect for summer stays.
  - img
  - text: 2 adults
  - img
  - text: AC
  - img
  - text: WiFi
  - img
  - text: TV
  - img
  - text: Hot Water
  - img
  - text: Work Desk
  - img
  - text: Sofa
  - img
  - text: Attached Bathroom
  - link "Details":
    - /url: /rooms/cmqanuj3w000h131mj8wibg9t
  - link "Book →":
    - /url: /book?branchId=branch-chakwal&roomId=cmqanuj3w000h131mj8wibg9t
  - button "Compare":
    - img
    - text: Compare
  - img
  - heading "Apartment / Suite Rooms" [level=2]
  - img
  - text: 50% OFF available
  - paragraph: 2 rooms · from ₨2,250 / night
  - heading "Apartment" [level=3]
  - paragraph: Room G01 · Chakwal, Chakwal
  - paragraph: ₨3,200
  - paragraph: / night
  - paragraph: Spacious self-contained apartment on the ground floor with a private living area, kitchenette, and attached bathroom. Rs. 3,200/night without AC · Rs. 4,500/night with AC — just tick 'AC Preference' when booking and our team will arrange it.
  - img
  - text: 4 adults + 2 children
  - img
  - text: WiFi
  - img
  - text: Smart TV
  - img
  - text: Hot Water
  - img
  - text: Kitchenette
  - img
  - text: Living Area
  - img
  - text: Attached Bathroom
  - link "Details":
    - /url: /rooms/cmqao4wk0000fgzz2a36nzhvx
  - link "Book →":
    - /url: /book?branchId=branch-chakwal&roomId=cmqao4wk0000fgzz2a36nzhvx
  - button "Compare":
    - img
    - text: Compare
  - img
  - text: Grand Opening — 50% OFF
  - button "View Apartment gallery":
    - img "Spacious apartment living area — Chakwal Guest House Madina Town"
    - img
    - text: 4 photos View Gallery
  - heading "Apartment" [level=3]
  - paragraph: Room 301 · Chakwal Guest House – Madina Town Branch, Chakwal
  - paragraph: ₨4,500
  - paragraph: ₨2,250
  - paragraph: / night
  - paragraph: Spacious ground floor apartment with drawing area, fully equipped kitchen, attached bathroom, hall, private lawn and garage. Ideal for families.
  - img
  - text: 4 adults + 2 children
  - img
  - text: Drawing Area
  - img
  - text: Kitchen
  - img
  - text: Attached Bathroom
  - img
  - text: Hall
  - img
  - text: Lawn
  - img
  - text: Garage
  - img
  - text: WiFi
  - img
  - text: AC
  - img
  - text: Hot Water
  - img
  - text: TV
  - link "Details":
    - /url: /rooms/room-madina-301
  - link "Book →":
    - /url: /book?branchId=branch-madina&roomId=room-madina-301
  - button "Compare":
    - img
    - text: Compare
  - heading "Ready to Book Your Stay?" [level=2]
  - paragraph: Check availability for your dates and confirm your room in minutes. No payment required online — pay on arrival.
  - link "Check Availability":
    - /url: /book
  - link "Call 0334-7742767":
    - /url: tel:+923347742767
- contentinfo:
  - text: CGH
  - paragraph: Chakwal
  - paragraph: Guest House
  - paragraph: Stay Comfortably. Feel at Home.
  - paragraph: Clean, comfortable and affordable rooms in Chakwal with modern facilities and 24/7 support.
  - link "WhatsApp":
    - /url: https://wa.me/923347742767
  - link "Facebook":
    - /url: https://www.facebook.com/chakwal.guest
    - img
  - link "Google Reviews":
    - /url: https://share.google/CX27VxrfpI4QQGCTx
    - img
  - link "Call":
    - /url: tel:+923347742767
    - img
  - heading "Quick Links" [level=4]
  - list:
    - listitem:
      - link "Home":
        - /url: /
    - listitem:
      - link "Our Rooms":
        - /url: /rooms
    - listitem:
      - link "Book a Room":
        - /url: /book
    - listitem:
      - link "My Booking":
        - /url: /my-booking
    - listitem:
      - link "About Us":
        - /url: /about
    - listitem:
      - link "Contact Us":
        - /url: /contact
    - listitem:
      - link "Our Location":
        - /url: /location
    - listitem:
      - link "Travel Blog":
        - /url: /blog
    - listitem:
      - link "Guest Portal":
        - /url: /guest/login
  - heading "Room Types" [level=4]
  - list:
    - listitem:
      - link "Classic Room — PKR 2,500/night":
        - /url: /rooms
    - listitem:
      - link "Family Room — PKR 2,500/night":
        - /url: /rooms
    - listitem:
      - link "Executive Room — PKR 3,000/night":
        - /url: /rooms
    - listitem:
      - link "Apartment Suite — PKR 3,200/night":
        - /url: /rooms
  - heading "Contact Us" [level=4]
  - list:
    - listitem:
      - img
      - link "0334-7742767":
        - /url: tel:+923347742767
      - paragraph: Call or WhatsApp
    - listitem:
      - img
      - paragraph: Near District Courts, Talagang Road, Chakwal
    - listitem:
      - img
      - paragraph: 24/7 Available
      - paragraph: "A/C timing: 12 hours daily"
    - listitem:
      - img
      - link "chakwalguesthouse@gmail.com":
        - /url: mailto:chakwalguesthouse@gmail.com
  - paragraph: © 2026 Chakwal Guest House. All Rights Reserved.
  - link "Privacy Policy":
    - /url: /privacy-policy
  - link "Terms of Use":
    - /url: /terms
  - text: Check-in 2:00 PM · Check-out 12:00 PM
- button "Chat with us":
  - img
- region "Notifications alt+T"
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
> 37 |   await expect(modal).toBeVisible({ timeout: 15_000 });
     |                       ^ Error: expect(locator).toBeVisible() failed
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
  64 |   await expect(modal).toBeVisible({ timeout: 15_000 });
  65 | 
  66 |   // Verify modal has aria-modal=true (prevents background content access in modern screen readers)
  67 |   const ariaModal = await modal.getAttribute("aria-modal");
  68 |   expect(ariaModal).toBe("true");
  69 | });
  70 | 
```