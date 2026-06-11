// Centralised public-facing business constants.
// Import this in any component that needs business info.
export const siteConfig = {
  name:        "Chakwal Grand Guest House",
  tagline:     "Premium Guest House Chain",
  phone:       "0334-7742767",
  phoneE164:   "+923347742767",
  whatsapp:    "923347742767",
  email:       "info@chakwalgrand.pk",
  currency:    "PKR",
  currencySymbol: "₨",

  checkInTime:  "2:00 PM",
  checkOutTime: "12:00 PM",
  acHoursDaily: 12,

  social: {
    whatsappUrl: "https://wa.me/923347742767",
  },

  branches: [
    { name: "Chakwal",      city: "Chakwal",     address: "Near Dist. Complex, Talagang Road, Chakwal" },
    { name: "Kallar Kahar", city: "Kallar Kahar", address: "Lake View Road, Kallar Kahar, Chakwal" },
    { name: "Sargodha",     city: "Sargodha",    address: "University Road, Sargodha" },
  ],
} as const;
