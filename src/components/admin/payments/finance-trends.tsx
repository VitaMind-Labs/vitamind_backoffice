"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarClock, CircleDollarSign, TrendingDown, TrendingUp, UserMinus } from "lucide-react";
import { ChartCard } from "@/components/admin/charts/chart-card";
import { axisProps, CATEGORICAL, GRID_STROKE } from "@/components/admin/charts/chart-theme";
import { ChartTooltipContent } from "@/components/admin/charts/chart-tooltip";
import { BreakdownBarChart } from "@/components/admin/charts/breakdown-bar-chart";
import { StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { paymentsApi } from "@/lib/api/payments";
import { formatCompact, formatMoney, formatNumber } from "@/lib/formatters";
import { format, parseISO } from "date-fns";

const monthLabel = (m: string) => format(parseISO(`${m}-01`), "MMM yy");

/** Money in and out by month, plus who is paying for which plan. Answers "is revenue healthy?" before the ledger below. */
export function FinanceTrends() {
  const revenue = useApiQuery(["payments", "revenue"], () => paymentsApi.revenue(12), { staleTime: 120_000 });
  const subs = useApiQuery(["payments", "subscribers"], () => paymentsApi.subscribers(), { staleTime: 120_000 });
  const r = revenue.data;
  const s = subs.data;
  const mom = r?.monthOverMonthPct ?? null;

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatCard
          label="Collected this month"
          icon={CircleDollarSign}
          loading={revenue.isLoading}
          value={formatMoney(r?.thisMonth.paid ?? 0)}
          hint={mom === null ? "No previous month to compare" : `${mom > 0 ? "+" : ""}${mom}% vs last month`}
          emphasis={mom !== null && mom < 0 ? "warning" : "default"}
        />
        <StatCard label="Estimated MRR" icon={mom !== null && mom < 0 ? TrendingDown : TrendingUp} loading={subs.isLoading} value={formatMoney(s?.mrrEUR ?? 0)} hint="Active subscribers × plan price, per 30 days" emphasis="success" />
        <StatCard label="Renewals & trials due" icon={CalendarClock} loading={subs.isLoading} value={formatNumber((s?.renewalsDueIn7d ?? 0) + (s?.trialsEndingIn7d ?? 0))} hint={`${s?.renewalsDueIn7d ?? 0} renewals · ${s?.trialsEndingIn7d ?? 0} trials ending, next 7 days`} />
        <StatCard label="Churned (30d)" icon={UserMinus} loading={subs.isLoading} value={formatNumber(s?.churnedLast30d ?? 0)} hint="Cancelled or expired" emphasis={(s?.churnedLast30d ?? 0) > 0 ? "warning" : "success"} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <ChartCard
          className="lg:col-span-3"
          title="Revenue by month"
          description="Collected, refunded and failed payments, last 12 months"
          isLoading={revenue.isLoading}
          error={revenue.error}
          onRetry={revenue.refetch}
          isEmpty={!r || r.series.every((m) => m.paid + m.refunded + m.failed === 0)}
          emptyLabel="No payments recorded yet"
          table={{ columns: ["Month", "Collected", "Refunded", "Failed", "Net"], rows: (r?.series ?? []).map((m) => [monthLabel(m.month), formatMoney(m.paid), formatMoney(m.refunded), formatMoney(m.failed), formatMoney(m.net)]) }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={r?.series ?? []} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="24%">
              <CartesianGrid vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="month" {...axisProps} tickFormatter={monthLabel} />
              <YAxis {...axisProps} width={48} tickFormatter={(v: number) => formatCompact(v)} />
              <Tooltip
                cursor={{ fill: "var(--muted)", opacity: 0.6 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as NonNullable<typeof r>["series"][number];
                  return (
                    <ChartTooltipContent
                      title={monthLabel(d.month)}
                      rows={[
                        { label: "Collected", value: `${formatMoney(d.paid)} · ${d.paidCount}`, color: "var(--status-good)" },
                        { label: "Refunded", value: `${formatMoney(d.refunded)} · ${d.refundedCount}`, color: CATEGORICAL[3] },
                        { label: "Failed", value: `${formatMoney(d.failed)} · ${d.failedCount}`, color: "var(--status-critical)" },
                        { label: "Net", value: formatMoney(d.net) },
                      ]}
                    />
                  );
                }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
              <Bar dataKey="paid" name="Collected" fill="var(--status-good)" maxBarSize={22} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="refunded" name="Refunded" fill={CATEGORICAL[3]} maxBarSize={22} radius={[3, 3, 0, 0]} isAnimationActive={false} />
              <Bar dataKey="failed" name="Failed" fill="var(--status-critical)" maxBarSize={22} radius={[3, 3, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Subscribers by plan"
          description="Active subscribers; trials are not paying yet"
          isLoading={subs.isLoading}
          error={subs.error}
          onRetry={subs.refetch}
          isEmpty={!s || s.byPlan.length === 0}
          emptyLabel="No plan configured"
          footer={s ? `${formatNumber(s.byStatus.TRIAL ?? 0)} on trial · ${formatNumber(s.byStatus.ACTIVE ?? 0)} paying · ${formatNumber(s.withoutPlan)} without a plan` : undefined}
          table={{ columns: ["Plan", "Active", "Trial", "MRR"], rows: (s?.byPlan ?? []).map((p) => [p.name, formatNumber(p.active), formatNumber(p.trial), formatMoney(p.mrrEUR)]) }}
        >
          <BreakdownBarChart
            data={(s?.byPlan ?? []).map((p, i) => ({ key: p.planId, label: p.name + (p.isActive ? "" : " (archived)"), value: p.active, color: CATEGORICAL[i % CATEGORICAL.length] }))}
            valueLabel="Active subscribers"
          />
        </ChartCard>
      </div>
    </div>
  );
}
