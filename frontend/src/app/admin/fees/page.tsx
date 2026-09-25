"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil, Plus, Trash2, X, Banknote } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { formatMoney } from "@/components/portal/PaymentInfoCard";
import { apiFetch, ApiError } from "@/lib/api";
import { adminAuth } from "@/lib/auth";
import type { FeeStructure } from "@/lib/types";

type EditRow = { label: string; amount: string };

export default function AdminFeesPage() {
  const router = useRouter();
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [rows, setRows] = useState<EditRow[]>([]);

  const load = useCallback(async () => {
    const token = adminAuth.get();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch<{ data: FeeStructure[] }>("/admin/fees", { token });
      setStructures(res.data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        adminAuth.clear();
        router.replace("/admin/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not load fee structures.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function startEdit(fs: FeeStructure) {
    setError(null);
    setEditingId(fs.program.id);
    setRows(
      fs.items.length > 0
        ? fs.items.map((i) => ({ label: i.label, amount: String(i.amount) }))
        : [{ label: "Tuition fee", amount: "0" }],
    );
  }

  function cancelEdit() {
    setEditingId(null);
    setRows([]);
  }

  function addRow() {
    setRows((r) => [...r, { label: "", amount: "0" }]);
  }

  function removeRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  function updateRow(idx: number, field: keyof EditRow, value: string) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));
  }

  const rowsTotal = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  async function save(programId: number) {
    const token = adminAuth.get();
    if (!token) return;

    const items = rows
      .map((r) => ({ label: r.label.trim(), amount: Number(r.amount) }))
      .filter((r) => r.label.length > 0);

    if (rows.some((r) => r.label.trim().length === 0)) {
      setError("Every fee line needs a label — remove any blank rows before saving.");
      return;
    }
    if (items.some((i) => !Number.isFinite(i.amount) || i.amount < 0)) {
      setError("Every fee amount must be a number of 0 or more.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/fees/${programId}`, { method: "PUT", token, body: { items } });
      setEditingId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save fee breakdown.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="min-h-[85svh] bg-ice-50 pb-24 pt-32 sm:pt-36">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 hover:text-ink">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <Reveal delay={0.05} className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">School Fee Management</h1>
            <p className="mt-1 text-sm text-ink/50">
              Set the itemized school-fee breakdown for each programme. Only visible to a student once their
              application has been accepted.
            </p>
          </div>
        </Reveal>

        {error && <Reveal className="mt-6 rounded-2xl bg-accent-500/10 px-5 py-4 text-sm font-medium text-accent-600">{error}</Reveal>}

        <Reveal delay={0.1} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-3xl border border-ink/10 bg-white p-16 text-ink/50">
              <Loader2 className="size-5 animate-spin" /> Loading fee structures…
            </div>
          ) : (
            <div className="space-y-4">
              {structures.map((fs) => {
                const isEditing = editingId === fs.program.id;
                return (
                  <div key={fs.program.id} className="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Banknote className="size-4 text-primary-600" />
                          <h3 className="font-semibold text-ink">{fs.program.name}</h3>
                        </div>
                        <p className="mt-1 text-xs text-ink/45">{fs.program.category}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        {fs.items.length === 0 && !isEditing && (
                          <span className="rounded-full bg-gold-400/15 px-2.5 py-1 text-xs font-medium text-gold-400">
                            Not yet configured
                          </span>
                        )}
                        <span className="font-semibold text-primary-700">
                          {formatMoney(isEditing ? rowsTotal : fs.total, "NGN")}
                        </span>
                        {!isEditing && (
                          <button
                            onClick={() => startEdit(fs)}
                            className="rounded-lg p-2 text-ink/50 hover:bg-ice-50 hover:text-ink"
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {!isEditing && fs.items.length > 0 && (
                      <ul className="mt-4 divide-y divide-ink/5 text-sm">
                        {fs.items.map((item) => (
                          <li key={item.id} className="flex items-center justify-between py-2">
                            <span className="text-ink/60">{item.label}</span>
                            <span className="font-medium text-ink">{formatMoney(item.amount, "NGN")}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {isEditing && (
                      <div className="mt-4 space-y-3">
                        {rows.map((row, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              value={row.label}
                              onChange={(e) => updateRow(idx, "label", e.target.value)}
                              placeholder="Fee label, e.g. Tuition fee"
                              className="flex-1 rounded-xl border border-ink/12 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                            <input
                              value={row.amount}
                              onChange={(e) => updateRow(idx, "amount", e.target.value)}
                              inputMode="numeric"
                              placeholder="Amount"
                              className="w-32 rounded-xl border border-ink/12 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                            />
                            <button
                              onClick={() => removeRow(idx)}
                              className="shrink-0 rounded-lg p-2 text-ink/40 hover:bg-accent-500/10 hover:text-accent-600"
                              title="Remove line"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        ))}

                        <button
                          onClick={addRow}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline"
                        >
                          <Plus className="size-4" /> Add fee line
                        </button>

                        <div className="flex items-center gap-3 pt-2">
                          <Button size="md" onClick={() => save(fs.program.id)} disabled={busy}>
                            {busy ? <Loader2 className="size-4 animate-spin" /> : "Save changes"}
                          </Button>
                          <Button size="md" variant="outline" onClick={cancelEdit} disabled={busy}>
                            <X className="size-4" /> Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
