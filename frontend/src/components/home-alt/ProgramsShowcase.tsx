import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProgramCard } from "@/components/programs/ProgramCard";
import type { Program } from "@/lib/types";

export function ProgramsShowcase({ programs }: { programs: Program[] }) {
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">Programmes</span>
            <h2
              className="mt-3 max-w-lg text-balance text-4xl font-normal leading-[1.1] text-ink sm:text-5xl"
              style={{ fontFamily: "var(--font-fraunces)" }}
            >
              Six paths into a healthcare career.
            </h2>
          </div>
          <Link
            href="/programs"
            data-cursor-hover
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink hover:text-primary-600"
          >
            View all programmes <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="mt-12 overflow-x-auto pb-4 pl-5 sm:pl-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex snap-x snap-mandatory gap-6">
          {programs.map((program) => (
            <div key={program.id} className="w-[280px] shrink-0 snap-start sm:w-[320px]">
              <ProgramCard program={program} />
            </div>
          ))}
          <div className="w-px shrink-0" aria-hidden />
        </div>
      </div>
      <p className="mt-4 px-5 text-xs text-ink/35 sm:px-8">Swipe or scroll to see all programmes →</p>
    </section>
  );
}
