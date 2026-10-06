"use client";

import { useState } from "react";
import { Hourglass, Percent, Stethoscope, TimerReset } from "lucide-react";
import { BreakdownBarChart } from "@/components/admin/charts/breakdown-bar-chart";
import { ChartCard } from "@/components/admin/charts/chart-card";
import { DistributionBar } from "@/components/admin/charts/distribution-bar";
import { FunnelChart } from "@/components/admin/charts/funnel-chart";
import { countsToBreakdown, sumCounts } from "@/components/admin/charts/transform";
import { DataTable, Pagination, type Column } from "@/components/admin/shared/data-table";
import { CopyableId, DetailDrawer, DetailRow, DetailSection, PrivacyNote } from "@/components/admin/shared/detail";
import {
  BooleanFilter,
  DateRangeFilter,
  FilterBar,
  optionsFrom,
  SelectFilter,
  type DateRangeValue,
} from "@/components/admin/shared/filters";
import { ListCard } from "@/components/admin/shared/list-card";
import { PageHeader } from "@/components/admin/shared/page-header";
import { RiskBadge, StatusBadge } from "@/components/admin/shared/status-badge";
import { StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { TableToolbar } from "@/components/admin/shared/table-toolbar";
import { ErrorState, LoadingBlock } from "@/components/admin/shared/states";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { useListState } from "@/hooks/admin/use-list-state";
import { useTablePrefs } from "@/hooks/admin/use-table-prefs";
import { diagnosticsApi, type DiagnosticFilters } from "@/lib/api/diagnostics";
import { DIAGNOSTIC_STATUS_META, DISEASE_LABELS, LANGUAGE_LABELS, RISK_META } from "@/lib/constants/status";
import { formatDateTime, formatNumber, formatRatio, formatRelative, humanize } from "@/lib/formatters";
import {
  DIAGNOSTIC_STATUSES,
  DISEASE_TYPES,
  LANGUAGES,
  RISK_LEVELS,
  type DiagnosticSession,
  type DiagnosticStatus,
  type DiseaseType,
  type Language,
  type RiskLevel,
} from "@/types/admin";

type Filters = Omit<DiagnosticFilters, "page" | "limit">;

const INITIAL: Filters = {};
const URL_KEYS = ["status", "riskLevel", "orientation", "language", "claimed", "from", "to"] as const satisfies readonly (keyof Filters)[];

const FUNNEL_LABELS: Record<string, string> = {
  started: "Started",
  completed: "Completed",
  claimed: "Claimed by a clinician",
};

function diagnosticColumns(): Column<DiagnosticSession>[] {
  return [
    {
      id: "stage",
      header: "Session",
      hideable: false,
      cell: (d) => (
        <div className="min-w-0">
          <p className="font-medium">{humanize(d.stage)}</p>
          <p className="truncate text-xs text-muted-foreground">
            {d.messageCount} messages · attempt {d.attemptNumber}
          </p>
        </div>
      ),
    },
    { id: "status", header: "Status", cell: (d) => <StatusBadge value={d.status} meta={DIAGNOSTIC_STATUS_META} /> },
    { id: "risk", header: "Risk", cell: (d) => <RiskBadge level={d.riskLevel} />, hideBelow: "sm" },
    {
      id: "orientation",
      header: "Orientation",
      hideBelow: "lg",
      cell: (d) => <span className="text-muted-foreground">{d.orientation ? DISEASE_LABELS[d.orientation] : "—"}</span>,
    },
    { id: "lang", header: "Language", hideBelow: "xl", cell: (d) => LANGUAGE_LABELS[d.language] ?? d.language },
    {
      id: "confidence",
      header: "Confidence",
      hideBelow: "xl",
      align: "right",
      cell: (d) => <span className="tabular-nums">{d.confidence === null ? "—" : formatRatio(d.confidence)}</span>,
    },
    {
      id: "activity",
      header: "Last activity",
      cell: (d) => (
        <div>
          <p className="text-[13px]">{formatRelative(d.lastActivityAt)}</p>
          <p className="text-xs text-muted-foreground">{d.completedAt ? `Completed ${formatDateTime(d.completedAt)}` : "Not completed"}</p>
        </div>
      ),
    },
  ];
}

function DiagnosticDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const q = useApiQuery(id ? ["diagnostics", "detail", id] : null, () => diagnosticsApi.get(id!));
  const d = q.data;

  return (
    <DetailDrawer
      open={!!id}
      onOpenChange={(open) => !open && onClose()}
      title={d ? humanize(d.stage) : "Diagnostic session"}
      description={d ? `Started ${formatDateTime(d.createdAt)}` : "Loading…"}
      badges={
        d && (
          <>
            <StatusBadge value={d.status} meta={DIAGNOSTIC_STATUS_META} />
            <RiskBadge level={d.riskLevel} />
          </>
        )
      }
    >
      {q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} compact />
      ) : !d ? (
        <LoadingBlock rows={6} />
      ) : (
        <>
          <DetailSection title="Session">
            <DetailRow label="Identifier">
              <CopyableId value={d.id} display={d.id.slice(0, 13)} />
            </DetailRow>
            <DetailRow label="Status">
              <StatusBadge value={d.status} meta={DIAGNOSTIC_STATUS_META} />
            </DetailRow>
            <DetailRow label="Stage">{humanize(d.stage)}</DetailRow>
            <DetailRow label="Language">{LANGUAGE_LABELS[d.language] ?? d.language}</DetailRow>
            <DetailRow label="Messages">{formatNumber(d.messageCount)}</DetailRow>
            <DetailRow label="Attempt">{d.attemptNumber}</DetailRow>
            <DetailRow label="Mira version">{d.miraVersion ?? "—"}</DetailRow>
          </DetailSection>
          <DetailSection title="Assessment">
            <DetailRow label="Risk level">
              <RiskBadge level={d.riskLevel} />
            </DetailRow>
            <DetailRow label="Last safety level">
              <RiskBadge level={d.lastSafetyLevel} />
            </DetailRow>
            <DetailRow label="Orientation">{d.orientation ? DISEASE_LABELS[d.orientation] : "Not determined"}</DetailRow>
            <DetailRow label="Confidence">{d.confidence === null ? "—" : formatRatio(d.confidence)}</DetailRow>
          </DetailSection>
          <DetailSection title="Lifecycle">
            <DetailRow label="Created">{formatDateTime(d.createdAt)}</DetailRow>
            <DetailRow label="Last activity">{formatDateTime(d.lastActivityAt)}</DetailRow>
            <DetailRow label="Claimed">{d.claimedAt ? formatDateTime(d.claimedAt) : "Not claimed"}</DetailRow>
            <DetailRow label="Completed">{d.completedAt ? formatDateTime(d.completedAt) : "Not completed"}</DetailRow>
            <DetailRow label="Expires">{d.expiresAt ? formatDateTime(d.expiresAt) : "No expiry"}</DetailRow>
          </DetailSection>
          <PrivacyNote>
            Mira prompts, patient answers and generated reports are never available in the admin platform. Only session metadata is
            shown.
          </PrivacyNote>
        </>
      )}
    </DetailDrawer>
  );
}

