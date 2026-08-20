import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";
import type { Program } from "@/lib/types";
import { RevealItem } from "@/components/ui/Reveal";

export function ProgramCard({ program }: { program: Program }) {
  return (
    <RevealItem>
      <Link
        href={`/programs/${program.slug}`}
        data-cursor-hover
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(11,31,58,0.06)] transition-shadow duration-300 hover:shadow-[0_24px_48px_-16px_rgba(11,31,58,0.18)]"
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={program.imageUrl}
            alt={program.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(min-width: 1024px) 380px, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/0 to-transparent" />
          <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-700 backdrop-blur-sm">
            {program.category}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <h3 className="font-display text-lg font-semibold leading-snug text-ink">{program.name}</h3>
          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-ink/60">{program.summary}</p>
          <div className="mt-5 flex items-center justify-between border-t border-ink/5 pt-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/50">
              <Clock className="size-3.5" />
              {program.durationYears} {program.durationYears === 1 ? "year" : "years"}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600">
              Details
              <ArrowUpRight className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </RevealItem>
  );
}
