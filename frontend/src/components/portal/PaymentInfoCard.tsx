import { Landmark } from "lucide-react";
import type { PaymentInfo } from "@/lib/types";

export function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function PaymentInfoCard({ info, kind }: { info: PaymentInfo; kind: "application_fee" | "school_fee" }) {
  const breakdown = kind === "school_fee" ? info.schoolFeeBreakdown : undefined;
  const amount = breakdown ? breakdown.total : kind === "application_fee" ? info.applicationFeeAmount : info.schoolFeeAmount;
  const label = kind === "application_fee" ? "Application Fee" : "School Fee";

  return (
    <div className="rounded-2xl border border-primary-600/15 bg-primary-600/5 p-6">
      <div className="flex items-center gap-2.5 text-primary-700">
        <Landmark className="size-5" />
        <h3 className="font-semibold">{label} — Payment Details</h3>
      </div>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink/45">Bank Name</dt>
          <dd className="font-medium text-ink">{info.bankName}</dd>
        </div>
        <div>
          <dt className="text-ink/45">Account Name</dt>
          <dd className="font-medium text-ink">{info.accountName}</dd>
        </div>
        <div>
          <dt className="text-ink/45">Account Number</dt>
          <dd className="font-medium tracking-wide text-ink">{info.accountNumber}</dd>
        </div>
        <div>
          <dt className="text-ink/45">Amount Due</dt>
          <dd className="font-semibold text-primary-700">{formatMoney(amount, info.currency)}</dd>
        </div>
      </dl>

      {breakdown && breakdown.items.length > 0 && (
        <div className="mt-5 border-t border-primary-600/15 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Fee Breakdown</p>
          <ul className="mt-3 divide-y divide-primary-600/10 text-sm">
            {breakdown.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between py-2">
                <span className="text-ink/65">{item.label}</span>
                <span className="font-medium text-ink">{formatMoney(item.amount, info.currency)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between border-t border-primary-600/15 pt-3 text-sm">
            <span className="font-semibold text-ink">Total</span>
            <span className="font-semibold text-primary-700">{formatMoney(breakdown.total, info.currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
