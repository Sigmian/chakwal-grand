import type { Metadata } from "next";
import { BookingLookup } from "@/features/public/components/BookingLookup";

export const metadata: Metadata = {
  title: "Check My Booking | Chakwal Grand Guest House",
  description: "Enter your booking reference to check the status of your reservation at Chakwal Grand Guest House.",
  alternates: { canonical: "https://www.staychakwal.de/my-booking" },
};

export default function MyBookingPage() {
  return <BookingLookup />;
}
