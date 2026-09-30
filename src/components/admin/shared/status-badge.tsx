import { AlertOctagon, AlertTriangle, CircleCheck, CircleDot, Clock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EMPTY, humanize } from "@/lib/formatters";
import { RISK_META, type StatusMeta } from "@/lib/constants/status";
import type { RiskLevel } from "@/types/admin";

/** Generic enum badge driven by a meta map (label + tone). */
export function StatusBadge<K extends string>({
  value,
  meta,
  className,
}: {
  value: K | null | undefined;
  meta: Record<K, StatusMeta>;
  className?: string;
}) {
  if (!value) return <span className="text-muted-foreground">{EMPTY}</span>;
  const entry = meta[value] ?? { label: humanize(value), tone: "neutral" as const };
  return (
    <Badge tone={entry.tone} className={className}>
      {entry.label}
    </Badge>
  );
}

const RISK_ICONS = {
  LOW: CircleCheck,
  MODERATE: CircleDot,
  HIGH: AlertTriangle,
  CRITICAL: AlertOctagon,
} as const;

/** Risk level: colour + icon + label, so severity never relies on colour alone. */
export function RiskBadge({ level, className }: { level: RiskLevel | null | undefined; className?: string }) {
  if (!level) return <span className="text-xs text-muted-foreground">Not assessed</span>;
  const meta = RISK_META[level];
  const Icon = RISK_ICONS[level];
  return (
    <Badge tone={meta.tone} className={className}>
      <Icon aria-hidden />
      {meta.label}
    </Badge>
  );
}

/** SLA indicator for crisis events and clinical alerts. */
export function SlaBadge({ breached, deadlineLabel }: { breached: boolean; deadlineLabel?: string | null }) {
  if (breached) {
    return (
      <Badge tone="danger">
        <ShieldAlert aria-hidden />
        SLA breached
      </Badge>
    );
  }
  if (deadlineLabel) {
    return (
      <Badge tone="outline">
        <Clock aria-hidden />
        {deadlineLabel}
      </Badge>
    );
  }
  return (
    <Badge tone="outline">
      <CircleCheck aria-hidden />
      Within SLA
    </Badge>
  );
}

export function BooleanBadge({ value, trueLabel = "Yes", falseLabel = "No" }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return <Badge tone={value ? "success" : "neutral"}>{value ? trueLabel : falseLabel}</Badge>;
}
