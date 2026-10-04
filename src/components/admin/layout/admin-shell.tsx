"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminSessionProvider } from "@/components/admin/providers/admin-session-provider";
import { ErrorState } from "@/components/admin/shared/states";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

const COLLAPSE_KEY = "vm-admin-sidebar-collapsed";

function FullScreenMessage({ children }: { children: ReactNode }) {
  return <div className="grid min-h-dvh place-items-center bg-background px-4">{children}</div>;
}

export function AdminShell({ children }: { children: ReactNode }) {
  // UI preference only (no session data in browser storage). The shell body is
  // rendered after the session check on the client, so this never affects hydration.
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setCollapsed((value) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, value ? "0" : "1");
      } catch {
        // storage unavailable
      }
      return !value;
    });
  }, []);

  // "[" toggles the sidebar (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "[" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return (
    <AdminSessionProvider
      fallback={
        <FullScreenMessage>
          <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <Loader2 className="size-4 animate-spin" /> Verifying your session…
          </div>
        </FullScreenMessage>
      }
      renderError={(message, retry) => (
        <FullScreenMessage>
          <ErrorState error={new Error(message)} title="The admin console couldn’t start" onRetry={retry} />
        </FullScreenMessage>
      )}
    >
      <TooltipProvider delayDuration={200}>
        <div className="flex min-h-dvh bg-background">
          <Sidebar collapsed={collapsed} onToggle={toggle} />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main id="main" className="mx-auto w-full max-w-[1600px] flex-1 animate-in px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </AdminSessionProvider>
  );
}
