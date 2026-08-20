"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Field, TextInput } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/api";
import { adminAuth } from "@/lib/auth";

export default function AdminLoginPage() {
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
      const res = await apiFetch<{ token: string }>("/auth/admin/login", { method: "POST", body: { email, password } });
      adminAuth.set(res.token);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex min-h-[85svh] items-center bg-navy-950 pb-16 pt-36 sm:pt-40">
      <div className="mx-auto w-full max-w-md px-5 sm:px-8">
        <Reveal className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-white/10 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-white">Admissions Staff Login</h1>
          <p className="mt-2 text-sm text-sky-100/60">Restricted access for admissions officers.</p>
        </Reveal>

        <Reveal delay={0.08}>
          <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-sm">
            <Field label="Email address">
              <TextInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@frontlinecollege.edu.ng" />
            </Field>
            <Field label="Password">
              <TextInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
            </Field>
            {error && <p className="rounded-xl bg-accent-500/10 px-4 py-3 text-sm font-medium text-accent-400">{error}</p>}
            <Button type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Log in"}
            </Button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
