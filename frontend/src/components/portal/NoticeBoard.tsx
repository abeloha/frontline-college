"use client";

import { useEffect, useState } from "react";
import { Loader2, Pin, Paperclip, Megaphone, Briefcase, AlertTriangle, type LucideIcon } from "lucide-react";
import { apiFetch, ApiError, openAuthedFile } from "@/lib/api";
import { studentAuth } from "@/lib/auth";
import type { Notice } from "@/lib/types";

export function NoticeBoard() {
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = studentAuth.get();
    if (!token) return;
    apiFetch<{ data: Notice[] }>("/student/notices", { token })
      .then((res) => setNotices(res.data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load notices."));
  }, []);

  async function viewAttachment(path: string) {
    const token = studentAuth.get();
    if (!token) return;
    try {
      await openAuthedFile(path, token);
    } catch {
      setError("Could not open attachment.");
    }
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-accent-600">
        <AlertTriangle className="size-4 shrink-0" /> {error}
      </div>
    );
  }

  if (notices === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-ink/50">
        <Loader2 className="size-4 animate-spin" /> Loading notices…
      </div>
    );
  }

  const placements = notices.filter((n) => n.category === "placement");
  const others = notices.filter((n) => n.category !== "placement");

  return (
    <div className="space-y-10">
      <NoticeGroup
        title="Practical Placements"
        icon={Briefcase}
        notices={placements}
        emptyText="No practical placement postings yet — check back once your programme schedules one."
        onView={viewAttachment}
      />
      <NoticeGroup
        title="Noticeboard"
        icon={Megaphone}
        notices={others}
        emptyText="No notices right now."
        onView={viewAttachment}
      />
    </div>
  );
}

function NoticeGroup({
  title,
  icon: Icon,
  notices,
  emptyText,
  onView,
}: {
  title: string;
  icon: LucideIcon;
  notices: Notice[];
  emptyText: string;
  onView: (path: string) => void;
}) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink/40">
        <Icon className="size-4" /> {title}
      </h3>
      {notices.length === 0 ? (
        <p className="mt-3 text-sm text-ink/50">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {notices.map((n) => (
            <div key={n.id} className="rounded-2xl border border-ink/10 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {n.pinned && <Pin className="size-3.5 shrink-0 text-accent-500" />}
                  <h4 className="font-semibold text-ink">{n.title}</h4>
                </div>
                <span className="shrink-0 text-xs text-ink/40">{new Date(n.publishedAt).toLocaleDateString()}</span>
              </div>
              {n.program && <p className="mt-1 text-xs font-medium text-primary-600">{n.program.name}</p>}
              <p className="mt-2 whitespace-pre-line text-sm text-ink/70">{n.body}</p>
              {n.fileUrl && (
                <button
                  onClick={() => onView(n.fileUrl!)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline"
                >
                  <Paperclip className="size-3.5" /> View attachment
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
