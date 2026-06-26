// Centralised public-facing business constants.
// Import this in any component that needs business info.
export const siteConfig = {
  name:        "Chakwal Guest House",
  tagline:     "Premium Guest House Chain",
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
    googleBusinessUrl: "https://maps.app.goo.gl/jRnLGENGuGrcHUZUA",
    googleReviewUrl:   "https://maps.app.goo.gl/jRnLGENGuGrcHUZUA",
  },

  mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3348.833769942778!2d72.80838061132684!3d32.92898987349045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39205d4dae8b2cd9%3A0x2a93af9389e3c5a!2sChakwal%20Guest%20House!5e0!3m2!1sen!2s!4v1781608179374!5m2!1sen!2s",

  branches: [
    { name: "Chakwal",      city: "Chakwal",     address: "Near District Courts, Talagang Road, Chakwal" },
    { name: "Kallar Kahar", city: "Kallar Kahar", address: "Lake View Road, Near Salt Mine, Kallar Kahar, Chakwal" },
    { name: "Sargodha",     city: "Sargodha",    address: "University Road, Near Peoples Colony, Sargodha" },
  ],
} as const;
