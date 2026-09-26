"use client";

import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ThresholdMeter } from "@/components/admin/analytics/threshold-meter";
import { BreakdownBarChart } from "@/components/admin/charts/breakdown-bar-chart";
import { ChartCard } from "@/components/admin/charts/chart-card";
import { CATEGORICAL } from "@/components/admin/charts/chart-theme";
import { PageHeader } from "@/components/admin/shared/page-header";
import { RequirePermission } from "@/components/admin/shared/permission";
import { StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { ErrorState } from "@/components/admin/shared/states";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { analyticsApi } from "@/lib/api/sessions";
import { formatNumber, parsePercent } from "@/lib/formatters";

const DRIFT_THRESHOLD = 5;

function ModelDriftView() {
  const q = useApiQuery(["analytics", "model-drift"], analyticsApi.modelDrift);
  const d = q.data;
  const rate = parsePercent(d?.crisisRate) ?? 0;
  const delta = d ? d.crisisSessions7d - d.previousPeriodCrisis : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Model drift"
        description="Watches the share of sessions flagged as crisis over the last 7 days. A rate above 5% suggests the detection model may be drifting."
      />
      {q.error ? (
        <Card>
          <ErrorState error={q.error} onRetry={q.refetch} />
        </Card>
      ) : (
        <>
          {d ? (
            d.driftDetected ? (
              <div role="alert" className="flex items-start gap-3 rounded-lg border border-destructive-border bg-destructive-soft px-4 py-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-destructive">Drift detected</p>
                  <p className="text-[13px] text-destructive/90">{d.alert ?? "Crisis rate exceeds the drift threshold."} Review recent crisis events and false positives.</p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-lg border border-success-border bg-success-soft px-4 py-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-success">No drift detected</p>
                  <p className="text-[13px] text-success/90">The crisis rate is within the expected range for the last 7 days.</p>
                </div>
              </div>
            )
          ) : (
            <Skeleton className="h-16 w-full" />
          )}

          <StatGrid className="xl:grid-cols-3">
            <StatCard label="Sessions · last 7 days" loading={!d} value={formatNumber(d?.totalSessions7d)} />
            <StatCard
              label="Crisis sessions · last 7 days"
              loading={!d}
              emphasis={d?.driftDetected ? "danger" : "default"}
              value={formatNumber(d?.crisisSessions7d)}
              hint={
                d ? (
                  <span className="inline-flex items-center gap-1">
                    {delta > 0 ? <TrendingUp className="size-3.5 text-destructive" /> : <TrendingDown className="size-3.5 text-success" />}
                    {delta === 0 ? "Same as" : `${delta > 0 ? "+" : ""}${formatNumber(delta)} vs`} previous 7 days
                  </span>
                ) : undefined
              }
            />
            <StatCard label="Crisis sessions · previous 7 days" loading={!d} value={formatNumber(d?.previousPeriodCrisis)} />
          </StatGrid>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="space-y-4 p-5">
              <div>
                <h3 className="text-sm font-semibold">Crisis rate vs drift threshold</h3>
                <p className="text-xs text-muted-foreground">Crisis sessions ÷ all sessions, last 7 days</p>
              </div>
              {d ? (
                <ThresholdMeter label="Crisis rate" value={rate} threshold={DRIFT_THRESHOLD} max={Math.max(10, Math.ceil(rate / 5) * 5)} />
              ) : (
                <Skeleton className="h-12 w-full" />
              )}
            </Card>
            <ChartCard
              title="Crisis sessions week over week"
              description="Previous 7 days compared with the last 7 days"
              isLoading={!d}
              height={140}
              table={
                d
                  ? {
                      columns: ["Period", "Crisis sessions"],
                      rows: [
                        ["Previous 7 days", formatNumber(d.previousPeriodCrisis)],
                        ["Last 7 days", formatNumber(d.crisisSessions7d)],
                      ],
                    }
                  : undefined
              }
            >
              {d && (
                <BreakdownBarChart
                  valueLabel="Crisis sessions"
                  data={[
                    { key: "prev", label: "Previous 7 days", value: d.previousPeriodCrisis, color: "var(--status-neutral)" },
                    { key: "last", label: "Last 7 days", value: d.crisisSessions7d, color: CATEGORICAL[0] },
                  ]}
                />
              )}
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

export default function ModelDriftPage() {
  return (
    <RequirePermission permission="analytics.view">
      <ModelDriftView />
    </RequirePermission>
  );
}
