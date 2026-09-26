import { SESSION_EXPIRED_EVENT } from "@/lib/auth/constants";

/**
 * Browser API client for the admin back-office. All calls go to the same-origin
 * BFF (/api/admin/* → /api/v1/admin/*), which attaches the admin token from an
 * httpOnly cookie. Responses are unwrapped from the backend envelope and errors
 * are mapped to ApiError with a user-facing message.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() {
    return this.status === 401;
  }
  get isForbidden() {
    return this.status === 403;
  }
  get isConflict() {
    return this.status === 409;
  }
  get isNotImplemented() {
    return this.status === 501;
  }
}

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export function toQueryString(query?: QueryParams): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

const DEFAULT_MESSAGES: Record<number, string> = {
  400: "The request was rejected. Check the values and try again.",
  401: "Your session expired. Please sign in again.",
  403: "Your role is not allowed to perform this operation.",
  404: "This record no longer exists.",
  409: "This action is no longer possible in the record's current state.",
  429: "Too many requests. Please wait a moment and retry.",
  501: "This operation is not implemented by the backend yet.",
  502: "The VitaMind API is unreachable.",
};

function messageFrom(payload: unknown, status: number): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message: unknown }).message;
    if (Array.isArray(message) && message.length) return message.join(", ");
    if (typeof message === "string" && message.trim()) return message;
  }
  return DEFAULT_MESSAGES[status] ?? `Request failed (HTTP ${status}).`;
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "success" in payload && "data" in payload) {
    return (payload as { data: T }).data;
  }
  return payload as T;
}

function notifySessionExpired() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

async function send(path: string, init: { method?: string; query?: QueryParams; body?: unknown; signal?: AbortSignal }) {
  let res: Response;
  try {
    res = await fetch(`/api/admin${path}${toQueryString(init.query)}`, {
      method: init.method ?? "GET",
      headers: init.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: init.signal,
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (error) {
    if ((error as Error)?.name === "AbortError") throw error;
    throw new ApiError("Network error — check your connection and retry.", 0);
  }
  if (!res.ok) {
    const payload = (res.headers.get("content-type") || "").includes("application/json")
      ? await res.json().catch(() => null)
      : null;
    if (res.status === 401) notifySessionExpired();
    throw new ApiError(messageFrom(payload, res.status), res.status);
  }
  return res;
}

export async function apiRequest<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; query?: QueryParams; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const res = await send(path, init);
  if (res.status === 204) return undefined as T;
  const payload = (res.headers.get("content-type") || "").includes("application/json") ? await res.json() : null;
  return unwrap<T>(payload);
}

export const api = {
  get: <T>(path: string, query?: QueryParams, signal?: AbortSignal) => apiRequest<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "POST", body: body ?? {} }),
  put: <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "PUT", body }),
  patch: <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: "PATCH", body: body ?? {} }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};

/** Downloads a file endpoint (CSV exports) and saves it through a temporary link. */
export async function apiDownload(path: string, query?: QueryParams): Promise<{ filename: string; size: number }> {
  const res = await send(path, { query });
  const blob = await res.blob();
  const disposition = res.headers.get("content-disposition") || "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const filename = match ? decodeURIComponent(match[1]) : `${path.split("/").pop() || "export"}.csv`;

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { filename, size: blob.size };
}
