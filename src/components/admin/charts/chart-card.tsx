"use client";

import { useState, type ReactNode } from "react";
import { BarChart3, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/admin/shared/states";

export interface ChartTable {
  columns: string[];
  rows: Array<Array<ReactNode>>;
}

/**
 * Frame for every chart: title answers the operational question, the body
 * handles loading / error / empty, and a table view is always one click away
 * so no value depends on colour or hover alone.
 */
export function ChartCard({
  title,
  description,
  actions,
  isLoading,
  error,
  onRetry,
  isEmpty,
  emptyLabel = "No data for this period",
  height = 260,
  table,
  footer,
  className,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  isLoading?: boolean;
  error?: ApiError;
  onRetry?: () => void;
  isEmpty?: boolean;
  emptyLabel?: string;
  height?: number;
  table?: ChartTable;
  footer?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const [showTable, setShowTable] = useState(false);
  const ready = !isLoading && !error && !isEmpty;

  return (
    <Card className={cn("flex min-w-0 flex-col", className)}>
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {actions}
          {table && ready && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowTable((v) => !v)}
              aria-pressed={showTable}
              aria-label={showTable ? "Show chart" : "Show data table"}
              title={showTable ? "Show chart" : "Show data table"}
            >
              {showTable ? <BarChart3 /> : <Table2 />}
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 px-5 pb-4 pt-3">
        {error ? (
          <ErrorState error={error} onRetry={onRetry} compact />
        ) : isLoading ? (
          <Skeleton style={{ height }} className="w-full" />
        ) : isEmpty ? (
          <div style={{ minHeight: height }} className="flex items-center justify-center">
            <EmptyState compact title={emptyLabel} />
          </div>
        ) : showTable && table ? (
          <div className="overflow-x-auto" style={{ minHeight: height }}>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  {table.columns.map((c, i) => (
                    <th key={c} className={cn("py-2 font-medium", i > 0 && "text-right")}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, r) => (
                  <tr key={r} className="border-b last:border-0">
                    {row.map((cell, i) => (
                      <td key={i} className={cn("py-2", i > 0 && "text-right tabular-nums")}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ height }} className="w-full">
            {children}
          </div>
        )}
      </div>
      {footer && ready && <div className="border-t px-5 py-2.5 text-xs text-muted-foreground">{footer}</div>}
    </Card>
  );
}
