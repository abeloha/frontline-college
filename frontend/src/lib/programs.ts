import { apiFetch } from "./api";
import type { Program } from "./types";

/** Server-side fetch helper — swallows errors so marketing pages still
 * render (with an empty list) if the API happens to be unreachable at
 * request time, rather than crashing the whole page. */
export async function getPrograms(): Promise<Program[]> {
  try {
    return await apiFetch<Program[]>("/programs", { cache: "no-store" });
  } catch {
    return [];
  }
}

export async function getProgram(slug: string): Promise<Program | null> {
  try {
    return await apiFetch<Program>(`/programs/${slug}`, { cache: "no-store" });
  } catch {
    return null;
  }
}
