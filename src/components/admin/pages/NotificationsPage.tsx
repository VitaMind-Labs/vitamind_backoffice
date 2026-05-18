"use client";

import { useNotifications } from "@/hooks/use-notifications";
import { formatDate } from "@/lib/utils";
import { Bell, CreditCard, FileCheck, AlertTriangle, AlertCircle } from "lucide-react";
import type { NotificationType } from "@/lib/types/enums";

const typeIcons: Record<string, typeof Bell> = {
  payment: CreditCard,
  test_completed: FileCheck,
  risk_alert: AlertTriangle,
  crisis: AlertTriangle,
  system: Bell,
};
const typeLabels: Record<string, string> = {
  payment: "Payment",
  test_completed: "Test",
  risk_alert: "Risk Alert",
  crisis: "Crisis",
  system: "System",
};

export function NotificationsPage() {
  const { data, loading, error } = useNotifications();
  const notifications = data?.data ?? [];

  const counts: Record<string, number> = {};
  notifications.forEach((n) => {
    counts[n.type] = (counts[n.type] || 0) + 1;
  });

  const types = ["payment", "test_completed", "risk_alert", "crisis", "system"];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-black">Notifications</h1>
        <p className="mt-1 text-sm text-gray-500">All system notifications.</p>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-5">
        {types.map((t) => (
          <div key={t} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{typeLabels[t] || t}</p>
            <p className="mt-1 text-xl font-bold text-black">{counts[t] || 0}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="space-y-0 divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex animate-pulse items-start gap-3 px-5 py-3.5">
                <div className="h-8 w-8 rounded-lg bg-gray-100" />
                <div className="flex-1">
                  <div className="h-4 w-40 rounded bg-gray-100" />
                  <div className="mt-1 h-3 w-64 rounded bg-gray-50" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Bell className="mb-2 h-8 w-8" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type] || Bell;
              return (
                <div key={n.id} className={`flex items-start gap-3 px-5 py-3.5 transition hover:bg-gray-50 ${!n.read ? "bg-gray-50" : ""}`}>
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-gray-200 bg-white">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">{typeLabels[n.type] || n.type}</span>
                        <p className="mt-1 text-sm font-medium text-black">{n.title}</p>
                      </div>
                      {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-black" />}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">{n.message}</p>
                    <div className="mt-1.5 text-xs text-gray-400">
                      <span>{formatDate(n.created_at)}</span>
                      {n.user && <span className="ml-3">User: {n.user.nickname}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
