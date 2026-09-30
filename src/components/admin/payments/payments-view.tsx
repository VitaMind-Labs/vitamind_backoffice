"use client";

import { useState } from "react";
import { CircleCheck, CircleDollarSign, Percent, ReceiptText } from "lucide-react";
import { BreakdownBarChart } from "@/components/admin/charts/breakdown-bar-chart";
import { ChartCard } from "@/components/admin/charts/chart-card";
import { DistributionBar } from "@/components/admin/charts/distribution-bar";
import { countsToBreakdown, groupByToCounts, sumCounts } from "@/components/admin/charts/transform";
import { DataTable, Pagination } from "@/components/admin/shared/data-table";
import { DateRangeFilter, FilterBar, NumberFilter, optionsFrom, SelectFilter } from "@/components/admin/shared/filters";
import { ListCard } from "@/components/admin/shared/list-card";
import { PageHeader } from "@/components/admin/shared/page-header";
import { StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { useListState } from "@/hooks/admin/use-list-state";
import { paymentsApi, type PaymentFilters } from "@/lib/api/payments";
import { PAYMENT_STATUS_META } from "@/lib/constants/status";
import { formatCompact, formatMoney, formatNumber, formatPercent } from "@/lib/formatters";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/types/admin";
import { PaymentDrawer, paymentColumns } from "../payments/payment-parts";

type Filters = Omit<PaymentFilters, "page" | "limit">;

const INITIAL: Filters = { sort_by: "created_at", order: "desc" };

function FinanceCharts() {
  const statistics = useApiQuery(["payments", "statistics"], paymentsApi.statistics);
  const counts = groupByToCounts(statistics.data?.byStatus, "status");
  const rows = countsToBreakdown(counts, {
    order: PAYMENT_STATUSES,
    labels: PAYMENT_STATUS_META,
    colors: PAYMENT_STATUS_META,
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        title="Payment outcomes"
        description="All recorded payments by status"
        isLoading={statistics.isLoading}
        error={statistics.error}
        onRetry={statistics.refetch}
        isEmpty={sumCounts(counts) === 0}
        height={200}
        table={{ columns: ["Status", "Payments"], rows: rows.map((r) => [r.label, formatNumber(r.value)]) }}
      >
        <DistributionBar
          ariaLabel="Payments by status"
          segments={PAYMENT_STATUSES.map((status) => ({
            key: status,
            label: PAYMENT_STATUS_META[status].label,
            value: counts[status] ?? 0,
            color: PAYMENT_STATUS_META[status].chart,
          }))}
        />
      </ChartCard>
      <ChartCard
        title="Status breakdown"
        description="Same figures as counts, for quick comparison"
        isLoading={statistics.isLoading}
        error={statistics.error}
        onRetry={statistics.refetch}
        isEmpty={sumCounts(counts) === 0}
        table={{ columns: ["Status", "Payments", "Share"], rows: rows.map((r) => [r.label, formatNumber(r.value), formatPercent((r.value / Math.max(sumCounts(counts), 1)) * 100)]) }}
      >
        <BreakdownBarChart data={rows} valueLabel="Payments" total={sumCounts(counts)} />
      </ChartCard>
    </div>
  );
}

export function PaymentsView() {
  const list = useListState<Filters>(INITIAL, 20);
  const { filters, update } = list;
  const [selected, setSelected] = useState<string | null>(null);

  const statistics = useApiQuery(["payments", "statistics"], paymentsApi.statistics);
  const q = useApiQuery(["payments", "list", list.params], () => paymentsApi.list(list.params));
  const s = statistics.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Transactions recorded for subscriptions. Refunds and manual status corrections are audited and role-restricted."
      />

      <StatGrid>
        <StatCard
          label="Total revenue"
          icon={CircleDollarSign}
          loading={statistics.isLoading}
          value={formatMoney(s?.totalRevenue)}
          hint="Paid transactions, all time"
        />
        <StatCard
          label="Payments recorded"
          icon={ReceiptText}
          loading={statistics.isLoading}
          value={formatCompact(s?.totalPayments)}
          hint={`${formatNumber(s?.paidCount)} settled`}
        />
        <StatCard
          label="Success rate"
          icon={CircleCheck}
          emphasis={(s?.conversionRate ?? 100) < 80 ? "warning" : "success"}
          loading={statistics.isLoading}
          value={formatPercent(s?.conversionRate)}
          hint="Paid ÷ all payments"
        />
        <StatCard
          label="Failed payments"
          icon={Percent}
          emphasis={(s?.byStatus.find((x) => x.status === "FAILED")?._count ?? 0) > 0 ? "warning" : "default"}
          loading={statistics.isLoading}
          value={formatNumber(s?.byStatus.find((x) => x.status === "FAILED")?._count)}
          hint="Worth reviewing with support"
        />
      </StatGrid>

      <FinanceCharts />

      <ListCard title="Transactions" description="Newest first">
        <FilterBar onReset={list.reset} canReset={list.isFiltered}>
          <SelectFilter
            label="Status"
            value={filters.status}
            options={optionsFrom(PAYMENT_STATUSES, PAYMENT_STATUS_META)}
            onChange={(v) => update({ status: v as PaymentStatus })}
          />
          <NumberFilter label="Amount ≥" value={filters.amount_min} onChange={(v) => update({ amount_min: v })} step="0.01" />
          <NumberFilter label="Amount ≤" value={filters.amount_max} onChange={(v) => update({ amount_max: v })} step="0.01" />
          <DateRangeFilter
            value={{ from: filters.from, to: filters.to }}
            onChange={(r) => update({ from: r.from, to: r.to })}
            allLabel="Any creation date"
          />
        </FilterBar>
        <DataTable
          columns={paymentColumns({ withPatient: true })}
          rows={q.data?.data}
          rowKey={(p) => p.id}
          isLoading={q.isLoading}
          error={q.error}
          onRetry={q.refetch}
          onRowClick={(p) => setSelected(p.id)}
          sort={{ sortBy: filters.sort_by, order: filters.order }}
          onSortChange={(sort) => update({ sort_by: sort.sortBy as Filters["sort_by"], order: sort.order })}
          emptyTitle={list.isFiltered ? "No payments match these filters" : "No payments recorded"}
        />
        {q.data && (
          <Pagination
            page={q.data.page}
            totalPages={q.data.totalPages}
            total={q.data.total}
            limit={q.data.limit}
            onPageChange={list.setPage}
            isFetching={q.isFetching}
          />
        )}
      </ListCard>

      <PaymentDrawer paymentId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
