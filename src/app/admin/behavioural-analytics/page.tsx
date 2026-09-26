"use client";

import Link from "next/link";
import { ArrowRight, Delete, Gauge, Keyboard, MousePointer2, ScrollText, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/shared/page-header";
import { RequirePermission } from "@/components/admin/shared/permission";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/admin/shared/states";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { analyticsApi } from "@/lib/api/sessions";
import { formatCompact, formatNumber } from "@/lib/formatters";

const METRICS: Array<{
  key: "avgWpm" | "avgBurstRatio" | "avgBackspaceRate" | "avgMouseVariance" | "avgScrollSpeed";
  label: string;
  icon: LucideIcon;
  digits: number;
  unit?: string;
  explains: string;
}> = [
  { key: "avgWpm", label: "Typing speed", icon: Keyboard, digits: 1, unit: "wpm", explains: "Average words per minute across sessions." },
  { key: "avgBurstRatio", label: "Burst ratio", icon: Zap, digits: 2, explains: "Share of keystrokes typed in rapid bursts." },
  { key: "avgBackspaceRate", label: "Backspace rate", icon: Delete, digits: 2, explains: "Corrections relative to keystrokes." },
  { key: "avgMouseVariance", label: "Mouse variance", icon: MousePointer2, digits: 2, explains: "Irregularity of pointer movement." },
  { key: "avgScrollSpeed", label: "Scroll speed", icon: ScrollText, digits: 2, explains: "Average scrolling velocity." },
];

function BehaviouralAnalyticsView() {
  const q = useApiQuery(["analytics", "behavioral"], analyticsApi.behavioral);
  const d = q.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Behavioural analytics"
        description="Population-level averages of the behavioural signals collected during sessions. Use them as the reference baseline when reviewing individual sessions."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/sessions">
              Explore sessions <ArrowRight />
            </Link>
          </Button>
        }
      />
      {q.error ? (
        <Card>
          <ErrorState error={q.error} onRetry={q.refetch} />
        </Card>
      ) : (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary">
                <Gauge className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-[13px] text-muted-foreground">Sessions in the baseline</p>
                {d ? <p className="text-2xl font-semibold tabular-nums">{formatCompact(d.totalSessions)}</p> : <Skeleton className="mt-1 h-7 w-20" />}
              </div>
            </div>
            <p className="max-w-md text-[13px] text-muted-foreground">
              Averages ignore sessions where a signal was not captured. Each measure has its own unit, so they are shown side by side rather than on a shared axis.
            </p>
          </Card>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {METRICS.map((m) => {
              const value = d?.[m.key];
              return (
                <Card key={m.key} className="space-y-3 p-4">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
                    <m.icon className="size-4 text-primary" aria-hidden />
                    {m.label}
                  </div>
                  {d ? (
                    <p className="text-2xl font-semibold tabular-nums">
                      {value === null || value === undefined ? "—" : formatNumber(value, m.digits)}
                      {m.unit && value != null && <span className="ml-1 text-sm font-normal text-muted-foreground">{m.unit}</span>}
                    </p>
                  ) : (
                    <Skeleton className="h-7 w-16" />
                  )}
                  <p className="text-xs text-muted-foreground">{m.explains}</p>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function BehaviouralAnalyticsPage() {
  return (
    <RequirePermission permission="analytics.view">
      <BehaviouralAnalyticsView />
    </RequirePermission>
  );
}
