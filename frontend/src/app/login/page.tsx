"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Field, TextInput } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";
import { studentAuth } from "@/lib/auth";

export default function StudentLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ token: string }>("/auth/login", { method: "POST", body: { email, password } });
      studentAuth.set(res.token);
      router.push("/portal");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-[85svh] items-center bg-ice-50 pb-16 pt-36 sm:pt-40">
      <div className="mx-auto w-full max-w-md px-5 sm:px-8">
        <Reveal className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary-600/10 text-primary-600">
            <LogIn className="size-5" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink">Applicant Portal Login</h1>
          <p className="mt-2 text-sm text-ink/50">Log in to track your application status.</p>
        </Reveal>

        <Reveal delay={0.08}>
          <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-primary-600/10 bg-white p-8 shadow-[0_1px_2px_rgba(11,31,58,0.06)]">
            <Field label="Email address">
              <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <TextInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
            </Field>
            {error && <p className="rounded-xl bg-accent-500/10 px-4 py-3 text-sm font-medium text-accent-600">{error}</p>}
            <Button type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Log in"}
            </Button>
          </form>
        </Reveal>

        <Reveal delay={0.16} className="mt-6 text-center text-sm text-ink/50">
          Haven&apos;t applied yet?{" "}
          <Link href="/apply" className="font-medium text-primary-600">
            Start your application
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
