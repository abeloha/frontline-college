import { apiFetch } from "@/lib/api";
import type { VirtualAccount } from "@/lib/types";

export type FeeType = "application_fee" | "school_fee";

export function createVirtualAccount(type: FeeType, token: string) {
  return apiFetch<{ virtualAccount: VirtualAccount }>("/student/application/virtual-account", {
    method: "POST",
    token,
    body: { type },
  });
}

export function getVirtualAccount(type: FeeType, token: string) {
  return apiFetch<{ virtualAccount: VirtualAccount }>(
    `/student/application/virtual-account?type=${type}`,
    { token },
  );
}
