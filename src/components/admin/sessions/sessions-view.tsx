"use client";

import { useState } from "react";
import { Activity, Keyboard, MousePointer2, Siren } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, Pagination } from "@/components/admin/shared/data-table";
import { BooleanFilter, DateRangeFilter, FilterBar, NumberFilter } from "@/components/admin/shared/filters";
import { ListCard } from "@/components/admin/shared/list-card";
import { PageHeader } from "@/components/admin/shared/page-header";
import { StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { TableToolbar } from "@/components/admin/shared/table-toolbar";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { useListState } from "@/hooks/admin/use-list-state";
import { useTablePrefs } from "@/hooks/admin/use-table-prefs";
import { sessionsApi, type SessionFilters } from "@/lib/api/sessions";
import { formatCompact, formatNumber } from "@/lib/formatters";
import { SessionDrawer, sessionColumns } from "./session-parts";

type Filters = Omit<SessionFilters, "page" | "limit">;
const INITIAL: Filters = { sort_by: "created_at", order: "desc" };
const URL_KEYS = [
  "is_crisis",
  "from",
  "to",
  "wpm_min",
  "wpm_max",
  "mouse_variance_min",
  "scroll_speed_min",
  "sort_by",
  "order",
] as const satisfies readonly (keyof Filters)[];

const columns = sessionColumns({ withPatient: true });

function AllSessions({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const list = useListState<Filters>(INITIAL, 20, { id: "sessions", urlKeys: URL_KEYS });
  const { filters, update } = list;
  const prefs = useTablePrefs("sessions");
  const q = useApiQuery(["sessions", "list", list.params], () => sessionsApi.list(list.params), { keepPrevious: true });

  return (
    <ListCard>
      <TableToolbar
        total={q.data?.total}
        noun="sessions"
        isFetching={q.isFetching}
        activeFilterCount={list.activeFilterCount}
        columns={columns}
        prefs={prefs}
        className="border-b"
      />
      <FilterBar onReset={list.reset} canReset={list.isFiltered}>
        <BooleanFilter label="Crisis" value={filters.is_crisis} onChange={(v) => update({ is_crisis: v })} trueLabel="Crisis detected" falseLabel="No crisis" />
        <DateRangeFilter value={{ from: filters.from, to: filters.to }} onChange={(r) => update({ from: r.from, to: r.to })} />
        <NumberFilter label="WPM ≥" value={filters.wpm_min} onChange={(v) => update({ wpm_min: v })} />
        <NumberFilter label="WPM ≤" value={filters.wpm_max} onChange={(v) => update({ wpm_max: v })} />
        <NumberFilter label="Mouse var. ≥" value={filters.mouse_variance_min} onChange={(v) => update({ mouse_variance_min: v })} />
        <NumberFilter label="Scroll ≥" value={filters.scroll_speed_min} onChange={(v) => update({ scroll_speed_min: v })} />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={q.data?.data}
        rowKey={(s) => s.id}
        isLoading={q.isLoading}
        isFetching={q.isFetching}
        stale={q.isPlaceholder}
        density={prefs.density}
        hiddenColumns={prefs.hidden}
        error={q.error}
        onRetry={q.refetch}
        onRowClick={(s) => onSelect(s.id)}
        activeRowKey={selected}
        sort={{ sortBy: filters.sort_by, order: filters.order }}
        onSortChange={(s) => update({ sort_by: s.sortBy as Filters["sort_by"], order: s.order })}
        emptyTitle={list.isFiltered ? "No sessions match these filters" : "No sessions recorded"}
        rowClassName={(s) => (s.isCrisisDetected ? "bg-destructive-soft/30" : undefined)}
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
  );
}

function CrisisSessions({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const list = useListState<Record<string, never>>({}, 20, { id: "sessions-crisis" });
  const prefs = useTablePrefs("sessions-crisis");
  const q = useApiQuery(["sessions", "crisis", list.page, list.limit], () => sessionsApi.crisis({ page: list.page, limit: list.limit }), {
    keepPrevious: true,
  });
  return (
    <ListCard title="Sessions with a detected crisis" description="Most recent first">
      <TableToolbar total={q.data?.total} noun="crisis sessions" isFetching={q.isFetching} columns={columns} prefs={prefs} className="border-b" />
      <DataTable
        columns={columns}
        rows={q.data?.data}
        rowKey={(s) => s.id}
        isLoading={q.isLoading}
        isFetching={q.isFetching}
        stale={q.isPlaceholder}
        density={prefs.density}
        hiddenColumns={prefs.hidden}
        error={q.error}
        onRetry={q.refetch}
        onRowClick={(s) => onSelect(s.id)}
        activeRowKey={selected}
        emptyTitle="No crisis sessions"
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
  );
}

export function SessionsView() {
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState("all");
  const analytics = useApiQuery(["sessions", "analytics"], sessionsApi.analytics);
  const crisisCount = useApiQuery(["sessions", "crisis-count"], () => sessionsApi.crisis({ limit: 1 }));
  const a = analytics.data;
  const crisisTotal = crisisCount.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        description="Behavioural telemetry recorded during patient sessions. IP addresses are never exposed."
      />
      <StatGrid>
        <StatCard label="Sessions recorded" icon={Activity} loading={analytics.isLoading} value={formatCompact(a?.totalSessions)} hint="All time" />
        <StatCard
          label="Crisis sessions"
          icon={Siren}
          emphasis={crisisTotal > 0 ? "danger" : "success"}
          loading={crisisCount.isLoading}
          value={formatNumber(crisisCount.data?.total)}
          hint={a && crisisCount.data && a.totalSessions > 0 ? `${((crisisTotal / a.totalSessions) * 100).toFixed(1)}% of sessions · open list` : undefined}
          onClick={() => setTab("crisis")}
          active={tab === "crisis"}
        />
        <StatCard
          label="Average typing speed"
          icon={Keyboard}
          loading={analytics.isLoading}
          value={a?.avgWpm != null ? `${formatNumber(a.avgWpm, 1)} wpm` : "—"}
          hint={a?.avgBackspaceRate != null ? `Backspace rate ${formatNumber(a.avgBackspaceRate, 2)}` : undefined}
        />
        <StatCard
          label="Average mouse variance"
          icon={MousePointer2}
          loading={analytics.isLoading}
          value={formatNumber(a?.avgMouseVariance, 2)}
          hint={a?.avgScrollSpeed != null ? `Scroll speed ${formatNumber(a.avgScrollSpeed, 2)}` : undefined}
        />
      </StatGrid>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">
            <Activity /> All sessions
          </TabsTrigger>
          <TabsTrigger value="crisis">
            <Siren /> Crisis sessions
            {crisisTotal > 0 && (
              <span className="rounded-full bg-destructive-soft px-1.5 py-px text-[11px] font-semibold tabular-nums text-destructive">
                {formatCompact(crisisTotal)}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <AllSessions selected={selected} onSelect={setSelected} />
        </TabsContent>
        <TabsContent value="crisis">
          <CrisisSessions selected={selected} onSelect={setSelected} />
        </TabsContent>
      </Tabs>
      <SessionDrawer sessionId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
