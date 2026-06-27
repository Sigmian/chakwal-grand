// Centralised public-facing business constants.
// Import this in any component that needs business info.
export const siteConfig = {
  name:        "Chakwal Guest House",
  shortName:   "CGH",
  tagline:     "Stay Comfortably. Feel at Home.",
  description: "Chakwal Guest House offers clean, comfortable and affordable rooms in Chakwal with two convenient branches — Main Branch near District Courts and our new Madina Town Branch. Modern facilities, 24/7 support and an exceptional guest experience.",
  url:         "https://www.staychakwal.de",
  phone:       "0334-7742767",
  phoneE164:   "+923347742767",
  whatsapp:    "923347742767",
  email:       "chakwalguesthouse@gmail.com",
  currency:    "PKR",
  currencySymbol: "₨",

  checkInTime:  "2:00 PM",
  checkOutTime: "12:00 PM",
  acHoursDaily: 12,

  social: {
    whatsappUrl:       "https://wa.me/923347742767",
    facebookUrl:       "https://www.facebook.com/chakwal.guest",
    googleBusinessUrl: "https://share.google/CX27VxrfpI4QQGCTx",
    googleReviewUrl:   "https://share.google/CX27VxrfpI4QQGCTx",
  },

  mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3348.833769942778!2d72.80838061132684!3d32.92898987349045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39205d4dae8b2cd9%3A0x2a93af9389e3c5a!2sChakwal%20Guest%20House!5e0!3m2!1sen!2s!4v1781608179374!5m2!1sen!2s",

  // Branch IDs — must match database records
  branchIds: {
    main:       "branch-chakwal",
    madinaTown: "branch-madina",
  },

  branches: [
    {
      id:      "branch-chakwal",
      name:    "Main Branch",
      city:    "Chakwal",
      address: "Near District Courts, Talagang Road, Chakwal",
      slug:    "chakwal",
      label:   "Flagship Location",
    },
    {
      id:      "branch-madina",
      name:    "Madina Town Branch",
      city:    "Chakwal",
      address: "Madina Town, Chakwal",
      slug:    "madina-town",
      label:   "New — Grand Opening",
    },
  ],
} as const;
