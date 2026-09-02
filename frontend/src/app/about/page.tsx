import type { Metadata } from "next";
import Image from "next/image";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { BadgeCheck, HeartPulse, ScrollText, Target, Users2, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "About the College",
  description:
    "Frontline College of Medical and Health Sciences is a private tertiary healthcare training institute in Chikuku, Kuje Area Council, FCT Abuja.",
};

const values = [
  { icon: HeartPulse, title: "Patient-Centered Care", copy: "Every skill we teach traces back to safer, more compassionate care for real patients and communities." },
  { icon: ScrollText, title: "Academic Rigor", copy: "A curriculum that meets professional and regulatory standards for Nigeria's health workforce." },
  { icon: Users2, title: "Community Impact", copy: "We train for the frontline — primary healthcare centers, LGAs and the communities that need us most." },
  { icon: Sparkles, title: "Moral & Ethical Grounding", copy: "Clinical competence paired with the integrity healthcare demands." },
];

export default function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pb-24 pt-40 text-white">
        <div className="absolute inset-0">
          <Image src="/images/about-campus.jpg" alt="" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/80 to-navy-950" />
        </div>
        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
              About the college
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 text-balance font-display text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl">
              Frontline in healthcare, excellence in training.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-sky-100/75">
              A private tertiary healthcare training institute located in Chikuku community, Kuje
              Area Council, Federal Capital Territory, Abuja — registered under the Companies and
              Allied Matters Act 1990 (as amended) and approved by the FCT Department of Higher
              Education.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-24 sm:py-28">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-5 sm:px-8 lg:grid-cols-2">
          <Reveal className="rounded-3xl border border-primary-600/10 bg-ice-50 p-9">
            <Target className="size-8 text-primary-600" />
            <h2 className="mt-5 font-display text-2xl font-semibold text-ink">Vision</h2>
            <p className="mt-3 leading-relaxed text-ink/65">
              To be a leading institution for the training of competent, ethical, and globally
              competitive health professionals who drive excellence in healthcare delivery.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="rounded-3xl border border-primary-600/10 bg-ice-50 p-9">
            <HeartPulse className="size-8 text-accent-500" />
            <h2 className="mt-5 font-display text-2xl font-semibold text-ink">Mission</h2>
            <p className="mt-3 leading-relaxed text-ink/65">
              To deliver world-class training in medical and health sciences that combines
              academic excellence, practical experience, and moral values — bridging the
              healthcare workforce gap by equipping students to provide safe, ethical,
              patient-centered care.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-ice-50 py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading eyebrow="What we stand for" title="Core values that shape every classroom and clinical placement." align="center" />
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
            {values.map((v) => (
              <RevealItem key={v.title} className="rounded-3xl bg-white p-7 shadow-[0_1px_2px_rgba(11,31,58,0.06)]">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
                  <v.icon className="size-5" />
                </div>
                <h3 className="mt-5 font-semibold text-ink">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{v.copy}</p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
          <Reveal>
            <BadgeCheck className="mx-auto size-10 text-primary-600" />
          </Reveal>
          <Reveal delay={0.08}>
            <h2 className="mt-5 font-display text-3xl font-semibold text-ink sm:text-4xl">Registered &amp; Approved</h2>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-4 max-w-2xl text-balance leading-relaxed text-ink/65">
              Frontline College of Medical and Health Sciences is registered under the Companies
              and Allied Matters Act 1990 (as amended) and approved by the Department of Higher
              Education, Federal Capital Territory Administration.
            </p>
          </Reveal>
          <Reveal delay={0.24} className="mt-8">
            <LinkButton href="/programs" variant="primary">
              Explore our programmes
            </LinkButton>
          </Reveal>
        </div>
      </section>
    </>
  );
}
