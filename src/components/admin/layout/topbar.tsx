"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, LogOut, Menu, Search, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAdminSession } from "@/components/admin/providers/admin-session-provider";
import { TwoFactorSetup } from "@/components/admin/auth/two-factor-setup";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { notificationsApi } from "@/lib/api/operations";
import { findNavItem } from "@/lib/constants/navigation";
import { NOTIFICATION_PRIORITY_META } from "@/lib/constants/status";
import { formatRelative } from "@/lib/formatters";
import { ROLE_LABELS } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { CommandPalette, useCommandPaletteShortcut } from "./command-palette";
import { BrandMark, NavList } from "./sidebar";

function Breadcrumbs() {
  const pathname = usePathname();
  const match = findNavItem(pathname);
  if (!match) return null;
  const isDetail = pathname !== match.item.href;
  return (
    <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13px] sm:flex">
      <span className="text-subtle-foreground">{match.group.label}</span>
      <ChevronRight className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
      {isDetail ? (
        <>
          <Link href={match.item.href} className="text-muted-foreground hover:text-foreground">
            {match.item.label}
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-subtle-foreground" aria-hidden />
          <span className="truncate font-medium text-foreground">Detail</span>
        </>
      ) : (
        <span className="truncate font-medium text-foreground" aria-current="page">
          {match.item.label}
        </span>
      )}
    </nav>
  );
}

function NotificationsMenu() {
  const { can } = useAdminSession();
  const enabled = can("notifications.view");
  const { data } = useApiQuery(["notifications", "unread-preview"], () => notificationsApi.list({ read: false, limit: 5 }), {
    enabled,
    staleTime: 60_000,
  });
  if (!enabled) return null;
  const unread = data?.total ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
          <Bell />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground ring-2 ring-card">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          <span className="text-xs text-muted-foreground">{unread} unread</span>
        </div>
        <div className="max-h-80 overflow-y-auto p-1">
          {data?.data.length ? (
            data.data.map((n) => (
              <DropdownMenuItem key={n.id} asChild className="items-start">
                <Link href="/admin/notifications">
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      n.priority === "URGENT" ? "bg-destructive" : n.priority === "HIGH" ? "bg-warning" : "bg-primary",
                    )}
                    aria-label={NOTIFICATION_PRIORITY_META[n.priority].label}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{n.title}</span>
                    <span className="block text-xs text-muted-foreground">{formatRelative(n.createdAt)}</span>
                  </span>
                </Link>
              </DropdownMenuItem>
            ))
          ) : (
            <p className="px-3 py-6 text-center text-[13px] text-muted-foreground">You’re all caught up.</p>
          )}
        </div>
        <div className="border-t p-1">
          <DropdownMenuItem asChild className="justify-center text-[13px] font-medium text-primary">
            <Link href="/admin/notifications">View all notifications</Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const { admin, signOut, reload } = useAdminSession();
  const [twoFactorOpen, setTwoFactorOpen] = useState(false);
  const displayName = [admin.firstName, admin.lastName].filter(Boolean).join(" ") || admin.email.split("@")[0];
  const initials =
    [admin.firstName?.[0], admin.lastName?.[0]].filter(Boolean).join("").toUpperCase() || admin.email.slice(0, 2).toUpperCase();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-accent"
            aria-label="Account menu"
          >
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-left leading-tight md:block">
              <span className="block max-w-40 truncate text-[13px] font-medium">{displayName}</span>
              <span className="block text-[11px] text-muted-foreground">{ROLE_LABELS[admin.role]}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuLabel className="space-y-1 py-2">
            <span className="block truncate text-sm font-medium text-foreground">{displayName}</span>
            <span className="block truncate text-xs font-normal">{admin.email}</span>
            <Badge tone="brand" className="mt-1">
              {ROLE_LABELS[admin.role]}
            </Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {admin.is2FAEnabled ? (
            <DropdownMenuItem disabled>
              <ShieldCheck /> Two-factor enabled
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setTwoFactorOpen(true)}>
              <ShieldOff /> Enable two-factor authentication
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => void signOut()}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={twoFactorOpen} onOpenChange={setTwoFactorOpen}>
        <DialogContent className="max-w-md gap-4 overflow-x-hidden p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>Enable two-factor authentication</DialogTitle>
            <DialogDescription>Protect this admin account with a time-based code from an authenticator app.</DialogDescription>
          </DialogHeader>
          {twoFactorOpen && (
            <TwoFactorSetup
              onCancel={() => setTwoFactorOpen(false)}
              onComplete={() => {
                setTwoFactorOpen(false);
                toast.success("Two-factor authentication enabled");
                void reload();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        className="hidden h-8 w-64 items-center gap-2 rounded-md border border-input bg-background/60 px-2.5 text-[13px] text-subtle-foreground shadow-xs transition-colors hover:border-border-strong hover:text-muted-foreground md:flex xl:w-80"
        aria-label="Search pages and patients"
      >
        <Search className="size-3.5" aria-hidden />
        <span className="flex-1 text-left">Search pages, patients…</span>
        <kbd className="rounded border bg-card px-1.5 font-mono text-[10px] text-muted-foreground">Ctrl K</kbd>
      </button>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onOpen} aria-label="Search">
        <Search />
      </Button>
    </>
  );
}

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  useCommandPaletteShortcut(openPalette);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-card/70 sm:px-6">
      <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
        <Menu />
      </Button>
      <div className="lg:hidden">
        <BrandMark collapsed />
      </div>
      <Breadcrumbs />
      <div className="ml-auto flex items-center gap-1">
        <SearchTrigger onOpen={openPalette} />
        <ThemeToggle />
        <NotificationsMenu />
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
        <UserMenu />
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-14 items-center border-b px-4">
            <BrandMark />
          </div>
          <NavList onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
