"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogOut, Download, FileCheck2, FileX2, FileClock, AlertTriangle } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { StatusTimeline } from "@/components/portal/StatusTimeline";
import { PaymentInfoCard } from "@/components/portal/PaymentInfoCard";
import { FileUploadBox } from "@/components/portal/FileUploadBox";
import { apiFetch, ApiError, openAuthedFile } from "@/lib/api";
import { studentAuth } from "@/lib/auth";
import { STATUS_LABELS, type Application, type PaymentInfo } from "@/lib/types";

type MeApplicationResponse = { application: Application; paymentInfo: PaymentInfo };

export default function PortalPage() {
  const router = useRouter();
  const [data, setData] = useState<MeApplicationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acceptingAdmission, setAcceptingAdmission] = useState(false);

  const load = useCallback(async () => {
    const token = studentAuth.get();
    if (!token) {
      router.replace("/login");
      return;
    }
    try {
      const res = await apiFetch<MeApplicationResponse>("/student/application", { token });
      setData(res);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        studentAuth.clear();
        router.replace("/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not load your application.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function logout() {
    studentAuth.clear();
    router.push("/");
  }

  async function uploadApplicationFeeProof(file: File) {
    const token = studentAuth.get();
    if (!token) return;
    const form = new FormData();
    form.append("file", file);
    await apiFetch("/student/application/payment-proof", { method: "POST", token, isForm: true, body: form });
    await load();
  }

  async function uploadSchoolFeeProof(file: File) {
    const token = studentAuth.get();
    if (!token) return;
    const form = new FormData();
    form.append("file", file);
    await apiFetch("/student/application/school-fee-proof", { method: "POST", token, isForm: true, body: form });
    await load();
  }

  async function acceptAdmission() {
    const token = studentAuth.get();
    if (!token) return;
    setAcceptingAdmission(true);
    setActionError(null);
    try {
      await apiFetch("/student/application/accept-admission", { method: "POST", token });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not accept admission.");
    } finally {
      setAcceptingAdmission(false);
    }
  }

  async function viewFile(path: string) {
    const token = studentAuth.get();
    if (!token) return;
    try {
      await openAuthedFile(path, token);
    } catch {
      setActionError("Could not open file.");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[70svh] items-center justify-center pt-24">
        <Loader2 className="size-6 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-md px-5 pb-24 pt-40 text-center">
        <AlertTriangle className="mx-auto size-8 text-accent-500" />
        <p className="mt-4 text-ink/60">{error || "No application found."}</p>
        <Link href="/apply" className="mt-6 inline-block font-medium text-primary-600">Start an application</Link>
      </div>
    );
  }

  const { application: app, paymentInfo } = data;

  return (
    <section className="bg-ice-50 pb-24 pt-32 sm:pt-36">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{app.applicationNumber}</p>
            <h1 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">
              Welcome back, {app.student?.firstName || "Applicant"}
            </h1>
            <p className="mt-1 text-sm text-ink/50">{app.program?.name}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="size-4" /> Log out
          </Button>
        </Reveal>

        <Reveal delay={0.08} className="mt-8 overflow-x-auto rounded-3xl border border-primary-600/10 bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold text-ink">Application Status</h2>
            <span className="rounded-full bg-primary-600/10 px-3 py-1 text-xs font-semibold text-primary-700">
              {STATUS_LABELS[app.status] || app.status}
            </span>
          </div>
          <div className="mt-6 min-w-max">
            <StatusTimeline status={app.status} />
          </div>
        </Reveal>

        {actionError && (
          <Reveal className="mt-6 rounded-2xl bg-accent-500/10 px-5 py-4 text-sm font-medium text-accent-600">{actionError}</Reveal>
        )}

        {app.status === "rejected" && app.rejectionReason && (
          <Reveal delay={0.12} className="mt-6 rounded-3xl border border-accent-500/20 bg-accent-500/5 p-6">
            <h3 className="font-semibold text-accent-600">Reason</h3>
            <p className="mt-2 text-sm text-ink/70">{app.rejectionReason}</p>
          </Reveal>
        )}

        {app.status === "submitted" && (
          <Reveal delay={0.12} className="mt-8 space-y-6">
            <PaymentInfoCard info={paymentInfo} kind="application_fee" />
            <FileUploadBox label="Upload application fee payment proof" onUpload={uploadApplicationFeeProof} />
          </Reveal>
        )}

        {app.status === "application_fee_review" && (
          <Reveal delay={0.12} className="mt-8 flex items-center gap-3 rounded-2xl bg-gold-400/10 px-5 py-4 text-sm font-medium text-ink/70">
            <FileClock className="size-5 shrink-0 text-gold-400" />
            Your application fee proof is being reviewed by our admissions team.
          </Reveal>
        )}

        {app.status === "under_review" && (
          <Reveal delay={0.12} className="mt-8 flex items-center gap-3 rounded-2xl bg-primary-600/5 px-5 py-4 text-sm font-medium text-ink/70">
            <FileClock className="size-5 shrink-0 text-primary-600" />
            Your payment is confirmed — your application is now under review.
          </Reveal>
        )}

        {app.status === "accepted" && (
          <Reveal delay={0.12} className="mt-8 space-y-6 rounded-3xl border border-primary-600/15 bg-primary-600/5 p-6 sm:p-8">
            <h3 className="font-display text-xl font-semibold text-ink">Congratulations — you&apos;ve been accepted! 🎉</h3>
            {app.admissionLetter ? (
              <Button onClick={() => viewFile(app.admissionLetter!.fileUrl)}>
                <Download className="size-4" /> View admission letter
              </Button>
            ) : (
              <p className="text-sm text-ink/60">Your admission letter will appear here shortly.</p>
            )}
            <div>
              <Button variant="accent" onClick={acceptAdmission} disabled={acceptingAdmission || !app.admissionLetter}>
                {acceptingAdmission ? <Loader2 className="size-4 animate-spin" /> : "Accept my admission"}
              </Button>
            </div>
          </Reveal>
        )}

        {app.status === "admission_accepted" && (
          <Reveal delay={0.12} className="mt-8 space-y-6">
            {app.admissionLetter && (
              <Button variant="outline" onClick={() => viewFile(app.admissionLetter!.fileUrl)}>
                <Download className="size-4" /> View admission letter
              </Button>
            )}
            <PaymentInfoCard info={paymentInfo} kind="school_fee" />
            <FileUploadBox label="Upload school fee payment proof" onUpload={uploadSchoolFeeProof} />
          </Reveal>
        )}

        {app.status === "school_fee_review" && (
          <Reveal delay={0.12} className="mt-8 flex items-center gap-3 rounded-2xl bg-gold-400/10 px-5 py-4 text-sm font-medium text-ink/70">
            <FileClock className="size-5 shrink-0 text-gold-400" />
            Your school fee payment proof is being reviewed.
          </Reveal>
        )}

        {app.status === "enrolled" && (
          <Reveal delay={0.12} className="mt-8 flex items-center gap-3 rounded-3xl border border-primary-600/15 bg-primary-600/5 p-6 text-ink/70">
            <FileCheck2 className="size-6 shrink-0 text-primary-600" />
            <p className="text-sm">
              You&apos;re officially enrolled at Frontline College! Resumption details will be sent to your email.
            </p>
          </Reveal>
        )}

        {(app.paymentProofs?.length ?? 0) > 0 && (
          <Reveal delay={0.16} className="mt-10">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/40">Payment history</h3>
            <div className="mt-4 space-y-3">
              {app.paymentProofs!.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white px-5 py-3">
                  <div className="flex items-center gap-3">
                    {p.status === "verified" ? (
                      <FileCheck2 className="size-4 text-primary-600" />
                    ) : p.status === "rejected" ? (
                      <FileX2 className="size-4 text-accent-500" />
                    ) : (
                      <FileClock className="size-4 text-gold-400" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {p.type === "application_fee" ? "Application Fee" : "School Fee"}
                      </p>
                      <p className="text-xs text-ink/45">{new Date(p.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium capitalize text-ink/50">{p.status}</span>
                    <button onClick={() => viewFile(p.fileUrl)} className="text-xs font-semibold text-primary-600 hover:underline">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
