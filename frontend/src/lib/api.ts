const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type FetchOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
  isForm?: boolean;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
};

export async function apiFetch<T = unknown>(path: string, opts: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;

  if (opts.isForm) {
    body = opts.body as FormData;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  if (opts.token) {
    headers["Authorization"] = `Bearer ${opts.token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method || "GET",
    headers,
    body,
    cache: opts.cache,
    next: opts.next,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    const message = (data && (data as { error?: string }).error) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export function fileUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  const base = API_URL.replace(/\/api\/?$/, "");
  return `${base}${path}`;
}

// Protected files (payment proofs, admission letters) require a Bearer
// token, so a plain <a href> won't work — fetch as a blob and open it.
export async function openAuthedFile(path: string, token: string) {
  const res = await fetch(fileUrl(path), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new ApiError("Could not load file", res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
