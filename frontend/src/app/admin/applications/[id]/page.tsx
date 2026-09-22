"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, FileCheck2, FileX2, FileClock, UploadCloud, Eye } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/admin/StatusPill";
import { apiFetch, ApiError, openAuthedFile } from "@/lib/api";
import { adminAuth } from "@/lib/auth";
import type { Application } from "@/lib/types";

export default function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const letterInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const token = adminAuth.get();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    try {
      const res = await apiFetch<Application>(`/admin/applications/${id}`, { token });
      setApp(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        adminAuth.clear();
        router.replace("/admin/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not load application.");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function verifyPayment(proofId: number, action: "verify" | "reject") {
    const token = adminAuth.get();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/applications/${id}/verify-payment`, { method: "POST", token, body: { proofId, action } });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update payment.");
    } finally {
      setBusy(false);
    }
  }

  async function decide(action: "accept" | "reject") {
    const token = adminAuth.get();
    if (!token) return;
    if (action === "reject" && !showRejectBox) {
      setShowRejectBox(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/applications/${id}/decision`, { method: "POST", token, body: { action, reason: rejectReason } });
      await load();
      setShowRejectBox(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save decision.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadLetter(file: File) {
    const token = adminAuth.get();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      await apiFetch(`/admin/applications/${id}/admission-letter`, { method: "POST", token, isForm: true, body: form });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not upload admission letter.");
    } finally {
      setBusy(false);
    }
  }

  async function viewFile(path: string) {
    const token = adminAuth.get();
    if (!token) return;
    await openAuthedFile(path, token).catch(() => setError("Could not open file."));
  }

  if (loading) {
    return (
      <div className="flex min-h-[70svh] items-center justify-center pt-24">
        <Loader2 className="size-6 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!app) {
    return <div className="pt-40 text-center text-ink/50">Application not found.</div>;
  }

  return (
    <section className="min-h-[85svh] bg-ice-50 pb-24 pt-32 sm:pt-36">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 hover:text-ink">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <Reveal delay={0.05} className="mt-4 flex flex-wrap items-start justify-between gap-4 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{app.applicationNumber}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink">
              {app.student?.firstName} {app.student?.lastName}
            </h1>
            <p className="mt-1 text-sm text-ink/50">{app.student?.email} &middot; {app.student?.phone}</p>
            <p className="mt-1 text-sm text-ink/50">Applying for: {app.program?.name}</p>
          </div>
          <StatusPill status={app.status} />
        </Reveal>

        {error && <Reveal className="mt-4 rounded-2xl bg-accent-500/10 px-5 py-4 text-sm font-medium text-accent-600">{error}</Reveal>}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal delay={0.08} className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
            <h2 className="font-semibold text-ink">Personal Details</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="Date of Birth" value={app.dateOfBirth} />
              <Row label="Gender" value={app.gender} />
              <Row label="State of Origin" value={app.stateOfOrigin} />
              <Row label="Address" value={app.address} />
              <Row label="Guardian" value={`${app.guardianName} (${app.guardianPhone})`} />
            </dl>
          </Reveal>

          <Reveal delay={0.12} className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
            <h2 className="font-semibold text-ink">Academic Background</h2>
            <dl className="mt-4 space-y-2.5 text-sm">
              <Row label="School Attended" value={app.schoolAttended} />
              <Row label="Qualification" value={app.qualificationType} />
              <Row label="Exam" value={`${app.examType} — ${app.examNumber}`} />
              {app.subjects && <Row label="Subjects" value={app.subjects} multiline />}
            </dl>
          </Reveal>
        </div>

        <Reveal delay={0.16} className="mt-6 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
          <h2 className="font-semibold text-ink">Payment Proofs</h2>
          {(app.paymentProofs?.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-ink/50">No payment proofs uploaded yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {app.paymentProofs!.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/10 px-5 py-3">
                  <div className="flex items-center gap-3">
                    {p.status === "verified" ? (
                      <FileCheck2 className="size-4 text-primary-600" />
                    ) : p.status === "rejected" ? (
                      <FileX2 className="size-4 text-accent-500" />
                    ) : (
                      <FileClock className="size-4 text-gold-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium capitalize text-ink">
                        {p.type.replace("_", " ")}
                        {!p.fileUrl && (
                          <span className="ml-2 text-xs font-normal normal-case text-primary-600">via Razz</span>
                        )}
                      </p>
                      <p className="text-xs text-ink/45">{new Date(p.uploadedAt).toLocaleString()} &middot; {p.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.fileUrl && (
                      <button onClick={() => viewFile(p.fileUrl)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:underline">
                        <Eye className="size-3.5" /> View
                      </button>
                    )}
                    {p.status === "pending" && (
                      <>
                        <Button size="md" disabled={busy} onClick={() => verifyPayment(p.id, "verify")}>Verify</Button>
                        <Button size="md" variant="outline" disabled={busy} onClick={() => verifyPayment(p.id, "reject")}>Reject</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>

        {app.status === "under_review" && (
          <Reveal delay={0.2} className="mt-6 rounded-3xl border border-primary-600/15 bg-primary-600/5 p-6 sm:p-8">
            <h2 className="font-semibold text-ink">Admission Decision</h2>
            <p className="mt-1 text-sm text-ink/60">This application&apos;s payment has been verified and is ready for a decision.</p>
            {showRejectBox && (
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection (shown to the applicant)"
                className="mt-4 w-full rounded-xl border border-ink/12 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                rows={3}
              />
            )}
            <div className="mt-4 flex gap-3">
              <Button variant="primary" disabled={busy} onClick={() => decide("accept")}>Accept Application</Button>
              <Button variant="outline" disabled={busy} onClick={() => decide("reject")}>
                {showRejectBox ? "Confirm Rejection" : "Reject Application"}
              </Button>
            </div>
          </Reveal>
        )}

        {app.rejectionReason && (
          <Reveal delay={0.2} className="mt-6 rounded-3xl border border-accent-500/20 bg-accent-500/5 p-6 sm:p-8">
            <h2 className="font-semibold text-accent-600">Rejection Reason</h2>
            <p className="mt-2 text-sm text-ink/70">{app.rejectionReason}</p>
          </Reveal>
        )}

        {(app.status === "accepted" || app.admissionLetter) && (
          <Reveal delay={0.24} className="mt-6 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
            <h2 className="font-semibold text-ink">Admission Letter</h2>
            {app.admissionLetter ? (
              <div className="mt-4 flex items-center gap-3">
                <Button variant="outline" onClick={() => viewFile(app.admissionLetter!.fileUrl)}>
                  <Eye className="size-4" /> View current letter
                </Button>
                {app.status === "accepted" && <span className="text-xs text-ink/40">Uploading a new file will replace it.</span>}
              </div>
            ) : (
              <p className="mt-1 text-sm text-ink/60">Upload the admission letter (PDF/JPG/PNG) for the applicant.</p>
            )}
            {app.status === "accepted" && (
              <div className="mt-4">
                <input ref={letterInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadLetter(file);
                }} />
                <Button variant="primary" disabled={busy} onClick={() => letterInputRef.current?.click()}>
                  <UploadCloud className="size-4" /> {app.admissionLetter ? "Replace letter" : "Upload letter"}
                </Button>
              </div>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
}

function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink/5 pb-2.5 last:border-0">
      <dt className="shrink-0 text-ink/45">{label}</dt>
      <dd className={`text-right font-medium text-ink ${multiline ? "whitespace-pre-line" : ""}`}>{value || "—"}</dd>
    </div>
  );
}
