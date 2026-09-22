import Image from "next/image";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";

const facilities = [
  { src: "/images/facility-lab.jpg", title: "Science & Clinical Labs", copy: "Hands-on practice with modern diagnostic and laboratory equipment.", span: "lg:col-span-2 lg:row-span-2" },
  { src: "/images/facility-classroom.jpg", title: "Modern Classrooms", copy: "Small cohorts, focused learning.", span: "" },
  { src: "/images/facility-library.jpg", title: "Resource Library", copy: "Curated references and study spaces.", span: "" },
  { src: "/images/facility-ward.jpg", title: "Clinical Practice Wards", copy: "Real-world patient-care simulation.", span: "lg:col-span-2" },
];

export function FacilitiesGallery() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Campus & Facilities"
          align="center"
          title="Learning environments built for practice, not just theory."
          description=""
        />

        <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[220px]">
          {facilities.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08} className={`group relative overflow-hidden rounded-3xl ${f.span}`}>
              <Image
                src={f.src}
                alt={f.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(min-width: 1024px) 480px, 100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-1 text-sm text-sky-100/75">{f.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
