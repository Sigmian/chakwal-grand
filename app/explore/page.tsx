// ============================================================
// app/explore/page.tsx
// The 3D exploration experience — full-bleed, outside the
// standard public chrome so the buildings stay the hero.
// ============================================================

import type { Metadata } from "next";
import { getExperienceData } from "@/server/actions/experience";
import { ExperienceShell } from "@/features/experience/components/ExperienceShell";
import { siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Explore in 3D | Chakwal Guest House",
  description:
    "Explore Chakwal Guest House in 3D — choose your branch, floor and room, then book the exact room you picked.",
  alternates: { canonical: `${siteConfig.url}/explore` },
};

export default async function ExplorePage() {
  const branches = await getExperienceData();
  return <ExperienceShell initialBranches={branches} />;
}
