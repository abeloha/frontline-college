import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const steps = ["Apply — free", "Pay fee", "Get reviewed", "Admission letter", "Enroll"];

export function AdmissionStepsCTA() {
  return (
    <section className="bg-ink py-24 text-white sm:py-32">
      <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
        <h2
          className="text-balance text-4xl font-normal leading-[1.1] sm:text-5xl"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          Admission is open. <span className="italic text-sky-300">Applying costs nothing.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-balance text-lg text-white/60">
          Six steps, fully trackable from your own portal — starting with a free online
          application.
        </p>

        <Link
          href="/apply"
          data-cursor-hover
          className="group mt-9 inline-flex items-center gap-2 rounded-full bg-accent-500 px-7 py-4 text-base font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-accent-600"
        >
          Apply Now
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="mx-auto mt-20 max-w-5xl px-5 sm:px-8">
        <div className="relative flex items-start justify-between">
          <div className="absolute left-0 right-0 top-4 h-px bg-white/15" aria-hidden />
          {steps.map((step, i) => (
            <div key={step} className="relative flex flex-1 flex-col items-center gap-3 text-center">
              <span className="relative z-10 flex size-8 items-center justify-center rounded-full border border-white/25 bg-ink text-xs font-semibold text-white/80">
                {i + 1}
              </span>
              <span className="max-w-[6.5rem] text-xs font-medium text-white/50 sm:text-sm">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
