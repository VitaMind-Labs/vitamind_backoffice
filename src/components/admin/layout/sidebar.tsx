"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useAdminSession } from "@/components/admin/providers/admin-session-provider";
import { useQueueBadges } from "@/hooks/admin/use-queue-counts";
import { NAVIGATION, type NavGroup } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils";

export function BrandMark({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link href="/admin" className="flex min-w-0 items-center justify-center gap-2.5" aria-label="SynQ Admin">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-transparent">
        <Image
          src="/logo.svg"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 bg-transparent object-contain"
          priority
        />
      </span>
      {!collapsed && <span className="truncate text-sm font-semibold text-sidebar-foreground">SynQ</span>}
    </Link>
  );
}

export function useVisibleNavigation(): NavGroup[] {
  const { can } = useAdminSession();
  return NAVIGATION.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.permissions.some((p) => can(p))),
  })).filter((group) => group.items.length > 0);
}

type NavBadge = { count: number; tone: "danger" | "warning" };

/** Work waiting in the clinical queues, shown next to their nav entries. */
function useNavBadges(): Record<string, NavBadge | undefined> {
  const { pendingCrises: pending, openAlerts: open } = useQueueBadges();
  return {
    "/admin/crisis-events": pending > 0 ? { count: pending, tone: "danger" } : undefined,
    "/admin/clinical-alerts": open > 0 ? { count: open, tone: "warning" } : undefined,
  };
}

function CountPill({ badge, collapsed }: { badge: NavBadge; collapsed?: boolean }) {
  const label = badge.count > 99 ? "99+" : String(badge.count);
  if (collapsed) {
    return (
      <span
        className={cn(
          "absolute right-1.5 top-1 size-2 rounded-full ring-2 ring-sidebar",
          badge.tone === "danger" ? "bg-destructive" : "bg-warning",
        )}
        aria-hidden
      />
    );
  }
  return (
    <span
      className={cn(
        "ml-auto min-w-5 rounded-full px-1.5 py-px text-center text-[10.5px] font-semibold tabular-nums",
        badge.tone === "danger" ? "bg-destructive text-destructive-foreground" : "bg-warning-soft text-warning ring-1 ring-inset ring-warning-border",
      )}
    >
      {label}
    </span>
  );
}

export function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const groups = useVisibleNavigation();
  const badges = useNavBadges();

  return (
    <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Main">
      {groups.map((group) => (
        <div key={group.label} className="space-y-0.5">
          {collapsed ? (
            <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border first:hidden" aria-hidden />
          ) : (
            <p className="px-2.5 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-subtle-foreground">{group.label}</p>
          )}
          {group.items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const badge = badges[item.href];
            const link = (
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                aria-label={badge ? `${item.label}, ${badge.count} waiting` : undefined}
                className={cn(
                  "group relative flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors duration-150",
                  active
                    ? "bg-sidebar-active text-sidebar-active-foreground"
                    : "text-sidebar-foreground hover:bg-accent hover:text-foreground",
                  collapsed && "justify-center px-0",
                )}
              >
                {active && <span className="absolute -left-3 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" aria-hidden />}
                <item.icon
                  className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")}
                  aria-hidden
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {badge && <CountPill badge={badge} collapsed={collapsed} />}
              </Link>
            );
            return collapsed ? (
              <Tooltip key={item.href} delayDuration={0}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">
                  {item.label}
                  {badge ? ` · ${badge.count}` : ""}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div key={item.href}>{link}</div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-[64px]" : "w-60",
      )}
    >
      <div className={cn("flex h-14 items-center border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-4")}>
        <BrandMark collapsed={collapsed} />
      </div>
      <NavList collapsed={collapsed} />
      <div className={cn("space-y-1 border-t border-sidebar-border p-2", collapsed && "flex flex-col items-center")}>
        {!collapsed && (
          <p className="flex items-center gap-2 px-2.5 py-1 text-[11px] text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            Metadata-only console · audited
          </p>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="mx-auto size-4" /> : <PanelLeftClose className="size-4" />}
          {!collapsed && (
            <>
              <span>Collapse</span>
              <kbd className="ml-auto rounded border bg-card px-1 font-mono text-[10px] text-subtle-foreground">[</kbd>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
