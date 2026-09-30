"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/admin/shared/states";
import { RiskBadge, SlaBadge, StatusBadge } from "@/components/admin/shared/status-badge";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { alertsApi, crisisApi } from "@/lib/api/clinical";
import { paymentsApi } from "@/lib/api/payments";
import { usersApi } from "@/lib/api/users";
import { ALERT_STATUS_META, PAYMENT_STATUS_META, USER_STATUS_META } from "@/lib/constants/status";
import { formatMoney, formatRelative, humanize, patientRef } from "@/lib/formatters";

function Panel({
  title,
  href,
  count,
  children,
}: {
  title: string;
  href: string;
  count?: number;
  children: ReactNode;
}) {
  return (
    <Card className="flex min-w-0 flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-5 py-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          {title}
          {count !== undefined && (
            <span className="rounded-full bg-muted px-1.5 py-px text-[11px] font-medium tabular-nums text-muted-foreground">{count}</span>
          )}
        </h3>
        <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="flex-1">{children}</div>
    </Card>
  );
}

function PanelSkeleton() {
  return (
    <ul className="divide-y">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-center justify-between gap-3 px-5 py-3">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

function Row({ primary, secondary, trailing, href }: { primary: ReactNode; secondary: ReactNode; trailing: ReactNode; href: string }) {
  return (
    <li>
      <Link href={href} className="flex items-center justify-between gap-3 px-5 py-2.5 transition-colors hover:bg-muted/40">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[13px] font-medium">{primary}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{secondary}</div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">{trailing}</div>
      </Link>
    </li>
  );
}

export function PendingCrisesPanel() {
  const q = useApiQuery(["crisis-events", "dashboard-pending"], () => crisisApi.list({ status: "PENDING", limit: 6 }));
  return (
    <Panel title="Crises awaiting action" href="/admin/crisis-events" count={q.data?.total}>
      {q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} compact />
      ) : !q.data ? (
        <PanelSkeleton />
      ) : q.data.data.length === 0 ? (
        <EmptyState compact title="No pending crises" description="Every detected crisis has been taken in charge." />
      ) : (
        <ul className="divide-y">
          {q.data.data.map((c) => (
            <Row
              key={c.id}
              href={`/admin/crisis-events?focus=${c.id}`}
              primary={
                <>
                  {patientRef(c.user?.patientNumber)}
                  <RiskBadge level={c.detectedRiskLevel} />
                </>
              }
              secondary={`${humanize(c.triggerType)} · ${formatRelative(c.createdAt)}`}
              trailing={<SlaBadge breached={c.slaBreached} />}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function OpenAlertsPanel() {
  const q = useApiQuery(["clinical-alerts", "dashboard-open"], () => alertsApi.list({ status: "OPEN", limit: 6 }));
  return (
    <Panel title="Open clinical alerts" href="/admin/clinical-alerts" count={q.data?.total}>
      {q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} compact />
      ) : !q.data ? (
        <PanelSkeleton />
      ) : q.data.data.length === 0 ? (
        <EmptyState compact title="No open alerts" />
      ) : (
        <ul className="divide-y">
          {q.data.data.map((a) => (
            <Row
              key={a.id}
              href="/admin/clinical-alerts"
              primary={
                <>
                  {a.patientRef}
                  <RiskBadge level={a.severity} />
                </>
              }
              secondary={`${humanize(a.type)} · ${a.routedTo ? `Routed to ${a.routedTo.firstName} ${a.routedTo.lastName}` : "Unrouted"}`}
              trailing={a.slaBreached ? <SlaBadge breached /> : <StatusBadge value={a.status} meta={ALERT_STATUS_META} />}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function RecentUsersPanel() {
  const q = useApiQuery(["users", "dashboard-recent"], () => usersApi.list({ limit: 6, sort_by: "created_at", order: "desc" }));
  return (
    <Panel title="Recent sign-ups" href="/admin/users">
      {q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} compact />
      ) : !q.data ? (
        <PanelSkeleton />
      ) : q.data.data.length === 0 ? (
        <EmptyState compact title="No users yet" />
      ) : (
        <ul className="divide-y">
          {q.data.data.map((u) => (
            <Row
              key={u.id}
              href={`/admin/users/${u.id}`}
              primary={patientRef(u.patientNumber)}
              secondary={`${u.subscriptionPlan?.tier ?? "No plan"} · joined ${formatRelative(u.createdAt)}`}
              trailing={<StatusBadge value={u.status} meta={USER_STATUS_META} />}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function RecentPaymentsPanel() {
  const q = useApiQuery(["payments", "dashboard-recent"], () => paymentsApi.list({ limit: 6, sort_by: "created_at", order: "desc" }));
  return (
    <Panel title="Recent payments" href="/admin/payments">
      {q.error ? (
        <ErrorState error={q.error} onRetry={q.refetch} compact />
      ) : !q.data ? (
        <PanelSkeleton />
      ) : q.data.data.length === 0 ? (
        <EmptyState compact title="No payments recorded" />
      ) : (
        <ul className="divide-y">
          {q.data.data.map((p) => (
            <Row
              key={p.id}
              href={`/admin/payments?focus=${p.id}`}
              primary={<span className="tabular-nums">{formatMoney(p.amount, p.currency)}</span>}
              secondary={`${patientRef(p.user?.patientNumber)} · ${formatRelative(p.createdAt)}`}
              trailing={<StatusBadge value={p.status} meta={PAYMENT_STATUS_META} />}
            />
          ))}
        </ul>
      )}
    </Panel>
  );
}
