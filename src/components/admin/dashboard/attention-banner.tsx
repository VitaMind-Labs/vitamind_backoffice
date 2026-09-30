"use client";

import Link from "next/link";
import { ArrowRight, CircleCheck, Siren } from "lucide-react";
import { LiveDot } from "@/components/admin/shared/stat-card";
import { useAlertCounts, useCrisisCounts } from "@/hooks/admin/use-queue-counts";
import { formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface Item {
  key: string;
  count: number;
  label: string;
  href: string;
  tone: "danger" | "warning";
}

/**
 * Top-of-dashboard triage strip: every counter that needs a human now, each
 * linking to the matching pre-filtered queue. Collapses to a calm "all clear".
 */
export function AttentionBanner() {
  const crisis = useCrisisCounts({ live: true });
  const alerts = useAlertCounts({ live: true });

  const loading =
    (crisis.enabled && (crisis.criticalPending.isLoading || crisis.pending.isLoading || crisis.breached.isLoading)) ||
    (alerts.enabled && (alerts.unrouted.isLoading || alerts.breached.isLoading));
  if (!crisis.enabled && !alerts.enabled) return null;
  if (loading) return <div className="h-[52px] animate-pulse rounded-xl border bg-card" aria-hidden />;

  const items: Item[] = [];
  const critical = crisis.criticalPending.data?.total ?? 0;
  const pending = crisis.pending.data?.total ?? 0;
  if (critical > 0)
    items.push({ key: "critical", count: critical, label: "critical crises pending", href: "/admin/crisis-events?severity=CRITICAL", tone: "danger" });
  if (pending - critical > 0)
    items.push({ key: "pending", count: pending - critical, label: "other crises pending", href: "/admin/crisis-events", tone: "warning" });
  const crisisBreached = crisis.breached.data?.total ?? 0;
  if (crisisBreached > 0)
    items.push({ key: "c-sla", count: crisisBreached, label: "crises past SLA", href: "/admin/crisis-events?status=&sla_breached=true", tone: "danger" });
  const unrouted = alerts.unrouted.data?.total ?? 0;
  if (unrouted > 0)
    items.push({ key: "unrouted", count: unrouted, label: "unrouted alerts", href: "/admin/clinical-alerts?status=&unrouted=true", tone: "warning" });
  const alertBreached = alerts.breached.data?.total ?? 0;
  if (alertBreached > 0)
    items.push({ key: "a-sla", count: alertBreached, label: "alerts past SLA", href: "/admin/clinical-alerts?status=&sla_breached=true", tone: "danger" });

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success-border bg-success-soft px-4 py-3 text-[13px] text-success">
        <CircleCheck className="size-4 shrink-0" aria-hidden />
        <span className="font-medium">All clear.</span>
        <span className="text-success/80">No pending crisis, unrouted alert or SLA breach right now.</span>
      </div>
    );
  }

  const urgent = items.some((i) => i.tone === "danger");
  return (
    <section
      aria-label="Needs attention"
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center",
        urgent ? "border-destructive-border bg-destructive-soft" : "border-warning-border bg-warning-soft",
      )}
    >
      <p className={cn("flex shrink-0 items-center gap-2 text-[13px] font-semibold", urgent ? "text-destructive" : "text-warning")}>
        <Siren className="size-4" aria-hidden />
        Needs attention
      </p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item.key}>
            <Link
              href={item.href}
              className="group inline-flex items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5 text-[13px] shadow-xs transition-all hover:border-border-strong hover:shadow-sm"
            >
              <LiveDot tone={item.tone} />
              <span className="font-semibold tabular-nums">{formatNumber(item.count)}</span>
              <span className="text-muted-foreground">{item.label}</span>
              <ArrowRight className="size-3 text-subtle-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
