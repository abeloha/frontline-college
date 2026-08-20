import { CheckCircle2, Circle, XCircle } from "lucide-react";
import type { ApplicationStatus } from "@/lib/types";

const FLOW: { key: ApplicationStatus; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "application_fee_review", label: "Fee Review" },
  { key: "under_review", label: "Under Review" },
  { key: "accepted", label: "Accepted" },
  { key: "admission_accepted", label: "Admission Accepted" },
  { key: "school_fee_review", label: "School Fee Review" },
  { key: "enrolled", label: "Enrolled" },
];

export function StatusTimeline({ status }: { status: ApplicationStatus }) {
  if (status === "rejected") {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-accent-500/10 px-5 py-4 text-accent-600">
        <XCircle className="size-5 shrink-0" />
        <p className="text-sm font-medium">This application was not successful.</p>
      </div>
    );
  }

  const currentIndex = FLOW.findIndex((f) => f.key === status);

  return (
    <div className="flex flex-wrap gap-x-1 gap-y-4">
      {FLOW.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              {done ? (
                <CheckCircle2 className="size-5 text-primary-600" />
              ) : active ? (
                <Circle className="size-5 fill-accent-500 text-accent-500" />
              ) : (
                <Circle className="size-5 text-ink/15" />
              )}
              <span className={`w-20 text-center text-[10px] font-medium leading-tight ${active ? "text-ink" : done ? "text-ink/60" : "text-ink/30"}`}>
                {step.label}
              </span>
            </div>
            {i < FLOW.length - 1 && <div className={`mx-1 mb-4 h-px w-6 sm:w-10 ${done ? "bg-primary-600" : "bg-ink/10"}`} />}
          </div>
        );
      })}
    </div>
  );
}
