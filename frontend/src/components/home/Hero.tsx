"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import Link from "next/link";

const words = ["Train", "for", "the", "frontline", "of", "healthcare."];

export function Hero() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-navy-950 pt-24">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-main.jpg"
          alt="Health sciences students training at Frontline College"
          fill
          priority
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/70 via-navy-950/75 to-navy-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-950 via-navy-950/40 to-transparent" />
      </div>
      <div className="bg-grain absolute inset-0" />

      <motion.div
        aria-hidden
        className="absolute right-[8%] top-1/3 hidden size-64 rounded-full bg-primary-500/20 blur-3xl md:block"
        animate={{ y: [0, -24, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-[12%] right-[18%] hidden size-40 rounded-full bg-accent-500/20 blur-3xl md:block"
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 pb-20 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-sky-100 backdrop-blur-sm"
        >
          <span className="size-1.5 animate-pulse rounded-full bg-accent-400" />
          2026/2027 Admissions Now Open
        </motion.div>

        <h1 className="font-display max-w-4xl text-balance text-5xl font-semibold leading-[1.03] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.25rem]">
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`mr-4 inline-block ${word === "frontline." ? "text-sky-300" : ""}`}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-8 max-w-xl text-balance text-lg leading-relaxed text-sky-100/75"
        >
          Frontline College of Health Sciences and Technology trains competent, ethical, globally
          competitive health professionals — combining rigorous academics with hands-on clinical
          and public health practice in Kuje, FCT Abuja.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.15 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link
            href="/apply"
            data-cursor-hover
            className="group inline-flex items-center gap-2 rounded-full bg-accent-500 px-7 py-4 text-base font-semibold text-white shadow-[0_12px_40px_-10px_rgba(217,42,52,0.8)] transition-transform hover:-translate-y-0.5 hover:bg-accent-600"
          >
            Start Your Application
            <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
          <Link
            href="/programs"
            data-cursor-hover
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-4 text-base font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/10"
          >
            Explore Programs
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-sky-100/50"
      >
        <span className="text-[11px] uppercase tracking-[0.2em]">Scroll</span>
        <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          <ChevronDown className="size-4" />
        </motion.div>
      </motion.div>
    </section>
  );
}
