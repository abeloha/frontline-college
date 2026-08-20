import { SectionHeading } from "@/components/ui/SectionHeading";
import { LinkButton } from "@/components/ui/Button";
import { ProgramCard } from "@/components/programs/ProgramCard";
import { RevealGroup } from "@/components/ui/Reveal";
import { getPrograms } from "@/lib/programs";

export async function ProgramsTeaser() {
  const programs = await getPrograms();
  const featured = programs.slice(0, 3);

  return (
    <section className="bg-ice-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <SectionHeading
            eyebrow="Programmes"
            title="Diploma tracks built for real healthcare careers."
            description="From community health extension to environmental health technology — every programme blends classroom rigor with hands-on clinical and field practice."
          />
          <LinkButton href="/programs" variant="outline" className="shrink-0">
            View all programmes
          </LinkButton>
        </div>

        {featured.length > 0 ? (
          <RevealGroup className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.12}>
            {featured.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </RevealGroup>
        ) : (
          <p className="mt-14 text-sm text-ink/50">Programmes will appear here once the admissions API is connected.</p>
        )}
      </div>
    </section>
  );
}
