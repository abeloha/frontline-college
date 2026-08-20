import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { Hero2 } from "@/components/home-alt/Hero2";
import { MarqueeBand } from "@/components/home-alt/MarqueeBand";
import { ProgramsShowcase } from "@/components/home-alt/ProgramsShowcase";
import { FeatureEditorial } from "@/components/home-alt/FeatureEditorial";
import { AdmissionStepsCTA } from "@/components/home-alt/AdmissionStepsCTA";
import { getPrograms } from "@/lib/programs";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Home — Concept B",
  description: "Alternate landing page concept for Frontline College of Health Sciences and Technology — for internal review.",
};

// NOTE: this is a client-review concept for an alternate home page design —
// same brand, a different editorial/daylight art direction (serif display
// type, split hero, horizontal programme rail) versus the cinematic dark
// hero on the live "/" home page. Not linked from navigation.
export default async function HomeAltPage() {
  const programs = await getPrograms();

  return (
    <div className={`${fraunces.variable}`}>
      <Hero2 />
      <MarqueeBand />
      <ProgramsShowcase programs={programs} />
      <FeatureEditorial />
      <AdmissionStepsCTA />
    </div>
  );
}
