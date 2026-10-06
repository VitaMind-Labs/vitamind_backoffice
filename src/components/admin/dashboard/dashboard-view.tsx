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
import { countsToBreakdown, groupByToCounts, sumCounts } from "@/components/admin/charts/transform";
import { DateRangeFilter, type DateRangeValue } from "@/components/admin/shared/filters";
import { PageHeader, SectionHeader } from "@/components/admin/shared/page-header";
import { MetricCard, StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { useAdminSession } from "@/components/admin/providers/admin-session-provider";
import { invalidateQueries, useApiQuery } from "@/hooks/admin/use-api-query";
import { dashboardApi } from "@/lib/api/dashboard";
import { diagnosticsApi } from "@/lib/api/diagnostics";
import { DISEASE_LABELS, RISK_META } from "@/lib/constants/status";
import {
  formatCompact,
  formatNumber,
  formatPercent,
  formatRatio,
  isoDaysAgo,
} from "@/lib/formatters";
import { RISK_LEVELS } from "@/types/admin";
import {
  OpenAlertsPanel,
  PendingCrisesPanel,
} from "./operations-panels";
import { AttentionBanner } from "./attention-banner";

function OverviewSection({ range }: { range: DateRangeValue }) {
  const stats = useApiQuery(["dashboard", "stats"], dashboardApi.stats);
  const kpis = useApiQuery(["dashboard", "kpis"], dashboardApi.kpis);
  const activity = useApiQuery(["dashboard", "user-activity"], dashboardApi.userActivity);
  const risk = useApiQuery(["dashboard", "risk-overview"], dashboardApi.riskOverview);
  const diag = useApiQuery(["diagnostics", "stats", range], () => diagnosticsApi.stats(range));

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
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PendingCrisesPanel />
        <OpenAlertsPanel />
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

  const refresh = useCallback((quiet = false) => {
    if (!quiet) setRefreshing(true);
    invalidateQueries("dashboard", "diagnostics", "crisis-events", "clinical-alerts", "users");
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
        title="Operations overview"
        description={
          <>
            {greeting(updatedAt)}
            {admin.firstName ? `, ${admin.firstName}` : ""}.{" "}
            Patient safety, engagement and diagnostics at a glance.
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
    </div>
  );
}
