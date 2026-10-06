"use client";

import Link from "next/link";
import {
  Activity, AlertTriangle, BrainCircuit, CheckCircle2, CircleAlert, Database, HeartPulse, RefreshCw, RotateCcw, Server, Siren, XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCard } from "@/components/admin/charts/chart-card";
import { Can } from "@/components/admin/shared/permission";
import { PageHeader, SectionHeader } from "@/components/admin/shared/page-header";
import { ErrorState } from "@/components/admin/shared/states";
import { StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { useApiQuery, invalidateQueries } from "@/hooks/admin/use-api-query";
import { systemApi } from "@/lib/api/system";
import { formatDuration, formatNumber, formatRelative, humanize } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { ComponentStatus, EngineProbe, HealthComponent, HealthIssue, SystemHealth, Verdict } from "@/types/admin";
import { CrisisChart, JournalPipelineChart, LatencyChart, MiraOutcomesChart, UptimeStrip, UsageChart } from "./system-charts";

const VERDICT: Record<Verdict, { label: string; sentence: string; icon: typeof CheckCircle2; box: string; icon_: string }> = {
  healthy: {
    label: "All systems operational",
    sentence: "Every component answers and nothing is waiting longer than it should.",
    icon: CheckCircle2,
    box: "border-success-border bg-success-soft",
    icon_: "text-success",
  },
  degraded: {
    label: "Degraded",
    sentence: "The platform is up, but something needs attention.",
    icon: AlertTriangle,
    box: "border-warning-border bg-warning-soft",
    icon_: "text-warning",
  },
  critical: {
    label: "Critical",
    sentence: "Something that protects patients is failing. Act now.",
    icon: XCircle,
    box: "border-destructive-border bg-destructive-soft",
    icon_: "text-destructive",
  },
};

const STATUS_TONE: Record<ComponentStatus, { dot: string; tone: "success" | "warning" | "danger"; label: string }> = {
  up: { dot: "bg-success", tone: "success", label: "Operational" },
  degraded: { dot: "bg-warning", tone: "warning", label: "Degraded" },
  down: { dot: "bg-destructive", tone: "danger", label: "Down" },
};

/** Where to go to fix each kind of problem. */
const ISSUE_LINKS: Record<string, { href: string; label: string }> = {
  crisis: { href: "/admin/crisis-events", label: "Open crisis queue" },
  alerts: { href: "/admin/clinical-alerts", label: "Open alerts" },
  assignments: { href: "/admin/assignments", label: "Open assignments" },
  reports: { href: "/admin/clinical-alerts", label: "Open alerts" },
};

function VerdictBanner({ health }: { health: SystemHealth }) {
  const v = VERDICT[health.verdict];
  const Icon = v.icon;
  return (
    <div className={cn("rounded-xl border p-4 sm:p-5", v.box)} role="status">
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-6 shrink-0", v.icon_)} aria-hidden />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-base font-semibold tracking-tight">{v.label}</p>
          <p className="text-sm text-muted-foreground">{health.issues.length ? `${health.issues.length} issue${health.issues.length > 1 ? "s" : ""} detected.` : v.sentence}</p>
          {health.issues.length > 0 && (
            <ul className="mt-3 space-y-2">
              {health.issues.map((issue) => (
                <IssueRow key={issue.code} issue={issue} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueRow({ issue }: { issue: HealthIssue }) {
  const link = ISSUE_LINKS[issue.area];
  return (
    <li className="flex flex-wrap items-center gap-2 text-[13px]">
      <Badge tone={issue.severity === "critical" ? "danger" : "warning"}>{issue.severity === "critical" ? "Critical" : "Warning"}</Badge>
      <span className="min-w-0 flex-1">{issue.message}</span>
      {link && (
        <Link href={link.href} className="text-xs font-medium text-primary underline-offset-2 hover:underline">
          {link.label}
        </Link>
      )}
    </li>
  );
}

function ComponentCard({ c }: { c: HealthComponent }) {
  const tone = STATUS_TONE[c.status];
  const Icon = c.kind === "engine" ? BrainCircuit : c.key === "database" ? Database : Server;
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{c.label}</p>
            <p className="text-xs text-muted-foreground">{c.kind === "engine" ? "AI engine" : "Core service"}</p>
          </div>
        </div>
        <Badge tone={tone.tone}>
          <span className={cn("size-1.5 rounded-full", tone.dot)} aria-hidden />
          {tone.label}
        </Badge>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted-foreground">Latency</dt>
        <dd className="text-right tabular-nums">{c.latencyMs === null ? "—" : `${c.latencyMs} ms`}</dd>
        {c.version && (
          <>
            <dt className="text-muted-foreground">Version</dt>
            <dd className="truncate text-right tabular-nums">{c.version}</dd>
          </>
        )}
        {c.contract && (
          <>
            <dt className="text-muted-foreground">Contract</dt>
            <dd className={cn("truncate text-right", !c.contract.match && "font-medium text-warning")}>{c.contract.reported ?? c.contract.expected}</dd>
          </>
        )}
        {c.breaker && (
          <>
            <dt className="text-muted-foreground">Breaker</dt>
            <dd className={cn("text-right", c.breaker.open && "font-medium text-destructive")}>{c.breaker.open ? "Open" : `Closed (${c.breaker.failures} fails)`}</dd>
          </>
        )}
      </dl>
      {c.detail && <p className="text-xs text-muted-foreground">{c.detail}</p>}
    </Card>
  );
}

function Backlogs({ health }: { health: SystemHealth }) {
  const b = health.backlogs;
  const t = health.thresholds;
  return (
    <div className="space-y-3">
      <SectionHeader title="Work waiting" description="Each item has an age limit. A number above zero means someone is being missed." />
      <StatGrid>
        <StatCard label="Crises unhandled" icon={Siren} value={formatNumber(b.crisesUnhandled)} hint={`Pending over ${t.crisisUnhandledMinutes} min`} emphasis={b.crisesUnhandled ? "danger" : "success"} live={b.crisesUnhandled > 0} href="/admin/crisis-events" />
        <StatCard label="Alerts without clinician" icon={CircleAlert} value={formatNumber(b.clinicalAlertsUnrouted)} hint="Open and unrouted" emphasis={b.clinicalAlertsUnrouted ? "danger" : "success"} live={b.clinicalAlertsUnrouted > 0} href="/admin/clinical-alerts" />
        <StatCard label="Alerts past SLA" icon={AlertTriangle} value={formatNumber(b.clinicalAlertsOverdue)} hint="Open beyond their deadline" emphasis={b.clinicalAlertsOverdue ? "warning" : "success"} href="/admin/clinical-alerts" />
        <StatCard label="Requests unanswered" icon={Activity} value={formatNumber(b.clinicianRequestsOverdue)} hint={`Clinician silent over ${t.clinicianRequestWaitHours}h`} emphasis={b.clinicianRequestsOverdue ? "warning" : "success"} href="/admin/assignments" />
        <StatCard label="Journal analyses stuck" icon={BrainCircuit} value={formatNumber(b.journalAnalysesStuck)} hint={`Pending over ${t.stuckAnalysisMinutes} min`} emphasis={b.journalAnalysesStuck ? "warning" : "success"} />
        <StatCard label="Journal failures (24h)" icon={XCircle} value={formatNumber(b.journalAnalysesFailed24h)} hint="Engine could not analyse" emphasis={b.journalAnalysesFailed24h ? "warning" : "success"} />
        <StatCard label="Weekly reports stale" icon={Activity} value={formatNumber(b.weeklyReportsStale)} hint={`Unacknowledged over ${t.weeklyReportWaitHours}h`} emphasis={b.weeklyReportsStale ? "warning" : "success"} />
        <StatCard
          label="API errors"
          icon={Server}
          value={health.http.enabled ? `${health.http.errorRatePct}%` : "n/a"}
          hint={health.http.enabled ? `${formatNumber(health.http.errors5xx)} of ${formatNumber(health.http.requests)} requests (5xx)` : "Enable METRICS_ENABLED to track"}
          emphasis={health.http.enabled && health.http.errorRatePct > t.http5xxRatePct ? "warning" : "default"}
        />
      </StatGrid>
    </div>
  );
}

function OverviewTab({ health }: { health: SystemHealth }) {
  const history = useApiQuery(["system", "history"], () => systemApi.history(), { refetchInterval: 60_000 });
  const activity = useApiQuery(["system", "activity", 14], () => systemApi.activity(14), { staleTime: 120_000 });
  const samples = history.data?.samples ?? [];
  const series = activity.data?.series ?? [];
  const f = health.flow;

  return (
    <div className="space-y-6">
      <Backlogs health={health} />

      <div className="space-y-3">
        <SectionHeader title="Availability" description="One cell per probe, about one a minute. Red means it did not answer." />
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <UptimeStrip label="PostgreSQL" samples={samples} pick={(s) => (s.db === null ? false : true)} />
          <UptimeStrip label="Redis" samples={samples} pick={(s) => (s.redis === null ? false : true)} />
          <UptimeStrip label="Mira" samples={samples} pick={(s) => s.engines.mira?.up ?? null} />
          <UptimeStrip label="Journal engine" samples={samples} pick={(s) => s.engines.journal?.up ?? null} />
          <UptimeStrip label="Check-in engine" samples={samples} pick={(s) => s.engines.checkin?.up ?? null} />
          <UptimeStrip label="Spark engine" samples={samples} pick={(s) => s.engines.spark?.up ?? null} />
        </Card>
        <ChartCard
          title="Response time"
          description="Probe latency per component. A gap in a line means that probe failed."
          isLoading={history.isLoading}
          error={history.error}
          onRetry={history.refetch}
          isEmpty={samples.length < 2}
          emptyLabel="Collecting probes… the first points appear after a couple of minutes"
          height={240}
          footer="Kept in memory on this API instance; resets when it restarts."
        >
          <LatencyChart samples={samples} />
        </ChartCard>
      </div>

      <div className="space-y-3">
        <SectionHeader title="What the platform did" description="Last 14 days, by day." />
        <div className="grid gap-4 xl:grid-cols-2">
          <ChartCard
            title="Mira sessions by outcome"
            description={`Last 24h: ${formatNumber(f.mira.sessions)} sessions, ${f.mira.blockedRatePct ?? 0}% blocked`}
            isLoading={activity.isLoading}
            error={activity.error}
            onRetry={activity.refetch}
            isEmpty={series.every((d) => d.mira.total === 0)}
            table={{
              columns: ["Day", "Completed", "Abandoned", "Blocked", "Total"],
              rows: series.map((d) => [d.day, d.mira.completed, d.mira.abandoned, d.mira.blocked, d.mira.total]),
            }}
          >
            <MiraOutcomesChart series={series} />
          </ChartCard>
          <ChartCard
            title="Journal analysis pipeline"
            description={`Last 24h: ${formatNumber(f.journal.analysed)} analysed, ${formatNumber(f.journal.failed)} failed (${f.journal.failureRatePct ?? 0}%)`}
            isLoading={activity.isLoading}
            error={activity.error}
            onRetry={activity.refetch}
            isEmpty={series.every((d) => d.journal.entries === 0)}
            table={{
              columns: ["Day", "Analysed", "Pending", "Failed", "Flagged"],
              rows: series.map((d) => [d.day, d.journal.analysed, d.journal.pending, d.journal.failed, d.journal.flaggedForReview]),
            }}
          >
            <JournalPipelineChart series={series} />
          </ChartCard>
          <ChartCard
            title="Crisis events"
            description={`Last 24h: ${formatNumber(f.crises.total)} events, ${formatNumber(f.crises.falseAlerts)} false alerts`}
            isLoading={activity.isLoading}
            error={activity.error}
            onRetry={activity.refetch}
            isEmpty={series.every((d) => d.crises.total === 0)}
            emptyLabel="No crisis events in this period"
            table={{
              columns: ["Day", "Total", "Resolved", "False alerts"],
              rows: series.map((d) => [d.day, d.crises.total, d.crises.resolved, d.crises.falseAlerts]),
            }}
          >
            <CrisisChart series={series} />
          </ChartCard>
          <ChartCard
            title="Usage"
            description="Daily check-ins, sign-ups and journal entries flagged for human review"
            isLoading={activity.isLoading}
            error={activity.error}
            onRetry={activity.refetch}
            isEmpty={series.every((d) => d.checkins + d.signups + d.journal.flaggedForReview === 0)}
            table={{
              columns: ["Day", "Check-ins", "Sign-ups", "Flagged"],
              rows: series.map((d) => [d.day, d.checkins, d.signups, d.journal.flaggedForReview]),
            }}
          >
            <UsageChart series={series} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function EngineRow({ name, probe, expected, resetting, onReset }: { name: "mira" | "journal" | "checkin" | "spark"; probe: EngineProbe; expected: string; resetting: boolean; onReset: () => void }) {
  const labels = { mira: "Mira — orientation chat", journal: "Journal engine — entry analysis", checkin: "Check-in engine — daily validation", spark: "Spark engine — ADHD task planning" };
  const up = probe.health?.ok === true;
  const ready = probe.ready?.ok === true;
  const reported = (probe.version?.body?.contract_version as string | undefined) ?? null;
  const version = (probe.version?.body?.version ?? probe.version?.body?.model_version) as string | undefined;
  const ok = up && ready && !probe.breaker.open && (!reported || reported === expected);
  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BrainCircuit className="size-4 text-muted-foreground" aria-hidden />
            {labels[name]}
          </h3>
          <p className="break-all text-xs text-muted-foreground">{probe.url}</p>
        </div>
        <Badge tone={ok ? "success" : up ? "warning" : "danger"}>{ok ? "Healthy" : up ? "Needs attention" : "Unreachable"}</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-[13px] sm:grid-cols-4">
        <Stat label="Reachable" value={up ? `Yes · ${probe.health?.latencyMs} ms` : probe.health?.error ?? "No"} bad={!up} />
        <Stat label="Ready" value={ready ? "Yes" : probe.ready?.error ?? "Not ready"} bad={!ready} />
        <Stat label="Version" value={version ?? "—"} />
        <Stat label="Contract" value={reported ?? "—"} bad={!!reported && reported !== expected} hint={reported && reported !== expected ? `expected ${expected}` : undefined} />
      </dl>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2.5 text-[13px]">
        <div>
          <span className="font-medium">Circuit breaker: </span>
          <span className={cn(probe.breaker.open ? "font-medium text-destructive" : "text-muted-foreground")}>
            {probe.breaker.open ? `open since ${formatRelative(probe.breaker.openedAt)}` : `closed · ${probe.breaker.failures} consecutive failure${probe.breaker.failures === 1 ? "" : "s"}`}
          </span>
          <p className="mt-0.5 text-xs text-muted-foreground">Opens after 5 failures in a row and refuses calls for 30 s so a dead engine cannot stall patients.</p>
        </div>
        <Can permission="system.manage">
          <Button size="sm" variant="outline" onClick={onReset} loading={resetting} disabled={!probe.breaker.open && probe.breaker.failures === 0}>
            <RotateCcw /> Reset breaker
          </Button>
        </Can>
      </div>
    </Card>
  );
}

function Stat({ label, value, bad, hint }: { label: string; value: string; bad?: boolean; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("truncate font-medium", bad && "text-destructive")} title={value}>{value}</dd>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function EnginesTab() {
  const q = useApiQuery(["system", "engines"], () => systemApi.engines(), { refetchInterval: 30_000 });
  const reset = useApiMutation((name: string) => systemApi.resetBreaker(name), {
    invalidate: ["system"],
    successMessage: (r) => `${humanize(r.engine)} breaker reset`,
  });

  if (q.error) return <ErrorState error={q.error} onRetry={q.refetch} />;
  const data = q.data;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The three models that read what patients write. Each runs in its own process, so one going down does not stop the others. Drift and false-positive trends are on the{" "}
        <Link href="/admin/model-drift" className="text-primary underline-offset-2 hover:underline">Detection quality</Link> page.
      </p>
      {data?.warnings.map((w) => (
        <div key={w} className="rounded-lg border border-warning-border bg-warning-soft px-3 py-2 text-[13px]">{w}</div>
      ))}
      {(["mira", "journal", "checkin", "spark"] as const).map((name) =>
        data ? (
          <EngineRow key={name} name={name} probe={data.agents[name]} expected={data.expectedContracts[name]} resetting={reset.isPending} onReset={() => void reset.mutate(name)} />
        ) : (
          <Card key={name} className="h-40 animate-pulse" />
        ),
      )}
    </div>
  );
}

export function SystemView() {
  const q = useApiQuery(["system", "health"], () => systemApi.health(), { refetchInterval: 30_000, staleTime: 10_000 });
  const health = q.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System health"
        description="Is the platform running correctly right now, and has it been? Refreshes every 30 seconds."
        meta={health && <span className="text-xs text-muted-foreground">Checked {formatRelative(health.checkedAt)} · up {formatDuration(health.process.uptimeSeconds)} · {health.process.memoryMb} MB</span>}
        actions={
          <Button size="sm" variant="outline" loading={q.isFetching} onClick={() => { invalidateQueries("system"); }}>
            <RefreshCw /> Refresh
          </Button>
        }
      />

      {q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} />
      ) : !health ? (
        <Card className="h-32 animate-pulse" />
      ) : (
        <>
          <VerdictBanner health={health} />
          <div className="space-y-3">
            <SectionHeader title="Components" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {health.components.map((c) => (
                <ComponentCard key={c.key} c={c} />
              ))}
            </div>
          </div>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview"><HeartPulse className="size-4" /> Overview</TabsTrigger>
              <TabsTrigger value="engines"><BrainCircuit className="size-4" /> AI engines</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="pt-4">
              <OverviewTab health={health} />
            </TabsContent>
            <TabsContent value="engines" className="pt-4">
              <EnginesTab />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
