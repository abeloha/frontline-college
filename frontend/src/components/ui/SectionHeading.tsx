import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && (
        <Reveal>
          <span
            className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
              dark
                ? "border-white/20 text-sky-200"
                : "border-primary-600/20 text-primary-600"
            }`}
          >
            <span className="size-1.5 rounded-full bg-accent-500" />
            {eyebrow}
          </span>
        </Reveal>
      )}
      <Reveal delay={0.08}>
        <h2
          className={`text-balance font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl md:text-5xl ${
            dark ? "text-white" : "text-ink"
          }`}
        >
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.16}>
          <p className={`mt-5 text-balance text-lg leading-relaxed ${dark ? "text-sky-100/80" : "text-ink/65"}`}>
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
