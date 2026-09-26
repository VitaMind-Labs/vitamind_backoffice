"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { CornerDownLeft, Loader2, LogOut, Monitor, Moon, Search, Sun, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAdminSession } from "@/components/admin/providers/admin-session-provider";
import { RiskBadge } from "@/components/admin/shared/status-badge";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { usersApi } from "@/lib/api/users";
import { formatRelative, patientRef } from "@/lib/formatters";
import { setTheme } from "@/lib/theme";
import { useVisibleNavigation } from "./sidebar";

const itemClass =
  "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-foreground outline-none data-[selected=true]:bg-accent [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";
const groupClass =
  "px-1.5 py-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-subtle-foreground";

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Opens with ⌘K / Ctrl+K anywhere in the console. */
export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);
}

/**
 * Global jump-to: pages the role can open, and a server-side patient search
 * (nickname / email) so it scales to any number of accounts.
 */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const { can, signOut } = useAdminSession();
  const groups = useVisibleNavigation();
  const [query, setQuery] = useState("");
  const term = useDebounced(query.trim(), 250);
  const canSearch = can("users.list") && term.length >= 2;

  const patients = useApiQuery(["users", "palette", term], () => usersApi.list({ search: term, limit: 6 }), {
    enabled: open && canSearch,
    staleTime: 60_000,
  });

  const close = () => {
    onOpenChange(false);
    setQuery("");
  };
  const go = (href: string) => {
    close();
    router.push(href);
  };

  const needle = query.trim().toLowerCase();
  const pages = groups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.label }))).filter(
    (item) => !needle || item.label.toLowerCase().includes(needle) || item.group.toLowerCase().includes(needle),
  );

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent hideClose className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command shouldFilter={false} loop className="flex flex-col">
          <div className="flex items-center gap-2.5 border-b px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder={can("users.list") ? "Jump to a page or search patients by nickname / email…" : "Jump to a page…"}
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-subtle-foreground"
            />
            {patients.isFetching && canSearch && <Loader2 className="size-4 animate-spin text-subtle-foreground" aria-label="Searching" />}
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">ESC</kbd>
          </div>
          <Command.List className="scrollbar-thin max-h-[min(60vh,420px)] overflow-y-auto py-1">
            <Command.Empty className="px-4 py-10 text-center text-[13px] text-muted-foreground">
              {canSearch && patients.isLoading ? "Searching patients…" : "No matching pages or patients."}
            </Command.Empty>

            {canSearch && (patients.data?.data.length ?? 0) > 0 && (
              <Command.Group heading={`Patients · ${patients.data?.total ?? 0} match${patients.data?.total === 1 ? "" : "es"}`} className={groupClass}>
                {patients.data?.data.map((u) => (
                  <Command.Item key={u.id} value={`patient-${u.id}`} onSelect={() => go(`/admin/users/${u.id}`)} className={itemClass}>
                    <UserRound />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium tabular-nums">{patientRef(u.patientNumber)}</span>
                      <span className="ml-2 truncate text-muted-foreground">{u.nickname}</span>
                    </span>
                    <span className="hidden text-xs text-subtle-foreground sm:inline">
                      {u.lastActiveAt ? formatRelative(u.lastActiveAt) : "Never active"}
                    </span>
                    <RiskBadge level={u.riskLevel} />
                  </Command.Item>
                ))}
                {(patients.data?.total ?? 0) > (patients.data?.data.length ?? 0) && (
                  <Command.Item value="patient-all" onSelect={() => go(`/admin/users?search=${encodeURIComponent(term)}`)} className={itemClass}>
                    <Search />
                    <span className="text-primary">See all {patients.data?.total} results in Users</span>
                  </Command.Item>
                )}
              </Command.Group>
            )}

            {pages.length > 0 && (
              <Command.Group heading="Pages" className={groupClass}>
                {pages.map((item) => (
                  <Command.Item key={item.href} value={`page-${item.href}`} onSelect={() => go(item.href)} className={itemClass}>
                    <item.icon />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-xs text-subtle-foreground">{item.group}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {!needle && (
              <Command.Group heading="Preferences" className={groupClass}>
                <Command.Item value="theme-light" onSelect={() => { setTheme("light"); close(); }} className={itemClass}>
                  <Sun /> Light theme
                </Command.Item>
                <Command.Item value="theme-dark" onSelect={() => { setTheme("dark"); close(); }} className={itemClass}>
                  <Moon /> Dark theme
                </Command.Item>
                <Command.Item value="theme-system" onSelect={() => { setTheme("system"); close(); }} className={itemClass}>
                  <Monitor /> Match system theme
                </Command.Item>
                <Command.Item value="sign-out" onSelect={() => { close(); void signOut(); }} className={itemClass}>
                  <LogOut /> Sign out
                </Command.Item>
              </Command.Group>
            )}
          </Command.List>
          <div className="flex items-center gap-4 border-t bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-card px-1 font-mono">↑</kbd>
              <kbd className="rounded border bg-card px-1 font-mono">↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-card px-1 font-mono">
                <CornerDownLeft className="inline size-2.5" />
              </kbd>
              open
            </span>
            {can("users.list") && <span className="ml-auto hidden sm:inline">Type 2+ characters to search patients</span>}
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
