import { cn } from "@/lib/utils";

/**
 * A single value against an alert threshold (e.g. crisis rate vs 5%).
 * The fill uses the status colour for the zone it falls in; the threshold is
 * a labelled marker, so the reading never depends on colour alone.
 */
export function ThresholdMeter({
  value,
  threshold,
  max,
  unit = "%",
  label,
}: {
  value: number;
  threshold: number;
  max: number;
  unit?: string;
  label: string;
}) {
  const clamp = (n: number) => Math.min(Math.max(n, 0), max);
  const pct = (clamp(value) / max) * 100;
  const thresholdPct = (threshold / max) * 100;
  const over = value > threshold;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <span className={cn("text-sm font-semibold tabular-nums", over ? "text-destructive" : "text-foreground")}>
          {value.toFixed(2)}
          {unit}
        </span>
      </div>
      <div className="relative h-2.5 rounded-full bg-muted" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: over ? "var(--status-critical)" : "var(--status-good)" }}
        />
        <div className="absolute -top-1 h-4.5 w-0.5 rounded bg-foreground" style={{ left: `calc(${thresholdPct}% - 1px)` }} aria-hidden />
      </div>
      <div className="relative h-4 text-[11px] text-muted-foreground">
        <span className="absolute left-0">0{unit}</span>
        <span className="absolute -translate-x-1/2 whitespace-nowrap font-medium text-foreground" style={{ left: `${thresholdPct}%` }}>
          Threshold {threshold}
          {unit}
        </span>
        <span className="absolute right-0">
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}
