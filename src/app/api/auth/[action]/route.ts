import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import {
  API_BASE,
  clearSession,
  errorMessage,
  getPendingChallenge,
  persistSession,
  readJson,
  refreshSession,
  sessionFromResponse,
  setPendingChallenge,
  unwrap,
  withAdminToken,
} from "@/lib/auth/server-session";
import { BACKEND_REFRESH_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";
import type { TwoFactorEnrollment } from "@/types/admin";

/**
 * Admin auth BFF — wraps /auth/admin/* so tokens stay in httpOnly cookies.
 *
 *   POST /api/auth/login        { email, password }
 *   POST /api/auth/2fa-verify   { token }            (after requires_2fa)
 *   POST /api/auth/2fa-enable                        (setup token or current session)
 *   POST /api/auth/2fa-confirm  { token }            (setup token or current session)
 *   POST /api/auth/refresh
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 */

type Params = { params: Promise<{ action: string }> };

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

function unreachable() {
  return json({ message: `Cannot reach the VitaMind API at ${API_BASE}.` }, 502);
}

async function backend(path: string, init: RequestInit = {}) {
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers as Record<string, string>) },
    cache: "no-store",
  });
}

async function readBody<T>(req: NextRequest): Promise<Partial<T>> {
  try {
    return (await req.json()) as Partial<T>;
  } catch {
    return {};
  }
}

function authFailure(res: Response, payload: unknown, fallback: string) {
  if (res.status === 429) return json({ message: "Too many attempts. Please wait a few minutes and try again." }, 429);
  return json({ message: errorMessage(payload, fallback) }, res.status);
}

/** Opens the session from a backend login-like response and returns the principal. */
async function completeSession(res: Response, payload: unknown) {
  const session = sessionFromResponse(payload, res);
  if (!session) return json({ message: "Unexpected response from the authentication server." }, 502);
  await persistSession(session);
  return json({ status: "authenticated", user: session.user });
}

async function login(req: NextRequest) {
  const { email, password } = await readBody<{ email: string; password: string }>(req);
  if (!email || !password) return json({ message: "Email and password are required." }, 400);

  const res = await backend("/auth/admin/login", { method: "POST", body: JSON.stringify({ email, password }) });
  const payload = await readJson(res);
  if (!res.ok) {
    // The backend deliberately returns the same 401 for unknown, wrong-password and inactive accounts.
    if (res.status === 401) {
      return json({ message: "Invalid credentials, or this admin account is not active." }, 401);
    }
    return authFailure(res, payload, "Sign-in failed.");
  }

  const data = unwrap<{ requires_2fa?: boolean; temp_token?: string; requires_2fa_setup?: boolean; setup_token?: string }>(payload);
  if (data?.requires_2fa && data.temp_token) {
    await setPendingChallenge({ kind: "2fa", token: data.temp_token });
    return json({ status: "requires_2fa" });
  }
  if (data?.requires_2fa_setup && data.setup_token) {
    await setPendingChallenge({ kind: "setup", token: data.setup_token });
    return json({ status: "requires_2fa_setup" });
  }
  return completeSession(res, payload);
}

async function verify2fa(req: NextRequest) {
  const { token } = await readBody<{ token: string }>(req);
  const challenge = await getPendingChallenge();
  if (!challenge || challenge.kind !== "2fa") {
    return json({ message: "Your verification step expired. Please sign in again." }, 401);
  }
  if (!token || !/^\d{6}$/.test(token)) return json({ message: "Enter the 6-digit code from your authenticator app." }, 400);

  const res = await backend("/auth/admin/login/2fa", {
    method: "POST",
    body: JSON.stringify({ temp_token: challenge.token, token }),
  });
  const payload = await readJson(res);
  if (!res.ok) return authFailure(res, payload, "Invalid verification code.");
  return completeSession(res, payload);
}

/** 2FA enrolment accepts the setup token (mandatory-2FA login) or the current access token. */
async function withEnrollmentToken(call: (token: string) => Promise<Response>) {
  const challenge = await getPendingChallenge();
  if (challenge?.kind === "setup") return call(challenge.token);
  return withAdminToken(call);
}

async function enable2fa() {
  const res = await withEnrollmentToken((token) =>
    backend("/auth/admin/2fa/enable", { method: "POST", headers: { Authorization: `Bearer ${token}` } }),
  );
  if (!res) return json({ message: "Your session expired. Please sign in again." }, 401);
  const payload = await readJson(res);
  if (!res.ok) return authFailure(res, payload, "Could not start two-factor enrolment.");
  return json(unwrap<TwoFactorEnrollment>(payload));
}

async function confirm2fa(req: NextRequest) {
  const { token } = await readBody<{ token: string }>(req);
  if (!token || !/^\d{6}$/.test(token)) return json({ message: "Enter the 6-digit code from your authenticator app." }, 400);
  const res = await withEnrollmentToken((bearer) =>
    backend("/auth/admin/2fa/confirm", {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer}` },
      body: JSON.stringify({ token }),
    }),
  );
  if (!res) return json({ message: "Your session expired. Please sign in again." }, 401);
  const payload = await readJson(res);
  if (!res.ok) return authFailure(res, payload, "Invalid verification code.");
  return completeSession(res, payload);
}

async function refresh() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return json({ message: "No active session." }, 401);
  const session = await refreshSession(refreshToken);
  if (!session) {
    await clearSession();
    return json({ message: "Your session expired. Please sign in again." }, 401);
  }
  await persistSession(session);
  return json({ status: "authenticated", user: session.user });
}

async function logout() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    try {
      await backend("/auth/admin/logout", {
        method: "POST",
        headers: { Cookie: `${BACKEND_REFRESH_COOKIE}=${encodeURIComponent(refreshToken)}` },
      });
    } catch {
      // Logout is idempotent; local cookies are cleared regardless.
    }
  }
  await clearSession();
  return json({ status: "signed_out" });
}

async function me() {
  const res = await withAdminToken((token) => backend("/auth/admin/me", { headers: { Authorization: `Bearer ${token}` } }));
  if (!res) return json({ message: "Not authenticated." }, 401);
  const payload = await readJson(res);
  if (!res.ok) {
    if (res.status === 401) await clearSession();
    return json({ message: errorMessage(payload, "Not authenticated.") }, res.status);
  }
  return json(unwrap(payload));
}

async function handle(action: string, req: NextRequest) {
  try {
    switch (action) {
      case "login":
        return await login(req);
      case "2fa-verify":
        return await verify2fa(req);
      case "2fa-enable":
        return await enable2fa();
      case "2fa-confirm":
        return await confirm2fa(req);
      case "refresh":
        return await refresh();
      case "logout":
        return await logout();
      default:
        return json({ message: "Not found" }, 404);
    }
  } catch {
    return unreachable();
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { action } = await params;
  return handle(action, req);
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { action } = await params;
  if (action !== "me") return json({ message: "Method not allowed" }, 405);
  try {
    return await me();
  } catch {
    return unreachable();
  }
}
