import type { Metadata } from "next";
import { BookingLookup } from "@/features/public/components/BookingLookup";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: `Check My Booking | ${siteConfig.name}`,
  description: "Enter your booking reference to check the status of your reservation at Chakwal Guest House.",
  alternates: { canonical: `${siteConfig.url}/my-booking` },
  robots: { index: false },
};

export default function MyBookingPage() {
  return <BookingLookup />;
}
