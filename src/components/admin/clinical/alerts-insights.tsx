"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { ChartCard } from "@/components/admin/charts/chart-card";
import { BreakdownBarChart } from "@/components/admin/charts/breakdown-bar-chart";
import { axisProps, GRID_STROKE } from "@/components/admin/charts/chart-theme";
import { ChartTooltipContent } from "@/components/admin/charts/chart-tooltip";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { alertsApi } from "@/lib/api/clinical";
import { RISK_META } from "@/lib/constants/status";
import { formatNumber } from "@/lib/formatters";
import { RISK_LEVELS, type RiskLevel } from "@/types/admin";

/** Where alert pressure sits: who is carrying it, and whether the last two weeks are getting worse. */
export function AlertsInsights() {
  const q = useApiQuery(["clinical-alerts", "summary"], () => alertsApi.summary(), { staleTime: 60_000 });
  const s = q.data;

  const days = Array.from(new Set((s?.perDay ?? []).map((d) => d.day))).sort();
  const trend = days.map((day) => {
    const row: Record<string, number | string> = { day };
    for (const level of RISK_LEVELS) row[level] = s?.perDay.find((d) => d.day === day && d.severity === level)?.count ?? 0;
    return row;
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title="Open alerts by clinician"
        description={s?.medianMinutesToAcknowledge30d != null ? `Median time to acknowledge (30d): ${s.medianMinutesToAcknowledge30d} min` : "Who is carrying the open alerts"}
        isLoading={q.isLoading}
        error={q.error}
        onRetry={q.refetch}
        isEmpty={!s || s.workload.length === 0}
        emptyLabel="No open alert is assigned"
        height={220}
        footer={s && (s.open.unrouted > 0 || s.open.overdue > 0) ? `${s.open.unrouted} without a clinician · ${s.open.overdue} past their SLA` : undefined}
        table={{ columns: ["Clinician", "Open alerts"], rows: (s?.workload ?? []).map((w) => [w.name, formatNumber(w.open)]) }}
      >
        <BreakdownBarChart data={(s?.workload ?? []).slice(0, 8).map((w) => ({ key: w.psychologistId, label: w.name, value: w.open }))} valueLabel="Open alerts" />
      </ChartCard>

      <ChartCard
        title="Alerts per day"
        description="Last 14 days, by severity"
        isLoading={q.isLoading}
        error={q.error}
        onRetry={q.refetch}
        isEmpty={trend.length === 0}
        emptyLabel="No alert raised in the last 14 days"
        height={220}
        table={{ columns: ["Day", ...RISK_LEVELS.map((l) => RISK_META[l].label)], rows: trend.map((d) => [String(d.day), ...RISK_LEVELS.map((l) => formatNumber(Number(d[l])))]) }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={GRID_STROKE} />
            <XAxis dataKey="day" {...axisProps} tickFormatter={(v: string) => format(parseISO(v), "d MMM")} minTickGap={16} />
            <YAxis {...axisProps} width={32} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0].payload as Record<string, number | string>;
                return <ChartTooltipContent title={format(parseISO(String(d.day)), "d MMM")} rows={RISK_LEVELS.map((l: RiskLevel) => ({ label: RISK_META[l].label, value: formatNumber(Number(d[l])), color: RISK_META[l].chart }))} />;
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
            {RISK_LEVELS.map((l) => (
              <Bar key={l} dataKey={l} name={RISK_META[l].label} stackId="a" fill={RISK_META[l].chart} maxBarSize={26} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
