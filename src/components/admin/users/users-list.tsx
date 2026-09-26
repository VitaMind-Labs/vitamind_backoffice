"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, Pagination, type Column } from "@/components/admin/shared/data-table";
import {
  DateRangeFilter,
  FilterBar,
  optionsFrom,
  SearchInput,
  SelectFilter,
} from "@/components/admin/shared/filters";
import { ListCard } from "@/components/admin/shared/list-card";
import { Can } from "@/components/admin/shared/permission";
import { TableToolbar } from "@/components/admin/shared/table-toolbar";
import { PageHeader } from "@/components/admin/shared/page-header";
import { RiskBadge, StatusBadge } from "@/components/admin/shared/status-badge";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { useListState } from "@/hooks/admin/use-list-state";
import { useTablePrefs } from "@/hooks/admin/use-table-prefs";
import { usersApi, type UserFilters } from "@/lib/api/users";
import { DISEASE_LABELS, LANGUAGE_LABELS, RISK_META, USER_STATUS_META } from "@/lib/constants/status";
import { formatDate, formatNumber, formatRelative, patientRef } from "@/lib/formatters";
import {
  DISEASE_TYPES,
  LANGUAGES,
  RISK_LEVELS,
  SUBSCRIPTION_TIERS,
  USER_STATUSES,
  type AdminUser,
  type DiseaseType,
  type Language,
  type RiskLevel,
  type SubscriptionTier,
  type UserStatus,
} from "@/types/admin";

type Filters = Omit<UserFilters, "page" | "limit">;

const INITIAL: Filters = { sort_by: "created_at", order: "desc" };

const URL_KEYS = [
  "search",
  "status",
  "risk_level",
  "detected_disease",
  "tier",
  "lang",
  "last_active_days",
  "min_crises",
  "from",
  "to",
  "sort_by",
  "order",
] as const satisfies readonly (keyof Filters)[];

function initials(nickname: string): string {
  return nickname.trim().slice(0, 2).toUpperCase() || "?";
}

const columns: Column<AdminUser>[] = [
  {
    id: "patient",
    header: "Patient",
    hideable: false,
    cell: (u) => (
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold text-sidebar-active-foreground ring-1 ring-inset ring-primary/10">
          {initials(u.nickname)}
        </span>
        <div className="min-w-0">
          <p className="font-medium tabular-nums group-hover/row:text-primary">{patientRef(u.patientNumber)}</p>
          <p className="truncate text-xs text-muted-foreground">{u.nickname}</p>
        </div>
      </div>
    ),
  },
  { id: "status", header: "Status", cell: (u) => <StatusBadge value={u.status} meta={USER_STATUS_META} /> },
  { id: "risk", header: "Risk", cell: (u) => <RiskBadge level={u.riskLevel} />, hideBelow: "sm" },
  {
    id: "orientation",
    header: "Orientation",
    hideBelow: "lg",
    cell: (u) => <span className="text-muted-foreground">{u.detectedDisease ? DISEASE_LABELS[u.detectedDisease] : "—"}</span>,
  },
  {
    id: "tier",
    header: "Plan",
    hideBelow: "md",
    cell: (u) => (u.subscriptionPlan ? <Badge tone="brand">{u.subscriptionPlan.tier}</Badge> : <span className="text-muted-foreground">None</span>),
  },
  { id: "lang", header: "Language", hideBelow: "xl", cell: (u) => LANGUAGE_LABELS[u.language] ?? u.language },
  {
    id: "crises",
    header: "Crises",
    hideBelow: "xl",
    align: "right",
    cell: (u) => <span className={u.crisisCount > 0 ? "font-medium text-serious" : "text-muted-foreground"}>{formatNumber(u.crisisCount)}</span>,
  },
  { id: "created", header: "Joined", sortKey: "created_at", hideBelow: "md", cell: (u) => formatDate(u.createdAt) },
  {
    id: "active",
    header: "Last active",
    sortKey: "last_active_at",
    hideBelow: "lg",
    cell: (u) => <span className="text-muted-foreground">{u.lastActiveAt ? formatRelative(u.lastActiveAt) : "Never"}</span>,
  },
];

export function UsersList() {
  const router = useRouter();
  const list = useListState<Filters>(INITIAL, 20, { id: "users", urlKeys: URL_KEYS });
  const { filters, update } = list;
  const prefs = useTablePrefs("users");
  const q = useApiQuery(["users", list.params], () => usersApi.list(list.params), { keepPrevious: true });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Patient accounts, shown by their VM reference. Open a patient for account operations and metadata history."
        actions={
          <Can permission="exports.users">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/exports">
                <Download /> Export CSV
              </Link>
            </Button>
          </Can>
        }
      />
      <ListCard>
        <TableToolbar
          total={q.data?.total}
          noun="patients"
          isFetching={q.isFetching}
          activeFilterCount={list.activeFilterCount}
          columns={columns}
          prefs={prefs}
          className="border-b"
        />
        <FilterBar onReset={list.reset} canReset={list.isFiltered}>
          <SearchInput value={filters.search ?? ""} onChange={(v) => update({ search: v || undefined })} placeholder="Search nickname or email" />
          <SelectFilter label="Status" value={filters.status} options={optionsFrom(USER_STATUSES, USER_STATUS_META)} onChange={(v) => update({ status: v as UserStatus })} />
          <SelectFilter label="Risk" value={filters.risk_level} options={optionsFrom(RISK_LEVELS, RISK_META)} onChange={(v) => update({ risk_level: v as RiskLevel })} />
          <SelectFilter label="Orientation" value={filters.detected_disease} options={optionsFrom(DISEASE_TYPES, DISEASE_LABELS)} onChange={(v) => update({ detected_disease: v as DiseaseType })} />
          <SelectFilter label="Plan" value={filters.tier} options={optionsFrom(SUBSCRIPTION_TIERS)} onChange={(v) => update({ tier: v as SubscriptionTier })} />
          <SelectFilter label="Language" value={filters.lang} options={optionsFrom(LANGUAGES, LANGUAGE_LABELS)} onChange={(v) => update({ lang: v as Language })} />
          <SelectFilter
            label="Active"
            allLabel="Any time"
            value={filters.last_active_days?.toString()}
            options={[
              { value: "1", label: "Last 24 hours" },
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
            ]}
            onChange={(v) => update({ last_active_days: v ? Number(v) : undefined })}
          />
          <SelectFilter
            label="Crises"
            allLabel="Any"
            value={filters.min_crises?.toString()}
            options={[
              { value: "1", label: "At least 1" },
              { value: "3", label: "At least 3" },
            ]}
            onChange={(v) => update({ min_crises: v ? Number(v) : undefined })}
          />
          <DateRangeFilter value={{ from: filters.from, to: filters.to }} onChange={(r) => update({ from: r.from, to: r.to })} allLabel="Any sign-up date" />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={q.data?.data}
          rowKey={(u) => u.id}
          isLoading={q.isLoading}
          isFetching={q.isFetching}
          stale={q.isPlaceholder}
          density={prefs.density}
          hiddenColumns={prefs.hidden}
          error={q.error}
          onRetry={q.refetch}
          onRowClick={(u) => router.push(`/admin/users/${u.id}`)}
          sort={{ sortBy: filters.sort_by, order: filters.order }}
          onSortChange={(s) => update({ sort_by: s.sortBy as Filters["sort_by"], order: s.order })}
          emptyTitle={list.isFiltered ? "No users match these filters" : "No users yet"}
          emptyDescription={list.isFiltered ? "Try removing a filter or widening the date range." : undefined}
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
    </div>
  );
}
