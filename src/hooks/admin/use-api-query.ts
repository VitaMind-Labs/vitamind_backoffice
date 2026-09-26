"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ApiError } from "@/lib/api/client";

/**
 * Minimal query cache: keyed results, in-flight de-duplication, stale-while-
 * revalidate on revisit and prefix invalidation after mutations. Keys are
 * arrays whose first element is the resource name, e.g. ["users", filters].
 */

type Entry = {
  data?: unknown;
  error?: ApiError;
  fetchedAt: number;
  isFetching: boolean;
  version: number;
  promise?: Promise<void>;
  fetcher?: () => Promise<unknown>;
  subscribers: Set<() => void>;
};

const store = new Map<string, Entry>();

function entryFor(key: string): Entry {
  let entry = store.get(key);
  if (!entry) {
    entry = { fetchedAt: 0, isFetching: false, version: 0, subscribers: new Set() };
    store.set(key, entry);
  }
  return entry;
}

function notify(entry: Entry) {
  entry.version += 1;
  entry.subscribers.forEach((fn) => fn());
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(error instanceof Error ? error.message : "Unexpected error", 0);
}

function run(key: string): Promise<void> {
  const entry = entryFor(key);
  if (entry.promise) return entry.promise;
  if (!entry.fetcher) return Promise.resolve();
  entry.isFetching = true;
  notify(entry);
  entry.promise = entry
    .fetcher()
    .then((data) => {
      entry.data = data;
      entry.error = undefined;
      entry.fetchedAt = Date.now();
    })
    .catch((error) => {
      entry.error = toApiError(error);
      entry.fetchedAt = Date.now();
    })
    .finally(() => {
      entry.isFetching = false;
      entry.promise = undefined;
      notify(entry);
    });
  return entry.promise;
}

/** Marks every query whose key starts with one of the resource names as stale, refetching mounted ones. */
export function invalidateQueries(...resources: string[]) {
  for (const [key, entry] of store) {
    const match = resources.some((r) => key === `["${r}"]` || key.startsWith(`["${r}",`));
    if (!match) continue;
    entry.fetchedAt = 0;
    if (entry.subscribers.size > 0) void run(key);
  }
}

export interface QueryResult<T> {
  data: T | undefined;
  error: ApiError | undefined;
  /** First load, no data yet. */
  isLoading: boolean;
  /** Any request in flight (including background refresh). */
  isFetching: boolean;
  /** `data` belongs to the previous key (keepPrevious) while the new key loads. */
  isPlaceholder: boolean;
  refetch: () => Promise<void>;
}

export function useApiQuery<T>(
  key: readonly unknown[] | null,
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean;
    staleTime?: number;
    /** Keep showing the last result while a new key (page, filters) loads — avoids skeleton flashes on large lists. */
    keepPrevious?: boolean;
    /** Background refresh interval in ms while the tab is visible (live counters). */
    refetchInterval?: number;
  } = {},
): QueryResult<T> {
  const { enabled = true, staleTime = 30_000, keepPrevious = false, refetchInterval } = options;
  const hash = key && enabled ? JSON.stringify(key) : null;
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (!hash) return () => {};
      const entry = entryFor(hash);
      entry.subscribers.add(onChange);
      return () => entry.subscribers.delete(onChange);
    },
    [hash],
  );
  useSyncExternalStore(
    subscribe,
    () => (hash ? entryFor(hash).version : -1),
    () => -1,
  );

  useEffect(() => {
    if (!hash) return;
    const entry = entryFor(hash);
    entry.fetcher = () => fetcherRef.current();
    if (!entry.fetchedAt || Date.now() - entry.fetchedAt > staleTime) void run(hash);
  }, [hash, staleTime]);

  useEffect(() => {
    if (!hash || !refetchInterval) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void run(hash);
    }, refetchInterval);
    return () => clearInterval(timer);
  }, [hash, refetchInterval]);

  const refetch = useCallback(() => (hash ? run(hash) : Promise.resolve()), [hash]);

  const entry = hash ? store.get(hash) : undefined;
  const current = entry?.data as T | undefined;

  // Last settled result, kept across key changes (adjust-state-during-render pattern).
  const [previous, setPrevious] = useState<T | undefined>(undefined);
  if (keepPrevious && current !== undefined && current !== previous) setPrevious(current);
  const placeholder = keepPrevious && current === undefined && !entry?.error ? previous : undefined;
  const data = current ?? placeholder;

  return {
    data,
    error: entry?.error,
    isLoading: !!hash && data === undefined && !entry?.error,
    isFetching: !!entry?.isFetching || (placeholder !== undefined && !!hash),
    isPlaceholder: placeholder !== undefined,
    refetch,
  };
}
