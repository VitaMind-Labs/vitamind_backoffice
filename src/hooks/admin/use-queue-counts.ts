"use client";

import { useAdminSession } from "@/components/admin/providers/admin-session-provider";
import { alertsApi, crisisApi } from "@/lib/api/clinical";
import { useApiQuery } from "./use-api-query";

/** Live queue counters refresh every minute while the tab is visible. */
const LIVE_INTERVAL = 60_000;

/**
 * Total-only queries (limit=1) for the clinical work queues. Keys are shared
 * with the queue pages, so the sidebar, dashboard and list KPIs read one cache
 * entry per counter instead of each firing their own request.
 */
export function useCrisisCounts(options: { live?: boolean } = {}) {
  const { can } = useAdminSession();
  const enabled = can("crisis.view");
  const opts = { enabled, refetchInterval: options.live ? LIVE_INTERVAL : undefined };
  const pending = useApiQuery(["crisis-events", "count", "PENDING"], () => crisisApi.list({ status: "PENDING", limit: 1 }), opts);
  const inProgress = useApiQuery(["crisis-events", "count", "IN_PROGRESS"], () => crisisApi.list({ status: "IN_PROGRESS", limit: 1 }), opts);
  const escalated = useApiQuery(["crisis-events", "count", "ESCALATED"], () => crisisApi.list({ status: "ESCALATED", limit: 1 }), opts);
  const breached = useApiQuery(["crisis-events", "count", "sla"], () => crisisApi.list({ sla_breached: true, limit: 1 }), opts);
  const criticalPending = useApiQuery(
    ["crisis-events", "count", "PENDING", "CRITICAL"],
    () => crisisApi.list({ status: "PENDING", severity: "CRITICAL", limit: 1 }),
    opts,
  );
  return { enabled, pending, inProgress, escalated, breached, criticalPending };
}

export function useAlertCounts(options: { live?: boolean } = {}) {
  const { can } = useAdminSession();
  const enabled = can("alerts.view");
  const opts = { enabled, refetchInterval: options.live ? LIVE_INTERVAL : undefined };
  const open = useApiQuery(["clinical-alerts", "count", "OPEN"], () => alertsApi.list({ status: "OPEN", limit: 1 }), opts);
  const acknowledged = useApiQuery(["clinical-alerts", "count", "ACKNOWLEDGED"], () => alertsApi.list({ status: "ACKNOWLEDGED", limit: 1 }), opts);
  const escalated = useApiQuery(["clinical-alerts", "count", "ESCALATED"], () => alertsApi.list({ status: "ESCALATED", limit: 1 }), opts);
  const breached = useApiQuery(["clinical-alerts", "count", "sla"], () => alertsApi.list({ sla_breached: true, limit: 1 }), opts);
  const unrouted = useApiQuery(["clinical-alerts", "count", "unrouted"], () => alertsApi.list({ unrouted: true, limit: 1 }), opts);
  return { enabled, open, acknowledged, escalated, breached, unrouted };
}

/** The two counters the navigation shows (pending crises, open alerts), polled live. */
export function useQueueBadges() {
  const { can } = useAdminSession();
  const crisis = useApiQuery(["crisis-events", "count", "PENDING"], () => crisisApi.list({ status: "PENDING", limit: 1 }), {
    enabled: can("crisis.view"),
    refetchInterval: LIVE_INTERVAL,
  });
  const alerts = useApiQuery(["clinical-alerts", "count", "OPEN"], () => alertsApi.list({ status: "OPEN", limit: 1 }), {
    enabled: can("alerts.view"),
    refetchInterval: LIVE_INTERVAL,
  });
  return { pendingCrises: crisis.data?.total ?? 0, openAlerts: alerts.data?.total ?? 0 };
}
