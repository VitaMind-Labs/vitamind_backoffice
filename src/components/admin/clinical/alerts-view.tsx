"use client";

import { useState } from "react";
import { BellRing, Route, ShieldAlert, ShieldCheck } from "lucide-react";
import { DataTable, Pagination } from "@/components/admin/shared/data-table";
import { BooleanFilter, DateRangeFilter, FilterBar, optionsFrom, SelectFilter } from "@/components/admin/shared/filters";
import { ListCard } from "@/components/admin/shared/list-card";
import { PageHeader } from "@/components/admin/shared/page-header";
import { StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { QueueTabs, TableToolbar } from "@/components/admin/shared/table-toolbar";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { useListState } from "@/hooks/admin/use-list-state";
import { useAlertCounts } from "@/hooks/admin/use-queue-counts";
import { useTablePrefs } from "@/hooks/admin/use-table-prefs";
import { alertsApi, type AlertFilters } from "@/lib/api/clinical";
import { ALERT_TYPE_META, RISK_META } from "@/lib/constants/status";
import { formatNumber } from "@/lib/formatters";
import { ALERT_TYPES, RISK_LEVELS, type AlertStatus, type AlertType, type ClinicalAlert, type RiskLevel } from "@/types/admin";
import { AlertDrawer, alertColumns } from "./alerts-parts";

type Filters = Omit<AlertFilters, "page" | "limit">;

const INITIAL: Filters = { status: "OPEN" };
const URL_KEYS = ["status", "severity", "type", "unrouted", "sla_breached", "from", "to"] as const satisfies readonly (keyof Filters)[];
const columns = alertColumns();

export function ClinicalAlertsView() {
  const list = useListState<Filters>(INITIAL, 20, { id: "clinical-alerts", urlKeys: URL_KEYS });
  const { filters, update } = list;
  const prefs = useTablePrefs("clinical-alerts");
  const [selected, setSelected] = useState<ClinicalAlert | null>(null);
  const totals = useAlertCounts({ live: true });

  const q = useApiQuery(["clinical-alerts", "list", list.params], () => alertsApi.list(list.params), { keepPrevious: true });

  const open = totals.open.data?.total;
  const acknowledged = totals.acknowledged.data?.total;
  const escalated = totals.escalated.data?.total;
  const unrouted = totals.unrouted.data?.total ?? 0;
  const breached = totals.breached.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical alerts"
        description="Alerts raised by the rules engine for the care team. Rerouting an alert hands the SLA to the new assignee and is recorded in the audit log."
      />

      <StatGrid>
        <StatCard
          label="Open"
          icon={BellRing}
          emphasis={(open ?? 0) > 0 ? "warning" : "success"}
          loading={totals.open.isLoading}
          value={formatNumber(open)}
          hint="Not acknowledged yet"
          onClick={() => update({ status: "OPEN", unrouted: undefined, sla_breached: undefined })}
          active={filters.status === "OPEN" && filters.unrouted === undefined && filters.sla_breached === undefined}
        />
        <StatCard
          label="Acknowledged"
          icon={ShieldCheck}
          loading={totals.acknowledged.isLoading}
          value={formatNumber(acknowledged)}
          hint="Being handled by a clinician"
          onClick={() => update({ status: "ACKNOWLEDGED", unrouted: undefined, sla_breached: undefined })}
          active={filters.status === "ACKNOWLEDGED" && filters.unrouted === undefined && filters.sla_breached === undefined}
        />
        <StatCard
          label="Unrouted"
          icon={Route}
          emphasis={unrouted > 0 ? "danger" : "success"}
          live={unrouted > 0}
          loading={totals.unrouted.isLoading}
          value={formatNumber(totals.unrouted.data?.total)}
          hint="No clinician assigned · all statuses"
          onClick={() => update({ status: undefined, unrouted: true, sla_breached: undefined })}
          active={filters.unrouted === true && filters.status === undefined}
        />
        <StatCard
          label="SLA breached"
          icon={ShieldAlert}
          emphasis={breached > 0 ? "danger" : "success"}
          loading={totals.breached.isLoading}
          value={formatNumber(totals.breached.data?.total)}
          hint="Past the response deadline · all statuses"
          onClick={() => update({ status: undefined, sla_breached: true, unrouted: undefined })}
          active={filters.sla_breached === true && filters.status === undefined}
        />
      </StatGrid>

      <ListCard title="Alert queue" description="Newest alerts first · counts refresh every minute">
        <QueueTabs<AlertStatus>
          label="Alert status"
          value={filters.status}
          onChange={(status) => update({ status })}
          tabs={[
            { value: "OPEN", label: "Open", count: open, tone: "warning" },
            { value: "ACKNOWLEDGED", label: "Acknowledged", count: acknowledged, tone: "info" },
            { value: "ESCALATED", label: "Escalated", count: escalated, tone: "danger" },
            { value: "RESOLVED", label: "Resolved" },
            { value: "DISMISSED", label: "Dismissed" },
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
            label="Type"
            value={filters.type}
            options={optionsFrom(ALERT_TYPES, ALERT_TYPE_META)}
            onChange={(v) => update({ type: v as AlertType })}
          />
          <BooleanFilter
            label="Routed"
            value={filters.unrouted}
            onChange={(v) => update({ unrouted: v })}
            trueLabel="Unrouted"
            falseLabel="Routed"
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
            allLabel="Any trigger date"
          />
        </FilterBar>
        <TableToolbar
          total={q.data?.total}
          noun="alerts"
          isFetching={q.isFetching}
          activeFilterCount={list.activeFilterCount}
          columns={columns}
          prefs={prefs}
          className="border-b"
        />
        <DataTable
          columns={columns}
          rows={q.data?.data}
          rowKey={(a) => a.id}
          isLoading={q.isLoading}
          isFetching={q.isFetching}
          stale={q.isPlaceholder}
          density={prefs.density}
          hiddenColumns={prefs.hidden}
          error={q.error}
          onRetry={q.refetch}
          onRowClick={(a) => setSelected(a)}
          activeRowKey={selected?.id}
          emptyTitle={list.isFiltered ? "No alerts match these filters" : "No open alerts — the queue is clear"}
          rowClassName={(a) =>
            a.slaBreached && a.status !== "RESOLVED" && a.status !== "DISMISSED"
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

      <AlertDrawer alert={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