function AnalyticsSection({ range }: { range: DateRangeValue }) {
  const stats = useApiQuery(["diagnostics", "stats", range], () => diagnosticsApi.stats(range));
  const funnel = useApiQuery(["diagnostics", "funnel", range], () => diagnosticsApi.funnel(range));
  const s = stats.data;

  const statusRows = countsToBreakdown(s?.byStatus, { order: [...DIAGNOSTIC_STATUSES], colors: { COMPLETED: "var(--status-good)", ABANDONED: "var(--status-warning)", EXPIRED: "var(--status-neutral)", BLOCKED: "var(--status-critical)" } });
  const riskRows = countsToBreakdown(s?.byRiskLevel, {
    order: [...RISK_LEVELS],
    labels: { ...RISK_META, NONE: "Not assessed" },
    colors: { ...RISK_META, NONE: "var(--status-neutral)" },
  });
  const orientationRows = countsToBreakdown(s?.byOrientation, {
    order: [...DISEASE_TYPES, "NONE"],
    labels: DISEASE_LABELS,
    colors: { NONE: "var(--status-neutral)" },
  });
  const stageRows = countsToBreakdown(s?.abandonmentByStage, { sortByValue: true });
  const steps =
    funnel.data?.steps.map((step) => ({
      key: step.step,
      label: FUNNEL_LABELS[step.step] ?? humanize(step.step),
      count: step.count,
      rate: step.rateFromPrevious,
      note: step.unit === "users" ? "users" : "sessions",
    })) ?? [];

  if (stats.error || funnel.error) {
    return (
      <div className="rounded-lg border bg-card">
        <ErrorState error={stats.error ?? funnel.error} onRetry={() => void stats.refetch().then(() => funnel.refetch())} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <StatGrid>
        <StatCard
          label="Mira sessions in period"
          icon={Stethoscope}
          loading={stats.isLoading}
          value={formatNumber(s?.total)}
          hint={range.from || range.to ? "Selected period" : "All time"}
        />
        <StatCard
          label="Completion rate"
          icon={Percent}
          emphasis="success"
          loading={stats.isLoading}
          value={formatRatio(s?.completionRate)}
          hint="Completed ÷ started"
        />
        <StatCard
          label="Abandonment rate"
          icon={Hourglass}
          emphasis={(s?.abandonmentRate ?? 0) > 0.3 ? "warning" : "default"}
          loading={stats.isLoading}
          value={formatRatio(s?.abandonmentRate)}
          hint="Abandoned ÷ started"
        />
        <StatCard
          label="Sessions in progress"
          icon={TimerReset}
          loading={stats.isLoading}
          value={formatNumber(s?.byStatus?.ACTIVE)}
          hint="Started and not finished"
        />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <ChartCard
          title="Diagnostic funnel"
          description="Started → completed → claimed"
          isLoading={funnel.isLoading}
          isEmpty={(funnel.data?.steps[0]?.count ?? 0) === 0}
          emptyLabel="No diagnostic activity in this period"
          table={{
            columns: ["Step", "Count", "Step conversion"],
            rows: steps.map((step) => [step.label, formatNumber(step.count), step.rate === undefined ? "—" : formatRatio(step.rate)]),
          }}
        >
          <div className="flex h-full items-center">
            <div className="w-full">
              <FunnelChart steps={steps} />
            </div>
          </div>
        </ChartCard>
        <ChartCard
          title="Outcomes"
          description="Sessions by status"
          isLoading={stats.isLoading}
          isEmpty={!s || s.total === 0}
          height={200}
          table={{ columns: ["Status", "Sessions"], rows: statusRows.map((r) => [r.label, formatNumber(r.value)]) }}
        >
          <DistributionBar
            ariaLabel="Diagnostic sessions by status"
            segments={DIAGNOSTIC_STATUSES.map((status) => ({
              key: status,
              label: DIAGNOSTIC_STATUS_META[status].label,
              value: s?.byStatus?.[status] ?? 0,
              color:
                status === "COMPLETED"
                  ? "var(--status-good)"
                  : status === "ABANDONED"
                    ? "var(--status-warning)"
                    : status === "BLOCKED"
                      ? "var(--status-critical)"
                      : status === "EXPIRED"
                        ? "var(--status-neutral)"
                        : "var(--chart-1)",
            }))}
          />
        </ChartCard>
        <ChartCard
          title="Abandonment by stage"
          description="Where patients stopped answering"
          isLoading={stats.isLoading}
          isEmpty={sumCounts(s?.abandonmentByStage) === 0}
          emptyLabel="No abandoned sessions in this period"
          table={{ columns: ["Stage", "Abandoned"], rows: stageRows.map((r) => [r.label, formatNumber(r.value)]) }}
        >
          <BreakdownBarChart data={stageRows} valueLabel="Abandoned" total={sumCounts(s?.abandonmentByStage)} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="Risk level at assessment"
          description="Sessions by Mira risk level"
          isLoading={stats.isLoading}
          isEmpty={sumCounts(s?.byRiskLevel) === 0}
          table={{ columns: ["Risk level", "Sessions"], rows: riskRows.map((r) => [r.label, formatNumber(r.value)]) }}
        >
          <BreakdownBarChart data={riskRows} valueLabel="Sessions" total={sumCounts(s?.byRiskLevel)} />
        </ChartCard>
        <ChartCard
          title="Detected orientation"
          description="Sessions by Mira orientation"
          isLoading={stats.isLoading}
          isEmpty={sumCounts(s?.byOrientation) === 0}
          table={{ columns: ["Orientation", "Sessions"], rows: orientationRows.map((r) => [r.label, formatNumber(r.value)]) }}
        >
          <BreakdownBarChart data={orientationRows} valueLabel="Sessions" total={sumCounts(s?.byOrientation)} />
        </ChartCard>
      </div>
    </div>
  );
}

const columns = diagnosticColumns();

export function DiagnosticsView() {
  const list = useListState<Filters>(INITIAL, 20, { id: "diagnostics", urlKeys: URL_KEYS });
  const { filters, update } = list;
  const prefs = useTablePrefs("diagnostics");
  const [selected, setSelected] = useState<string | null>(null);
  const range: DateRangeValue = { from: filters.from, to: filters.to };
  const q = useApiQuery(["diagnostics", "list", list.params], () => diagnosticsApi.list(list.params), { keepPrevious: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Diagnostics"
        description="Mira diagnostic sessions: where patients stop, what orientation the model converges on, and how many sessions reach a clinician. Transcript content is never exposed."
        actions={<DateRangeFilter value={range} onChange={(r) => update({ from: r.from, to: r.to })} allLabel="All time" />}
      />

      <AnalyticsSection range={range} />

      <ListCard
        title="Diagnostic sessions"
        description="Metadata for every Mira conversation recorded in the selected period"
      >
        <FilterBar onReset={list.reset} canReset={list.isFiltered}>
          <SelectFilter
            label="Status"
            value={filters.status}
            options={optionsFrom(DIAGNOSTIC_STATUSES, DIAGNOSTIC_STATUS_META)}
            onChange={(v) => update({ status: v as DiagnosticStatus })}
          />
          <SelectFilter
            label="Risk"
            value={filters.riskLevel}
            options={optionsFrom(RISK_LEVELS, RISK_META)}
            onChange={(v) => update({ riskLevel: v as RiskLevel })}
          />
          <SelectFilter
            label="Orientation"
            value={filters.orientation}
            options={optionsFrom(DISEASE_TYPES, DISEASE_LABELS)}
            onChange={(v) => update({ orientation: v as DiseaseType })}
          />
          <SelectFilter
            label="Language"
            value={filters.language}
            options={optionsFrom(LANGUAGES, LANGUAGE_LABELS)}
            onChange={(v) => update({ language: v as Language })}
          />
          <BooleanFilter
            label="Claimed"
            value={filters.claimed}
            onChange={(v) => update({ claimed: v })}
            trueLabel="Claimed"
            falseLabel="Unclaimed"
          />
        </FilterBar>
        <TableToolbar
          total={q.data?.total}
          noun="sessions"
          isFetching={q.isFetching}
          activeFilterCount={list.activeFilterCount}
          columns={columns}
          prefs={prefs}
          className="border-b"
        />
        <DataTable
          columns={columns}
          rows={q.data?.data}
          rowKey={(d) => d.id}
          isLoading={q.isLoading}
          isFetching={q.isFetching}
          stale={q.isPlaceholder}
          density={prefs.density}
          hiddenColumns={prefs.hidden}
          error={q.error}
          onRetry={q.refetch}
          onRowClick={(d) => setSelected(d.id)}
          activeRowKey={selected}
          emptyTitle={list.isFiltered ? "No sessions match these filters" : "No diagnostic sessions recorded"}
        />
        {q.data && (
          <Pagination
            page={q.data.page}
            totalPages={q.data.totalPages}
            total={q.data.total}
            limit={q.data.limit}
            onPageChange={list.setPage}
            onLimitChange={list.setLimit}
            isFetching={q.isFetching}
          />
        )}
      </ListCard>

      <DiagnosticDrawer id={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
