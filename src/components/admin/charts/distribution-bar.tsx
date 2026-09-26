import { formatNumber } from "@/lib/formatters";

export interface DistributionSegment {
  key: string;
  label: string;
  value: number;
  color: string;
}

/**
 * Compact part-to-whole bar (one 100% track, 2px surface gaps) with a legend
 * that always carries label, count and share — identity never relies on colour.
 */
export function DistributionBar({ segments, ariaLabel }: { segments: DistributionSegment[]; ariaLabel: string }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const visible = segments.filter((s) => s.value > 0);

  return (
    <div className="space-y-3">
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted" role="img" aria-label={ariaLabel}>
        {total > 0 &&
          visible.map((s) => (
            <div
              key={s.key}
              className="h-full first:rounded-l-full last:rounded-r-full"
              style={{ width: `${(s.value / total) * 100}%`, background: s.color }}
              title={`${s.label}: ${formatNumber(s.value)}`}
            />
          ))}
      </div>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5 sm:grid-cols-2">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-2 text-[13px]">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span className="size-2 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
              <span className="truncate">{s.label}</span>
            </span>
            <span className="shrink-0 tabular-nums">
              <span className="font-medium text-foreground">{formatNumber(s.value)}</span>
              <span className="ml-1.5 text-xs text-subtle-foreground">
                {total > 0 ? `${((s.value / total) * 100).toFixed(0)}%` : "0%"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
