"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isoDaysAgo } from "@/lib/formatters";
import { cn } from "@/lib/utils";

/** One row of filters above a table or chart group; wraps on small screens. */
export function FilterBar({ children, onReset, canReset, className }: { children: ReactNode; onReset?: () => void; canReset?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 border-b px-5 py-3", className)}>
      {children}
      {onReset && canReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
          <X /> Reset
        </Button>
      )}
    </div>
  );
}

/** Debounced search field. */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  delay = 350,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
}) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => onChange(draft.trim()), delay);
    return () => clearTimeout(t);
  }, [draft, value, onChange, delay]);

  return (
    <div className={cn("relative w-full sm:w-64", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
      <Input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
        aria-label={placeholder}
      />
    </div>
  );
}

const ALL = "__all";

export interface Option {
  value: string;
  label: string;
}

/** Enum filter with an explicit "All" choice. */
export function SelectFilter({
  label,
  value,
  options,
  onChange,
  className,
  allLabel,
}: {
  label: string;
  value: string | undefined;
  options: readonly Option[];
  onChange: (value: string | undefined) => void;
  className?: string;
  allLabel?: string;
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
      <SelectTrigger className={cn("h-8 w-auto min-w-36 text-[13px]", className)} aria-label={label}>
        <span className="text-muted-foreground">{label}:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel ?? "All"}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function optionsFrom<K extends string>(values: readonly K[], labels?: Partial<Record<K, { label: string } | string>>): Option[] {
  return values.map((v) => {
    const entry = labels?.[v];
    const label = typeof entry === "string" ? entry : entry?.label;
    return { value: v, label: label ?? v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ") };
  });
}

export interface DateRangeValue {
  from?: string;
  to?: string;
}

const PRESETS = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
  { id: "365d", label: "Last 12 months", days: 365 },
] as const;

function presetOf(value: DateRangeValue): string {
  if (!value.from && !value.to) return "all";
  if (!value.to) {
    const match = PRESETS.find((p) => isoDaysAgo(p.days) === value.from);
    if (match) return match.id;
  }
  return "custom";
}

/** Period selector: presets plus a custom from/to (ISO dates, inclusive). */
export function DateRangeFilter({
  value,
  onChange,
  className,
  allLabel = "All time",
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  className?: string;
  allLabel?: string;
}) {
  const [custom, setCustom] = useState(presetOf(value) === "custom");
  const preset = custom ? "custom" : presetOf(value);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Select
        value={preset}
        onValueChange={(v) => {
          if (v === "custom") {
            setCustom(true);
            return;
          }
          setCustom(false);
          if (v === "all") onChange({});
          else {
            const p = PRESETS.find((x) => x.id === v);
            if (p) onChange({ from: isoDaysAgo(p.days) });
          }
        }}
      >
        <SelectTrigger className="h-8 w-auto min-w-36 text-[13px]" aria-label="Period">
          <span className="text-muted-foreground">Period:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {PRESETS.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
          <SelectItem value="custom">Custom range</SelectItem>
        </SelectContent>
      </Select>
      {preset === "custom" && (
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            aria-label="From date"
            className="h-8 w-36 text-[13px]"
            value={value.from ?? ""}
            max={value.to}
            onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            aria-label="To date"
            className="h-8 w-36 text-[13px]"
            value={value.to ?? ""}
            min={value.from}
            onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
          />
        </div>
      )}
    </div>
  );
}

/** Numeric threshold filter (applied on blur / Enter to avoid a request per keystroke). */
export function NumberFilter({
  label,
  value,
  onChange,
  step = "any",
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  step?: string;
}) {
  const [draft, setDraft] = useState(value?.toString() ?? "");
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setDraft(value?.toString() ?? "");
  }
  const commit = () => {
    const n = draft.trim() === "" ? undefined : Number(draft);
    if (n === undefined || (Number.isFinite(n) && n >= 0)) {
      if (n !== value) onChange(n);
    } else setDraft(value?.toString() ?? "");
  };
  return (
    <label className="flex h-8 items-center gap-1.5 rounded-md border border-input bg-card pl-3 text-[13px] shadow-xs focus-within:border-ring">
      <span className="whitespace-nowrap text-muted-foreground">{label}</span>
      <input
        type="number"
        min={0}
        step={step}
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && commit()}
        placeholder="Any"
        className="h-full w-16 bg-transparent pr-2 tabular-nums outline-none placeholder:text-subtle-foreground"
      />
    </label>
  );
}

export function BooleanFilter({
  label,
  value,
  onChange,
  trueLabel = "Yes",
  falseLabel = "No",
}: {
  label: string;
  value: boolean | undefined;
  onChange: (value: boolean | undefined) => void;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <SelectFilter
      label={label}
      value={value === undefined ? undefined : String(value)}
      options={[
        { value: "true", label: trueLabel },
        { value: "false", label: falseLabel },
      ]}
      onChange={(v) => onChange(v === undefined ? undefined : v === "true")}
    />
  );
}
