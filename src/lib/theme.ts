"use client";

import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "./theme-script";

export type ThemePreference = "light" | "dark" | "system";

const listeners = new Set<() => void>();
const MEDIA = "(prefers-color-scheme: dark)";

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function apply(preference: ThemePreference) {
  const dark = preference === "dark" || (preference === "system" && window.matchMedia(MEDIA).matches);
  document.documentElement.classList.toggle("dark", dark);
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const media = window.matchMedia(MEDIA);
  const onSystemChange = () => {
    if (readPreference() === "system") apply("system");
    onChange();
  };
  media.addEventListener("change", onSystemChange);
  return () => {
    listeners.delete(onChange);
    media.removeEventListener("change", onSystemChange);
  };
}

export function setTheme(preference: ThemePreference) {
  try {
    if (preference === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // storage unavailable: the choice still applies to this page view
  }
  apply(preference);
  listeners.forEach((fn) => fn());
}

/** Current preference; the server snapshot is "system" so hydration never mismatches. */
export function useTheme(): { preference: ThemePreference; setTheme: (preference: ThemePreference) => void } {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);
  return { preference, setTheme };
}
