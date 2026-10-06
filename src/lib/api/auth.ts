import type { AdminPrincipal, AdminProfile, TwoFactorEnrollment } from "@/types/admin";

/** Client for the same-origin auth BFF (/api/auth/*). Tokens never reach the browser. */

export type LoginResult =
  | { status: "authenticated"; user: AdminPrincipal; backup_codes?: string[] }
  | { status: "requires_2fa" }
  | { status: "requires_2fa_setup" };

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    /** Set by the password-reset routes: "invalid_link" means the link is unusable (expired, used, malformed). */
    public readonly code?: string,
  ) {
    super(message);
  }
}

async function call<T>(action: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/auth/${action}`, {
      method: init.method ?? "POST",
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch {
    throw new AuthError("Network error — check your connection and retry.", 0);
  }
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const failure = payload as { message?: string; code?: string } | null;
    throw new AuthError(failure?.message ?? `Request failed (HTTP ${res.status}).`, res.status, failure?.code);
  }
  return payload as T;
}

export const authApi = {
  login: (email: string, password: string) => call<LoginResult>("login", { body: { email, password } }),
  verify2fa: (token: string) => call<LoginResult>("2fa-verify", { body: { token } }),
  enable2fa: () => call<TwoFactorEnrollment>("2fa-enable", { body: {} }),
  confirm2fa: (token: string) => call<LoginResult>("2fa-confirm", { body: { token } }),
  refresh: () => call<LoginResult>("refresh", { body: {} }),
  logout: () => call<{ status: string }>("logout", { body: {} }),
  me: () => call<AdminProfile>("me", { method: "GET" }),
  /** Always resolves the same way for any address: the backend never says whether the account exists. */
  forgotPassword: (email: string) => call<{ status: string }>("forgot-password", { body: { email } }),
  resetPassword: (token: string, password: string, confirmPassword: string) =>
    call<{ status: string }>("reset-password", { body: { token, password, confirmPassword } }),
};
