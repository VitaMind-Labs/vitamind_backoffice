"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Activity,
  AlertOctagon,
  CircleDollarSign,
  RefreshCw,
  Stethoscope,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { BreakdownBarChart } from "@/components/admin/charts/breakdown-bar-chart";
import { ChartCard } from "@/components/admin/charts/chart-card";
import { DistributionBar } from "@/components/admin/charts/distribution-bar";
import { FunnelChart } from "@/components/admin/charts/funnel-chart";
import { countsToBreakdown, groupByToCounts, sumCounts } from "@/components/admin/charts/transform";
import { CATEGORICAL } from "@/components/admin/charts/chart-theme";
import { DateRangeFilter, type DateRangeValue } from "@/components/admin/shared/filters";
import { PageHeader, SectionHeader } from "@/components/admin/shared/page-header";
import { MetricCard, StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { useAdminSession } from "@/components/admin/providers/admin-session-provider";
import { invalidateQueries, useApiQuery } from "@/hooks/admin/use-api-query";
import { dashboardApi } from "@/lib/api/dashboard";
import { diagnosticsApi } from "@/lib/api/diagnostics";
import { paymentsApi, plansApi } from "@/lib/api/payments";
import { DISEASE_LABELS, PAYMENT_STATUS_META, RISK_META } from "@/lib/constants/status";
import {
  formatCompact,
  formatMoney,
  formatNumber,
  formatPercent,
  formatRatio,
  isoDaysAgo,
  shortId,
} from "@/lib/formatters";
import { PAYMENT_STATUSES, RISK_LEVELS } from "@/types/admin";
import {
  OpenAlertsPanel,
  PendingCrisesPanel,
  RecentPaymentsPanel,
  RecentUsersPanel,
} from "./operations-panels";
import { AttentionBanner } from "./attention-banner";

const FUNNEL_LABELS: Record<string, string> = {
  started: "Started",
  completed: "Completed",
  claimed: "Claimed",
  subscribed: "Subscribed",
};

function OverviewSection({ range }: { range: DateRangeValue }) {
  const stats = useApiQuery(["dashboard", "stats"], dashboardApi.stats);
  const kpis = useApiQuery(["dashboard", "kpis"], dashboardApi.kpis);
  const activity = useApiQuery(["dashboard", "user-activity"], dashboardApi.userActivity);
  const risk = useApiQuery(["dashboard", "risk-overview"], dashboardApi.riskOverview);
  const diag = useApiQuery(["diagnostics", "stats", range], () => diagnosticsApi.stats(range));
  const funnel = useApiQuery(["diagnostics", "funnel", range], () => diagnosticsApi.funnel(range));

  const s = stats.data;
  const k = kpis.data;
  const a = activity.data;

  const riskCounts = groupByToCounts(risk.data?.byRiskLevel, "riskLevel");
  const riskRows = countsToBreakdown(riskCounts, {
    order: [...RISK_LEVELS, "NONE"],
    labels: { ...RISK_META, NONE: "Not assessed" },
    colors: { ...RISK_META, NONE: "var(--status-neutral)" },
  });
  const profileCounts = groupByToCounts(risk.data?.byProfile, "detectedDisease");
  const profileRows = countsToBreakdown(profileCounts, {
    order: ["ADHD", "BIPOLAR", "SCHIZOPHRENIA", "NONE"],
    labels: DISEASE_LABELS,
    colors: { NONE: "var(--status-neutral)" },
  });
  const funnelSteps =
    funnel.data?.steps.map((step) => ({
      key: step.step,
      label: FUNNEL_LABELS[step.step] ?? step.step,
      count: step.count,
      rate: step.rateFromPrevious,
      note: step.unit === "users" ? "users" : "sessions",
    })) ?? [];

  const criticalPending = s?.criticalCrisesPending ?? 0;

  return (
    <div className="space-y-6">
      <StatGrid>
        <StatCard
          label="Total users"
          icon={Users}
          href="/admin/users"
          loading={stats.isLoading}
          value={formatCompact(s?.totalUsers)}
          hint={s ? `${formatNumber(s.activeUsers)} accounts with active status` : undefined}
        />
        <StatCard
          label="Active users · 7 days"
          icon={Activity}
          href="/admin/users?last_active_days=7"
          loading={activity.isLoading}
          value={formatCompact(a?.activeUsers7d)}
          hint={a ? `${formatPercent(a.retentionRate)} of all users` : undefined}
        />
        <StatCard
          label="Diagnostic completion"
          icon={Stethoscope}
          href="/admin/diagnostics"
          emphasis="success"
          loading={diag.isLoading}
          value={formatRatio(diag.data?.completionRate)}
          hint={diag.data ? `${formatNumber(diag.data.total)} Mira sessions in period` : undefined}
        />
        <StatCard
          label="Critical crises pending"
          icon={AlertOctagon}
          emphasis={criticalPending > 0 ? "danger" : "success"}
          live={criticalPending > 0}
          href="/admin/crisis-events?severity=CRITICAL"
          loading={stats.isLoading}
          value={formatNumber(s?.criticalCrisesPending)}
          hint={s ? `${formatNumber(s.todayCrises)} crises detected today` : undefined}
        />
      </StatGrid>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Sessions today" value={formatNumber(s?.todaySessions)} />
        <MetricCard label="Sessions · 7 days" value={formatNumber(a?.sessionsPerWeek)} />
        <MetricCard label="New users · 30 days" value={formatNumber(k?.newUsers30d)} />
        <MetricCard
          label="Crises handled · 30 days"
          value={formatPercent(k?.crisisResolutionRate)}
          hint="Share with a handling time"
        />
        <MetricCard
          label="Avg. time to handle"
          value={k ? `${formatNumber(k.avgSlaMinutes, 1)} min` : "—"}
          hint={k ? (k.slaMet ? `Within ${k.slaTarget} min SLA` : `Above ${k.slaTarget} min SLA`) : undefined}
        />
        <MetricCard label="Revenue today" value={formatMoney(s?.todayRevenue)} hint="Paid payments only" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="Patient risk distribution"
          description="Users by latest Mira risk level"
          isLoading={risk.isLoading}
          error={risk.error}
          onRetry={risk.refetch}
          isEmpty={sumCounts(riskCounts) === 0}
          table={{ columns: ["Risk level", "Users"], rows: riskRows.map((r) => [r.label, formatNumber(r.value)]) }}
        >
          <BreakdownBarChart data={riskRows} valueLabel="Users" total={sumCounts(riskCounts)} />
        </ChartCard>
        <ChartCard
          title="Detected orientation"
          description="Users by Mira orientation"
          isLoading={risk.isLoading}
          error={risk.error}
          onRetry={risk.refetch}
          isEmpty={sumCounts(profileCounts) === 0}
          table={{ columns: ["Orientation", "Users"], rows: profileRows.map((r) => [r.label, formatNumber(r.value)]) }}
        >
          <BreakdownBarChart data={profileRows} valueLabel="Users" total={sumCounts(profileCounts)} />
        </ChartCard>
        <ChartCard
          title="Diagnostic funnel"
          description="Mira sessions → subscribed users, selected period"
          isLoading={funnel.isLoading}
          error={funnel.error}
          onRetry={funnel.refetch}
          isEmpty={(funnel.data?.steps[0]?.count ?? 0) === 0}
          table={{
            columns: ["Step", "Count", "Step conversion"],
            rows: funnelSteps.map((f) => [f.label, formatNumber(f.count), f.rate === undefined ? "—" : formatRatio(f.rate)]),
          }}
        >
          <div className="flex h-full items-center">
            <div className="w-full">
              <FunnelChart steps={funnelSteps} />
            </div>
          </div>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PendingCrisesPanel />
        <OpenAlertsPanel />
        <RecentUsersPanel />
      </div>
    </div>
  );
}

function FinanceSection() {
  const { can } = useAdminSession();
  const canPlans = can("plans.view");
  const canPayments = can("payments.view");
  const pay = useApiQuery(["dashboard", "payments"], dashboardApi.payments);
  const plans = useApiQuery(["plans", "all"], () => plansApi.list(), { enabled: canPlans });
  const statistics = useApiQuery(["payments", "statistics"], paymentsApi.statistics, { enabled: canPayments });

  const planName = (id: string) => {
    const plan = plans.data?.find((p) => p.id === id);
    return plan ? `${plan.name} (${plan.tier})` : `Plan ${shortId(id)}`;
  };
  const planCounts = groupByToCounts(pay.data?.usersByPlan, "subscriptionPlanId");
  const planRows = countsToBreakdown(planCounts, { sortByValue: true, colors: { NONE: "var(--status-neutral)" } }).map((row) => ({
    ...row,
    label: row.key === "NONE" ? "No plan" : planName(row.key),
  }));
  const statusCounts = groupByToCounts(statistics.data?.byStatus, "status");

  return (
    <div className="space-y-4">
      <SectionHeader title="Revenue" description="Paid payments only. Provider webhooks are not integrated yet, so figures reflect recorded payments." />
      <StatGrid>
        <StatCard
          label="Revenue this month"
          icon={CircleDollarSign}
          loading={pay.isLoading}
          value={formatMoney(pay.data?.mrr)}
          hint="Paid since the 1st of the month"
        />
        <StatCard label="Annualised run rate" loading={pay.isLoading} value={formatMoney(pay.data?.arr)} hint="This month × 12" />
        <StatCard
          label="Paid transactions"
          loading={pay.isLoading}
          value={formatNumber(pay.data?.totalPaidTransactions)}
          hint="All time"
        />
        {canPayments ? (
          <StatCard
            label="Payment success rate"
            loading={statistics.isLoading}
            value={formatPercent(statistics.data?.conversionRate)}
            hint={statistics.data ? `${formatNumber(statistics.data.paidCount)} of ${formatNumber(statistics.data.totalPayments)} payments` : undefined}
          />
        ) : (
          <StatCard label="Users on a plan" loading={pay.isLoading} value={formatNumber(sumCounts(planCounts) - (planCounts.NONE ?? 0))} />
        )}
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="Users by subscription plan"
          isLoading={pay.isLoading}
          error={pay.error}
          onRetry={pay.refetch}
          isEmpty={planRows.length === 0}
          className={canPayments ? "xl:col-span-1" : "xl:col-span-3"}
          table={{ columns: ["Plan", "Users"], rows: planRows.map((r) => [r.label, formatNumber(r.value)]) }}
        >
          <BreakdownBarChart data={planRows.map((r, i) => ({ ...r, color: r.key === "NONE" ? r.color : CATEGORICAL[Math.min(i, 7)] }))} valueLabel="Users" />
        </ChartCard>
        {canPayments && (
          <>
            <ChartCard
              title="Payment outcomes"
              description="All recorded payments by status"
              isLoading={statistics.isLoading}
              error={statistics.error}
              onRetry={statistics.refetch}
              isEmpty={sumCounts(statusCounts) === 0}
              height={180}
            >
              <DistributionBar
                ariaLabel="Payments by status"
                segments={PAYMENT_STATUSES.map((st) => ({
                  key: st,
                  label: PAYMENT_STATUS_META[st].label,
                  value: statusCounts[st] ?? 0,
                  color: PAYMENT_STATUS_META[st].chart,
                }))}
              />
            </ChartCard>
            <RecentPaymentsPanel />
          </>
        )}
      </div>
    </div>
  );
}

const AUTO_REFRESH_MS = 60_000;
const AUTO_KEY = "vm-dashboard-auto-refresh";

function greeting(date: Date): string {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function DashboardView() {
  const { can, admin } = useAdminSession();
  const [range, setRange] = useState<DateRangeValue>({ from: isoDaysAgo(30) });
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [auto, setAuto] = useState(() => {
    try {
      return localStorage.getItem(AUTO_KEY) === "1";
    } catch {
      return false;
    }
  });
  const showOverview = can("dashboard.overview");
  const showFinance = can("dashboard.payments");

  const refresh = useCallback((quiet = false) => {
    if (!quiet) setRefreshing(true);
    invalidateQueries("dashboard", "diagnostics", "crisis-events", "clinical-alerts", "users", "payments", "plans");
    setUpdatedAt(new Date());
    if (!quiet) setTimeout(() => setRefreshing(false), 600);
  }, []);

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh(true);
    }, AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [auto, refresh]);

  const toggleAuto = (value: boolean) => {
    setAuto(value);
    try {
      localStorage.setItem(AUTO_KEY, value ? "1" : "0");
    } catch {
      // storage unavailable
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={showOverview ? "Operations overview" : "Finance overview"}
        description={
          <>
            {greeting(updatedAt)}
            {admin.firstName ? `, ${admin.firstName}` : ""}.{" "}
            {showOverview
              ? "Patient safety, engagement and diagnostics at a glance."
              : "Revenue and subscription health from recorded payments."}
          </>
        }
        meta={
          <span className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={auto ? "size-1.5 rounded-full bg-success" : "size-1.5 rounded-full bg-subtle-foreground"} aria-hidden />
              Updated {format(updatedAt, "HH:mm")}
            </span>
            <label className="flex cursor-pointer items-center gap-2">
              <Switch checked={auto} onCheckedChange={toggleAuto} aria-label="Auto-refresh every minute" className="scale-90" />
              Auto-refresh
            </label>
          </span>
        }
        actions={
          <>
            {showOverview && <DateRangeFilter value={range} onChange={setRange} allLabel="All time" />}
            <Button variant="outline" size="sm" onClick={() => refresh()} disabled={refreshing}>
              <RefreshCw className={refreshing ? "animate-spin" : undefined} /> Refresh
            </Button>
          </>
        }
      />
      {showOverview && <AttentionBanner />}
      {showOverview && <OverviewSection range={range} />}
      {showFinance && (
        <div className={showOverview ? "border-t pt-8" : undefined}>
          <FinanceSection />
        </div>
      )}
    </div>
  );
}
