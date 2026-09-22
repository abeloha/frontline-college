import { Landmark, Zap } from "lucide-react";

export function PaymentMethodPicker({
  onSelect,
}: {
  onSelect: (method: "manual" | "razz") => void;
}) {
  return (
    <div className="rounded-2xl border border-primary-600/15 bg-white p-6">
      <h3 className="font-semibold text-ink">How would you like to pay?</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect("razz")}
          className="flex flex-col items-start gap-2 rounded-2xl border border-primary-600/20 bg-primary-600/5 p-5 text-left transition-colors hover:bg-primary-600/10"
        >
          <Zap className="size-5 text-primary-600" />
          <span className="font-semibold text-ink">Instant transfer</span>
          <span className="text-xs text-ink/50">
            Get a one-time account number and we&apos;ll confirm your payment automatically —
            no proof upload, no waiting for review.
          </span>
        </button>
        <button
          type="button"
          onClick={() => onSelect("manual")}
          className="flex flex-col items-start gap-2 rounded-2xl border border-ink/10 bg-white p-5 text-left transition-colors hover:bg-ice-50"
        >
          <Landmark className="size-5 text-ink/60" />
          <span className="font-semibold text-ink">Bank transfer</span>
          <span className="text-xs text-ink/50">
            Pay into our account and upload your proof of payment for our team to review.
          </span>
        </button>
      </div>
    </div>
  );
}
