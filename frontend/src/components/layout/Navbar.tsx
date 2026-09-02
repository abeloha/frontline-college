"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ArrowUpRight } from "lucide-react";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/programs", label: "Programs" },
  { href: "/admissions", label: "Admissions" },
  { href: "/contact", label: "Contact" },
];

// Routes that open with a full-bleed dark hero — everywhere else (the
// application form, login, portal, admin) starts on a light background, so
// the nav can't render white-on-white until the user scrolls.
const DARK_TOP_ROUTES = ["/", "/about", "/admissions", "/contact", "/admin/login"];
function hasDarkTop(pathname: string) {
  return DARK_TOP_ROUTES.includes(pathname) || pathname.startsWith("/programs");
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // "solid" = render the light-background/dark-text nav treatment, either
  // because the user has scrolled past the hero, the mobile menu is open, or
  // the current page never had a dark hero to begin with.
  const solid = scrolled || open || !hasDarkTop(pathname);

  // Close the mobile menu when the route changes — adjusted during render
  // (React's recommended pattern) rather than in an effect.
  const [menuClosedFor, setMenuClosedFor] = useState(pathname);
  if (pathname !== menuClosedFor) {
    setMenuClosedFor(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          solid
            ? "bg-ice-50/85 shadow-[0_1px_0_0_rgba(11,31,58,0.06)] backdrop-blur-lg"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <Link href="/" className="flex items-center gap-3" data-cursor-hover>
            <Image src="/images/logo.jpeg" alt="Frontline College crest" width={42} height={42} className="rounded-full" priority />
            <span
              className={`hidden font-display text-sm font-semibold leading-tight tracking-tight sm:block ${
                solid ? "text-ink" : "text-white"
              }`}
            >
              Frontline College
              <span className="block text-[11px] font-medium uppercase tracking-[0.16em] opacity-70">
                Medical &amp; Health Sciences
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-cursor-hover
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  solid
                    ? "text-ink/70 hover:bg-primary-600/8 hover:text-ink"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                } ${pathname === link.href ? (solid ? "text-primary-600" : "text-white") : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login"
              data-cursor-hover
              className={`text-sm font-medium transition-colors ${
                solid ? "text-ink/70 hover:text-ink" : "text-white/80 hover:text-white"
              }`}
            >
              Student Login
            </Link>
            <Link
              href="/apply"
              data-cursor-hover
              className="group inline-flex items-center gap-1.5 rounded-full bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(217,42,52,0.7)] transition-all hover:bg-accent-600"
            >
              Apply Now
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <button
            className={`inline-flex items-center justify-center rounded-full p-2 lg:hidden ${
              solid ? "text-ink" : "text-white"
            }`}
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-navy-950 lg:hidden"
          >
            <div className="flex h-full flex-col justify-center px-8">
              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * i + 0.1 }}
                  >
                    <Link href={link.href} className="font-display text-4xl font-semibold text-white">
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * NAV_LINKS.length + 0.1 }}
                  className="mt-8 flex flex-col gap-4"
                >
                  <Link href="/login" className="text-lg font-medium text-sky-200">
                    Student Login
                  </Link>
                  <Link
                    href="/apply"
                    className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-base font-semibold text-white"
                  >
                    Apply Now <ArrowUpRight className="size-4" />
                  </Link>
                </motion.div>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
