import Image from "next/image";

const points = [
  {
    n: "01",
    title: "Practice-first curriculum",
    copy: "Supervised clinical and field placements from year one, not just lecture halls.",
  },
  {
    n: "02",
    title: "Small, mentored cohorts",
    copy: "Low student-to-tutor ratios mean real attention throughout your training.",
  },
  {
    n: "03",
    title: "Career-mapped programmes",
    copy: "Every diploma is built around real roles across PHCs, hospitals and ministries.",
  },
];

export function FeatureEditorial() {
  return (
    <section className="bg-ice-50 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2.5rem] lg:order-2">
          <Image
            src="/images/facility-lab.jpg"
            alt="Students in a clinical laboratory"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 560px, 90vw"
          />
        </div>

        <div className="lg:order-1">
          <blockquote
            className="text-balance text-3xl font-normal leading-[1.2] text-ink sm:text-4xl"
            style={{ fontFamily: "var(--font-fraunces)" }}
          >
            &ldquo;We don&apos;t just teach healthcare — we put students <span className="italic text-primary-600">into</span> it, from the first term.&rdquo;
          </blockquote>

          <div className="mt-12 space-y-8">
            {points.map((p) => (
              <div key={p.n} className="flex gap-5">
                <span
                  className="text-2xl font-normal text-primary-600/40"
                  style={{ fontFamily: "var(--font-fraunces)" }}
                >
                  {p.n}
                </span>
                <div className="border-l border-ink/10 pl-5">
                  <h3 className="font-semibold text-ink">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{p.copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
