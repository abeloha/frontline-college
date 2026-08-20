import { Counter } from "@/components/ui/Counter";
import { RevealGroup, RevealItem } from "@/components/ui/Reveal";

const stats = [
  { value: 6, suffix: "", label: "Diploma programmes on offer" },
  { value: 3, suffix: "yr", label: "Average programme duration" },
  { value: 100, suffix: "%", label: "Practical, clinical-based training" },
  { value: 1, suffix: "", label: "FCT-approved campus in Kuje, Abuja" },
];

export function Stats() {
  return (
    <section className="relative border-y border-primary-600/10 bg-white">
      <RevealGroup className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-16 sm:px-8 md:grid-cols-4">
        {stats.map((s) => (
          <RevealItem key={s.label} className="text-center md:text-left">
            <div className="font-display text-4xl font-semibold text-primary-600 sm:text-5xl">
              <Counter to={s.value} suffix={s.suffix} />
            </div>
            <p className="mt-2 text-sm leading-snug text-ink/60">{s.label}</p>
          </RevealItem>
        ))}
      </RevealGroup>
    </section>
  );
}
