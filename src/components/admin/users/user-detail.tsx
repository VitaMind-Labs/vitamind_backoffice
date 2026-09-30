"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  CreditCard,
  Minus,
  MoreHorizontal,
  PencilLine,
  ShieldBan,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartCard } from "@/components/admin/charts/chart-card";
import { RiskTrendChart } from "@/components/admin/charts/risk-trend-chart";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { DataTable, Pagination } from "@/components/admin/shared/data-table";
import { CopyableId, DetailRow, DetailSection, PrivacyNote } from "@/components/admin/shared/detail";
import { ErrorState, PageSkeleton } from "@/components/admin/shared/states";
import { MetricCard } from "@/components/admin/shared/stat-card";
import { RiskBadge, StatusBadge } from "@/components/admin/shared/status-badge";
import { PaymentDrawer, paymentColumns } from "@/components/admin/payments/payment-parts";
import { useAdminSession } from "@/components/admin/providers/admin-session-provider";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { usersApi } from "@/lib/api/users";
import {
  DISEASE_LABELS,
  LANGUAGE_LABELS,
  RISK_META,
  SUBSCRIPTION_STATUS_META,
  USER_STATUS_META,
} from "@/lib/constants/status";
import { formatDate, formatDateTime, formatNumber, formatRelative, patientRef } from "@/lib/formatters";
import type { AdminUserDetail, RiskHistoryPoint } from "@/types/admin";
import { cn } from "@/lib/utils";
import { SubscriptionTierDialog, UserEditDialog, UserStatusDialog } from "./user-dialogs";

function OverviewTab({ user }: { user: AdminUserDetail }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <DetailSection title="Account">
        <DetailRow label="Patient reference">{patientRef(user.patientNumber)}</DetailRow>
        <DetailRow label="Nickname">{user.nickname}</DetailRow>
        <DetailRow label="Email">{user.email}</DetailRow>
        <DetailRow label="Language">{LANGUAGE_LABELS[user.language] ?? user.language}</DetailRow>
        <DetailRow label="Status">
          <StatusBadge value={user.status} meta={USER_STATUS_META} />
        </DetailRow>
        <DetailRow label="Joined">{formatDateTime(user.createdAt)}</DetailRow>
        <DetailRow label="Last active">{user.lastActiveAt ? formatRelative(user.lastActiveAt) : "Never"}</DetailRow>
        <DetailRow label="Identifier">
          <CopyableId value={user.id} display={user.id.slice(0, 13)} />
        </DetailRow>
      </DetailSection>
      <div className="space-y-5">
        <DetailSection title="Subscription">
          <DetailRow label="Plan">{user.subscriptionPlan ? `${user.subscriptionPlan.name} · ${user.subscriptionPlan.tier}` : "No plan"}</DetailRow>
          <DetailRow label="Subscription status">
            <StatusBadge value={user.subscriptionStatus} meta={SUBSCRIPTION_STATUS_META} />
          </DetailRow>
        </DetailSection>
        <DetailSection title="Clinical metadata">
          <DetailRow label="Latest risk level">
            <RiskBadge level={user.riskLevel} />
          </DetailRow>
          <DetailRow label="Detected orientation">{user.detectedDisease ? DISEASE_LABELS[user.detectedDisease] : "Not determined"}</DetailRow>
          <DetailRow label="Crises detected">{formatNumber(user.crisisCount)}</DetailRow>
        </DetailSection>
        <DetailSection title="Behavioural baseline">
          <DetailRow label="Baseline WPM">{formatNumber(user.baselineWpm, 1)}</DetailRow>
          <DetailRow label="Baseline backspace rate">{formatNumber(user.baselineBackspace, 2)}</DetailRow>
        </DetailSection>
      </div>
      <PrivacyNote>
        Mira transcripts, summaries, reports, journal content and clinician notes are never available in the back office.
      </PrivacyNote>
    </div>
  );
}

