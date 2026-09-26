"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

/** Page sizes the backend accepts (PaginationDto: 1 ≤ limit ≤ 100). */
export const PAGE_SIZES = [10, 20, 50, 100] as const;

/** Keys that never count as "a filter" for the active-filter badge. */
const NON_FILTER_KEYS = new Set(["sort_by", "order"]);

export interface ListStateOptions<F> {
  /**
   * Stable list id. Persists the chosen page size per list, and — with
   * `urlKeys` — scopes URL sync to this list.
   */
  id?: string;
  /**
   * Filter keys mirrored in the query string (plus `page` / `limit`), so a
   * filtered view survives reloads and can be shared as a link. Only these keys
   * are ever read from the URL, so unrelated params never reach the API.
   */
  urlKeys?: readonly (keyof F & string)[];
}

/** URL values are strings; restore booleans / numbers. Free text (`search`) stays text. */
function parseParam(key: string, raw: string): unknown {
  if (raw === "") return undefined;
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (key !== "search" && /^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

function limitStorageKey(id: string) {
  return `vm-list:${id}:limit`;
}

function isPageSize(n: number): boolean {
  return (PAGE_SIZES as readonly number[]).includes(n);
}

function readInitial<F extends object>(initialFilters: F, defaultLimit: number, options: ListStateOptions<F>) {
  let filters = initialFilters;
  let page = 1;
  let limit = defaultLimit;
  if (typeof window === "undefined") return { filters, page, limit };

  if (options.id) {
    try {
      const stored = Number(localStorage.getItem(limitStorageKey(options.id)));
      if (isPageSize(stored)) limit = stored;
    } catch {
      // storage unavailable
    }
  }

  if (options.urlKeys?.length) {
    const params = new URLSearchParams(window.location.search);
    const next: Record<string, unknown> = { ...(initialFilters as Record<string, unknown>) };
    for (const key of options.urlKeys) {
      if (params.has(key)) next[key] = parseParam(key, params.get(key) ?? "");
    }
    filters = next as F;
    const p = Number(params.get("page"));
    if (Number.isInteger(p) && p > 1) page = p;
    const l = Number(params.get("limit"));
    if (isPageSize(l)) limit = l;
  }
  return { filters, page, limit };
}

/**
 * Filters + pagination for list pages. Any filter change resets to page 1.
 * `params` is ready to pass to an API list function.
 */
export function useListState<F extends object>(initialFilters: F, defaultLimit = 20, options: ListStateOptions<F> = {}) {
  // Admin pages render client-side only (after the session check), so reading
  // the URL / storage in the initializer never causes a hydration mismatch.
  const [initial] = useState(() => readInitial(initialFilters, defaultLimit, options));
  const [filters, setFilters] = useState<F>(initial.filters);
  const [page, setPage] = useState(initial.page);
  const [limit, setLimitState] = useState(initial.limit);
  const { id, urlKeys } = options;

  const update = useCallback((patch: Partial<F>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }, []);

  const reset = useCallback(() => {
    setFilters(initialFilters);
    setPage(1);
    // initialFilters is a literal declared by the page; resetting to its first value is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLimit = useCallback(
    (next: number) => {
      if (!isPageSize(next)) return;
      setLimitState(next);
      setPage(1);
      if (id) {
        try {
          localStorage.setItem(limitStorageKey(id), String(next));
        } catch {
          // storage unavailable
        }
      }
    },
    [id],
  );

  const changedKeys = useMemo(
    () =>
      Object.keys({ ...initialFilters, ...filters }).filter((key) => {
        const value = (filters as Record<string, unknown>)[key];
        const start = (initialFilters as Record<string, unknown>)[key];
        return value !== start && !(value === "" && start === undefined);
      }),
    [filters, initialFilters],
  );

  const isFiltered = changedKeys.length > 0;
  const activeFilterCount = changedKeys.filter((key) => !NON_FILTER_KEYS.has(key)).length;

  // Mirror state in the query string (replaceState: no history entry per keystroke).
  const urlSignature = urlKeys ? JSON.stringify([filters, page, limit]) : null;
  useEffect(() => {
    if (!urlKeys?.length) return;
    const params = new URLSearchParams(window.location.search);
    for (const key of urlKeys) params.delete(key);
    params.delete("page");
    params.delete("limit");
    for (const key of urlKeys) {
      const value = (filters as Record<string, unknown>)[key];
      const start = (initialFilters as Record<string, unknown>)[key];
      if (value === start) continue;
      // Empty value = explicitly cleared a filter that has a non-empty default (e.g. status=PENDING → All).
      params.set(key, value === undefined || value === null ? "" : String(value));
    }
    if (page > 1) params.set("page", String(page));
    if (limit !== defaultLimit) params.set("limit", String(limit));
    const qs = params.toString();
    const next = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(null, "", next);
    // urlSignature captures filters/page/limit; initialFilters and urlKeys are page literals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSignature]);

  const params = useMemo(() => ({ ...filters, page, limit }), [filters, page, limit]);

  return { filters, update, reset, page, setPage, limit, setLimit, params, isFiltered, activeFilterCount };
}
