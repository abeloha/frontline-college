"use client";

const STUDENT_TOKEN_KEY = "fchst_student_token";
const ADMIN_TOKEN_KEY = "fchst_admin_token";

export const studentAuth = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(STUDENT_TOKEN_KEY)),
  set: (token: string) => localStorage.setItem(STUDENT_TOKEN_KEY, token),
  clear: () => localStorage.removeItem(STUDENT_TOKEN_KEY),
};

export const adminAuth = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(ADMIN_TOKEN_KEY)),
  set: (token: string) => localStorage.setItem(ADMIN_TOKEN_KEY, token),
  clear: () => localStorage.removeItem(ADMIN_TOKEN_KEY),
};
