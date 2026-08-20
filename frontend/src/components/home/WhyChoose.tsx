import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { GraduationCap, Stethoscope, Users, FileCheck2 } from "lucide-react";

const reasons = [
  {
    icon: Stethoscope,
    title: "Practice-first curriculum",
    copy: "Every diploma pairs classroom instruction with supervised clinical and field placements from year one.",
  },
  {
    icon: Users,
    title: "Small, mentored cohorts",
    copy: "Low student-to-tutor ratios mean personal attention throughout your training.",
  },
  {
    icon: GraduationCap,
    title: "Career-ready graduates",
    copy: "Programmes are mapped directly to real roles across PHCs, hospitals, ministries and NGOs.",
  },
  {
    icon: FileCheck2,
    title: "Simple, transparent admissions",
    copy: "Apply online free of charge, track your status, and manage every step from your student portal.",
  },
];

export function WhyChoose() {
  return (
    <section className="relative overflow-hidden bg-navy-950 py-24 sm:py-32">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-full max-w-4xl -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Why Frontline"
          align="center"
          dark
          title="Training designed around who you'll become."
          description="Not just lectures — a pathway into Nigeria's healthcare workforce."
        />

        <RevealGroup className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {reasons.map((r) => (
            <RevealItem
              key={r.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-sm transition-colors hover:bg-white/[0.06]"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                <r.icon className="size-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-white">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-sky-100/65">{r.copy}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
