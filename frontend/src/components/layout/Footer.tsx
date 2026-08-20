import Link from "next/link";
import Image from "next/image";
import { Globe, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden bg-navy-950 text-white">
      <div className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 size-72 rounded-full bg-accent-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/images/logo.jpeg" alt="Frontline College crest" width={44} height={44} className="rounded-full" />
              <span className="font-display text-base font-semibold leading-tight">
                Frontline College
                <span className="block text-[11px] font-medium uppercase tracking-[0.16em] text-sky-200/70">
                  Health Sciences &amp; Technology
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-sky-100/60">
              Frontline in healthcare, excellence in training. A private tertiary healthcare training
              institute approved by the Department of Higher Education, FCT Administration.
            </p>
            <div className="mt-6 flex gap-3">
              {[Globe, MessageCircle, Send].map((Icon, i) => (
                <span
                  key={i}
                  className="flex size-9 items-center justify-center rounded-full border border-white/15 text-sky-100/70 transition-colors hover:border-white/40 hover:text-white"
                >
                  <Icon className="size-4" />
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/70">Explore</h4>
            <ul className="mt-5 space-y-3 text-sm text-sky-100/80">
              <li><Link href="/about" className="hover:text-white">About the College</Link></li>
              <li><Link href="/programs" className="hover:text-white">Programs</Link></li>
              <li><Link href="/admissions" className="hover:text-white">Admissions Process</Link></li>
              <li><Link href="/apply" className="hover:text-white">Apply Online</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/70">Portal</h4>
            <ul className="mt-5 space-y-3 text-sm text-sky-100/80">
              <li><Link href="/login" className="hover:text-white">Student Login</Link></li>
              <li><Link href="/apply" className="hover:text-white">Track My Application</Link></li>
              <li><Link href="/admin/login" className="hover:text-white">Staff / Admin Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200/70">Get in touch</h4>
            <ul className="mt-5 space-y-4 text-sm text-sky-100/80">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-accent-400" />
                <span>Chikuku Community, Kuje Area Council, FCT Abuja, Nigeria</span>
              </li>
              <li className="flex gap-3">
                <Phone className="size-4 shrink-0 text-accent-400" />
                <span>0904 433 2294 &middot; 0916 232 3949</span>
              </li>
              <li className="flex gap-3">
                <Mail className="size-4 shrink-0 text-accent-400" />
                <span>frontlinehealthtech@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-sky-100/50 sm:flex-row">
          <p>&copy; {year} Frontline College of Health Sciences and Technology. All rights reserved.</p>
          <p>Registered under CAMA 1990 (as amended) &middot; Approved by the FCT Dept. of Higher Education</p>
        </div>
      </div>
    </footer>
  );
}
