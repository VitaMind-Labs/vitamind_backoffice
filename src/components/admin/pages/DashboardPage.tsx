"use client";

import { DangerAlert } from "@/components/admin/DangerAlert";
import { StatCard } from "@/components/admin/StatCard";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { useDashboardStats, useDashboardKPIs, useRiskOverview } from "@/hooks/use-dashboard";
import { useUsers } from "@/hooks/use-users";
import { useResponses } from "@/hooks/use-responses";
import { useNotifications } from "@/hooks/use-notifications";
import { formatDate } from "@/lib/utils";
import { Users, ClipboardList, FileText, ShieldAlert, Activity, TrendingUp, Bell, AlertTriangle } from "lucide-react";

const riskLabels: Record<string, string> = {
  low: "text-gray-500", moderate: "text-gray-700", high: "font-semibold text-black", critical: "font-bold text-red-600",
};

interface UserRow { id: string; nickname: string; email: string; status: string; risk_level: string | null; last_active_at: string | null; }
interface ResponseRow { id: string; user?: { nickname: string }; questionnaire?: { title: string }; risk_level: string | null; score: number | null; completed_at: string | null; }

const userCols: Column<UserRow>[] = [
  { key: "nickname", label: "Name", sortable: true, render: (u) => <span className="text-sm text-black">{u.nickname}</span> },
  {
    key: "status", label: "Status", sortable: true,
    render: (u) => (
      u.status === "active" ? <span className="text-gray-700">Active</span> :
      u.status === "inactive" ? <span className="text-gray-400">Inactive</span> :
      <span className="text-red-600">Suspended</span>
    ),
  },
  {
    key: "risk_level", label: "Risk", sortable: true,
    render: (u) => <span className={riskLabels[u.risk_level ?? "low"]}>{u.risk_level ?? "—"}</span>,
  },
  { key: "last_active_at", label: "Last Active", render: (u) => <span className="text-gray-400">{u.last_active_at ? formatDate(u.last_active_at) : "—"}</span> },
];

const resCols: Column<ResponseRow>[] = [
  { key: "user", label: "User", sortable: true, render: (r) => <span className="text-sm text-black">{r.user?.nickname ?? "—"}</span> },
  { key: "questionnaire", label: "Questionnaire", sortable: true, render: (r) => <span>{r.questionnaire?.title ?? "—"}</span> },
  {
    key: "risk_level", label: "Risk", sortable: true,
    render: (r) => <span className={riskLabels[r.risk_level ?? "low"]}>{r.risk_level ?? "—"}</span>,
  },
  { key: "score", label: "Score", sortable: true, render: (r) => <span className="font-medium">{r.score ?? "—"}</span> },
  { key: "completed_at", label: "Date", render: (r) => <span className="text-gray-400">{r.completed_at ? formatDate(r.completed_at) : "—"}</span> },
];

export function DashboardPage() {
  const stats = useDashboardStats();
  const kpis = useDashboardKPIs();
  const riskOv = useRiskOverview();
  const users = useUsers({ limit: 5, sort_by: "created_at", order: "desc" });
  const responses = useResponses({ limit: 5, sort_by: "completed_at", order: "desc" });
  const notifications = useNotifications({ read: "false", limit: 1 });

  const criticalCount = riskOv.data?.byRiskLevel?.find((r) => r.risk_level === "critical")?._count ?? 0;

  const s = stats.data;
  const uData = users.data?.data ?? [];
  const rData = responses.data?.data ?? [];

  function mapUser(u: typeof uData[0]): UserRow {
    return { id: u.id, nickname: u.nickname, email: u.email ?? "", status: u.status, risk_level: u.risk_level, last_active_at: u.last_active_at };
  }
  function mapResponse(r: typeof rData[0]): ResponseRow {
    return { id: r.id, user: r.user, questionnaire: r.questionnaire, risk_level: r.risk_level, score: r.score, completed_at: r.completed_at };
  }

  const isLoading = stats.loading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-black">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of your mental wellness management platform.</p>
      </div>

      <DangerAlert />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white p-5">
              <div className="h-3 w-20 rounded bg-gray-100" />
              <div className="mt-3 h-7 w-16 rounded bg-gray-100" />
              <div className="mt-2 h-3 w-24 rounded bg-gray-50" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={s?.totalUsers ?? 0} icon={Users} subtitle="Registered users" />
          <StatCard title="Active Users" value={s?.activeUsers ?? 0} icon={Activity} subtitle="Currently active" />
          <StatCard title="Sessions Today" value={s?.todaySessions ?? 0} icon={ClipboardList} subtitle="Last 24h" />
          <StatCard title="Daily Crises" value={s?.todayCrises ?? 0} icon={ShieldAlert} subtitle="Today" />
          <StatCard title="Critical Pending" value={s?.criticalCrisesPending ?? 0} icon={AlertTriangle} subtitle="Needs attention" />
          <StatCard title="Total Crises" value={s?.totalCrises ?? 0} icon={AlertTriangle} subtitle="All time" />
          <StatCard title="Unread Alerts" value={notifications.data?.total ?? 0} icon={Bell} subtitle="Notifications" />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-black">Recent Users</h3>
            <span className="text-xs text-gray-400">Last 5</span>
          </div>
          <DataTable columns={userCols} data={uData.map(mapUser)} searchable={false} />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-black">Recent Responses</h3>
            <span className="text-xs text-gray-400">Last 5</span>
          </div>
          <DataTable columns={resCols} data={rData.map(mapResponse)} searchable={false} />
        </div>
      </div>
    </div>
  );
}
