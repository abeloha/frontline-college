import type { Metadata } from "next";
import { Reveal } from "@/components/ui/Reveal";
import { ApplyForm } from "@/components/forms/ApplyForm";

export const metadata: Metadata = {
  title: "Apply Online",
  description: "Apply online to Frontline College of Health Sciences and Technology — free to submit, track your status from your student portal.",
};

export default function ApplyPage() {
  return (
    <section className="bg-ice-50 pb-24 pt-36 sm:pt-40">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-600/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            Online Application
          </span>
        </Reveal>
        <Reveal delay={0.08}>
          <h1 className="mt-6 text-balance font-display text-3xl font-semibold text-ink sm:text-4xl">
            Apply to Frontline College — free, in four short steps.
          </h1>
        </Reveal>
      </div>

      <div className="mt-14 px-5 sm:px-8">
        <ApplyForm />
      </div>
    </section>
  );
}
