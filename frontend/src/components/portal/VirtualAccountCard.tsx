"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Clock, Copy, Zap } from "lucide-react";
import { getVirtualAccount, type FeeType } from "@/lib/payments";
import { formatMoney } from "@/components/portal/PaymentInfoCard";
import type { VirtualAccount } from "@/lib/types";

const POLL_MS = 6000;

function timeLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function VirtualAccountCard({
  account,
  type,
  currency,
  token,
  onPaid,
}: {
  account: VirtualAccount;
  type: FeeType;
  currency: string;
  token: string;
  onPaid: () => void;
}) {
  const [va, setVa] = useState(account);
  const [copied, setCopied] = useState(false);
  const [, forceTick] = useState(0);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    setVa(account);
  }, [account]);

  useEffect(() => {
    if (va.status !== "pending") return;
    const poll = setInterval(async () => {
      try {
        const res = await getVirtualAccount(type, token);
        setVa(res.virtualAccount);
        if (res.virtualAccount.status === "paid") onPaidRef.current();
      } catch {
        // transient — next tick retries
      }
    }, POLL_MS);
    // Re-render every second too, purely so the "time left" countdown moves
    // without waiting for the next poll.
    const tick = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [va.status, type, token]);

  function copyAccountNumber() {
    navigator.clipboard.writeText(va.accountNumber).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (va.status === "paid") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-primary-600/15 bg-primary-600/5 p-6">
        <CheckCircle2 className="size-6 shrink-0 text-primary-600" />
        <p className="text-sm font-medium text-ink">
          Payment received — {formatMoney(va.amount, currency)} confirmed automatically.
        </p>
      </div>
    );
  }

  const expired = va.status === "expired" || timeLeft(va.expiresAt) === "expired";

  return (
    <div className="rounded-2xl border border-primary-600/15 bg-primary-600/5 p-6">
      <div className="flex items-center gap-2.5 text-primary-700">
        <Zap className="size-5" />
        <h3 className="font-semibold">Instant Transfer — Pay Now</h3>
      </div>

      {expired ? (
        <p className="mt-4 text-sm text-ink/60">
          This account has expired. Refresh the page to get a new one.
        </p>
      ) : (
        <>
          <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink/45">Bank Name</dt>
              <dd className="font-medium text-ink">{va.bankName}</dd>
            </div>
            <div>
              <dt className="text-ink/45">Account Number</dt>
              <dd className="flex items-center gap-2 font-medium tracking-wide text-ink">
                {va.accountNumber}
                <button
                  type="button"
                  onClick={copyAccountNumber}
                  className="text-primary-600 hover:text-primary-700"
                  aria-label="Copy account number"
                >
                  <Copy className="size-3.5" />
                </button>
                {copied && <span className="text-xs text-primary-600">Copied!</span>}
              </dd>
            </div>
            <div>
              <dt className="text-ink/45">Amount Due</dt>
              <dd className="font-semibold text-primary-700">{formatMoney(va.amount, currency)}</dd>
            </div>
            <div>
              <dt className="text-ink/45">Expires In</dt>
              <dd className="flex items-center gap-1.5 font-medium text-ink">
                <Clock className="size-3.5 text-ink/40" />
                {timeLeft(va.expiresAt)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 flex items-center gap-2 text-xs text-ink/50">
            <span className="size-2 animate-pulse rounded-full bg-gold-400" />
            Waiting for your transfer — this page updates automatically once it's received.
          </p>
        </>
      )}
    </div>
  );
}
