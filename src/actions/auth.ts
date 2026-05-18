'use server';

import { cookies } from 'next/headers';
import { setAuthCookies, clearAuthCookies, parseSetCookieFromHeader } from './api-client';
import { API_BASE, AUTH_ENDPOINTS, REFRESH_TOKEN_COOKIE, TOKEN_COOKIE } from './config';

interface AdminProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

function extractAuthPayload(payload: unknown): {
  access_token?: string;
  user?: { id: string; email: string; role: string };
} {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    return (payload as { data?: { access_token?: string; user?: { id: string; email: string; role: string } } }).data ?? {};
  }

  return (payload as { access_token?: string; user?: { id: string; email: string; role: string } }) ?? {};
}

export async function login(email: string, password: string) {
  try {
    const res = await fetch(`${API_BASE}${AUTH_ENDPOINTS.SIGNIN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        user: null,
        error: body.message || body.error || `Login failed (HTTP ${res.status})`,
      };
    }

    const json = await res.json();
    const { access_token: accessToken, user } = extractAuthPayload(json);

    if (!accessToken) {
      return { user: null, error: 'Invalid response from server (no access token)' };
    }

    const setCookieHeader = res.headers.get('set-cookie');
    const parsedCookies = parseSetCookieFromHeader(setCookieHeader);
    const refreshToken = parsedCookies[REFRESH_TOKEN_COOKIE];

    await setAuthCookies(accessToken, refreshToken);

    return { user: user!, error: null };
  } catch (error) {
    const message =
      error instanceof TypeError && error.message === 'fetch failed'
        ? `Cannot connect to backend server at ${API_BASE}`
        : error instanceof Error
          ? error.message
          : 'An unexpected error occurred';
    return { user: null, error: message };
  }
}

export async function logout() {
  try {
    const store = await cookies();
    const token = store.get(TOKEN_COOKIE)?.value;
    if (token) {
      await fetch(`${API_BASE}${AUTH_ENDPOINTS.LOGOUT}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      });
    }
  } catch {
    // ignore
  }
  try {
    await clearAuthCookies();
  } catch {
    // ignore
  }
}

export async function getProfile() {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}${AUTH_ENDPOINTS.ME}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Failed to get profile');

  const json = await res.json();
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return (json as { data: AdminProfile }).data;
  }
  return json as AdminProfile;
}

export async function initAdmin(email: string, password: string) {
  const res = await fetch(`${API_BASE}${AUTH_ENDPOINTS.INIT_ADMIN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });
  return res.json();
}

export async function refreshSession() {
  try {
    const store = await cookies();
    const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) {
      await clearAuthCookies();
      return null;
    }

    const res = await fetch(`${API_BASE}${AUTH_ENDPOINTS.REFRESH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      await clearAuthCookies();
      return null;
    }

    const json = await res.json();
    const { access_token: accessToken, user } = extractAuthPayload(json);

    if (!accessToken) {
      await clearAuthCookies();
      return null;
    }

    const setCookieHeader = res.headers.get('set-cookie');
    const parsedCookies = parseSetCookieFromHeader(setCookieHeader);
    const newRefreshToken = parsedCookies[REFRESH_TOKEN_COOKIE] ?? refreshToken;

    await setAuthCookies(accessToken, newRefreshToken);
    return { user: user! };
  } catch {
    await clearAuthCookies();
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    await getProfile();
    return true;
  } catch {
    return false;
  }
}
