import { humanize } from "@/lib/formatters";
import type { BreakdownDatum } from "./breakdown-bar-chart";

/**
 * Turns `{ KEY: count }` (backend stats) into ordered breakdown rows.
 * `order` fixes the category order (and therefore colour assignment) so a
 * category keeps its position whatever the counts; unknown keys follow.
 */
export function countsToBreakdown(
  counts: Record<string, number> | undefined,
  options: {
    order?: readonly string[];
    labels?: Record<string, string | { label: string }>;
    colors?: Record<string, string | { chart: string }>;
    includeZero?: boolean;
    sortByValue?: boolean;
  } = {},
): BreakdownDatum[] {
  if (!counts) return [];
  const { order = [], labels = {}, colors = {}, includeZero = true, sortByValue = false } = options;
  const keys = [...order, ...Object.keys(counts).filter((k) => !order.includes(k))];
  const rows = keys
    .map((key) => {
      const label = labels[key];
      const color = colors[key];
      return {
        key,
        label: typeof label === "string" ? label : label?.label ?? (key === "NONE" ? "Not set" : humanize(key)),
        value: counts[key] ?? 0,
        color: typeof color === "string" ? color : color?.chart,
      };
    })
    .filter((row) => includeZero || row.value > 0);
  return sortByValue ? rows.sort((a, b) => b.value - a.value) : rows;
}

/** `[{ field: KEY | null, _count }]` (Prisma groupBy) → `{ KEY: count }`. */
export function groupByToCounts<T extends { _count: number }>(rows: T[] | undefined, field: keyof T): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows ?? []) {
    const key = row[field] === null || row[field] === undefined ? "NONE" : String(row[field]);
    out[key] = (out[key] ?? 0) + row._count;
  }
  return out;
}

export function sumCounts(counts: Record<string, number> | undefined): number {
  return Object.values(counts ?? {}).reduce((a, b) => a + b, 0);
}
