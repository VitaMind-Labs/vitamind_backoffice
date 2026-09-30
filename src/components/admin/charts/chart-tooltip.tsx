"use client";

import type { ReactNode } from "react";

export interface TooltipRow {
  label: string;
  value: ReactNode;
  color?: string;
}

/** Shared tooltip surface: title, then one row per series with a colour key. */
export function ChartTooltipContent({ title, rows }: { title?: ReactNode; rows: TooltipRow[] }) {
  return (
    <div className="min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {title && <p className="mb-1.5 font-medium text-foreground">{title}</p>}
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {row.color && <span className="size-2 rounded-full" style={{ background: row.color }} aria-hidden />}
              {row.label}
            </span>
            <span className="font-medium tabular-nums text-foreground">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
