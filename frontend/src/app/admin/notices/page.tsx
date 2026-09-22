"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus, Pin, Paperclip, Pencil, Trash2, Eye, EyeOff, X } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError, openAuthedFile } from "@/lib/api";
import { adminAuth } from "@/lib/auth";
import { NOTICE_CATEGORY_LABELS, type Notice, type NoticeCategory, type Program } from "@/lib/types";

const CATEGORY_OPTIONS = Object.entries(NOTICE_CATEGORY_LABELS) as [NoticeCategory, string][];

type FormState = {
  title: string;
  body: string;
  category: NoticeCategory;
  programId: string;
  pinned: boolean;
  published: boolean;
  expiresAt: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  body: "",
  category: "general",
  programId: "",
  pinned: false,
  published: true,
  expiresAt: "",
};

export default function AdminNoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const token = adminAuth.get();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    setLoading(true);
    try {
      const [noticesRes, programsRes] = await Promise.all([
        apiFetch<{ data: Notice[] }>("/admin/notices", { token }),
        apiFetch<Program[]>("/programs"),
      ]);
      setNotices(noticesRes.data);
      setPrograms(programsRes);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        adminAuth.clear();
        router.replace("/admin/login");
        return;
      }
      setError(err instanceof ApiError ? err.message : "Could not load notices.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function startCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowForm(true);
  }

  function startEdit(n: Notice) {
    setEditingId(n.id);
    setForm({
      title: n.title,
      body: n.body,
      category: n.category,
      programId: n.programId ? String(n.programId) : "",
      pinned: n.pinned,
      published: n.published,
      expiresAt: n.expiresAt ? n.expiresAt.slice(0, 10) : "",
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowForm(true);
  }

  async function submit() {
    const token = adminAuth.get();
    if (!token) return;
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("body", form.body);
      fd.append("category", form.category);
      fd.append("pinned", String(form.pinned));
      fd.append("published", String(form.published));
      if (form.programId) fd.append("programId", form.programId);
      if (form.expiresAt) fd.append("expiresAt", form.expiresAt);
      const file = fileInputRef.current?.files?.[0];
      if (file) fd.append("file", file);

      if (editingId) {
        await apiFetch(`/admin/notices/${editingId}`, { method: "PUT", token, isForm: true, body: fd });
      } else {
        await apiFetch("/admin/notices", { method: "POST", token, isForm: true, body: fd });
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save notice.");
    } finally {
      setBusy(false);
    }
  }

  async function togglePublished(n: Notice) {
    const token = adminAuth.get();
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("title", n.title);
      fd.append("body", n.body);
      fd.append("category", n.category);
      fd.append("pinned", String(n.pinned));
      fd.append("published", String(!n.published));
      if (n.programId) fd.append("programId", String(n.programId));
      if (n.expiresAt) fd.append("expiresAt", n.expiresAt.slice(0, 10));
      await apiFetch(`/admin/notices/${n.id}`, { method: "PUT", token, isForm: true, body: fd });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update notice.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    const token = adminAuth.get();
    if (!token) return;
    if (!window.confirm("Delete this notice? This cannot be undone.")) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/admin/notices/${id}`, { method: "DELETE", token });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete notice.");
    } finally {
      setBusy(false);
    }
  }

  async function viewAttachment(path: string) {
    const token = adminAuth.get();
    if (!token) return;
    await openAuthedFile(path, token).catch(() => setError("Could not open file."));
  }

  return (
    <section className="min-h-[85svh] bg-ice-50 pb-24 pt-32 sm:pt-36">
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/50 hover:text-ink">
          <ArrowLeft className="size-4" /> Back to dashboard
        </Link>

        <Reveal delay={0.05} className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Noticeboard</h1>
            <p className="mt-1 text-sm text-ink/50">
              Publish announcements, documents and practical placement postings for students.
            </p>
          </div>
          <Button onClick={startCreate}>
            <Plus className="size-4" /> New Notice
          </Button>
        </Reveal>

        {error && <Reveal className="mt-6 rounded-2xl bg-accent-500/10 px-5 py-4 text-sm font-medium text-accent-600">{error}</Reveal>}

        {showForm && (
          <Reveal delay={0.08} className="mt-6 rounded-3xl border border-ink/10 bg-white p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-ink">{editingId ? "Edit Notice" : "New Notice"}</h2>
              <button onClick={() => setShowForm(false)} className="text-ink/40 hover:text-ink">
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Title"
                className="w-full rounded-xl border border-ink/12 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              <textarea
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                placeholder="Details students will see…"
                rows={4}
                className="w-full rounded-xl border border-ink/12 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as NoticeCategory }))}
                  className="rounded-xl border border-ink/12 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  {CATEGORY_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                <select
                  value={form.programId}
                  onChange={(e) => setForm((f) => ({ ...f, programId: e.target.value }))}
                  className="rounded-xl border border-ink/12 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">All programmes</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-ink/70">
                  <span className="text-ink/45">Expires (optional)</span>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                    className="rounded-xl border border-ink/12 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </label>
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} accept=".pdf,.jpg,.jpeg,.png" className="text-sm text-ink/60" />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    checked={form.pinned}
                    onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))}
                  />
                  Pin to top
                </label>
                <label className="flex items-center gap-2 text-sm text-ink/70">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
                  />
                  Published (visible to students)
                </label>
              </div>

              <div className="flex gap-3">
                <Button onClick={submit} disabled={busy}>
                  {busy ? <Loader2 className="size-4 animate-spin" /> : editingId ? "Save changes" : "Publish notice"}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)} disabled={busy}>Cancel</Button>
              </div>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.12} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-3xl border border-ink/10 bg-white p-16 text-ink/50">
              <Loader2 className="size-5 animate-spin" /> Loading notices…
            </div>
          ) : notices.length === 0 ? (
            <p className="rounded-3xl border border-ink/10 bg-white p-16 text-center text-ink/50">No notices yet.</p>
          ) : (
            <div className="space-y-3">
              {notices.map((n) => (
                <div key={n.id} className="rounded-2xl border border-ink/10 bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {n.pinned && <Pin className="size-3.5 text-accent-500" />}
                        <h3 className="font-semibold text-ink">{n.title}</h3>
                        <span className="rounded-full bg-primary-600/10 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                          {NOTICE_CATEGORY_LABELS[n.category]}
                        </span>
                        {!n.published && (
                          <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-xs font-medium text-ink/50">Draft</span>
                        )}
                      </div>
                      {n.program && <p className="mt-1 text-xs text-ink/45">Scoped to: {n.program.name}</p>}
                      {!n.program && <p className="mt-1 text-xs text-ink/45">All programmes</p>}
                      <p className="mt-2 whitespace-pre-line text-sm text-ink/70">{n.body}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink/40">
                        <span>Posted {new Date(n.publishedAt).toLocaleDateString()}</span>
                        {n.expiresAt && <span>Expires {new Date(n.expiresAt).toLocaleDateString()}</span>}
                        {n.fileUrl && (
                          <button onClick={() => viewAttachment(n.fileUrl!)} className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:underline">
                            <Paperclip className="size-3.5" /> Attachment
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        title={n.published ? "Unpublish" : "Publish"}
                        onClick={() => togglePublished(n)}
                        disabled={busy}
                        className="rounded-lg p-2 text-ink/50 hover:bg-ice-50 hover:text-ink"
                      >
                        {n.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                      <button
                        title="Edit"
                        onClick={() => startEdit(n)}
                        disabled={busy}
                        className="rounded-lg p-2 text-ink/50 hover:bg-ice-50 hover:text-ink"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        title="Delete"
                        onClick={() => remove(n.id)}
                        disabled={busy}
                        className="rounded-lg p-2 text-ink/50 hover:bg-accent-500/10 hover:text-accent-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
