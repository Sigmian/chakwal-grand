import type { Metadata } from "next";
import { PublicNavbar } from "@/features/public/components/PublicNavbar";
import { PublicFooter } from "@/features/public/components/PublicFooter";
import { ChatWidget }  from "@/features/public/components/ChatWidget";
import { ScrollToTop } from "@/features/public/components/ScrollToTop";
import { AnnouncementBanner } from "@/features/public/components/AnnouncementBanner";
import { getActiveAnnouncement } from "@/server/actions/public";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: { default: "Chakwal Grand Guest House | Best Stay in Chakwal Punjab", template: "%s | Chakwal Grand Guest House" },
  description: "Stay at Chakwal Grand Guest House — the most trusted accommodation in Chakwal, Punjab. AC rooms, family suites & VIP rooms from PKR 2,000/night. Online booking available.",
  keywords: [
    "guest house Chakwal", "hotel Chakwal", "accommodation Chakwal", "room booking Chakwal",
    "family rooms Chakwal", "AC rooms Chakwal", "cheap stay Chakwal", "Chakwal Grand",
    "best hotel Chakwal Punjab", "overnight stay Chakwal", "CGH Chakwal",
  ],
  alternates: { canonical: siteConfig.url },
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const announcement = await getActiveAnnouncement();

  return (
    <>
      {announcement && (
        <AnnouncementBanner title={announcement.title} body={announcement.body} />
      )}
      <PublicNavbar />
      <main className="min-h-screen">{children}</main>
      <PublicFooter />
      <ChatWidget />
      <ScrollToTop />
    </>
  );
}
