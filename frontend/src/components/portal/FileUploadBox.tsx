"use client";

import { useRef, useState } from "react";
import { Loader2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function FileUploadBox({
  onUpload,
  label = "Upload proof of payment",
  accept = ".pdf,.jpg,.jpeg,.png",
}: {
  onUpload: (file: File) => Promise<void>;
  label?: string;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed, please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-dashed border-primary-600/25 bg-white p-6 text-center">
      <UploadCloud className="mx-auto size-8 text-primary-500" />
      <p className="mt-3 text-sm font-medium text-ink">{label}</p>
      <p className="mt-1 text-xs text-ink/45">PDF, JPG or PNG — up to 5MB</p>

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />

      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="outline" size="md" onClick={() => inputRef.current?.click()}>
          {file ? "Change file" : "Choose file"}
        </Button>
        {file && (
          <Button type="button" size="md" onClick={submit} disabled={uploading}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : "Upload"}
          </Button>
        )}
      </div>
      {file && <p className="mt-3 truncate text-xs text-ink/50">{file.name}</p>}
      {error && <p className="mt-3 text-xs font-medium text-accent-600">{error}</p>}
    </div>
  );
}