function PaymentsTab({ userId }: { userId: string }) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const { can } = useAdminSession();
  const q = useApiQuery(["users", "payments", userId, page], () => usersApi.payments(userId, { page, limit: 20 }), { keepPrevious: true });
  return (
    <>
      <Card className="overflow-hidden">
        <DataTable
          columns={paymentColumns({ withPatient: false })}
          rows={q.data?.data}
          rowKey={(p) => p.id}
          isLoading={q.isLoading}
          isFetching={q.isFetching}
          stale={q.isPlaceholder}
          error={q.error}
          onRetry={q.refetch}
          onRowClick={can("payments.view") ? (p) => setSelected(p.id) : undefined}
          activeRowKey={selected}
          emptyTitle="No payments for this patient"
        />
        {q.data && <Pagination page={q.data.page} totalPages={q.data.totalPages} total={q.data.total} limit={q.data.limit} onPageChange={setPage} isFetching={q.isFetching} />}
      </Card>
      {can("payments.view") && <PaymentDrawer paymentId={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

type Trajectory = "worsening" | "improving" | "stable";

/** Summary of an ordered risk history: latest, peak, and direction first → last assessment. */
function summarize(points: RiskHistoryPoint[]) {
  if (points.length === 0) return null;
  const sorted = [...points].sort(
    (a, b) => new Date(a.completedAt ?? a.createdAt).getTime() - new Date(b.completedAt ?? b.createdAt).getTime(),
  );
  const first = sorted[0];
  const latest = sorted[sorted.length - 1];
  const peak = sorted.reduce((max, p) => (RISK_META[p.riskLevel].rank > RISK_META[max.riskLevel].rank ? p : max), first);
  const delta = RISK_META[latest.riskLevel].rank - RISK_META[first.riskLevel].rank;
  const trajectory: Trajectory = delta > 0 ? "worsening" : delta < 0 ? "improving" : "stable";
  const highOrAbove = sorted.filter((p) => RISK_META[p.riskLevel].rank >= RISK_META.HIGH.rank).length;
  return { count: sorted.length, latest, peak, trajectory, highOrAbove };
}

const TRAJECTORY_META: Record<Trajectory, { label: string; icon: typeof TrendingUp; className: string }> = {
  worsening: { label: "Worsening", icon: TrendingUp, className: "text-destructive" },
  improving: { label: "Improving", icon: TrendingDown, className: "text-success" },
  stable: { label: "Stable", icon: Minus, className: "text-muted-foreground" },
};

function RiskSummary({ points }: { points: RiskHistoryPoint[] }) {
  const summary = summarize(points);
  if (!summary) return null;
  const trend = TRAJECTORY_META[summary.trajectory];
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricCard label="Latest assessment" value={<RiskBadge level={summary.latest.riskLevel} className="text-[13px]" />} hint={formatDate(summary.latest.completedAt ?? summary.latest.createdAt)} />
      <MetricCard label="Peak level" value={<RiskBadge level={summary.peak.riskLevel} className="text-[13px]" />} hint={formatDate(summary.peak.completedAt ?? summary.peak.createdAt)} />
      <MetricCard
        label="Trajectory"
        value={
          <span className={cn("inline-flex items-center gap-1.5", trend.className)}>
            <trend.icon className="size-4" aria-hidden />
            {trend.label}
          </span>
        }
        hint="First → latest assessment"
      />
      <MetricCard
        label="Assessments"
        value={formatNumber(summary.count)}
        hint={summary.highOrAbove > 0 ? `${formatNumber(summary.highOrAbove)} at high or critical` : "None at high or critical"}
      />
    </div>
  );
}

export function RiskHistoryPanel({ userId }: { userId: string }) {
  const q = useApiQuery(["users", "risk-history", userId], () => usersApi.riskHistory(userId));
  const points = q.data ?? [];
  return (
    <div className="space-y-5">
      {!q.isLoading && !q.error && <RiskSummary points={points} />}
      <ChartCard
        title="Risk level over time"
        description="Mira diagnostic results (metadata only)"
        isLoading={q.isLoading}
        error={q.error}
        onRetry={q.refetch}
        isEmpty={points.length === 0}
        emptyLabel="No assessed Mira sessions for this patient"
        height={240}
        table={{
          columns: ["Date", "Risk level", "Orientation", "Confidence"],
          rows: points.map((p) => [
            formatDate(p.completedAt ?? p.createdAt),
            RISK_META[p.riskLevel].label,
            p.orientation ? DISEASE_LABELS[p.orientation] : "—",
            p.confidence === null ? "—" : `${Math.round(p.confidence * 100)}%`,
          ]),
        }}
      >
        <RiskTrendChart points={points} />
      </ChartCard>
    </div>
  );
}

export function UserDetail({ userId }: { userId: string }) {
  const router = useRouter();
  const { can } = useAdminSession();
  const q = useApiQuery(["users", "detail", userId], () => usersApi.get(userId));
  const [dialog, setDialog] = useState<"status" | "edit" | "delete" | "tier" | null>(null);
  const remove = useApiMutation(() => usersApi.remove(userId), {
    invalidate: ["users", "dashboard"],
    successMessage: "Account deleted (soft delete)",
    onSuccess: () => router.push("/admin/users"),
  });

  if (q.error && !q.data) {
    return (
      <Card>
        <ErrorState error={q.error} onRetry={q.refetch} />
      </Card>
    );
  }
  const user = q.data;
  if (!user) return <PageSkeleton />;

  const deleted = !!user.deletedAt;
  const hasActions = can("users.status") || can("users.update") || can("users.delete") || can("users.subscription");

  return (
    <div className="space-y-6">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> All users
      </Link>
      <Card className="overflow-hidden">
        <div className="relative border-b bg-gradient-to-r from-primary-soft via-card to-card px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span
                className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-auth-panel-2 text-lg font-semibold text-primary-foreground shadow-md ring-1 ring-inset ring-white/10"
                aria-hidden
              >
                {user.nickname.trim().slice(0, 2).toUpperCase() || "?"}
              </span>
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold tabular-nums tracking-tight sm:text-[22px]">{patientRef(user.patientNumber)}</h1>
                  <CopyableId value={user.id} display={user.id.slice(0, 8)} />
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {user.nickname} · joined {formatDate(user.createdAt)}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <StatusBadge value={user.status} meta={USER_STATUS_META} />
                  <RiskBadge level={user.riskLevel} />
                  {user.subscriptionPlan && <Badge tone="brand">{user.subscriptionPlan.tier}</Badge>}
                  {deleted && <Badge tone="danger">Deleted {formatDate(user.deletedAt)}</Badge>}
                </div>
              </div>
            </div>
            {hasActions && !deleted && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {can("users.status") && (
                  <Button variant="outline" size="sm" onClick={() => setDialog("status")}>
                    <ShieldBan /> Change status
                  </Button>
                )}
                {(can("users.update") || can("users.delete") || can("users.subscription")) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon-sm" aria-label="More actions">
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {can("users.update") && (
                        <DropdownMenuItem onSelect={() => setDialog("edit")}>
                          <PencilLine /> Edit account details
                        </DropdownMenuItem>
                      )}
                      {can("users.subscription") && (
                        <DropdownMenuItem onSelect={() => setDialog("tier")}>
                          <ArrowLeftRight /> Change subscription tier
                        </DropdownMenuItem>
                      )}
                      {can("users.delete") && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem destructive onSelect={() => setDialog("delete")}>
                            <Trash2 /> Delete account
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 xl:grid-cols-6">
          {[
            { label: "Risk level", value: <RiskBadge level={user.riskLevel} /> },
            {
              label: "Crises detected",
              value: <span className={cn("tabular-nums", user.crisisCount > 0 && "text-serious")}>{formatNumber(user.crisisCount)}</span>,
            },
            { label: "Orientation", value: user.detectedDisease ? DISEASE_LABELS[user.detectedDisease] : "Not determined" },
            {
              label: "Plan",
              value: user.subscriptionPlan ? user.subscriptionPlan.name : <span className="text-muted-foreground">No plan</span>,
            },
            { label: "Last active", value: user.lastActiveAt ? formatRelative(user.lastActiveAt) : "Never" },
            { label: "Language", value: LANGUAGE_LABELS[user.language] ?? user.language },
          ].map((fact) => (
            <div key={fact.label} className="min-w-0 bg-card px-5 py-3">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">{fact.label}</dt>
              <dd className="mt-1 truncate text-sm font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <UserRound /> Overview
          </TabsTrigger>
          {can("users.payments") && (
            <TabsTrigger value="payments">
              <CreditCard /> Payments
            </TabsTrigger>
          )}
          {can("users.riskHistory") && (
            <TabsTrigger value="risk">
              <TrendingUp /> Risk history
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab user={user} />
        </TabsContent>
        {can("users.payments") && (
          <TabsContent value="payments">
            <PaymentsTab userId={user.id} />
          </TabsContent>
        )}
        {can("users.riskHistory") && (
          <TabsContent value="risk">
            <RiskHistoryPanel userId={user.id} />
          </TabsContent>
        )}
      </Tabs>

      {dialog === "status" && <UserStatusDialog user={user} open onOpenChange={(o) => !o && setDialog(null)} />}
      {dialog === "edit" && <UserEditDialog user={user} open onOpenChange={(o) => !o && setDialog(null)} />}
      {dialog === "tier" && (
        <SubscriptionTierDialog
          open
          onOpenChange={(o) => !o && setDialog(null)}
          userId={user.id}
          patientLabel={patientRef(user.patientNumber)}
          currentTier={user.subscriptionPlan?.tier}
        />
      )}
      <ConfirmDialog
        open={dialog === "delete"}
        onOpenChange={(o) => !o && setDialog(null)}
        title={`Delete ${patientRef(user.patientNumber)}?`}
        description="The account is soft-deleted: it disappears from lists and the patient can no longer use it. This is recorded in the audit log."
        confirmLabel="Delete account"
        destructive
        isPending={remove.isPending}
        onConfirm={async () => !!(await remove.mutate(undefined))}
      />
    </div>
  );
}
