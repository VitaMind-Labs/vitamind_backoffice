"use client";

import { ArrowDown } from "lucide-react";
import { formatNumber, formatRatio } from "@/lib/formatters";
import { ORDINAL } from "./chart-theme";

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
  /** 0..1 conversion from previous step */
  rate?: number;
  note?: string;
}

/**
 * Stage funnel: bar length is the share of the first step, stages use the
 * ordinal ramp, and each transition shows its step conversion rate.
 */
export function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  const base = steps[0]?.count || 0;
  return (
    <ol className="space-y-1.5" aria-label="Conversion funnel">
      {steps.map((step, i) => {
        const width = base > 0 ? Math.max((step.count / base) * 100, step.count > 0 ? 1.5 : 0) : 0;
        return (
          <li key={step.key}>
            {i > 0 && step.rate !== undefined && (
              <div className="flex items-center gap-1.5 py-1 pl-1 text-xs text-muted-foreground">
                <ArrowDown className="size-3" aria-hidden />
                <span className="tabular-nums">{formatRatio(step.rate)}</span>
                <span>from previous step</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className="w-24 shrink-0 text-[13px] text-muted-foreground sm:w-28">{step.label}</div>
              <div className="relative h-7 flex-1 rounded bg-muted/60">
                <div
                  className="h-full rounded"
                  style={{ width: `${width}%`, background: ORDINAL[Math.min(i + 1, ORDINAL.length - 1)] }}
                />
              </div>
              <div className="w-20 shrink-0 text-right">
                <span className="text-sm font-semibold tabular-nums">{formatNumber(step.count)}</span>
                {step.note && <span className="block text-[11px] text-subtle-foreground">{step.note}</span>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
