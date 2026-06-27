import type { Metadata } from "next";
import { PublicNavbar } from "@/features/public/components/PublicNavbar";
import { PublicFooter } from "@/features/public/components/PublicFooter";
import { ChatWidget }  from "@/features/public/components/ChatWidget";
import { ScrollToTop } from "@/features/public/components/ScrollToTop";
import { AnnouncementBanner } from "@/features/public/components/AnnouncementBanner";
import { BranchSelectorModal } from "@/features/public/components/BranchSelectorModal";
import { BranchProvider } from "@/components/providers/BranchProvider";
import { getActiveAnnouncement, getGrandOpeningOffer } from "@/server/actions/public";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: { default: "Chakwal Guest House | Best Stay in Chakwal Punjab", template: "%s | Chakwal Guest House" },
  description: "Stay at Chakwal Guest House — the most trusted accommodation in Chakwal, Punjab. AC rooms, family suites & VIP rooms from PKR 2,000/night. Online booking available.",
  keywords: [
    "guest house Chakwal", "hotel Chakwal", "accommodation Chakwal", "room booking Chakwal",
    "family rooms Chakwal", "AC rooms Chakwal", "cheap stay Chakwal", "Chakwal Guest House",
    "best hotel Chakwal Punjab", "overnight stay Chakwal", "CGH Chakwal",
  ],
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [announcement, grandOpening] = await Promise.all([
    getActiveAnnouncement(),
    getGrandOpeningOffer(siteConfig.branchIds.madinaTown),
  ]);

  return (
    <BranchProvider>
      {/* Accessibility: skip to main content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-gold-500 focus:text-background focus:rounded-xl focus:font-semibold focus:text-sm focus:shadow-gold-md"
      >
        Skip to main content
      </a>

      <div className="fixed top-0 left-0 right-0 z-50">
        {announcement && (
          <AnnouncementBanner title={announcement.title} body={announcement.body} />
        )}
        <PublicNavbar />
      </div>
      {/* pt-20 = navbar height; banner adds ~36px when present */}
      <main id="main-content" className={`min-h-screen ${announcement ? "pt-[calc(5rem+36px)]" : "pt-20"}`}>
        {children}
      </main>
      <PublicFooter />
      <ChatWidget />
      <ScrollToTop />
      <BranchSelectorModal grandOpeningActive={!!grandOpening} />
    </BranchProvider>
  );
}
