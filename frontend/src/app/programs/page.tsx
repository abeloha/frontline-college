import type { Metadata } from "next";
import { Reveal, RevealGroup } from "@/components/ui/Reveal";
import { ProgramCard } from "@/components/programs/ProgramCard";
import { getPrograms } from "@/lib/programs";

export const metadata: Metadata = {
  title: "Programmes",
  description: "Explore Professional and National Diploma programmes in community health, public health, health education and environmental health technology.",
};

export default async function ProgramsPage() {
  const programs = await getPrograms();
  const categories = Array.from(new Set(programs.map((p) => p.category)));

  return (
    <>
      <section className="bg-navy-950 pb-20 pt-40 text-white">
        <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
              Programmes
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 text-balance font-display text-4xl font-semibold sm:text-5xl md:text-6xl">
              Diploma tracks for every path into healthcare.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-sky-100/75">
              Professional and National Diploma programmes across community health, public health,
              health education and environmental health.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-ice-50 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          {programs.length === 0 && (
            <p className="text-center text-ink/50">Programmes will appear here once the admissions API is connected.</p>
          )}

          {categories.map((category) => (
            <div key={category} className="mb-16 last:mb-0">
              <Reveal>
                <h2 className="font-display text-2xl font-semibold text-ink">{category}</h2>
              </Reveal>
              <RevealGroup className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
                {programs
                  .filter((p) => p.category === category)
                  .map((program) => (
                    <ProgramCard key={program.id} program={program} />
                  ))}
              </RevealGroup>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
