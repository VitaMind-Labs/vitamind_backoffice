import { cookies } from "next/headers";
import type { AdminPrincipal } from "@/types/admin";
import { ACCESS_COOKIE, BACKEND_REFRESH_COOKIE, PENDING_COOKIE, REFRESH_COOKIE } from "./constants";

/**
 * Server-only admin session helpers (route handlers).
 *
 * The browser never sees a token: the access JWT and the rotated refresh
 * token are kept in httpOnly cookies on the back-office origin, and every
 * backend call is made server-to-server with `Authorization: Bearer`.
 */

export const API_BASE = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

/** Slightly shorter than the backend's 15 min access JWT so we refresh before it expires. */
const ACCESS_MAX_AGE = 14 * 60;
const DEFAULT_REFRESH_MAX_AGE = 7 * 24 * 60 * 60;
const PENDING_MAX_AGE = 15 * 60;
const isProd = process.env.NODE_ENV === "production";

export interface BackendSession {
  access_token: string;
  user: AdminPrincipal;
  /** Rotated refresh token + expiry parsed from the backend Set-Cookie header. */
  refreshToken?: string;
  refreshExpires?: Date;
}

export interface PendingChallenge {
  kind: "2fa" | "setup";
  token: string;
}

/* ------------------------------------------------------------ envelopes */

export async function readJson(res: Response): Promise<unknown> {
  if (!(res.headers.get("content-type") || "").includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/** Unwraps the backend `{ success, data, timestamp }` envelope. */
export function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

export function errorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message: unknown }).message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

/* --------------------------------------------------------------- cookies */

function parseBackendRefreshCookie(res: Response): { token?: string; expires?: Date } {
  const headers = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  for (const header of headers) {
    const [pair, ...attributes] = header.split(";");
    const eq = pair.indexOf("=");
    if (eq < 0 || pair.slice(0, eq).trim() !== BACKEND_REFRESH_COOKIE) continue;
    const token = decodeURIComponent(pair.slice(eq + 1).trim());
    const expiresAttr = attributes.find((a) => a.trim().toLowerCase().startsWith("expires="));
    const expires = expiresAttr ? new Date(expiresAttr.trim().slice(8)) : undefined;
    return { token: token || undefined, expires: expires && !Number.isNaN(expires.getTime()) ? expires : undefined };
  }
  return {};
}

export function sessionFromResponse(payload: unknown, res: Response): BackendSession | null {
  const data = unwrap<{ access_token?: string; user?: AdminPrincipal }>(payload);
  if (!data?.access_token || !data.user) return null;
  const { token, expires } = parseBackendRefreshCookie(res);
  return { access_token: data.access_token, user: data.user, refreshToken: token, refreshExpires: expires };
}

export async function persistSession(session: BackendSession) {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_MAX_AGE,
  });
  if (session.refreshToken) {
    jar.set(REFRESH_COOKIE, session.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/",
      ...(session.refreshExpires ? { expires: session.refreshExpires } : { maxAge: DEFAULT_REFRESH_MAX_AGE }),
    });
  }
  jar.delete(PENDING_COOKIE);
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(PENDING_COOKIE);
}

export async function setPendingChallenge(challenge: PendingChallenge) {
  const jar = await cookies();
  jar.set(PENDING_COOKIE, JSON.stringify(challenge), {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    path: "/",
    maxAge: PENDING_MAX_AGE,
  });
}

export async function getPendingChallenge(): Promise<PendingChallenge | null> {
  const raw = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingChallenge;
    return parsed?.token && (parsed.kind === "2fa" || parsed.kind === "setup") ? parsed : null;
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------- refresh */

/**
 * The backend rotates refresh tokens and treats the re-use of a revoked token
 * as theft (every session of the admin is revoked). Parallel requests that all
 * hit an expired access token must therefore share ONE refresh call per token;
 * the result stays cached briefly for requests still carrying the old cookie.
 */
const refreshes = new Map<string, Promise<BackendSession | null>>();
const REFRESH_REUSE_WINDOW_MS = 30_000;

async function callRefresh(refreshToken: string): Promise<BackendSession | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/admin/refresh`, {
      method: "POST",
      headers: { Cookie: `${BACKEND_REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return sessionFromResponse(await readJson(res), res);
  } catch {
    return null;
  }
}

export function refreshSession(refreshToken: string): Promise<BackendSession | null> {
  const existing = refreshes.get(refreshToken);
  if (existing) return existing;
  const pending = callRefresh(refreshToken);
  refreshes.set(refreshToken, pending);
  pending.finally(() => setTimeout(() => refreshes.delete(refreshToken), REFRESH_REUSE_WINDOW_MS));
  return pending;
}

/**
 * Runs `call` with a valid access token, refreshing once when the token is
 * missing or rejected (401). Persists the rotated session or clears it.
 */
export async function withAdminToken(call: (accessToken: string) => Promise<Response>): Promise<Response | null> {
  const jar = await cookies();
  let accessToken = jar.get(ACCESS_COOKIE)?.value;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  let refreshed = false;

  const tryRefresh = async () => {
    refreshed = true;
    if (!refreshToken) return null;
    const session = await refreshSession(refreshToken);
    if (session) await persistSession(session);
    else await clearSession();
    return session?.access_token ?? null;
  };

  if (!accessToken) accessToken = (await tryRefresh()) ?? undefined;
  if (!accessToken) return null;

  let res = await call(accessToken);
  if (res.status === 401 && !refreshed) {
    const next = await tryRefresh();
    if (!next) return res;
    res = await call(next);
  }
  return res;
}
