import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HeartPulse, ShieldCheck, Target } from "lucide-react";

const pillars = [
  { icon: Target, title: "Our Vision", copy: "To be a leading institution for training competent, ethical, globally competitive health professionals." },
  { icon: HeartPulse, title: "Our Mission", copy: "World-class training in medical and health sciences — bridging Nigeria's healthcare workforce gap." },
  { icon: ShieldCheck, title: "Approved & Registered", copy: "Registered under CAMA 1990 and approved by the FCT Department of Higher Education." },
];

export function AboutTeaser() {
  return (
    <section className="relative overflow-hidden bg-ice-50 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-5 sm:px-8 lg:grid-cols-2">
        <Reveal className="relative">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem]">
            <Image
              src="/images/about-campus.jpg"
              alt="Frontline College campus"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 480px, 100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/50 via-transparent to-transparent" />
          </div>
          <div className="absolute -bottom-8 -right-4 w-56 rounded-2xl border border-primary-600/10 bg-white p-5 shadow-xl sm:-right-10">
            <p className="font-display text-3xl font-semibold text-primary-600">2026/27</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-ink/50">Admissions session now open</p>
          </div>
        </Reveal>

        <div>
          <SectionHeading
            eyebrow="About Frontline College"
            title="A private tertiary healthcare training institute in Kuje, FCT Abuja."
            description="Frontline College of Medical and Health Sciences combines academic excellence, practical experience, and moral values to equip students for safe, ethical, patient-centered care."
          />

          <div className="mt-10 space-y-6">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={0.1 + i * 0.08} className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
                  <p.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-ink">{p.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink/60">{p.copy}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3} className="mt-10">
            <LinkButton href="/about" variant="outline">
              More about the college
            </LinkButton>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
