"use client";

import { useCallback, useMemo, useState } from "react";

export type TableDensity = "compact" | "comfortable";

interface StoredPrefs {
  density?: TableDensity;
  hidden?: string[];
}

function storageKey(id: string) {
  return `vm-table:${id}`;
}

function read(id: string): StoredPrefs {
  try {
    const raw = localStorage.getItem(storageKey(id));
    return raw ? (JSON.parse(raw) as StoredPrefs) : {};
  } catch {
    return {};
  }
}

function write(id: string, prefs: StoredPrefs) {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(prefs));
  } catch {
    // storage unavailable: preferences last for this page view only
  }
}

/**
 * Per-table view preferences (row density, hidden columns), remembered per
 * browser. UI convenience only — never holds data.
 */
export function useTablePrefs(id: string, defaults: { density?: TableDensity; hidden?: string[] } = {}) {
  const [prefs, setPrefs] = useState<StoredPrefs>(() => {
    const stored = typeof window === "undefined" ? {} : read(id);
    return { density: stored.density ?? defaults.density ?? "comfortable", hidden: stored.hidden ?? defaults.hidden ?? [] };
  });

  const persist = useCallback(
    (next: StoredPrefs) => {
      setPrefs(next);
      write(id, next);
    },
    [id],
  );

  const hidden = useMemo(() => new Set(prefs.hidden ?? []), [prefs.hidden]);

  const setDensity = useCallback((density: TableDensity) => persist({ ...prefs, density }), [persist, prefs]);

  const toggleColumn = useCallback(
    (columnId: string) => {
      const next = new Set(hidden);
      if (next.has(columnId)) next.delete(columnId);
      else next.add(columnId);
      persist({ ...prefs, hidden: [...next] });
    },
    [hidden, persist, prefs],
  );

  const resetColumns = useCallback(() => persist({ ...prefs, hidden: defaults.hidden ?? [] }), [defaults.hidden, persist, prefs]);

  return { density: prefs.density ?? "comfortable", setDensity, hidden, toggleColumn, resetColumns };
}

export type TablePrefs = ReturnType<typeof useTablePrefs>;
