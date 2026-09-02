import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import { LinkButton } from "@/components/ui/Button";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Frontline College of Medical and Health Sciences, Chikuku, Kuje Area Council, FCT Abuja.",
};

const cards = [
  { icon: MapPin, title: "Campus Address", lines: ["Chikuku Community", "Kuje Area Council, FCT Abuja, Nigeria"] },
  { icon: Phone, title: "Call Us", lines: ["0904 433 2294", "0916 232 3949"] },
  { icon: Mail, title: "Email Us", lines: ["frontlinehealthtech@gmail.com"] },
  { icon: Clock, title: "Office Hours", lines: ["Monday – Friday", "8:00am – 4:00pm"] },
];

export default function ContactPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pb-20 pt-40 text-white">
        <div className="absolute inset-0">
          <Image src="/images/contact-hero.jpg" alt="" fill className="object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/85 to-navy-950" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100">
              Contact
            </span>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 text-balance font-display text-4xl font-semibold sm:text-5xl">We&apos;d love to hear from you.</h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-5 text-balance text-lg text-sky-100/75">
              Questions about programmes, admissions or your application status — reach the team directly.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-ice-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((c, i) => (
              <Reveal key={c.title} delay={i * 0.08} className="rounded-3xl bg-white p-7 shadow-[0_1px_2px_rgba(11,31,58,0.06)]">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600">
                  <c.icon className="size-5" />
                </div>
                <h3 className="mt-5 font-semibold text-ink">{c.title}</h3>
                {c.lines.map((l) => (
                  <p key={l} className="mt-1 text-sm text-ink/60">{l}</p>
                ))}
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.2} className="mt-14 overflow-hidden rounded-3xl border border-primary-600/10">
            <iframe
              title="Frontline College location — Chikuku, Kuje, FCT Abuja"
              src="https://www.google.com/maps?q=Kuje+Area+Council,+FCT+Abuja&output=embed"
              className="h-[420px] w-full grayscale"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </Reveal>

          <Reveal delay={0.28} className="mt-14 flex flex-col items-center gap-5 rounded-3xl bg-primary-600 p-10 text-center text-white">
            <h2 className="font-display text-2xl font-semibold">Ready to apply?</h2>
            <p className="max-w-md text-sm text-sky-50/80">
              Skip the back-and-forth — start your online application now and track everything from your portal.
            </p>
            <LinkButton href="/apply" variant="accent">
              Apply Now
            </LinkButton>
          </Reveal>
        </div>
      </section>
    </>
  );
}
