/**
 * Chart design constants. Colours reference the CSS tokens in globals.css so
 * every chart shares one palette:
 *  - CATEGORICAL: identity (fixed order, never cycled, max 8)
 *  - status tokens: meaning (good / warning / serious / critical) via RISK_META
 *  - ORDINAL: ordered stages (funnels)
 */
export const CATEGORICAL = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
] as const;

/** Light → dark; the lightest ordinal step still clears 2:1 on the card surface. */
export const ORDINAL = ["var(--seq-250)", "var(--seq-350)", "var(--seq-450)", "var(--seq-550)", "var(--seq-650)"] as const;

export const NEUTRAL = "var(--status-neutral)";

export const AXIS_TICK = { fontSize: 11, fill: "var(--chart-axis)" } as const;
export const GRID_STROKE = "var(--chart-grid)";

export const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: AXIS_TICK,
} as const;
