import { format, formatDistanceToNowStrict, isValid, parseISO } from "date-fns";
import type { DecimalValue } from "@/types/admin";

const numberFormat = new Intl.NumberFormat("en-US");
const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = typeof value === "string" ? parseISO(value) : value;
  return isValid(date) ? date : null;
}

export const EMPTY = "—";

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY;
  return digits
    ? value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : numberFormat.format(Math.round(value));
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY;
  return Math.abs(value) < 10_000 ? numberFormat.format(value) : compactFormat.format(value);
}

export function toNumber(value: DecimalValue | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function formatMoney(value: DecimalValue | null | undefined, currency = "EUR"): string {
  const n = toNumber(value);
  if (n === null) return EMPTY;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

/** `ratio` in 0..1 */
export function formatRatio(ratio: number | null | undefined, digits = 1): string {
  if (ratio === null || ratio === undefined || Number.isNaN(ratio)) return EMPTY;
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** `value` already in 0..100 */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return EMPTY;
  return `${value.toFixed(digits)}%`;
}

/** Parses backend percentage strings such as "3.20%". */
export function parsePercent(value: string | null | undefined): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value.replace("%", ""));
  return Number.isFinite(n) ? n : null;
}

/** Byte size for a downloaded file (CSV exports). */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined || Number.isNaN(bytes) || bytes < 0) return EMPTY;
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 100 ? 0 : 1)} ${units[unit]}`;
}

export function formatDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy") : EMPTY;
}

export function formatDateTime(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? format(date, "d MMM yyyy, HH:mm") : EMPTY;
}

export function formatShortDate(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? format(date, "d MMM") : EMPTY;
}

export function formatRelative(value: string | Date | null | undefined): string {
  const date = toDate(value);
  return date ? `${formatDistanceToNowStrict(date)} ago` : EMPTY;
}

/** "in 12 min" / "8 min overdue" for SLA deadlines. */
export function formatDeadline(value: string | null | undefined): { label: string; overdue: boolean } | null {
  const date = toDate(value);
  if (!date) return null;
  const overdue = date.getTime() < Date.now();
  const distance = formatDistanceToNowStrict(date);
  return { label: overdue ? `${distance} overdue` : `in ${distance}`, overdue };
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return EMPTY;
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function patientRef(patientNumber: number | null | undefined): string {
  return patientNumber === null || patientNumber === undefined ? "Anonymous" : `VM-${patientNumber}`;
}

export function shortId(id: string | null | undefined): string {
  return id ? id.slice(0, 8) : EMPTY;
}

/** "HIGH_RISK_JOURNAL" → "High risk journal" */
export function humanize(value: string | null | undefined): string {
  if (!value) return EMPTY;
  const text = value.replace(/[_-]+/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** ISO date (yyyy-MM-dd) n days before today. */
export function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return format(date, "yyyy-MM-dd");
}

export function isoToday(): string {
  return format(new Date(), "yyyy-MM-dd");
}
