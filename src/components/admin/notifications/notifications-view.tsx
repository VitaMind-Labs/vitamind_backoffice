"use client";

import { useState } from "react";
import { Bell, Check, CheckCheck, Inbox, Mail, MessageSquare, MoreHorizontal, Trash2, Users, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, Pagination, type Column } from "@/components/admin/shared/data-table";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { DateRangeFilter, FilterBar, optionsFrom, SelectFilter } from "@/components/admin/shared/filters";
import { ListCard } from "@/components/admin/shared/list-card";
import { PageHeader } from "@/components/admin/shared/page-header";
import { Can } from "@/components/admin/shared/permission";
import { StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { useListState } from "@/hooks/admin/use-list-state";
import { notificationsApi, type NotificationFilters } from "@/lib/api/operations";
import { NOTIFICATION_PRIORITY_META } from "@/lib/constants/status";
import { formatDateTime, formatNumber, formatPercent, formatRelative, humanize, patientRef } from "@/lib/formatters";
import { NOTIFICATION_TYPES, type AdminNotification, type NotificationType } from "@/types/admin";

type Filters = Omit<NotificationFilters, "page" | "limit">;

const INITIAL: Filters = { read: false };

const CHANNEL_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  push: Bell,
  sms: MessageSquare,
  in_app: Inbox,
};

function audience(notification: AdminNotification): string {
  if (notification.user) return `Patient ${patientRef(notification.user.patientNumber)}`;
  if (notification.psychologistId) return "Psychologist";
  if (notification.adminId) return "Admin team";
  return "System";
}

export function NotificationsView() {
  const list = useListState<Filters>(INITIAL, 20);
  const { filters, update } = list;
  const [deleting, setDeleting] = useState<AdminNotification | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const q = useApiQuery(["notifications", "list", list.params], () => notificationsApi.list(list.params));
  const total = useApiQuery(["notifications", "count"], () => notificationsApi.list({ limit: 1 }));
  const unread = useApiQuery(["notifications", "count", "unread"], () => notificationsApi.list({ read: false, limit: 1 }));

  const markRead = useApiMutation((id: string) => notificationsApi.markRead(id), {
    invalidate: ["notifications"],
    successMessage: "Marked as read",
    onSuccess: () => setBusyId(null),
  });
  const remove = useApiMutation((id: string) => notificationsApi.remove(id), {
    invalidate: ["notifications"],
    successMessage: "Notification record deleted",
  });

  const totalCount = total.data?.total ?? 0;
  const unreadCount = unread.data?.total ?? 0;

  const columns: Column<AdminNotification>[] = [
    {
      id: "notification",
      header: "Notification",
      cell: (n) => (
        <div className="min-w-0 max-w-md">
          <p className="flex items-center gap-1.5 truncate font-medium">
            {!n.isRead && <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
            {n.title}
          </p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{n.message}</p>
        </div>
      ),
    },
    { id: "type", header: "Type", hideBelow: "lg", cell: (n) => <span className="text-muted-foreground">{humanize(n.type)}</span> },
    { id: "priority", header: "Priority", cell: (n) => <StatusBadge value={n.priority} meta={NOTIFICATION_PRIORITY_META} /> },
    { id: "audience", header: "Audience", hideBelow: "md", cell: (n) => <span className="text-muted-foreground">{audience(n)}</span> },
    {
      id: "channels",
      header: "Channels",
      hideBelow: "xl",
      cell: (n) =>
        n.channels.length === 0 ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className="flex flex-wrap gap-1">
            {n.channels.map((c) => {
              const Icon = CHANNEL_ICONS[c] ?? Zap;
              return (
                <Badge key={c} tone="outline">
                  <Icon aria-hidden />
                  {humanize(c)}
                </Badge>
              );
            })}
          </span>
        ),
    },
    {
      id: "sent",
      header: "Sent",
      cell: (n) => (
        <div>
          <p className="text-[13px]">{formatDateTime(n.sentAt ?? n.createdAt)}</p>
          <p className="text-xs text-muted-foreground">
            {n.isRead && n.readAt ? `Read ${formatRelative(n.readAt)}` : "Not read"}
          </p>
        </div>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      className: "w-px",
      cell: (n) => (
        <Can permission="notifications.manage">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${n.title}`}
                onClick={(e) => e.stopPropagation()}
                disabled={busyId === n.id}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                disabled={n.isRead || busyId === n.id}
                onSelect={() => {
                  setBusyId(n.id);
                  void markRead.mutate(n.id);
                }}
              >
                <Check /> Mark as read
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={() => setDeleting(n)}>
                <Trash2 /> Delete record
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Can>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Every message the platform sent to patients, clinicians and the admin team. Deleting a record clears the log but cannot recall a message already delivered."
      />

      <StatGrid>
        <StatCard label="Notifications" icon={Bell} loading={total.isLoading} value={formatNumber(totalCount)} hint="All time" />
        <StatCard
          label="Unread"
          icon={Inbox}
          emphasis={unreadCount > 0 ? "warning" : "success"}
          loading={unread.isLoading}
          value={formatNumber(unreadCount)}
          hint="Not opened by the recipient"
        />
        <StatCard
          label="Read"
          icon={CheckCheck}
          loading={total.isLoading}
          value={formatNumber(Math.max(totalCount - unreadCount, 0))}
          hint="Opened by the recipient"
        />
        <StatCard
          label="Unread share"
          icon={Users}
          loading={total.isLoading || unread.isLoading}
          value={formatPercent(totalCount > 0 ? (unreadCount / totalCount) * 100 : 0)}
          hint="Unread ÷ all notifications"
        />
      </StatGrid>

      <ListCard title="Delivery log" description="Newest first">
        <FilterBar onReset={list.reset} canReset={list.isFiltered}>
          <SelectFilter
            label="Type"
            value={filters.type}
            options={optionsFrom(NOTIFICATION_TYPES)}
            onChange={(v) => update({ type: v as NotificationType })}
          />
          <SelectFilter
            label="State"
            allLabel="All notifications"
            value={filters.read === undefined ? undefined : String(filters.read)}
            options={[
              { value: "false", label: "Unread" },
              { value: "true", label: "Read" },
            ]}
            onChange={(v) => update({ read: v === undefined ? undefined : v === "true" })}
          />
          <DateRangeFilter
            value={{ from: filters.from }}
            onChange={(r) => update({ from: r.from })}
            allLabel="Any send date"
          />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={q.data?.data}
          rowKey={(n) => n.id}
          isLoading={q.isLoading}
          error={q.error}
          onRetry={q.refetch}
          emptyTitle={list.isFiltered ? "No notifications match these filters" : "No notifications sent yet"}
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

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this notification record?"
        description="The log entry is removed from the back office. A message already delivered to its recipient cannot be recalled."
        confirmLabel="Delete record"
        destructive
        isPending={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return false;
          return !!(await remove.mutate(deleting.id));
        }}
      />
    </div>
  );
}
