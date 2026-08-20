"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { applySchema, STEP_FIELDS, type ApplyFormValues } from "@/lib/validation";
import { Field, Select, TextArea, TextInput } from "./FormField";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";
import { studentAuth } from "@/lib/auth";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import type { Program } from "@/lib/types";
import Image from "next/image";

const STEP_TITLES = ["Programme", "Personal Details", "Academic Background", "Create Your Account"];

export function ApplyForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [applicationNumber, setApplicationNumber] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ApplyFormValues>({
    resolver: zodResolver(applySchema),
    mode: "onTouched",
    defaultValues: { programId: 0, subjects: "" },
  });

  useEffect(() => {
    apiFetch<Program[]>("/programs")
      .then((data) => {
        setPrograms(data);
        const preselect = new URLSearchParams(window.location.search).get("program");
        if (preselect) {
          const match = data.find((p) => p.slug === preselect);
          if (match) setValue("programId", match.id, { shouldValidate: true });
        }
      })
      .catch(() => setPrograms([]))
      .finally(() => setLoadingPrograms(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedProgramId = watch("programId");

  async function goNext() {
    const fields = STEP_FIELDS[step];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, STEP_TITLES.length - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const onSubmit = async (values: ApplyFormValues) => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { confirmPassword: _confirmPassword, ...payload } = values;
      void _confirmPassword;
      const res = await apiFetch<{ token: string; applicationNumber: string }>("/apply", {
        method: "POST",
        body: payload,
      });
      studentAuth.set(res.token);
      setApplicationNumber(res.applicationNumber);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const categories = useMemo(() => Array.from(new Set(programs.map((p) => p.category))), [programs]);

  if (applicationNumber) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-primary-600/10 bg-white p-10 text-center shadow-xl">
        <CheckCircle2 className="mx-auto size-14 text-primary-600" />
        <h2 className="mt-6 font-display text-2xl font-semibold text-ink">Application submitted!</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">
          Your application number is
          <span className="mx-1.5 font-semibold text-primary-600">{applicationNumber}</span>
          We&apos;ve saved it to your new applicant account and sent a confirmation email. Head to your
          portal to view the application fee account details and next steps.
        </p>
        <Button className="mt-8 w-full justify-center" onClick={() => router.push("/portal")}>
          Go to my portal
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <ol className="mb-10 flex items-center justify-between gap-2">
        {STEP_TITLES.map((title, i) => (
          <li key={title} className="flex flex-1 flex-col items-center gap-2">
            <div
              className={`flex size-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                i < step
                  ? "bg-primary-600 text-white"
                  : i === step
                  ? "bg-accent-500 text-white"
                  : "bg-ink/5 text-ink/40"
              }`}
            >
              {i < step ? <CheckCircle2 className="size-4" /> : i + 1}
            </div>
            <span className={`hidden text-center text-[11px] font-medium sm:block ${i === step ? "text-ink" : "text-ink/40"}`}>
              {title}
            </span>
          </li>
        ))}
      </ol>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl border border-primary-600/10 bg-white p-6 shadow-[0_1px_2px_rgba(11,31,58,0.06)] sm:p-10">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            {step === 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Choose your programme</h2>
                <p className="mt-1 text-sm text-ink/50">Select the diploma track you&apos;d like to apply for.</p>

                {loadingPrograms ? (
                  <div className="mt-8 flex items-center gap-2 text-sm text-ink/50">
                    <Loader2 className="size-4 animate-spin" /> Loading programmes…
                  </div>
                ) : (
                  <div className="mt-6 space-y-6">
                    {categories.map((category) => (
                      <div key={category}>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/40">{category}</h3>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {programs
                            .filter((p) => p.category === category)
                            .map((p) => (
                              <button
                                type="button"
                                key={p.id}
                                onClick={() => setValue("programId", p.id, { shouldValidate: true })}
                                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                                  selectedProgramId === p.id
                                    ? "border-primary-600 bg-primary-600/5"
                                    : "border-ink/10 hover:border-primary-600/30"
                                }`}
                              >
                                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                                  <Image src={p.imageUrl} alt="" fill className="object-cover" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-ink">{p.name}</p>
                                  <p className="text-xs text-ink/50">{p.durationYears} {p.durationYears === 1 ? "year" : "years"}</p>
                                </div>
                              </button>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.programId && <p className="mt-4 text-xs font-medium text-accent-600">{errors.programId.message}</p>}
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Personal details</h2>
                <p className="mt-1 text-sm text-ink/50">Tell us a little about yourself.</p>
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="First name" error={errors.firstName?.message}>
                    <TextInput {...register("firstName")} placeholder="Amaka" />
                  </Field>
                  <Field label="Last name" error={errors.lastName?.message}>
                    <TextInput {...register("lastName")} placeholder="Okafor" />
                  </Field>
                  <Field label="Email address" error={errors.email?.message}>
                    <TextInput type="email" {...register("email")} placeholder="you@example.com" />
                  </Field>
                  <Field label="Phone number" error={errors.phone?.message}>
                    <TextInput {...register("phone")} placeholder="080X XXX XXXX" />
                  </Field>
                  <Field label="Date of birth" error={errors.dateOfBirth?.message}>
                    <TextInput type="date" {...register("dateOfBirth")} />
                  </Field>
                  <Field label="Gender" error={errors.gender?.message}>
                    <Select {...register("gender")} defaultValue="">
                      <option value="" disabled>Select gender</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                    </Select>
                  </Field>
                  <Field label="State of origin" error={errors.stateOfOrigin?.message}>
                    <Select {...register("stateOfOrigin")} defaultValue="">
                      <option value="" disabled>Select state</option>
                      {NIGERIAN_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Residential address" error={errors.address?.message}>
                    <TextInput {...register("address")} placeholder="Street, city" />
                  </Field>
                  <Field label="Parent/guardian name" error={errors.guardianName?.message}>
                    <TextInput {...register("guardianName")} placeholder="Full name" />
                  </Field>
                  <Field label="Parent/guardian phone" error={errors.guardianPhone?.message}>
                    <TextInput {...register("guardianPhone")} placeholder="080X XXX XXXX" />
                  </Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Academic background</h2>
                <p className="mt-1 text-sm text-ink/50">Your most recent qualification.</p>
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Last school attended" error={errors.schoolAttended?.message}>
                    <TextInput {...register("schoolAttended")} placeholder="e.g. Government Secondary School, Kuje" />
                  </Field>
                  <Field label="Qualification type" error={errors.qualificationType?.message}>
                    <Select {...register("qualificationType")} defaultValue="">
                      <option value="" disabled>Select qualification</option>
                      <option value="SSCE / O-Level">SSCE / O-Level</option>
                      <option value="National Diploma">National Diploma</option>
                      <option value="NCE">NCE</option>
                      <option value="Other">Other</option>
                    </Select>
                  </Field>
                  <Field label="Examination type" error={errors.examType?.message}>
                    <Select {...register("examType")} defaultValue="">
                      <option value="" disabled>Select exam body</option>
                      <option value="WAEC">WAEC</option>
                      <option value="NECO">NECO</option>
                      <option value="NABTEB">NABTEB</option>
                      <option value="Other">Other</option>
                    </Select>
                  </Field>
                  <Field label="Examination number" error={errors.examNumber?.message}>
                    <TextInput {...register("examNumber")} placeholder="e.g. 1234567890" />
                  </Field>
                  <Field
                    label="Subjects & grades (optional)"
                    hint="One per line, e.g. English Language: C4"
                    error={errors.subjects?.message}
                  >
                    <TextArea {...register("subjects")} placeholder={"English Language: C4\nMathematics: C5\nBiology: B3"} />
                  </Field>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Create your account</h2>
                <p className="mt-1 text-sm text-ink/50">
                  Use this to log in and track your application — no payment is required to apply.
                </p>
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Password" error={errors.password?.message}>
                    <TextInput type="password" {...register("password")} placeholder="At least 6 characters" />
                  </Field>
                  <Field label="Confirm password" error={errors.confirmPassword?.message}>
                    <TextInput type="password" {...register("confirmPassword")} placeholder="Repeat password" />
                  </Field>
                </div>

                <div className="mt-8 rounded-2xl bg-ice-50 p-5 text-sm text-ink/60">
                  <p className="font-medium text-ink">Before you submit</p>
                  <p className="mt-1">
                    Applying is free. After submitting, you&apos;ll be able to log in immediately to view
                    application fee account details and upload proof of payment when you&apos;re ready.
                  </p>
                </div>

                {submitError && (
                  <p className="mt-4 rounded-xl bg-accent-500/10 px-4 py-3 text-sm font-medium text-accent-600">{submitError}</p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-between border-t border-ink/10 pt-6">
          <Button type="button" variant="outline" onClick={goBack} disabled={step === 0} className={step === 0 ? "invisible" : ""}>
            <ArrowLeft className="size-4" /> Back
          </Button>
          {step < STEP_TITLES.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Continue <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="submit" variant="accent" disabled={submitting}>
              {submitting ? <Loader2 className="size-4 animate-spin" /> : "Submit Application"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
