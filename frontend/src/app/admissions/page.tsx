import type { Metadata } from "next";
import Image from "next/image";
import { Reveal, RevealGroup, RevealItem } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import {
  ClipboardList,
  UserCheck,
  Banknote,
  MailCheck,
  GraduationCap,
  BadgeCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admissions",
  description: "How to apply to Frontline College of Medical and Health Sciences — a simple, free, fully online application process.",
};

const steps = [
  {
    icon: ClipboardList,
    title: "Apply online — free",
    copy: "Fill the online application form with your personal, academic and programme details. No fee is required to submit.",
  },
  {
    icon: Banknote,
    title: "Log in & pay the application fee",
    copy: "Once submitted, log in to your applicant portal to view our bank account details and upload proof of payment.",
  },
  {
    icon: UserCheck,
    title: "Application review",
    copy: "Our admissions team verifies your payment and reviews your application against programme requirements.",
  },
  {
    icon: MailCheck,
    title: "Admission decision",
    copy: "You'll be notified by email and in your portal. If accepted, your admission letter is uploaded for download.",
  },
  {
    icon: GraduationCap,
    title: "Accept & pay school fees",
    copy: "Accept your offer in the portal, then upload proof of school fee payment to complete enrollment.",
  },
  {
    icon: BadgeCheck,
    title: "Welcome to Frontline",
    copy: "Once your school fee is verified, you're officially enrolled — resumption details follow by email.",
  },
];

const faqs = [
  {
    q: "Does it cost anything to apply?",
    a: "No. Submitting your application is completely free. You only make a payment (the application fee) after you've applied, from your applicant portal.",
  },
  {
    q: "What documents do I need?",
    a: "Your O'Level results (WAEC/NECO/NABTEB), a valid means of identification, and your guardian's contact details. You can add supporting documents when requested during review.",
  },
  {
    q: "How do I check my application status?",
    a: "Log in to the student portal any time with the email and password you used to apply. Your status, payment history and admission letter (once available) all live there.",
  },
  {
    q: "What if my payment proof is rejected?",
    a: "You'll be notified with a reason and can upload a corrected proof of payment straight from your portal.",
  },
];

export default function AdmissionsPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pb-20 pt-40 text-white">
        <div className="absolute inset-0">
          <Image src="/images/admissions-hero.jpg" alt="" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/85 to-navy-950" />
        </div>
        <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
              Admissions
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 text-balance font-display text-4xl font-semibold sm:text-5xl md:text-6xl">
              A simple, transparent path from application to enrollment.
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-sky-100/75">
              Six steps, entirely trackable from your own portal — starting with a free online
              application.
            </p>
          </Reveal>
          <Reveal delay={0.24} className="mt-8">
            <LinkButton href="/apply" variant="accent" size="lg">
              Start your application
            </LinkButton>
          </Reveal>
        </div>
      </section>

      <section className="bg-ice-50 py-24 sm:py-28">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <RevealGroup className="relative space-y-6" stagger={0.1}>
            {steps.map((s, i) => (
              <RevealItem key={s.title} className="relative flex gap-6 rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(11,31,58,0.06)] sm:p-8">
                <div className="flex flex-col items-center">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-600/10 font-display text-lg font-semibold text-primary-600">
                    {i + 1}
                  </div>
                  {i < steps.length - 1 && <div className="mt-2 w-px flex-1 bg-primary-600/10" />}
                </div>
                <div className="pb-2">
                  <div className="flex items-center gap-2.5">
                    <s.icon className="size-5 text-accent-500" />
                    <h3 className="font-display text-lg font-semibold text-ink">{s.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">{s.copy}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="bg-white py-24 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Frequently asked questions</h2>
          </Reveal>
          <div className="mt-12 divide-y divide-ink/10 rounded-3xl border border-ink/10">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.06} className="p-6">
                <h3 className="font-semibold text-ink">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{f.a}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
