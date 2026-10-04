"use client";

import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, parseISO } from "date-fns";
import { formatNumber, formatShortDate } from "@/lib/formatters";
import { axisProps, CATEGORICAL, GRID_STROKE } from "@/components/admin/charts/chart-theme";
import { ChartTooltipContent } from "@/components/admin/charts/chart-tooltip";
import type { ActivityDay, HealthSample } from "@/types/admin";

const OK = "var(--status-good)";
const WARN = "var(--status-warning)";
const BAD = "var(--status-critical)";
const NEUTRAL = "var(--status-neutral)";

const legendStyle = { fontSize: 12, color: "var(--muted-foreground)" } as const;

function Stacked({
  data,
  bars,
}: {
  data: Array<Record<string, number | string>>;
  bars: Array<{ key: string; label: string; color: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="22%">
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="day" {...axisProps} tickFormatter={(v: string) => formatShortDate(v)} minTickGap={16} />
        <YAxis {...axisProps} width={36} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "var(--muted)", opacity: 0.6 }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as Record<string, number | string>;
            return (
              <ChartTooltipContent
                title={formatShortDate(String(d.day))}
                rows={bars.map((b) => ({ label: b.label, value: formatNumber(Number(d[b.key] ?? 0)), color: b.color }))}
              />
            );
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
        {bars.map((b, i) => (
          <Bar
            key={b.key}
            dataKey={b.key}
            name={b.label}
            stackId="a"
            fill={b.color}
            maxBarSize={28}
            isAnimationActive={false}
            radius={i === bars.length - 1 ? [3, 3, 0, 0] : 0}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MiraOutcomesChart({ series }: { series: ActivityDay[] }) {
  return (
    <Stacked
      data={series.map((d) => ({ day: d.day, completed: d.mira.completed, abandoned: d.mira.abandoned, blocked: d.mira.blocked, other: Math.max(d.mira.total - d.mira.completed - d.mira.abandoned - d.mira.blocked, 0) }))}
      bars={[
        { key: "completed", label: "Completed", color: OK },
        { key: "other", label: "In progress", color: CATEGORICAL[0] },
        { key: "abandoned", label: "Abandoned / expired", color: WARN },
        { key: "blocked", label: "Blocked", color: BAD },
      ]}
    />
  );
}

export function JournalPipelineChart({ series }: { series: ActivityDay[] }) {
  return (
    <Stacked
      data={series.map((d) => ({ day: d.day, analysed: d.journal.analysed, pending: d.journal.pending, failed: d.journal.failed }))}
      bars={[
        { key: "analysed", label: "Analysed", color: OK },
        { key: "pending", label: "Pending", color: WARN },
        { key: "failed", label: "Failed", color: BAD },
      ]}
    />
  );
}

export function CrisisChart({ series }: { series: ActivityDay[] }) {
  return (
    <Stacked
      data={series.map((d) => ({ day: d.day, real: Math.max(d.crises.total - d.crises.falseAlerts, 0), falseAlerts: d.crises.falseAlerts }))}
      bars={[
        { key: "real", label: "Crisis events", color: BAD },
        { key: "falseAlerts", label: "False alerts", color: NEUTRAL },
      ]}
    />
  );
}

export function UsageChart({ series }: { series: ActivityDay[] }) {
  const data = series.map((d) => ({ day: d.day, checkins: d.checkins, signups: d.signups, flagged: d.journal.flaggedForReview }));
  const lines = [
    { key: "checkins", label: "Check-ins", color: CATEGORICAL[0] },
    { key: "signups", label: "Sign-ups", color: CATEGORICAL[1] },
    { key: "flagged", label: "Journal flagged for review", color: CATEGORICAL[3] },
  ];
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="day" {...axisProps} tickFormatter={(v: string) => formatShortDate(v)} minTickGap={16} />
        <YAxis {...axisProps} width={36} allowDecimals={false} />
        <Tooltip
          cursor={{ stroke: "var(--border-strong)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as Record<string, number | string>;
            return <ChartTooltipContent title={formatShortDate(String(d.day))} rows={lines.map((l) => ({ label: l.label, value: formatNumber(Number(d[l.key] ?? 0)), color: l.color }))} />;
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
        {lines.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.label} stroke={l.color} strokeWidth={2} dot={false} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

const LATENCY_SERIES = [
  { key: "db", label: "PostgreSQL", color: CATEGORICAL[0] },
  { key: "redis", label: "Redis", color: CATEGORICAL[1] },
  { key: "mira", label: "Mira", color: CATEGORICAL[2] },
  { key: "journal", label: "Journal", color: CATEGORICAL[3] },
  { key: "checkin", label: "Check-in", color: CATEGORICAL[4] },
] as const;

/** Probe latency over the last hours, one line per component; a gap means the probe failed. */
export function LatencyChart({ samples }: { samples: HealthSample[] }) {
  const data = samples.map((s) => ({
    t: s.t,
    db: s.db,
    redis: s.redis,
    mira: s.engines.mira?.up ? s.engines.mira.ms : null,
    journal: s.engines.journal?.up ? s.engines.journal.ms : null,
    checkin: s.engines.checkin?.up ? s.engines.checkin.ms : null,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} stroke={GRID_STROKE} />
        <XAxis dataKey="t" {...axisProps} tickFormatter={(v: string) => format(parseISO(v), "HH:mm")} minTickGap={36} />
        <YAxis {...axisProps} width={44} tickFormatter={(v: number) => `${v}ms`} />
        <Tooltip
          cursor={{ stroke: "var(--border-strong)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const d = payload[0].payload as Record<string, number | string | null>;
            return (
              <ChartTooltipContent
                title={format(parseISO(String(d.t)), "HH:mm:ss")}
                rows={LATENCY_SERIES.map((l) => ({ label: l.label, value: d[l.key] == null ? "down" : `${d[l.key]} ms`, color: l.color }))}
              />
            );
          }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={legendStyle} />
        {LATENCY_SERIES.map((l) => (
          <Line key={l.key} type="monotone" dataKey={l.key} name={l.label} stroke={l.color} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/** One cell per probe: green = answered, red = did not. Reads as an uptime strip. */
export function UptimeStrip({ samples, pick, label }: { samples: HealthSample[]; pick: (s: HealthSample) => boolean | null; label: string }) {
  const cells = samples.slice(-90);
  const known = cells.filter((s) => pick(s) !== null);
  const up = known.filter((s) => pick(s)).length;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{known.length ? `${((up / known.length) * 100).toFixed(1)}% up` : "no data yet"}</span>
      </div>
      <div className="flex h-5 items-stretch gap-px" role="img" aria-label={`${label} availability over the last ${cells.length} probes`}>
        {cells.length === 0 && <div className="flex-1 rounded-sm bg-muted" />}
        {cells.map((s) => {
          const state = pick(s);
          return (
            <span
              key={s.t}
              title={`${format(parseISO(s.t), "HH:mm")} — ${state === null ? "unknown" : state ? "up" : "down"}`}
              className="min-w-[3px] flex-1 rounded-[2px]"
              style={{ background: state === null ? "var(--muted)" : state ? OK : BAD }}
            />
          );
        })}
      </div>
    </div>
  );
}
