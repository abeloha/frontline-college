import { Hero } from "@/components/home/Hero";
import { Stats } from "@/components/home/Stats";
import { AboutTeaser } from "@/components/home/AboutTeaser";
import { ProgramsTeaser } from "@/components/home/ProgramsTeaser";
import { FacilitiesGallery } from "@/components/home/FacilitiesGallery";
import { WhyChoose } from "@/components/home/WhyChoose";
import { AdmissionsCTA } from "@/components/home/AdmissionsCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <Stats />
      <AboutTeaser />
      <ProgramsTeaser />
      <FacilitiesGallery />
      <WhyChoose />
      <AdmissionsCTA />
    </>
  );
}
