"use client";

import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-xl border border-[rgba(26,46,53,0.08)] bg-white/70 px-4 py-2 text-sm font-medium text-muted-foreground backdrop-blur-sm transition hover:bg-white hover:text-foreground"
    >
      <Globe className="h-4 w-4" />
      EN
    </button>
  );
}
