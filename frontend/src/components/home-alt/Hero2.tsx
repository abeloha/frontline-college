"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const stats = [
  { value: "6", label: "Programmes" },
  { value: "3 yr", label: "Avg. duration" },
  { value: "FCT", label: "Approved campus" },
];

export function Hero2() {
  return (
    <section className="relative overflow-hidden bg-ice-50 pb-20 pt-32 sm:pb-28 sm:pt-40">
      <div className="pointer-events-none absolute -left-40 top-20 size-96 rounded-full bg-sky-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 size-72 rounded-full bg-accent-500/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary-600/20 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 shadow-sm"
          >
            <span className="size-1.5 rounded-full bg-accent-500" />
            2026/2027 Admissions Open
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-7 text-balance text-5xl font-normal leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-[3.75rem]"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            Real training for
            <br />
            <span className="italic text-primary-600">healthcare&apos;s</span> frontline.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-6 max-w-md text-balance text-lg leading-relaxed text-ink/60"
          >
            Frontline College of Medical and Health Sciences trains Nigeria&apos;s next
            community health, public health and environmental health professionals —
            hands-on, ethical, and workforce-ready.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link
              href="/apply"
              data-cursor-hover
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-base font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              Start Your Application
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/programs"
              data-cursor-hover
              className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-7 py-4 text-base font-medium text-ink transition-colors hover:bg-ink/5"
            >
              Explore Programmes
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex max-w-md items-center gap-6 border-t border-ink/10 pt-6"
          >
            {stats.map((s, i) => (
              <div key={s.label} className={`flex items-center gap-6 ${i > 0 ? "border-l border-ink/10 pl-6" : ""}`}>
                <div>
                  <p className="text-2xl font-semibold text-ink" style={{ fontFamily: "var(--font-fraunces)" }}>
                    {s.value}
                  </p>
                  <p className="text-xs text-ink/50">{s.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto aspect-[4/5] w-full max-w-md lg:max-w-none"
        >
          <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
            <Image
              src="/images/hero-alt.jpg"
              alt="Frontline College students in training"
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 560px, 90vw"
            />
          </div>

          <div className="absolute -bottom-8 -left-6 w-[58%] -rotate-3 overflow-hidden rounded-3xl border-4 border-ice-50 shadow-xl sm:-left-10">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/facility-classroom.jpg"
                alt="Classroom training session"
                fill
                className="object-cover"
                sizes="320px"
              />
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="absolute -top-5 right-4 rounded-2xl bg-white px-5 py-4 shadow-xl sm:right-8"
          >
            <p className="text-2xl font-semibold text-primary-600" style={{ fontFamily: "var(--font-fraunces)" }}>
              2026/27
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink/45">Session now open</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
