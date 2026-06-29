# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: branch-selector.spec.ts >> branch can be switched from navbar dropdown
- Location: e2e\branch-selector.spec.ts:77:5

# Error details

```
TimeoutError: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('header button').filter({ hasText: /chakwal|main/i }).first()

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
        - text: Offer
      - generic [ref=e11]: New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.deNew Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de ✦ New Guest Offer — Use code NEW20 at booking and get 10% OFF your first stay! Valid on all room types — book now at staychakwal.de
      - button "Dismiss announcement" [ref=e12]:
        - img [ref=e13]
    - banner [ref=e16]:
      - navigation [ref=e17]:
        - generic [ref=e18]:
          - link "Chakwal Guest House Chakwal Guest House" [ref=e19] [cursor=pointer]:
            - /url: /
            - img "Chakwal Guest House" [ref=e20]
            - generic [ref=e21]:
              - paragraph [ref=e22]: Chakwal
              - paragraph [ref=e23]: Guest House
          - generic [ref=e24]:
            - link "Home" [ref=e25] [cursor=pointer]:
              - /url: /
            - link "Rooms" [ref=e26] [cursor=pointer]:
              - /url: /rooms
            - link "Gallery" [ref=e27] [cursor=pointer]:
              - /url: /gallery
            - link "Blog" [ref=e28] [cursor=pointer]:
              - /url: /blog
            - link "About" [ref=e29] [cursor=pointer]:
              - /url: /about
            - link "Location" [ref=e30] [cursor=pointer]:
              - /url: /location
            - link "Contact" [ref=e31] [cursor=pointer]:
              - /url: /contact
            - link "My Booking" [ref=e32] [cursor=pointer]:
              - /url: /my-booking
            - link "My Stay" [ref=e33] [cursor=pointer]:
              - /url: /guest/login
          - generic [ref=e34]:
            - link "0334-7742767" [ref=e35] [cursor=pointer]:
              - /url: tel:+923347742767
              - img [ref=e36]
              - text: 0334-7742767
            - link "Book Now" [ref=e38] [cursor=pointer]:
              - /url: /book
          - button "Toggle menu" [ref=e39]:
            - img [ref=e40]
  - main [ref=e41]:
    - generic [ref=e42]:
      - generic [ref=e43]:
        - paragraph [ref=e44]: Our Accommodations
        - heading "Find Your Perfect Room" [level=1] [ref=e45]
        - paragraph [ref=e46]: From cozy classic rooms to spacious family suites — all with complimentary WiFi, hot water, and 24/7 service.
        - generic [ref=e47]:
          - link "Choose Your Room by Floor" [ref=e48] [cursor=pointer]:
            - /url: /rooms/pick
            - img [ref=e49]
            - text: Choose Your Room by Floor
            - img [ref=e53]
          - paragraph [ref=e55]: or browse by category below · tick rooms to compare side-by-side
      - generic [ref=e56]:
        - generic [ref=e58]:
          - button "Filters" [ref=e59]:
            - img [ref=e60]
            - text: Filters
          - paragraph [ref=e61]: 12 rooms found
        - generic [ref=e62]:
          - generic [ref=e63]:
            - generic [ref=e64]:
              - img [ref=e66]
              - generic [ref=e69]:
                - generic [ref=e70]:
                  - heading "Classic Rooms" [level=2] [ref=e71]
                  - generic [ref=e72]:
                    - img [ref=e73]
                    - text: 50% OFF available
                - paragraph [ref=e75]: 5 rooms · from ₨1,750 / night
            - generic [ref=e76]:
              - generic [ref=e77]:
                - generic [ref=e78]:
                  - generic [ref=e79]:
                    - generic [ref=e80]:
                      - heading "Classic Room" [level=3] [ref=e81]
                      - paragraph [ref=e82]: Room 203 · Chakwal, Chakwal
                    - generic [ref=e83]:
                      - paragraph [ref=e84]: ₨2,500
                      - paragraph [ref=e85]: / night
                  - paragraph [ref=e86]: Clean and cosy classic room on the second floor (right wing). Single bed, TV, and attached bathroom with hot water. Our most affordable option for solo travellers.
                  - generic [ref=e87]:
                    - img [ref=e88]
                    - generic [ref=e93]: 2 adults
                  - generic [ref=e94]:
                    - generic [ref=e95]:
                      - img [ref=e96]
                      - text: WiFi
                    - generic [ref=e100]:
                      - img [ref=e101]
                      - text: TV
                    - generic [ref=e104]:
                      - img [ref=e105]
                      - text: Hot Water
                    - generic [ref=e107]:
                      - img [ref=e108]
                      - text: Attached Bathroom
                - generic [ref=e111]:
                  - link "Details" [ref=e112] [cursor=pointer]:
                    - /url: /rooms/cmqao4ylp000rgzz2njaqpzkm
                  - link "Book →" [ref=e113] [cursor=pointer]:
                    - /url: /book?branchId=branch-chakwal&roomId=cmqao4ylp000rgzz2njaqpzkm
                  - button "Compare" [ref=e114]:
                    - img [ref=e115]
                    - text: Compare
              - generic [ref=e117]:
                - generic [ref=e118]:
                  - img [ref=e119]
                  - text: Grand Opening — 50% OFF
                - button "View Standard Room gallery" [ref=e122]:
                  - img "Standard room — Chakwal Guest House Madina Town" [ref=e123]
                  - generic [ref=e124]:
                    - img [ref=e125]
                    - text: 2 photos
                  - generic [ref=e130]: View Gallery
                - generic [ref=e131]:
                  - generic [ref=e132]:
                    - generic [ref=e133]:
                      - heading "Standard Room" [level=3] [ref=e134]
                      - paragraph [ref=e135]: Room 302 · Chakwal Guest House – Madina Town Branch, Chakwal
                    - generic [ref=e136]:
                      - paragraph [ref=e137]: ₨3,500
                      - paragraph [ref=e138]: ₨1,750
                      - paragraph [ref=e139]: / night
                  - paragraph [ref=e140]: Comfortable ground floor standard room with attached bathroom and all daily amenities.
                  - generic [ref=e141]:
                    - img [ref=e142]
                    - generic [ref=e147]: 2 adults + 1 child
                  - generic [ref=e148]:
                    - generic [ref=e149]:
                      - img [ref=e150]
                      - text: Attached Bathroom
                    - generic [ref=e153]:
                      - img [ref=e154]
                      - text: Daily Amenities
                    - generic [ref=e157]:
                      - img [ref=e158]
                      - text: WiFi
                    - generic [ref=e162]:
                      - img [ref=e163]
                      - text: AC
                    - generic [ref=e168]:
                      - img [ref=e169]
                      - text: Hot Water
                    - generic [ref=e171]:
                      - img [ref=e172]
                      - text: TV
                - generic [ref=e175]:
                  - link "Details" [ref=e176] [cursor=pointer]:
                    - /url: /rooms/room-madina-302
                  - link "Book →" [ref=e177] [cursor=pointer]:
                    - /url: /book?branchId=branch-madina&roomId=room-madina-302
                  - button "Compare" [ref=e178]:
                    - img [ref=e179]
                    - text: Compare
              - generic [ref=e181]:
                - generic [ref=e182]:
                  - img [ref=e183]
                  - text: Grand Opening — 50% OFF
                - button "View Standard Room gallery" [ref=e186]:
                  - img "Standard room first floor — Chakwal Guest House Madina Town" [ref=e187]
                  - generic [ref=e188]:
                    - img [ref=e189]
                    - text: 2 photos
                  - generic [ref=e194]: View Gallery
                - generic [ref=e195]:
                  - generic [ref=e196]:
                    - generic [ref=e197]:
                      - heading "Standard Room" [level=3] [ref=e198]
                      - paragraph [ref=e199]: Room 401 · Chakwal Guest House – Madina Town Branch, Chakwal
                    - generic [ref=e200]:
                      - paragraph [ref=e201]: ₨3,500
                      - paragraph [ref=e202]: ₨1,750
                      - paragraph [ref=e203]: / night
                  - paragraph [ref=e204]: First floor standard room with attached bathroom and all daily amenities.
                  - generic [ref=e205]:
                    - img [ref=e206]
                    - generic [ref=e211]: 2 adults + 1 child
                  - generic [ref=e212]:
                    - generic [ref=e213]:
                      - img [ref=e214]
                      - text: Attached Bathroom
                    - generic [ref=e217]:
                      - img [ref=e218]
                      - text: Daily Amenities
                    - generic [ref=e221]:
                      - img [ref=e222]
                      - text: WiFi
                    - generic [ref=e226]:
                      - img [ref=e227]
                      - text: AC
                    - generic [ref=e232]:
                      - img [ref=e233]
                      - text: Hot Water
                    - generic [ref=e235]:
                      - img [ref=e236]
                      - text: TV
                - generic [ref=e239]:
                  - link "Details" [ref=e240] [cursor=pointer]:
                    - /url: /rooms/room-madina-401
                  - link "Book →" [ref=e241] [cursor=pointer]:
                    - /url: /book?branchId=branch-madina&roomId=room-madina-401
                  - button "Compare" [ref=e242]:
                    - img [ref=e243]
                    - text: Compare
              - generic [ref=e245]:
                - generic [ref=e246]:
                  - img [ref=e247]
                  - text: Grand Opening — 50% OFF
                - button "View Standard Room gallery" [ref=e250]:
                  - img "Standard room first floor — Chakwal Guest House Madina Town" [ref=e251]
                  - generic [ref=e252]:
                    - img [ref=e253]
                    - text: 2 photos
                  - generic [ref=e258]: View Gallery
                - generic [ref=e259]:
                  - generic [ref=e260]:
                    - generic [ref=e261]:
                      - heading "Standard Room" [level=3] [ref=e262]
                      - paragraph [ref=e263]: Room 402 · Chakwal Guest House – Madina Town Branch, Chakwal
                    - generic [ref=e264]:
                      - paragraph [ref=e265]: ₨3,500
                      - paragraph [ref=e266]: ₨1,750
                      - paragraph [ref=e267]: / night
                  - paragraph [ref=e268]: First floor standard room with attached bathroom and all daily amenities.
                  - generic [ref=e269]:
                    - img [ref=e270]
                    - generic [ref=e275]: 2 adults + 1 child
                  - generic [ref=e276]:
                    - generic [ref=e277]:
                      - img [ref=e278]
                      - text: Attached Bathroom
                    - generic [ref=e281]:
                      - img [ref=e282]
                      - text: Daily Amenities
                    - generic [ref=e285]:
                      - img [ref=e286]
                      - text: WiFi
                    - generic [ref=e290]:
                      - img [ref=e291]
                      - text: AC
                    - generic [ref=e296]:
                      - img [ref=e297]
                      - text: Hot Water
                    - generic [ref=e299]:
                      - img [ref=e300]
                      - text: TV
                - generic [ref=e303]:
                  - link "Details" [ref=e304] [cursor=pointer]:
                    - /url: /rooms/room-madina-402
                  - link "Book →" [ref=e305] [cursor=pointer]:
                    - /url: /book?branchId=branch-madina&roomId=room-madina-402
                  - button "Compare" [ref=e306]:
                    - img [ref=e307]
                    - text: Compare
              - generic [ref=e309]:
                - generic [ref=e310]:
                  - img [ref=e311]
                  - text: Grand Opening — 50% OFF
                - button "View Standard Room gallery" [ref=e314]:
                  - img "Standard room first floor — Chakwal Guest House Madina Town" [ref=e315]
                  - generic [ref=e316]:
                    - img [ref=e317]
                    - text: 2 photos
                  - generic [ref=e322]: View Gallery
                - generic [ref=e323]:
                  - generic [ref=e324]:
                    - generic [ref=e325]:
                      - heading "Standard Room" [level=3] [ref=e326]
                      - paragraph [ref=e327]: Room 403 · Chakwal Guest House – Madina Town Branch, Chakwal
                    - generic [ref=e328]:
                      - paragraph [ref=e329]: ₨3,500
                      - paragraph [ref=e330]: ₨1,750
                      - paragraph [ref=e331]: / night
                  - paragraph [ref=e332]: First floor standard room with attached bathroom and all daily amenities.
                  - generic [ref=e333]:
                    - img [ref=e334]
                    - generic [ref=e339]: 2 adults + 1 child
                  - generic [ref=e340]:
                    - generic [ref=e341]:
                      - img [ref=e342]
                      - text: Attached Bathroom
                    - generic [ref=e345]:
                      - img [ref=e346]
                      - text: Daily Amenities
                    - generic [ref=e349]:
                      - img [ref=e350]
                      - text: WiFi
                    - generic [ref=e354]:
                      - img [ref=e355]
                      - text: AC
                    - generic [ref=e360]:
                      - img [ref=e361]
                      - text: Hot Water
                    - generic [ref=e363]:
                      - img [ref=e364]
                      - text: TV
                - generic [ref=e367]:
                  - link "Details" [ref=e368] [cursor=pointer]:
                    - /url: /rooms/room-madina-403
                  - link "Book →" [ref=e369] [cursor=pointer]:
                    - /url: /book?branchId=branch-madina&roomId=room-madina-403
                  - button "Compare" [ref=e370]:
                    - img [ref=e371]
                    - text: Compare
          - generic [ref=e373]:
            - generic [ref=e374]:
              - img [ref=e376]
              - generic [ref=e381]:
                - heading "Family Rooms" [level=2] [ref=e383]
                - paragraph [ref=e384]: 2 rooms · from ₨2,500 / night
            - generic [ref=e385]:
              - generic [ref=e386]:
                - button "View Family Room gallery" [ref=e388]:
                  - img "Family Room" [ref=e389]
                  - generic [ref=e390]: View Gallery
                - generic [ref=e391]:
                  - generic [ref=e392]:
                    - generic [ref=e393]:
                      - heading "Family Room" [level=3] [ref=e394]
                      - paragraph [ref=e395]: Room 202 · Chakwal, Chakwal
                    - generic [ref=e396]:
                      - paragraph [ref=e397]: ₨2,500
                      - paragraph [ref=e398]: / night
                  - paragraph [ref=e399]: Comfortable family room on the second floor (right wing). Two beds, TV, and attached bathroom — a practical choice for small families visiting Chakwal.
                  - generic [ref=e400]:
                    - img [ref=e401]
                    - generic [ref=e406]: 4 adults + 1 child
                  - generic [ref=e407]:
                    - generic [ref=e408]:
                      - img [ref=e409]
                      - text: WiFi
                    - generic [ref=e413]:
                      - img [ref=e414]
                      - text: TV
                    - generic [ref=e417]:
                      - img [ref=e418]
                      - text: Hot Water
                    - generic [ref=e420]:
                      - img [ref=e421]
                      - text: Attached Bathroom
                - generic [ref=e424]:
                  - link "Details" [ref=e425] [cursor=pointer]:
                    - /url: /rooms/cmqao4yf0000pgzz2vutzrzw4
                  - link "Book →" [ref=e426] [cursor=pointer]:
                    - /url: /book?branchId=branch-chakwal&roomId=cmqao4yf0000pgzz2vutzrzw4
                  - button "Compare" [ref=e427]:
                    - img [ref=e428]
                    - text: Compare
              - generic [ref=e430]:
                - generic [ref=e431]:
                  - generic [ref=e432]:
                    - generic [ref=e433]:
                      - heading "Family Room" [level=3] [ref=e434]
                      - paragraph [ref=e435]: Room 201 · Chakwal, Chakwal
                    - generic [ref=e436]:
                      - paragraph [ref=e437]: ₨2,500
                      - paragraph [ref=e438]: / night
                  - paragraph [ref=e439]: Spacious family room on the second floor (left wing) with extra bedding, sitting area, and plenty of space for the whole family. Ideal for family trips to Chakwal.
                  - generic [ref=e440]:
                    - img [ref=e441]
                    - generic [ref=e446]: 4 adults + 2 children
                  - generic [ref=e447]:
                    - generic [ref=e448]:
                      - img [ref=e449]
                      - text: WiFi
                    - generic [ref=e453]:
                      - img [ref=e454]
                      - text: TV
                    - generic [ref=e457]:
                      - img [ref=e458]
                      - text: Hot Water
                    - generic [ref=e460]:
                      - img [ref=e461]
                      - text: Sitting Area
                    - generic [ref=e464]:
                      - img [ref=e465]
                      - text: Extra Bedding
                    - generic [ref=e468]:
                      - img [ref=e469]
                      - text: Attached Bathroom
                - generic [ref=e472]:
                  - link "Details" [ref=e473] [cursor=pointer]:
                    - /url: /rooms/cmqanujb8000j131modnt6ij8
                  - link "Book →" [ref=e474] [cursor=pointer]:
                    - /url: /book?branchId=branch-chakwal&roomId=cmqanujb8000j131modnt6ij8
                  - button "Compare" [ref=e475]:
                    - img [ref=e476]
                    - text: Compare
          - generic [ref=e478]:
            - generic [ref=e479]:
              - img [ref=e481]
              - generic [ref=e483]:
                - heading "Executive Rooms" [level=2] [ref=e485]
                - paragraph [ref=e486]: 3 rooms · from ₨3,000 / night
            - generic [ref=e487]:
              - generic [ref=e488]:
                - button "View Executive Room gallery" [ref=e490]:
                  - img "Executive Room" [ref=e491]
                  - generic [ref=e492]: View Gallery
                - generic [ref=e493]:
                  - generic [ref=e494]:
                    - generic [ref=e495]:
                      - heading "Executive Room" [level=3] [ref=e496]
                      - paragraph [ref=e497]: Room 103 · Chakwal, Chakwal
                    - generic [ref=e498]:
                      - paragraph [ref=e499]: ₨3,000
                      - paragraph [ref=e500]: / night
                  - paragraph [ref=e501]: Well-appointed executive room on the first floor (right wing). Features a double bed, TV, and attached bathroom with hot water. A great-value option for business or leisure.
                  - generic [ref=e502]:
                    - img [ref=e503]
                    - generic [ref=e508]: 2 adults
                  - generic [ref=e509]:
                    - generic [ref=e510]:
                      - img [ref=e511]
                      - text: WiFi
                    - generic [ref=e515]:
                      - img [ref=e516]
                      - text: TV
                    - generic [ref=e519]:
                      - img [ref=e520]
                      - text: Hot Water
                    - generic [ref=e522]:
                      - img [ref=e523]
                      - text: Attached Bathroom
                - generic [ref=e526]:
                  - link "Details" [ref=e527] [cursor=pointer]:
                    - /url: /rooms/cmqao4xyf000lgzz2el0hme7e
                  - link "Book →" [ref=e528] [cursor=pointer]:
                    - /url: /book?branchId=branch-chakwal&roomId=cmqao4xyf000lgzz2el0hme7e
                  - button "Compare" [ref=e529]:
                    - img [ref=e530]
                    - text: Compare
              - generic [ref=e532]:
                - button "View Executive Room (Non-AC) gallery" [ref=e534]:
                  - img "Executive Room (Non-AC)" [ref=e535]
                  - generic [ref=e536]: View Gallery
                - generic [ref=e537]:
                  - generic [ref=e538]:
                    - generic [ref=e539]:
                      - heading "Executive Room (Non-AC)" [level=3] [ref=e540]
                      - paragraph [ref=e541]: Room 101 · Chakwal, Chakwal
                    - generic [ref=e542]:
                      - paragraph [ref=e543]: ₨3,000
                      - paragraph [ref=e544]: / night
                  - paragraph [ref=e545]: Comfortable executive room on the first floor (left wing). Tastefully furnished with a double bed, work desk, and attached bathroom. No air conditioning — ideal for cooler seasons.
                  - generic [ref=e546]:
                    - img [ref=e547]
                    - generic [ref=e552]: 2 adults
                  - generic [ref=e553]:
                    - generic [ref=e554]:
                      - img [ref=e555]
                      - text: WiFi
                    - generic [ref=e559]:
                      - img [ref=e560]
                      - text: TV
                    - generic [ref=e563]:
                      - img [ref=e564]
                      - text: Hot Water
                    - generic [ref=e566]:
                      - img [ref=e567]
                      - text: Attached Bathroom
                    - generic [ref=e570]:
                      - img [ref=e571]
                      - text: Wardrobe
                    - generic [ref=e574]:
                      - img [ref=e575]
                      - text: Kitchenette
                    - generic [ref=e578]:
                      - img [ref=e579]
                      - text: City View
                - generic [ref=e582]:
                  - link "Details" [ref=e583] [cursor=pointer]:
                    - /url: /rooms/cmqanuiph000f131m4qay89y4
                  - link "Book →" [ref=e584] [cursor=pointer]:
                    - /url: /book?branchId=branch-chakwal&roomId=cmqanuiph000f131m4qay89y4
                  - button "Compare" [ref=e585]:
                    - img [ref=e586]
                    - text: Compare
              - generic [ref=e588]:
                - button "View Executive Room (AC) gallery" [ref=e590]:
                  - img "Executive Room (AC)" [ref=e591]
                  - generic [ref=e592]: View Gallery
                - generic [ref=e593]:
                  - generic [ref=e594]:
                    - generic [ref=e595]:
                      - heading "Executive Room (AC)" [level=3] [ref=e596]
                      - paragraph [ref=e597]: Room 102 · Chakwal, Chakwal
                    - generic [ref=e598]:
                      - paragraph [ref=e599]: ₨4,000
                      - paragraph [ref=e600]: / night
                  - paragraph [ref=e601]: Premium executive room on the first floor (left wing) with full air conditioning. Double bed, work desk, sofa chair, and attached bathroom. Perfect for summer stays.
                  - generic [ref=e602]:
                    - img [ref=e603]
                    - generic [ref=e608]: 2 adults
                  - generic [ref=e609]:
                    - generic [ref=e610]:
                      - img [ref=e611]
                      - text: AC
                    - generic [ref=e616]:
                      - img [ref=e617]
                      - text: WiFi
                    - generic [ref=e621]:
                      - img [ref=e622]
                      - text: TV
                    - generic [ref=e625]:
                      - img [ref=e626]
                      - text: Hot Water
                    - generic [ref=e628]:
                      - img [ref=e629]
                      - text: Work Desk
                    - generic [ref=e632]:
                      - img [ref=e633]
                      - text: Sofa
                    - generic [ref=e636]:
                      - img [ref=e637]
                      - text: Attached Bathroom
                - generic [ref=e640]:
                  - link "Details" [ref=e641] [cursor=pointer]:
                    - /url: /rooms/cmqanuj3w000h131mj8wibg9t
                  - link "Book →" [ref=e642] [cursor=pointer]:
                    - /url: /book?branchId=branch-chakwal&roomId=cmqanuj3w000h131mj8wibg9t
                  - button "Compare" [ref=e643]:
                    - img [ref=e644]
                    - text: Compare
          - generic [ref=e646]:
            - generic [ref=e647]:
              - img [ref=e649]
              - generic [ref=e652]:
                - generic [ref=e653]:
                  - heading "Apartment / Suite Rooms" [level=2] [ref=e654]
                  - generic [ref=e655]:
                    - img [ref=e656]
                    - text: 50% OFF available
                - paragraph [ref=e658]: 2 rooms · from ₨2,250 / night
            - generic [ref=e659]:
              - generic [ref=e660]:
                - generic [ref=e661]:
                  - generic [ref=e662]:
                    - generic [ref=e663]:
                      - heading "Apartment" [level=3] [ref=e664]
                      - paragraph [ref=e665]: Room G01 · Chakwal, Chakwal
                    - generic [ref=e666]:
                      - paragraph [ref=e667]: ₨3,200
                      - paragraph [ref=e668]: / night
                  - paragraph [ref=e669]: Spacious self-contained apartment on the ground floor with a private living area, kitchenette, and attached bathroom. Rs. 3,200/night without AC · Rs. 4,500/night with AC — just tick 'AC Preference' when booking and our team will arrange it.
                  - generic [ref=e670]:
                    - img [ref=e671]
                    - generic [ref=e676]: 4 adults + 2 children
                  - generic [ref=e677]:
                    - generic [ref=e678]:
                      - img [ref=e679]
                      - text: WiFi
                    - generic [ref=e683]:
                      - img [ref=e684]
                      - text: Smart TV
                    - generic [ref=e687]:
                      - img [ref=e688]
                      - text: Hot Water
                    - generic [ref=e690]:
                      - img [ref=e691]
                      - text: Kitchenette
                    - generic [ref=e694]:
                      - img [ref=e695]
                      - text: Living Area
                    - generic [ref=e698]:
                      - img [ref=e699]
                      - text: Attached Bathroom
                - generic [ref=e702]:
                  - link "Details" [ref=e703] [cursor=pointer]:
                    - /url: /rooms/cmqao4wk0000fgzz2a36nzhvx
                  - link "Book →" [ref=e704] [cursor=pointer]:
                    - /url: /book?branchId=branch-chakwal&roomId=cmqao4wk0000fgzz2a36nzhvx
                  - button "Compare" [ref=e705]:
                    - img [ref=e706]
                    - text: Compare
              - generic [ref=e708]:
                - generic [ref=e709]:
                  - img [ref=e710]
                  - text: Grand Opening — 50% OFF
                - button "View Apartment gallery" [ref=e713]:
                  - img "Spacious apartment living area — Chakwal Guest House Madina Town" [ref=e714]
                  - generic [ref=e715]:
                    - img [ref=e716]
                    - text: 4 photos
                  - generic [ref=e721]: View Gallery
                - generic [ref=e722]:
                  - generic [ref=e723]:
                    - generic [ref=e724]:
                      - heading "Apartment" [level=3] [ref=e725]
                      - paragraph [ref=e726]: Room 301 · Chakwal Guest House – Madina Town Branch, Chakwal
                    - generic [ref=e727]:
                      - paragraph [ref=e728]: ₨4,500
                      - paragraph [ref=e729]: ₨2,250
                      - paragraph [ref=e730]: / night
                  - paragraph [ref=e731]: Spacious ground floor apartment with drawing area, fully equipped kitchen, attached bathroom, hall, private lawn and garage. Ideal for families.
                  - generic [ref=e732]:
                    - img [ref=e733]
                    - generic [ref=e738]: 4 adults + 2 children
                  - generic [ref=e739]:
                    - generic [ref=e740]:
                      - img [ref=e741]
                      - text: Drawing Area
                    - generic [ref=e744]:
                      - img [ref=e745]
                      - text: Kitchen
                    - generic [ref=e748]:
                      - img [ref=e749]
                      - text: Attached Bathroom
                    - generic [ref=e752]:
                      - img [ref=e753]
                      - text: Hall
                    - generic [ref=e756]:
                      - img [ref=e757]
                      - text: Lawn
                    - generic [ref=e760]:
                      - img [ref=e761]
                      - text: Garage
                    - generic [ref=e764]:
                      - img [ref=e765]
                      - text: WiFi
                    - generic [ref=e769]:
                      - img [ref=e770]
                      - text: AC
                    - generic [ref=e775]:
                      - img [ref=e776]
                      - text: Hot Water
                    - generic [ref=e778]:
                      - img [ref=e779]
                      - text: TV
                - generic [ref=e782]:
                  - link "Details" [ref=e783] [cursor=pointer]:
                    - /url: /rooms/room-madina-301
                  - link "Book →" [ref=e784] [cursor=pointer]:
                    - /url: /book?branchId=branch-madina&roomId=room-madina-301
                  - button "Compare" [ref=e785]:
                    - img [ref=e786]
                    - text: Compare
      - generic [ref=e789]:
        - heading "Ready to Book Your Stay?" [level=2] [ref=e790]
        - paragraph [ref=e791]: Check availability for your dates and confirm your room in minutes. No payment required online — pay on arrival.
        - generic [ref=e792]:
          - link "Check Availability" [ref=e793] [cursor=pointer]:
            - /url: /book
          - link "Call 0334-7742767" [ref=e794] [cursor=pointer]:
            - /url: tel:+923347742767
  - contentinfo [ref=e795]:
    - generic [ref=e796]:
      - generic [ref=e797]:
        - generic [ref=e798]:
          - generic [ref=e799]:
            - generic [ref=e800]: CGH
            - generic [ref=e801]:
              - paragraph [ref=e802]: Chakwal
              - paragraph [ref=e803]: Guest House
          - paragraph [ref=e804]: Stay Comfortably. Feel at Home.
          - paragraph [ref=e805]: Clean, comfortable and affordable rooms in Chakwal with modern facilities and 24/7 support.
          - generic [ref=e806]:
            - link "WhatsApp" [ref=e807] [cursor=pointer]:
              - /url: https://wa.me/923347742767
              - img [ref=e808]
            - link "Facebook" [ref=e810] [cursor=pointer]:
              - /url: https://www.facebook.com/chakwal.guest
              - img [ref=e811]
            - link "Google Reviews" [ref=e813] [cursor=pointer]:
              - /url: https://share.google/CX27VxrfpI4QQGCTx
              - img [ref=e814]
            - link "Call" [ref=e816] [cursor=pointer]:
              - /url: tel:+923347742767
              - img [ref=e817]
        - generic [ref=e819]:
          - heading "Quick Links" [level=4] [ref=e820]
          - list [ref=e821]:
            - listitem [ref=e822]:
              - link "Home" [ref=e823] [cursor=pointer]:
                - /url: /
            - listitem [ref=e824]:
              - link "Our Rooms" [ref=e825] [cursor=pointer]:
                - /url: /rooms
            - listitem [ref=e826]:
              - link "Book a Room" [ref=e827] [cursor=pointer]:
                - /url: /book
            - listitem [ref=e828]:
              - link "My Booking" [ref=e829] [cursor=pointer]:
                - /url: /my-booking
            - listitem [ref=e830]:
              - link "About Us" [ref=e831] [cursor=pointer]:
                - /url: /about
            - listitem [ref=e832]:
              - link "Contact Us" [ref=e833] [cursor=pointer]:
                - /url: /contact
            - listitem [ref=e834]:
              - link "Our Location" [ref=e835] [cursor=pointer]:
                - /url: /location
            - listitem [ref=e836]:
              - link "Travel Blog" [ref=e837] [cursor=pointer]:
                - /url: /blog
            - listitem [ref=e838]:
              - link "Guest Portal" [ref=e839] [cursor=pointer]:
                - /url: /guest/login
        - generic [ref=e840]:
          - heading "Room Types" [level=4] [ref=e841]
          - list [ref=e842]:
            - listitem [ref=e843]:
              - link "Classic Room — PKR 2,500/night" [ref=e844] [cursor=pointer]:
                - /url: /rooms
            - listitem [ref=e845]:
              - link "Family Room — PKR 2,500/night" [ref=e846] [cursor=pointer]:
                - /url: /rooms
            - listitem [ref=e847]:
              - link "Executive Room — PKR 3,000/night" [ref=e848] [cursor=pointer]:
                - /url: /rooms
            - listitem [ref=e849]:
              - link "Apartment Suite — PKR 3,200/night" [ref=e850] [cursor=pointer]:
                - /url: /rooms
        - generic [ref=e851]:
          - heading "Contact Us" [level=4] [ref=e852]
          - list [ref=e853]:
            - listitem [ref=e854]:
              - img [ref=e855]
              - generic [ref=e857]:
                - link "0334-7742767" [ref=e858] [cursor=pointer]:
                  - /url: tel:+923347742767
                - paragraph [ref=e859]: Call or WhatsApp
            - listitem [ref=e860]:
              - img [ref=e861]
              - paragraph [ref=e864]: Near District Courts, Talagang Road, Chakwal
            - listitem [ref=e865]:
              - img [ref=e866]
              - generic [ref=e869]:
                - paragraph [ref=e870]: 24/7 Available
                - paragraph [ref=e871]: "A/C timing: 12 hours daily"
            - listitem [ref=e872]:
              - img [ref=e873]
              - link "chakwalguesthouse@gmail.com" [ref=e876] [cursor=pointer]:
                - /url: mailto:chakwalguesthouse@gmail.com
      - generic [ref=e877]:
        - paragraph [ref=e878]: © 2026 Chakwal Guest House. All Rights Reserved.
        - generic [ref=e879]:
          - link "Privacy Policy" [ref=e880] [cursor=pointer]:
            - /url: /privacy-policy
          - link "Terms of Use" [ref=e881] [cursor=pointer]:
            - /url: /terms
          - generic [ref=e882]: Check-in 2:00 PM · Check-out 12:00 PM
  - button "Chat with us" [ref=e884]:
    - img [ref=e885]
  - region "Notifications alt+T"
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
  17  |   await expect(modal).toBeVisible({ timeout: 15_000 });
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
> 83  |   await branchPill.click();
      |                    ^ TimeoutError: locator.click: Timeout 30000ms exceeded.
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