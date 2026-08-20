import { Marquee } from "@/components/ui/Marquee";

const items = [
  "Community Health Extension",
  "Public Health Technology",
  "Environmental Health",
  "Health Education & Promotion",
  "Admissions Open — 2026/2027",
];

export function MarqueeBand() {
  return (
    <div className="border-y border-primary-700 bg-primary-600 py-5">
      <Marquee>
        {items.map((item, i) => (
          <span
            key={i}
            className="mx-6 inline-flex items-center gap-6 text-xl font-normal italic text-white/90"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            {item}
            <span className="size-1.5 rounded-full bg-white/40 not-italic" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}
