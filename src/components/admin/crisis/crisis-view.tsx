"use client";

import { useState } from "react";
import { AlertOctagon, Clock, Siren, TrendingUp } from "lucide-react";
import { DataTable, Pagination } from "@/components/admin/shared/data-table";
import {
  BooleanFilter,
  DateRangeFilter,
  FilterBar,
  optionsFrom,
  SelectFilter,
} from "@/components/admin/shared/filters";
import { ListCard } from "@/components/admin/shared/list-card";
import { PageHeader } from "@/components/admin/shared/page-header";
import { StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { QueueTabs, TableToolbar } from "@/components/admin/shared/table-toolbar";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { useListState } from "@/hooks/admin/use-list-state";
import { useCrisisCounts } from "@/hooks/admin/use-queue-counts";
import { useTablePrefs } from "@/hooks/admin/use-table-prefs";
import { crisisApi, type CrisisFilters } from "@/lib/api/clinical";
import { RISK_META, TRIGGER_META } from "@/lib/constants/status";
import { formatNumber } from "@/lib/formatters";
import { RISK_LEVELS, TRIGGER_TYPES, type CrisisStatus, type RiskLevel, type TriggerType } from "@/types/admin";
import { CrisisDrawer, crisisColumns } from "./crisis-parts";

type Filters = Omit<CrisisFilters, "page" | "limit">;

const INITIAL: Filters = { status: "PENDING" };
const URL_KEYS = ["status", "severity", "trigger_type", "sla_breached", "from", "to"] as const satisfies readonly (keyof Filters)[];
const columns = crisisColumns();

export function CrisisEventsView({ focus }: { focus?: string }) {
  const list = useListState<Filters>(INITIAL, 20, { id: "crisis-events", urlKeys: URL_KEYS });
  const { filters, update } = list;
  const prefs = useTablePrefs("crisis-events");
  const [selected, setSelected] = useState<string | null>(focus ?? null);
  const totals = useCrisisCounts({ live: true });

  const q = useApiQuery(["crisis-events", "list", list.params], () => crisisApi.list(list.params), { keepPrevious: true });

  const pending = totals.pending.data?.total;
  const inProgress = totals.inProgress.data?.total;
  const escalated = totals.escalated.data?.total;
  const breached = totals.breached.data?.total ?? 0;
  const critical = totals.criticalPending.data?.total ?? 0;
  const openCount = (pending ?? 0) + (inProgress ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crisis events"
        description="Every crisis raised by a detection channel, with its handling status and SLA. Escalating routes a clinical alert to the on-call psychologist."
      />

      <StatGrid>
        <StatCard
          label="Pending"
          icon={Siren}
          emphasis={(pending ?? 0) > 0 ? "danger" : "success"}
          live={critical > 0}
          loading={totals.pending.isLoading}
          value={formatNumber(pending)}
          hint={critical > 0 ? `${formatNumber(critical)} critical waiting for a handler` : "Waiting for a handler"}
          onClick={() => update({ status: "PENDING", sla_breached: undefined })}
          active={filters.status === "PENDING" && filters.sla_breached === undefined}
        />
        <StatCard
          label="In progress"
          icon={Clock}
          emphasis="warning"
          loading={totals.inProgress.isLoading}
          value={formatNumber(inProgress)}
          hint="Taken, not yet closed"
          onClick={() => update({ status: "IN_PROGRESS", sla_breached: undefined })}
          active={filters.status === "IN_PROGRESS" && filters.sla_breached === undefined}
        />
        <StatCard
          label="SLA breached"
          icon={AlertOctagon}
          emphasis={breached > 0 ? "danger" : "success"}
          loading={totals.breached.isLoading}
          value={formatNumber(totals.breached.data?.total)}
          hint="Past the response deadline · all statuses"
          onClick={() => update({ status: undefined, sla_breached: true })}
          active={filters.sla_breached === true && filters.status === undefined}
        />
        <StatCard
          label="Escalated"
          icon={TrendingUp}
          loading={totals.escalated.isLoading}
          value={formatNumber(escalated)}
          hint={openCount > 0 ? `${formatNumber(openCount)} events still open` : "Nothing open"}
          onClick={() => update({ status: "ESCALATED", sla_breached: undefined })}
          active={filters.status === "ESCALATED" && filters.sla_breached === undefined}
        />
      </StatGrid>

      <ListCard title="Crisis queue" description="Newest detections first · counts refresh every minute">
        <QueueTabs<CrisisStatus>
          label="Crisis status"
          value={filters.status}
          onChange={(status) => update({ status })}
          tabs={[
            { value: "PENDING", label: "Pending", count: pending, tone: "danger" },
            { value: "IN_PROGRESS", label: "In progress", count: inProgress, tone: "info" },
            { value: "ESCALATED", label: "Escalated", count: escalated, tone: "warning" },
            { value: "RESOLVED", label: "Resolved" },
            { value: "FALSE_ALERT", label: "False alerts" },
            { value: undefined, label: "All" },
          ]}
        />
        <FilterBar onReset={list.reset} canReset={list.isFiltered}>
          <SelectFilter
            label="Severity"
            value={filters.severity}
            options={optionsFrom(RISK_LEVELS, RISK_META)}
            onChange={(v) => update({ severity: v as RiskLevel })}
          />
          <SelectFilter
            label="Trigger"
            value={filters.trigger_type}
            options={optionsFrom(TRIGGER_TYPES, TRIGGER_META)}
            onChange={(v) => update({ trigger_type: v as TriggerType })}
          />
          <BooleanFilter
            label="SLA"
            value={filters.sla_breached}
            onChange={(v) => update({ sla_breached: v })}
            trueLabel="Breached"
            falseLabel="Within SLA"
          />
          <DateRangeFilter
            value={{ from: filters.from, to: filters.to }}
            onChange={(r) => update({ from: r.from, to: r.to })}
            allLabel="Any detection date"
          />
        </FilterBar>
        <TableToolbar
          total={q.data?.total}
          noun="events"
          isFetching={q.isFetching}
          activeFilterCount={list.activeFilterCount}
          columns={columns}
          prefs={prefs}
          className="border-b"
        />
        <DataTable
          columns={columns}
          rows={q.data?.data}
          rowKey={(c) => c.id}
          isLoading={q.isLoading}
          isFetching={q.isFetching}
          stale={q.isPlaceholder}
          density={prefs.density}
          hiddenColumns={prefs.hidden}
          error={q.error}
          onRetry={q.refetch}
          onRowClick={(c) => setSelected(c.id)}
          activeRowKey={selected}
          emptyTitle={list.isFiltered ? "No crisis events match these filters" : "No pending crisis — the queue is clear"}
          rowClassName={(c) =>
            c.slaBreached && c.status !== "RESOLVED" && c.status !== "FALSE_ALERT"
              ? "bg-destructive-soft/40 shadow-[inset_2px_0_0_var(--destructive)]"
              : undefined
          }
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

      <CrisisDrawer crisisId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
