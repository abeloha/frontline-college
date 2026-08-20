import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { getProgram, getPrograms } from "@/lib/programs";
import { Briefcase, Clock, GraduationCap, ListChecks } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgram(slug);
  if (!program) return { title: "Programme" };
  return {
    title: program.name,
    description: program.summary,
  };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = await getProgram(slug);
  if (!program) notFound();

  const duties = program.coreDuties.split(/,(?![^()]*\))/).map((s) => s.trim()).filter(Boolean);

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pb-20 pt-40 text-white">
        <div className="absolute inset-0">
          <Image src={program.imageUrl} alt="" fill className="object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/85 to-navy-950" />
        </div>
        <div className="relative mx-auto max-w-4xl px-5 sm:px-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
              {program.category}
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 text-balance font-display text-4xl font-semibold leading-tight sm:text-5xl">
              {program.name}
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-5 max-w-2xl text-balance text-lg text-sky-100/75">{program.summary}</p>
          </Reveal>
          <Reveal delay={0.24} className="mt-8 flex flex-wrap items-center gap-4">
            <LinkButton href={`/apply?program=${program.slug}`} variant="accent">
              Apply for this programme
            </LinkButton>
            <span className="inline-flex items-center gap-2 text-sm text-sky-100/70">
              <Clock className="size-4" /> {program.durationYears} {program.durationYears === 1 ? "year" : "years"} full-time
            </span>
          </Reveal>
        </div>
      </section>

      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-5 sm:px-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Reveal className="flex items-center gap-3">
              <ListChecks className="size-6 text-primary-600" />
              <h2 className="font-display text-2xl font-semibold text-ink">Core Duties &amp; Training Focus</h2>
            </Reveal>
            <Reveal delay={0.08}>
              <ul className="mt-6 space-y-3">
                {duties.map((d, i) => (
                  <li key={i} className="flex gap-3 rounded-2xl bg-ice-50 p-4 text-sm leading-relaxed text-ink/70">
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent-500" />
                    {d}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={0.16} className="mt-12 flex items-center gap-3">
              <Briefcase className="size-6 text-primary-600" />
              <h2 className="font-display text-2xl font-semibold text-ink">Where Graduates Work</h2>
            </Reveal>
            <Reveal delay={0.22}>
              <p className="mt-4 leading-relaxed text-ink/70">{program.placesOfWork}</p>
            </Reveal>

            <Reveal delay={0.28} className="mt-12 flex items-center gap-3">
              <GraduationCap className="size-6 text-primary-600" />
              <h2 className="font-display text-2xl font-semibold text-ink">Entry Requirements</h2>
            </Reveal>
            <Reveal delay={0.34}>
              <p className="mt-4 leading-relaxed text-ink/70">
                A minimum of five (5) credits including English Language and Mathematics in WAEC,
                NECO or NABTEB (SSCE), or equivalent qualifications. Exact requirements are
                confirmed during application review — the admissions team will contact you if any
                documentation is outstanding.
              </p>
            </Reveal>
          </div>

          <aside className="lg:col-span-1">
            <Reveal className="sticky top-28 overflow-hidden rounded-3xl border border-primary-600/10 bg-ice-50 p-7">
              <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src={program.imageUrl} alt={program.name} fill className="object-cover" />
              </div>
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-ink/10 pb-3">
                  <dt className="text-ink/50">Category</dt>
                  <dd className="font-medium text-ink">{program.category}</dd>
                </div>
                <div className="flex justify-between border-b border-ink/10 pb-3">
                  <dt className="text-ink/50">Duration</dt>
                  <dd className="font-medium text-ink">{program.durationYears} {program.durationYears === 1 ? "year" : "years"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink/50">Mode</dt>
                  <dd className="font-medium text-ink">Full-time</dd>
                </div>
              </dl>
              <LinkButton href={`/apply?program=${program.slug}`} variant="primary" className="mt-7 w-full justify-center">
                Apply Now
              </LinkButton>
            </Reveal>
          </aside>
        </div>
      </section>
    </>
  );
}

export async function generateStaticParams() {
  const programs = await getPrograms();
  return programs.map((p) => ({ slug: p.slug }));
}
