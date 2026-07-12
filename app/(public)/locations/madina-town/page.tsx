import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { BranchLandingPage } from "@/features/public/components/BranchLandingPage";

const branch = siteConfig.branches[1];

export const metadata: Metadata = {
  title: "Guest House in Madina Town, Chakwal | Rooms & Booking",
  description: "View current rooms and the confirmed Google Maps pin for Chakwal Guest House's Madina Town branch.",
  alternates: { canonical: `${siteConfig.url}${branch.pageUrl}` },
  openGraph: {
    title: "Chakwal Guest House — Madina Town Branch",
    description: "Compare current Madina Town room options and open the confirmed Google Maps pin for directions.",
    url: `${siteConfig.url}${branch.pageUrl}`,
  },
};

export const revalidate = 60;

export default function MadinaTownPage() {
  return <BranchLandingPage branch={branch} eyebrow="Madina Town Branch" heading="Guest House in Madina Town, Chakwal" introduction="Compare the rooms currently listed for Madina Town and use the confirmed Google Maps pin for directions. Call if you need help identifying the entrance or confirming an arrival detail." />;
}
