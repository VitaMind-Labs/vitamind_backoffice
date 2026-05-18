// 'use server';

import { cookies } from 'next/headers';
import { API_BASE, TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, AUTH_ENDPOINTS } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface BackendResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  message?: string;
  statusCode?: number;
}

interface BackendErrorResponse {
  success?: false;
  message?: string | string[];
  error?: string;
  code?: string;
  statusCode?: number;
}

async function getCookieStore() {
  return cookies();
}

async function getAccessToken(): Promise<string | undefined> {
  const store = await getCookieStore();
  return store.get(TOKEN_COOKIE)?.value;
}

export function parseSetCookieFromHeader(setCookie: string | null): Record<string, string> {
  const result: Record<string, string> = {};
  if (!setCookie) return result;

  const parts = setCookie.split(';');
  for (const part of parts) {
    const eqIdx = part.indexOf('=');
    if (eqIdx > 0) {
      const key = part.substring(0, eqIdx).trim();
      const val = part.substring(eqIdx + 1).trim();
      if (
        key &&
        val &&
        !['Path', 'Domain', 'Max-Age', 'Expires', 'Secure', 'HttpOnly', 'SameSite'].includes(key)
      ) {
        result[key] = val;
      }
    }
  }

  return result;
}

function isWrappedResponse<T>(value: unknown): value is BackendResponse<T> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'success' in value &&
      typeof (value as { success?: unknown }).success === 'boolean',
  );
}

function getErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;

  const { message, error } = payload as BackendErrorResponse;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return undefined;
}

async function parseResponseBody(res: Response): Promise<unknown | null> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

function unwrapResponseData<T>(payload: unknown): T | null {
  if (payload === null) return null;
  if (isWrappedResponse<T>(payload)) {
    return payload.success ? payload.data : null;
  }
  return payload as T;
}

export async function setAuthCookies(accessToken: string, refreshToken?: string) {
  const store = await getCookieStore();
  store.set(TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 15 * 60, // 15 min
  });

  if (refreshToken) {
    store.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  }
}

export async function clearAuthCookies() {
  const store = await getCookieStore();
  store.delete(TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const store = await getCookieStore();
    const refreshToken = store.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) return null;

    const res = await fetch(`${API_BASE}${AUTH_ENDPOINTS.REFRESH}`, {
      method: 'POST',
      headers: {
        Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}`,
      },
      cache: 'no-store',
    });

    const payload = await parseResponseBody(res);

    if (!res.ok) {
      await clearAuthCookies();
      return null;
    }

    const tokens = unwrapResponseData<{ access_token: string }>(payload);
    if (!tokens?.access_token) {
      await clearAuthCookies();
      return null;
    }

    const nextRefreshToken =
      parseSetCookieFromHeader(res.headers.get('set-cookie'))[REFRESH_TOKEN_COOKIE] ?? refreshToken;

    await setAuthCookies(tokens.access_token, nextRefreshToken);
    return tokens.access_token;
  } catch {
    await clearAuthCookies();
    return null;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: 'no-store',
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        cache: 'no-store',
      });
    } else {
      throw new ApiError('Session expired. Please sign in again.', 401, 'UNAUTHORIZED');
    }
  }

  const payload = await parseResponseBody(res);

  if (!res.ok) {
    throw new ApiError(
      getErrorMessage(payload) || `Request failed with status ${res.status}`,
      (payload as BackendErrorResponse | null)?.statusCode || res.status,
      (payload as BackendErrorResponse | null)?.code,
    );
  }

  const data = unwrapResponseData<T>(payload);
  return (data ?? ({} as T));
}

export async function apiClientFormData<T>(
  endpoint: string,
  formData: FormData,
  method: string = 'POST',
): Promise<T> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: formData,
    cache: 'no-store',
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: formData,
        cache: 'no-store',
      });
    } else {
      throw new ApiError('Session expired. Please sign in again.', 401, 'UNAUTHORIZED');
    }
  }

  const payload = await parseResponseBody(res);

  if (!res.ok) {
    throw new ApiError(
      getErrorMessage(payload) || 'Request failed',
      (payload as BackendErrorResponse | null)?.statusCode || res.status,
      (payload as BackendErrorResponse | null)?.code,
    );
  }

  const data = unwrapResponseData<T>(payload);
  return (data ?? ({} as T));
}
