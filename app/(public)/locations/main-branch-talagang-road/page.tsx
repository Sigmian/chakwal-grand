import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { BranchLandingPage } from "@/features/public/components/BranchLandingPage";

const branch = siteConfig.branches[0];

export const metadata: Metadata = {
  title: "Guest House Near District Courts Chakwal | Talagang Road",
  description: "View current rooms and directions for Chakwal Guest House's Main Branch near District Courts on Talagang Road, Chakwal.",
  alternates: { canonical: `${siteConfig.url}${branch.pageUrl}` },
  openGraph: {
    title: "Chakwal Guest House Near District Courts, Talagang Road",
    description: "Compare current rooms, prices and arrival details for the Main Branch in Chakwal.",
    url: `${siteConfig.url}${branch.pageUrl}`,
  },
};

export const revalidate = 60;

export default function MainBranchPage() {
  return <BranchLandingPage branch={branch} eyebrow="Main Branch" heading="Guest House Near District Courts, Talagang Road" introduction="Compare current rooms at the Main Branch, review the location details and confirm any essential facility or arrival requirement before booking." publishLocalBusinessSchema />;
}
