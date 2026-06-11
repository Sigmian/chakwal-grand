import type { Metadata } from "next";
import { PublicNavbar } from "@/features/public/components/PublicNavbar";
import { PublicFooter } from "@/features/public/components/PublicFooter";
import { ChatWidget }  from "@/features/public/components/ChatWidget";

export const metadata: Metadata = {
  title: { default: "Chakwal Grand Guest House", template: "%s | Chakwal Grand" },
  description: "Premium guest house in Chakwal offering comfortable rooms from ₨2,000/night. Book online or call 0334-7742767.",
  keywords: ["guest house", "Chakwal", "hotel", "accommodation", "rooms", "booking"],
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen">{children}</main>
      <PublicFooter />
      <ChatWidget />
    </>
  );
}
