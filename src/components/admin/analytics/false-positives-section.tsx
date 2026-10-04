"use client";

import { CircleSlash, Siren, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BreakdownBarChart } from "@/components/admin/charts/breakdown-bar-chart";
import { ChartCard } from "@/components/admin/charts/chart-card";
import { DistributionBar } from "@/components/admin/charts/distribution-bar";
import { countsToBreakdown, groupByToCounts, sumCounts } from "@/components/admin/charts/transform";
import { StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { ErrorState } from "@/components/admin/shared/states";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { analyticsApi } from "@/lib/api/analytics";
import { formatNumber, formatPercent, parsePercent } from "@/lib/formatters";
import { TRIGGER_TYPES } from "@/types/admin";

const TRIGGER_LABELS = { NLP: "NLP", JOURNAL: "Journal", DIAGNOSTIC: "Diagnostic", BIOMETRICS: "Biometrics", MANUAL: "Manual" };

/** Crisis events closed as false alerts, and which detection channels produce them. */
export function FalsePositivesSection() {
  const q = useApiQuery(["analytics", "false-positives"], analyticsApi.falsePositives);
  const d = q.data;
  const counts = groupByToCounts(d?.byTriggerType, "triggerType");
  const rows = countsToBreakdown(counts, { order: TRIGGER_TYPES, labels: TRIGGER_LABELS });
  const rate = parsePercent(d?.falsePositiveRate);

  if (q.error) {
    return (
      <Card>
        <ErrorState error={q.error} onRetry={q.refetch} />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <StatGrid className="xl:grid-cols-3">
        <StatCard label="False-positive rate" icon={Target} loading={!d} emphasis={rate !== null && rate > 20 ? "warning" : "default"} value={formatPercent(rate)} hint="False alerts ÷ all crisis events" />
        <StatCard label="False alerts" icon={CircleSlash} loading={!d} value={formatNumber(d?.falseAlerts)} />
        <StatCard label="Crisis events" icon={Siren} href="/admin/crisis-events" loading={!d} value={formatNumber(d?.totalCrisis)} hint="All time" />
      </StatGrid>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          title="False alerts by trigger"
          description="Which detection channel raised the events closed as false alerts"
          isLoading={!d}
          isEmpty={sumCounts(counts) === 0}
          emptyLabel="No false alerts recorded"
          table={{ columns: ["Trigger", "False alerts"], rows: rows.map((r) => [r.label, formatNumber(r.value)]) }}
        >
          <BreakdownBarChart data={rows} valueLabel="False alerts" total={sumCounts(counts)} />
        </ChartCard>
        <ChartCard className="lg:col-span-2" title="Crisis outcomes" description="False alerts among all crisis events" isLoading={!d} isEmpty={!d?.totalCrisis} height={140}>
          {d && (
            <DistributionBar
              ariaLabel="False alerts among crisis events"
              segments={[
                { key: "other", label: "Other outcomes", value: d.totalCrisis - d.falseAlerts, color: "var(--chart-1)" },
                { key: "false", label: "False alerts", value: d.falseAlerts, color: "var(--status-neutral)" },
              ]}
            />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
