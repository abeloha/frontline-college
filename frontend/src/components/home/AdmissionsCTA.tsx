import { LinkButton } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { Marquee } from "@/components/ui/Marquee";

const steps = ["Apply Online — Free", "Upload Payment Proof", "Get Reviewed", "Receive Admission Letter", "Accept & Enroll"];

export function AdmissionsCTA() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 py-24 text-white sm:py-28">
      <div className="bg-grain absolute inset-0" />
      <div className="pointer-events-none absolute -left-20 top-0 size-72 rounded-full bg-accent-500/30 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur-sm">
            <span className="size-1.5 animate-pulse rounded-full bg-accent-300" />
            2026/2027 Session
          </span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-6 text-balance font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Admission is now open — and applying costs you nothing.
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-sky-50/85">
            Submit your application in minutes, track every step from your portal, and pay only
            when you&apos;re ready — no upfront fee required to apply.
          </p>
        </Reveal>
        <Reveal delay={0.24} className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <LinkButton href="/apply" variant="accent" size="lg">
            Apply Now
          </LinkButton>
          <LinkButton href="/admissions" variant="ghost" size="lg" withArrow={false}>
            See admissions process
          </LinkButton>
        </Reveal>
      </div>

      <div className="relative mt-16 border-t border-white/15 py-6">
        <Marquee>
          {steps.map((s, i) => (
            <span key={i} className="mx-6 inline-flex items-center gap-3 text-sm font-medium uppercase tracking-wide text-sky-50/70">
              {s}
              <span className="size-1 rounded-full bg-white/40" />
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
