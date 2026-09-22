"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  LogOut,
  Download,
  FileCheck2,
  FileX2,
  FileClock,
  AlertTriangle,
  User,
  ClipboardList,
  Wallet,
  Megaphone,
  CircleDollarSign,
} from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { StatusTimeline } from "@/components/portal/StatusTimeline";
import { PaymentInfoCard } from "@/components/portal/PaymentInfoCard";
import { FileUploadBox } from "@/components/portal/FileUploadBox";
import { PaymentMethodPicker } from "@/components/portal/PaymentMethodPicker";
import { VirtualAccountCard } from "@/components/portal/VirtualAccountCard";
import { NoticeBoard } from "@/components/portal/NoticeBoard";
import { apiFetch, ApiError, openAuthedFile } from "@/lib/api";
import { createVirtualAccount, cancelVirtualAccount, type FeeType } from "@/lib/payments";
import { studentAuth } from "@/lib/auth";
import { STATUS_LABELS, type Application, type PaymentInfo } from "@/lib/types";

type MeApplicationResponse = { application: Application; paymentInfo: PaymentInfo };

const TABS = [
  { key: "personal", label: "Personal Information", icon: User },
  { key: "result", label: "Result", icon: ClipboardList },
  { key: "finance", label: "Finance", icon: Wallet },
  { key: "notices", label: "Noticeboard", icon: Megaphone },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Statuses where the application is stalled on the student taking a fee (or
// fee-adjacent) action — surfaced as a banner right under the status
// timeline so it can't be missed, on top of the same action living in the
// Finance tab itself.
const ACTION_NEEDED: Partial<Record<Application["status"], { message: string; cta: string }>> = {
  submitted: {
    message: "Action needed — pay your application fee so we can review your application.",
    cta: "Pay Application Fee",
  },
  accepted: {
    message: "Action needed — accept your admission offer to continue toward enrollment.",
    cta: "View Offer",
  },
  admission_accepted: {
    message: "Action needed — pay your school fee to complete enrollment.",
    cta: "Pay School Fee",
  },
};

export default function PortalPage() {
  const router = useRouter();
  const [data, setData] = useState<MeApplicationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [acceptingAdmission, setAcceptingAdmission] = useState(false);
  const [method, setMethod] = useState<"manual" | "razz" | null>(null);
  const [creatingVA, setCreatingVA] = useState(false);
  const [tab, setTab] = useState<TabKey>("personal");

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

  // A fresh fee-collecting stage (a new application, or moving on to the
  // school fee after accepting admission) should always start back at the
  // method picker, not whatever was chosen for a previous stage.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMethod(null);
  }, [data?.application.status]);

  function logout() {
    studentAuth.clear();
    router.push("/");
  }

  async function selectMethod(feeType: FeeType, chosen: "manual" | "razz") {
    if (chosen === "manual") {
      setMethod("manual");
      return;
    }
    const token = studentAuth.get();
    if (!token) return;
    setCreatingVA(true);
    setActionError(null);
    try {
      await createVirtualAccount(feeType, token);
      setMethod("razz");
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not set up instant transfer.");
    } finally {
      setCreatingVA(false);
    }
  }

  async function cancelMethod(feeType: FeeType) {
    const token = studentAuth.get();
    if (!token) return;
    setActionError(null);
    try {
      await cancelVirtualAccount(feeType, token);
      setMethod(null);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not cancel — please try again.");
    }
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
  const actionNeeded = ACTION_NEEDED[app.status];

  function renderPaymentSection(
    feeType: FeeType,
    uploadLabel: string,
    onUpload: (file: File) => Promise<void>,
  ) {
    const methods = paymentInfo.paymentMethods;
    const existingVA = app.virtualAccounts?.find(
      (v) => v.type === feeType && v.status !== "expired",
    );
    if (existingVA) {
      return (
        <VirtualAccountCard
          account={existingVA}
          type={feeType}
          currency={paymentInfo.currency}
          token={studentAuth.get() || ""}
          onPaid={load}
          onCancel={methods.manual ? () => cancelMethod(feeType) : undefined}
        />
      );
    }

    if (!methods.manual && !methods.razz) {
      return (
        <p className="text-sm text-ink/60">
          Payment is temporarily unavailable — please contact admissions.
        </p>
      );
    }

    // Only auto-select a method when just one is enabled — with both
    // enabled, let the student choose via PaymentMethodPicker instead of
    // silently defaulting to manual and hiding the online option.
    const onlyMethodAvailable =
      methods.manual && methods.razz ? null : methods.razz ? "razz" : methods.manual ? "manual" : null;
    const chosen = method ?? onlyMethodAvailable;

    if (!chosen) {
      return <PaymentMethodPicker onSelect={(m) => selectMethod(feeType, m)} />;
    }

    if (chosen === "razz") {
      // Only actually mid-flight while creatingVA is true — chosen can also
      // read "razz" as a stale leftover (e.g. the VA naturally expired), in
      // which case fall back to letting them pick again rather than getting
      // stuck on this spinner forever.
      if (creatingVA) {
        return (
          <div className="flex items-center gap-2 text-sm text-ink/60">
            <Loader2 className="size-4 animate-spin" /> Setting up your instant transfer…
          </div>
        );
      }
      return <PaymentMethodPicker onSelect={(m) => selectMethod(feeType, m)} />;
    }

    return (
      <>
        <PaymentInfoCard info={paymentInfo} kind={feeType} />
        <FileUploadBox label={uploadLabel} onUpload={onUpload} />
        {methods.razz && (
          <button
            type="button"
            onClick={() => setMethod(null)}
            className="text-xs font-semibold text-ink/40 hover:text-ink/70"
          >
            Picked this by mistake? Choose a different payment method
          </button>
        )}
      </>
    );
  }

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

        {app.status === "rejected" && app.rejectionReason && (
          <Reveal delay={0.12} className="mt-6 rounded-3xl border border-accent-500/20 bg-accent-500/5 p-6">
            <h3 className="font-semibold text-accent-600">Reason</h3>
            <p className="mt-2 text-sm text-ink/70">{app.rejectionReason}</p>
          </Reveal>
        )}

        {actionNeeded && (
          <Reveal delay={0.12} className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold-400/30 bg-gold-400/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <CircleDollarSign className="size-5 shrink-0 text-gold-400" />
              <p className="text-sm font-medium text-ink/80">{actionNeeded.message}</p>
            </div>
            <Button size="md" variant="accent" onClick={() => setTab("finance")}>
              {actionNeeded.cta}
            </Button>
          </Reveal>
        )}

        <Reveal delay={0.14} className="mt-8 flex flex-wrap gap-2 border-b border-ink/10">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 rounded-t-xl px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-b-2 border-primary-600 text-primary-700"
                    : "border-b-2 border-transparent text-ink/45 hover:text-ink/70"
                }`}
              >
                <t.icon className="size-4" /> {t.label}
              </button>
            );
          })}
        </Reveal>

        <div className="mt-8">
          {tab === "personal" && (
            <Reveal className="space-y-6">
              <div className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
                <h2 className="font-semibold text-ink">Personal Details</h2>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <InfoRow label="Full Name" value={`${app.student?.firstName || ""} ${app.student?.lastName || ""}`.trim()} />
                  <InfoRow label="Email" value={app.student?.email} />
                  <InfoRow label="Phone" value={app.student?.phone} />
                  <InfoRow label="Date of Birth" value={app.dateOfBirth} />
                  <InfoRow label="Gender" value={app.gender} />
                  <InfoRow label="State of Origin" value={app.stateOfOrigin} />
                  <InfoRow label="Address" value={app.address} />
                  <InfoRow label="Guardian" value={app.guardianName ? `${app.guardianName} (${app.guardianPhone})` : ""} />
                </dl>
              </div>
              <div className="rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
                <h2 className="font-semibold text-ink">Academic Background</h2>
                <dl className="mt-4 space-y-2.5 text-sm">
                  <InfoRow label="Programme" value={app.program?.name} />
                  <InfoRow label="School Attended" value={app.schoolAttended} />
                  <InfoRow label="Qualification" value={app.qualificationType} />
                  <InfoRow label="Exam" value={app.examType ? `${app.examType} — ${app.examNumber}` : ""} />
                  {app.subjects && <InfoRow label="Subjects" value={app.subjects} multiline />}
                </dl>
              </div>
            </Reveal>
          )}

          {tab === "result" && (
            <Reveal className="flex items-center gap-3 rounded-3xl border border-ink/10 bg-white p-6 text-sm text-ink/60 sm:p-8">
              <ClipboardList className="size-5 shrink-0 text-ink/30" />
              Your results will be published here once released by the exams office.
            </Reveal>
          )}

          {tab === "finance" && (
            <Reveal className="space-y-6">
              {actionError && (
                <p className="rounded-2xl bg-accent-500/10 px-5 py-4 text-sm font-medium text-accent-600">{actionError}</p>
              )}

              {app.status === "submitted" &&
                renderPaymentSection(
                  "application_fee",
                  "Upload application fee payment proof",
                  uploadApplicationFeeProof,
                )}

              {app.status === "application_fee_review" && (
                <div className="flex items-center gap-3 rounded-2xl bg-gold-400/10 px-5 py-4 text-sm font-medium text-ink/70">
                  <FileClock className="size-5 shrink-0 text-gold-400" />
                  Your application fee proof is being reviewed by our admissions team.
                </div>
              )}

              {app.status === "under_review" && (
                <div className="flex items-center gap-3 rounded-2xl bg-primary-600/5 px-5 py-4 text-sm font-medium text-ink/70">
                  <FileClock className="size-5 shrink-0 text-primary-600" />
                  Your payment is confirmed — your application is now under review.
                </div>
              )}

              {app.status === "accepted" && (
                <div className="space-y-6 rounded-3xl border border-primary-600/15 bg-primary-600/5 p-6 sm:p-8">
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
                </div>
              )}

              {app.status === "admission_accepted" && (
                <div className="space-y-6">
                  {app.admissionLetter && (
                    <Button variant="outline" onClick={() => viewFile(app.admissionLetter!.fileUrl)}>
                      <Download className="size-4" /> View admission letter
                    </Button>
                  )}
                  {renderPaymentSection(
                    "school_fee",
                    "Upload school fee payment proof",
                    uploadSchoolFeeProof,
                  )}
                </div>
              )}

              {app.status === "school_fee_review" && (
                <div className="flex items-center gap-3 rounded-2xl bg-gold-400/10 px-5 py-4 text-sm font-medium text-ink/70">
                  <FileClock className="size-5 shrink-0 text-gold-400" />
                  Your school fee payment proof is being reviewed.
                </div>
              )}

              {app.status === "enrolled" && (
                <div className="flex items-center gap-3 rounded-3xl border border-primary-600/15 bg-primary-600/5 p-6 text-ink/70">
                  <FileCheck2 className="size-6 shrink-0 text-primary-600" />
                  <p className="text-sm">
                    You&apos;re officially enrolled at Frontline College! Resumption details will be sent to your email.
                  </p>
                </div>
              )}

              {["rejected", "application_fee_review"].includes(app.status) && !app.paymentProofs?.length && (
                <p className="text-sm text-ink/50">No fee payment is due at this stage.</p>
              )}

              {(app.paymentProofs?.length ?? 0) > 0 && (
                <div>
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
                              {!p.fileUrl && (
                                <span className="ml-2 text-xs font-normal text-primary-600">via Razz</span>
                              )}
                            </p>
                            <p className="text-xs text-ink/45">{new Date(p.uploadedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium capitalize text-ink/50">{p.status}</span>
                          {p.fileUrl && (
                            <button onClick={() => viewFile(p.fileUrl)} className="text-xs font-semibold text-primary-600 hover:underline">
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Reveal>
          )}

          {tab === "notices" && (
            <Reveal>
              <NoticeBoard />
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoRow({ label, value, multiline }: { label: string; value?: string; multiline?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-ink/5 pb-2.5 last:border-0">
      <dt className="shrink-0 text-ink/45">{label}</dt>
      <dd className={`text-right font-medium text-ink ${multiline ? "whitespace-pre-line" : ""}`}>{value || "—"}</dd>
    </div>
  );
}
