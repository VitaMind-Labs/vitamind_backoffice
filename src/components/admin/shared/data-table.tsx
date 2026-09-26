"use client";

import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PAGE_SIZES } from "@/hooks/admin/use-list-state";
import type { TableDensity } from "@/hooks/admin/use-table-prefs";
import type { ApiError } from "@/lib/api/client";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "./states";

export interface Column<T> {
  id: string;
  header: ReactNode;
  /** Plain-text name for the column picker when `header` is not a string. */
  label?: string;
  cell: (row: T) => ReactNode;
  /** Hide the column below this breakpoint to avoid horizontal scrolling. */
  hideBelow?: "sm" | "md" | "lg" | "xl";
  align?: "left" | "right";
  className?: string;
  /** Backend sort key; the column header becomes a sort toggle. */
  sortKey?: string;
  /** Set false for identity columns that must always stay visible. */
  hideable?: boolean;
}

const hideClasses = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
} as const;

const densityCell: Record<TableDensity, string> = {
  compact: "py-1.5 text-[13px]",
  comfortable: "py-2.5",
};

export interface SortState {
  sortBy?: string;
  order?: "asc" | "desc";
}

/** Default scroll viewport for list tables: header and pagination stay in view on long pages. */
const DEFAULT_MAX_HEIGHT = "min(70dvh, 880px)";

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  isLoading,
  isFetching,
  stale,
  error,
  onRetry,
  onRowClick,
  activeRowKey,
  emptyTitle = "No results",
  emptyDescription,
  sort,
  onSortChange,
  skeletonRows = 8,
  density = "comfortable",
  hiddenColumns,
  maxHeight = DEFAULT_MAX_HEIGHT,
  className,
  rowClassName,
}: {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  isLoading?: boolean;
  /** Request in flight: shows a thin progress bar above the header. */
  isFetching?: boolean;
  /** Rows are from the previous page / filter set while the new one loads. */
  stale?: boolean;
  error?: ApiError;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  /** Row whose detail is open (drawer), kept highlighted. */
  activeRowKey?: string | null;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  skeletonRows?: number;
  density?: TableDensity;
  hiddenColumns?: ReadonlySet<string>;
  /** CSS max-height of the scroll viewport; `false` lets the table grow with the page. */
  maxHeight?: string | false;
  className?: string;
  rowClassName?: (row: T) => string | undefined;
}) {
  if (error && !rows) return <ErrorState error={error} onRetry={onRetry} compact />;

  const visible = hiddenColumns?.size ? columns.filter((c) => c.hideable === false || !hiddenColumns.has(c.id)) : columns;

  const toggleSort = (key: string) => {
    if (!onSortChange) return;
    const order = sort?.sortBy === key && sort.order === "desc" ? "asc" : "desc";
    onSortChange({ sortBy: key, order });
  };

  return (
    <div className={cn("relative min-w-0", className)}>
      {isFetching && rows && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-primary/10" role="progressbar" aria-label="Loading">
          <div className="h-full w-1/3 animate-progress rounded-full bg-primary" />
        </div>
      )}
      <Table
        containerClassName={cn("scrollbar-thin", maxHeight && "overflow-y-auto")}
        containerStyle={maxHeight ? { maxHeight } : undefined}
      >
        <TableHeader className="sticky top-0 z-10 bg-muted shadow-[inset_0_-1px_0_var(--border)] [&_tr]:border-b-0">
          <TableRow className="hover:bg-transparent">
            {visible.map((col) => {
              const active = col.sortKey && sort?.sortBy === col.sortKey;
              const SortIcon = !active ? ArrowUpDown : sort?.order === "asc" ? ArrowUp : ArrowDown;
              return (
                <TableHead
                  key={col.id}
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-wide",
                    col.hideBelow && hideClasses[col.hideBelow],
                    col.align === "right" && "text-right",
                    col.className,
                  )}
                  aria-sort={active ? (sort?.order === "asc" ? "ascending" : "descending") : undefined}
                >
                  {col.sortKey && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.sortKey!)}
                      className={cn(
                        "-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 uppercase tracking-wide transition-colors hover:text-foreground",
                        active && "text-foreground",
                      )}
                    >
                      {col.header}
                      <SortIcon className={cn("size-3", !active && "opacity-40")} aria-hidden />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody className={cn("transition-opacity duration-200", stale && "opacity-55")} aria-busy={isFetching || undefined}>
          {isLoading && !rows
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {visible.map((col) => (
                    <TableCell key={col.id} className={cn(densityCell[density], col.hideBelow && hideClasses[col.hideBelow])}>
                      <Skeleton className="h-4 w-full max-w-32" style={{ opacity: 1 - i * 0.08 }} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : rows?.map((row) => {
                const key = rowKey(row);
                const isActive = activeRowKey === key;
                return (
                  <TableRow
                    key={key}
                    data-clickable={!!onRowClick}
                    data-active={isActive || undefined}
                    aria-selected={onRowClick ? isActive : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onRowClick(row);
                            }
                          }
                        : undefined
                    }
                    className={cn(
                      "group/row",
                      onRowClick && "focus-visible:bg-muted/60 focus-visible:outline-none",
                      "data-[active=true]:bg-primary-soft data-[active=true]:shadow-[inset_2px_0_0_var(--primary)]",
                      rowClassName?.(row),
                    )}
                  >
                    {visible.map((col) => (
                      <TableCell
                        key={col.id}
                        className={cn(
                          densityCell[density],
                          col.hideBelow && hideClasses[col.hideBelow],
                          col.align === "right" && "text-right tabular-nums",
                          col.className,
                        )}
                      >
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
      {!isLoading && rows && rows.length === 0 && <EmptyState compact title={emptyTitle} description={emptyDescription} />}
    </div>
  );
}

/** 1 … 4 5 [6] 7 8 … 120 */
function pageWindow(page: number, totalPages: number): Array<number | "gap"> {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (page >= totalPages - 2) [totalPages - 3, totalPages - 2, totalPages - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

function JumpToPage({ totalPages, onPageChange }: { totalPages: number; onPageChange: (page: number) => void }) {
  const [draft, setDraft] = useState("");
  const commit = () => {
    const n = Number(draft);
    if (Number.isInteger(n) && n >= 1 && n <= totalPages) onPageChange(n);
    setDraft("");
  };
  return (
    <label className="hidden items-center gap-1.5 text-xs text-muted-foreground lg:flex">
      Go to
      <input
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        onBlur={() => draft && commit()}
        placeholder="#"
        aria-label={`Go to page (1–${totalPages})`}
        className="h-7 w-12 rounded-md border border-input bg-card px-2 text-center tabular-nums text-foreground outline-none focus:border-ring"
      />
    </label>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  isFetching,
  className,
}: {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  /** Shows the rows-per-page selector. */
  onLimitChange?: (limit: number) => void;
  isFetching?: boolean;
  className?: string;
}) {
  if (total === 0) return null;
  const pages = Math.max(totalPages, 1);
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);
  const go = (p: number) => onPageChange(Math.min(Math.max(p, 1), pages));

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t bg-card px-5 py-2.5", className)}>
      <div className="flex items-center gap-4">
        <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
          <span className="font-medium text-foreground">{formatNumber(first)}–{formatNumber(last)}</span> of {formatNumber(total)}
          {isFetching && <span className="ml-2 text-subtle-foreground">Updating…</span>}
        </p>
        {onLimitChange && (
          <Select value={String(limit)} onValueChange={(v) => onLimitChange(Number(v))}>
            <SelectTrigger className="hidden h-7 w-auto gap-1.5 px-2 text-xs sm:flex" aria-label="Rows per page">
              <span className="text-muted-foreground">Rows</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <Button variant="ghost" size="icon-sm" className="hidden size-7 sm:inline-flex" onClick={() => go(1)} disabled={page <= 1} aria-label="First page">
          <ChevronsLeft />
        </Button>
        <Button variant="outline" size="icon-sm" className="size-7" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Previous page">
          <ChevronLeft />
        </Button>
        <span className="min-w-14 text-center text-xs tabular-nums text-muted-foreground sm:hidden">
          {page} / {pages}
        </span>
        <div className="hidden items-center gap-0.5 sm:flex">
          {pageWindow(page, pages).map((p, i) =>
            p === "gap" ? (
              <span key={`gap-${i}`} className="w-6 text-center text-xs text-subtle-foreground" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => go(p)}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "h-7 min-w-7 rounded-md px-1.5 text-xs tabular-nums transition-colors",
                  p === page ? "bg-primary font-semibold text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {formatNumber(p)}
              </button>
            ),
          )}
        </div>
        <Button variant="outline" size="icon-sm" className="size-7" onClick={() => go(page + 1)} disabled={page >= pages} aria-label="Next page">
          <ChevronRight />
        </Button>
        <Button variant="ghost" size="icon-sm" className="hidden size-7 sm:inline-flex" onClick={() => go(pages)} disabled={page >= pages} aria-label="Last page">
          <ChevronsRight />
        </Button>
        {pages > 7 && <JumpToPage totalPages={pages} onPageChange={go} />}
      </nav>
    </div>
  );
}
