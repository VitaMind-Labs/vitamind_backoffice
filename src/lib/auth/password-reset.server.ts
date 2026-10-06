import { API_BASE, errorMessage, readJson } from "@/lib/auth/server-session";

/**
 * Password reset calls to the backend. Public on purpose (the admin is signed out): no session, no refresh,
 * no cookies. The backend decides everything; this only carries the request and maps the outcome to something
 * safe to show. Server-only (route handler + the reset page).
 */
const AUDIENCE = "backoffice";

export type ResetCode = "ok" | "invalid_link" | "rate_limited" | "validation" | "unavailable";
export interface ResetOutcome {
  code: ResetCode;
  /** Safe to show; empty on success. */
  message: string;
}

const MESSAGES = {
  invalid_link: "This reset link is invalid or has expired. Request a new one.",
  rate_limited: "Too many attempts. Please wait a few minutes and try again.",
  unavailable: "We could not reach the server. Please try again in a moment.",
} as const;

export async function callPasswordReset(
  path: "forgot-password" | "verify-reset-token" | "reset-password",
  body: Record<string, string>,
): Promise<ResetOutcome> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, audience: AUDIENCE }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { code: "unavailable", message: MESSAGES.unavailable };
  }
  if (res.ok) return { code: "ok", message: "" };
  if (res.status === 429) return { code: "rate_limited", message: MESSAGES.rate_limited };
  if (res.status === 400) {
    // The backend's 400 texts are deliberate and safe (invalid link, passwords do not match, too short).
    const text = errorMessage(await readJson(res), "");
    return !text || /invalid or has expired/i.test(text)
      ? { code: "invalid_link", message: MESSAGES.invalid_link }
      : { code: "validation", message: text };
  }
  return { code: "unavailable", message: MESSAGES.unavailable };
}
