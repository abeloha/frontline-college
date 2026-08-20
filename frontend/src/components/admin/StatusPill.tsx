import { STATUS_LABELS } from "@/lib/types";

const COLORS: Record<string, string> = {
  submitted: "bg-sky-100 text-primary-700",
  application_fee_review: "bg-gold-400/15 text-gold-400",
  under_review: "bg-primary-600/10 text-primary-700",
  accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-accent-500/10 text-accent-600",
  admission_accepted: "bg-primary-600/15 text-primary-700",
  school_fee_review: "bg-gold-400/15 text-gold-400",
  enrolled: "bg-emerald-100 text-emerald-700",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${COLORS[status] || "bg-ink/10 text-ink/60"}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}
