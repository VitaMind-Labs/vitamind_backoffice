"use client";

import type { ReactNode } from "react";
import { Columns3, Loader2, Rows3, Rows4 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { TablePrefs } from "@/hooks/admin/use-table-prefs";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Column } from "./data-table";

function columnName<T>(col: Column<T>): string {
  if (col.label) return col.label;
  return typeof col.header === "string" ? col.header : col.id;
}

/**
 * Result summary + view controls above a list table. The count is the
 * backend total for the current filters, so it stays truthful on huge sets.
 */
export function TableToolbar<T>({
  total,
  noun = "results",
  isFetching,
  activeFilterCount = 0,
  columns,
  prefs,
  actions,
  className,
}: {
  total: number | undefined;
  noun?: string;
  isFetching?: boolean;
  activeFilterCount?: number;
  columns?: Column<T>[];
  prefs?: TablePrefs;
  actions?: ReactNode;
  className?: string;
}) {
  const hideable = columns?.filter((c) => c.hideable !== false) ?? [];

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-2 px-5 py-2", className)}>
      <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        {total === undefined ? (
          <span className="h-3.5 w-24 animate-pulse rounded bg-muted" aria-hidden />
        ) : (
          <span className="tabular-nums" aria-live="polite">
            <span className="font-semibold text-foreground">{formatNumber(total)}</span> {noun}
          </span>
        )}
        {activeFilterCount > 0 && (
          <span className="rounded-full bg-primary-soft px-1.5 py-px text-[11px] font-medium text-sidebar-active-foreground">
            {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
          </span>
        )}
        {isFetching && <Loader2 className="size-3.5 animate-spin text-subtle-foreground" aria-label="Refreshing" />}
      </div>
      <div className="flex items-center gap-1">
        {actions}
        {prefs && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-7 text-muted-foreground"
                onClick={() => prefs.setDensity(prefs.density === "compact" ? "comfortable" : "compact")}
                aria-label={prefs.density === "compact" ? "Comfortable rows" : "Compact rows"}
              >
                {prefs.density === "compact" ? <Rows3 /> : <Rows4 />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{prefs.density === "compact" ? "Comfortable rows" : "Compact rows"}</TooltipContent>
          </Tooltip>
        )}
        {prefs && hideable.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs text-muted-foreground">
                <Columns3 className="!size-3.5" />
                Columns
                {prefs.hidden.size > 0 && <span className="tabular-nums text-subtle-foreground">({hideable.length - hideable.filter((c) => prefs.hidden.has(c.id)).length}/{hideable.length})</span>}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
              {hideable.map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={!prefs.hidden.has(col.id)}
                  onCheckedChange={() => prefs.toggleColumn(col.id)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {columnName(col)}
                </DropdownMenuCheckboxItem>
              ))}
              {prefs.hidden.size > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={prefs.resetColumns} className="justify-center text-xs text-primary">
                    Show all columns
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export interface QueueTab<K extends string> {
  value: K | undefined;
  label: string;
  count?: number;
  /** Colours the count when it needs attention. */
  tone?: "danger" | "warning" | "info" | "neutral";
}

const countTone = {
  danger: "bg-destructive text-destructive-foreground",
  warning: "bg-warning-soft text-warning ring-1 ring-inset ring-warning-border",
  info: "bg-info-soft text-info ring-1 ring-inset ring-info-border",
  neutral: "bg-muted text-muted-foreground",
} as const;

/**
 * Status tabs for work queues (crisis events, clinical alerts): one click to a
 * queue, with the backend total per status shown on each tab.
 */
export function QueueTabs<K extends string>({
  value,
  onChange,
  tabs,
  label,
  className,
}: {
  value: K | undefined;
  onChange: (value: K | undefined) => void;
  tabs: QueueTab<K>[];
  label: string;
  className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={cn("scrollbar-thin flex items-center gap-1 overflow-x-auto border-b bg-muted/40 px-4 py-2", className)}>
      {tabs.map((tab) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value ?? "__all"}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-[13px] font-medium transition-colors",
              selected ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "min-w-5 rounded-full px-1.5 py-px text-center text-[11px] font-semibold tabular-nums",
                  tab.count > 0 && tab.tone ? countTone[tab.tone] : countTone.neutral,
                )}
              >
                {tab.count > 999 ? `${Math.floor(tab.count / 1000)}k+` : tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
