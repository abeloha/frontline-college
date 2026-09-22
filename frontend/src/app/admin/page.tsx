"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2, Search, Users, Clock, CheckCircle2, XCircle, GraduationCap, Megaphone } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Button, LinkButton } from "@/components/ui/Button";
import { StatusPill } from "@/components/admin/StatusPill";
import { apiFetch, ApiError } from "@/lib/api";
import { adminAuth } from "@/lib/auth";
import type { Application } from "@/lib/types";

type Stats = { total: number; submitted: number; underReview: number; accepted: number; rejected: number; enrolled: number };

const STATUS_FILTERS = [
  { value: "", label: "All statuses" },
  { value: "submitted", label: "Submitted" },
  { value: "application_fee_review", label: "Application Fee Review" },
  { value: "under_review", label: "Under Review" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "admission_accepted", label: "Admission Accepted" },
  { value: "school_fee_review", label: "School Fee Review" },
  { value: "enrolled", label: "Enrolled" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const token = adminAuth.get();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (q) params.set("q", q);
      const [statsRes, appsRes] = await Promise.all([
        apiFetch<Stats>("/admin/stats", { token }),
        apiFetch<{ data: Application[] }>(`/admin/applications?${params.toString()}`, { token }),
      ]);
      setStats(statsRes);
      setApps(appsRes.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        adminAuth.clear();
        router.replace("/admin/login");
      }
    } finally {
      setLoading(false);
    }
  }, [router, status, q]);

  useEffect(() => {
    // Data-fetch on mount / filter change — setState happens after the
    // internal await, not synchronously, but the linter can't see through
    // the useCallback indirection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function logout() {
    adminAuth.clear();
    router.push("/admin/login");
  }

  const cards = stats
    ? [
        { label: "Total Applications", value: stats.total, icon: Users, color: "text-primary-600" },
        { label: "Under Review", value: stats.underReview, icon: Clock, color: "text-gold-400" },
        { label: "Accepted", value: stats.accepted, icon: CheckCircle2, color: "text-emerald-600" },
        { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-accent-500" },
        { label: "Enrolled", value: stats.enrolled, icon: GraduationCap, color: "text-primary-600" },
      ]
    : [];

  return (
    <section className="min-h-[85svh] bg-ice-50 pb-24 pt-32 sm:pt-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Admissions Dashboard</h1>
            <p className="mt-1 text-sm text-ink/50">Review, verify and decide on applications.</p>
          </div>
          <div className="flex items-center gap-3">
            <LinkButton href="/admin/notices" variant="outline" withArrow={false}>
              <Megaphone className="size-4" /> Noticeboard
            </LinkButton>
            <Button variant="outline" onClick={logout}>
              <LogOut className="size-4" /> Log out
            </Button>
          </div>
        </Reveal>

        {stats && (
          <Reveal delay={0.06} className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {cards.map((c) => (
              <div key={c.label} className="rounded-2xl border border-ink/10 bg-white p-5">
                <c.icon className={`size-5 ${c.color}`} />
                <p className="mt-3 font-display text-2xl font-semibold text-ink">{c.value}</p>
                <p className="mt-0.5 text-xs text-ink/50">{c.label}</p>
              </div>
            ))}
          </Reveal>
        )}

        <Reveal delay={0.1} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/30" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email or application number…"
              className="w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-11 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </Reveal>

        <Reveal delay={0.14} className="mt-6 overflow-hidden rounded-3xl border border-ink/10 bg-white">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-16 text-ink/50">
              <Loader2 className="size-5 animate-spin" /> Loading applications…
            </div>
          ) : apps.length === 0 ? (
            <p className="p-16 text-center text-ink/50">No applications match your filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
                  <tr>
                    <th className="px-6 py-4 font-medium">Applicant</th>
                    <th className="px-6 py-4 font-medium">Programme</th>
                    <th className="px-6 py-4 font-medium">Application No.</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/5">
                  {apps.map((a) => (
                    <tr key={a.id} className="cursor-pointer transition-colors hover:bg-ice-50" onClick={() => router.push(`/admin/applications/${a.id}`)}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-ink">{a.student?.firstName} {a.student?.lastName}</p>
                        <p className="text-xs text-ink/45">{a.student?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-ink/70">{a.program?.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-ink/60">{a.applicationNumber}</td>
                      <td className="px-6 py-4"><StatusPill status={a.status} /></td>
                      <td className="px-6 py-4 text-ink/50">{new Date(a.submittedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
