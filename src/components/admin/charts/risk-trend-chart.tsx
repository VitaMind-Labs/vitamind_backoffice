"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RISK_META, DISEASE_LABELS } from "@/lib/constants/status";
import { formatDate, formatShortDate } from "@/lib/formatters";
import type { RiskHistoryPoint, RiskLevel } from "@/types/admin";
import { axisProps, CATEGORICAL, GRID_STROKE } from "./chart-theme";
import { ChartTooltipContent } from "./chart-tooltip";

const LEVELS: RiskLevel[] = ["LOW", "MODERATE", "HIGH", "CRITICAL"];

/**
 * Mira risk level over time for one patient (metadata only). Risk is an
 * ordinal scale, so points sit on the four levels and each dot carries the
 * level's status colour; the line itself stays neutral.
 */
export function RiskTrendChart({ points }: { points: RiskHistoryPoint[] }) {
  const data = points.map((p) => ({
    id: p.id,
    at: p.completedAt ?? p.createdAt,
    rank: RISK_META[p.riskLevel].rank,
    level: p.riskLevel,
    orientation: p.orientation,
    confidence: p.confidence,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="at" {...axisProps} tickFormatter={(v: string) => formatShortDate(v)} minTickGap={24} />
        <YAxis
          {...axisProps}
          domain={[0.5, 4.5]}
          ticks={[1, 2, 3, 4]}
          width={72}
          tickFormatter={(v: number) => RISK_META[LEVELS[v - 1]]?.label ?? ""}
        />
        <Tooltip
          cursor={{ stroke: "var(--border-strong)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as (typeof data)[number];
            return (
              <ChartTooltipContent
                title={formatDate(d.at)}
                rows={[
                  { label: "Risk level", value: RISK_META[d.level].label, color: RISK_META[d.level].chart },
                  { label: "Orientation", value: d.orientation ? DISEASE_LABELS[d.orientation] : "—" },
                  { label: "Confidence", value: d.confidence === null ? "—" : `${Math.round(d.confidence * 100)}%` },
                ]}
              />
            );
          }}
        />
        <Line
          type="linear"
          dataKey="rank"
          stroke={CATEGORICAL[0]}
          strokeOpacity={0.45}
          strokeWidth={2}
          isAnimationActive={false}
          dot={(props: { cx?: number; cy?: number; payload?: (typeof data)[number] }) => {
            const { cx, cy, payload } = props;
            if (cx === undefined || cy === undefined || !payload) return <g key={payload?.id ?? "empty"} />;
            return (
              <circle
                key={payload.id}
                cx={cx}
                cy={cy}
                r={5}
                fill={RISK_META[payload.level].chart}
                stroke="var(--card)"
                strokeWidth={2}
              />
            );
          }}
          activeDot={{ r: 6, stroke: "var(--card)", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
