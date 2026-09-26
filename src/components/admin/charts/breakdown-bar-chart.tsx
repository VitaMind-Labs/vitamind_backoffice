"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatNumber } from "@/lib/formatters";
import { axisProps, CATEGORICAL, GRID_STROKE } from "./chart-theme";
import { ChartTooltipContent, type TooltipRow } from "./chart-tooltip";

export interface BreakdownDatum {
  key: string;
  label: string;
  value: number;
  /** Semantic colour (status token). Omit to use the single series colour. */
  color?: string;
}

/**
 * Horizontal bars for a categorical breakdown ("how many per X?").
 * One series → one colour unless the categories carry meaning (risk, status),
 * in which case the caller passes the reserved status colour with the label.
 */
export function BreakdownBarChart({
  data,
  valueLabel = "Count",
  formatValue = (v: number) => formatNumber(v),
  total,
}: {
  data: BreakdownDatum[];
  valueLabel?: string;
  formatValue?: (value: number) => string;
  /** When provided, the tooltip also shows the share of total. */
  total?: number;
}) {
  const longest = Math.max(...data.map((d) => d.label.length), 4);
  const yWidth = Math.min(Math.max(longest * 6.5, 56), 150);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, bottom: 4, left: 0 }} barCategoryGap={8}>
        <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
        <XAxis type="number" {...axisProps} allowDecimals={false} tickFormatter={(v: number) => formatValue(v)} />
        <YAxis type="category" dataKey="label" {...axisProps} width={yWidth} tick={{ ...axisProps.tick, fill: "var(--muted-foreground)" }} />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as BreakdownDatum;
            const rows: TooltipRow[] = [{ label: valueLabel, value: formatValue(d.value), color: d.color ?? CATEGORICAL[0] }];
            if (total) rows.push({ label: "Share", value: `${((d.value / total) * 100).toFixed(1)}%` });
            return <ChartTooltipContent title={d.label} rows={rows} />;
          }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.color ?? CATEGORICAL[0]} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            offset={6}
            formatter={(v: unknown) => formatValue(Number(v))}
            style={{ fontSize: 11, fill: "var(--muted-foreground)", fontVariantNumeric: "tabular-nums" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
