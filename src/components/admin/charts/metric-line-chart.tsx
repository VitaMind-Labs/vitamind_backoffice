"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateTime, formatNumber, formatShortDate } from "@/lib/formatters";
import { axisProps, CATEGORICAL, GRID_STROKE } from "./chart-theme";
import { ChartTooltipContent } from "./chart-tooltip";

export interface MetricPoint {
  at: string;
  value: number | null;
}

/** Single-series trend over time (one measure, one axis). */
export function MetricLineChart({
  points,
  label,
  digits = 0,
  color = CATEGORICAL[0],
}: {
  points: MetricPoint[];
  label: string;
  digits?: number;
  color?: string;
}) {
  const gradientId = `grad-${label.replace(/\W+/g, "")}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.16} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="at" {...axisProps} tickFormatter={(v: string) => formatShortDate(v)} minTickGap={28} />
        <YAxis {...axisProps} width={44} tickFormatter={(v: number) => formatNumber(v)} />
        <Tooltip
          cursor={{ stroke: "var(--border-strong)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as MetricPoint;
            return (
              <ChartTooltipContent
                title={formatDateTime(d.at)}
                rows={[{ label, value: formatNumber(d.value, digits), color }]}
              />
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          connectNulls
          isAnimationActive={false}
          dot={points.length <= 24 ? { r: 3, fill: color, stroke: "var(--card)", strokeWidth: 2 } : false}
          activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
