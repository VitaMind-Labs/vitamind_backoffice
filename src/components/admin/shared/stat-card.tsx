import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Emphasis = "default" | "success" | "warning" | "danger";

const emphasisStyles: Record<Emphasis, string> = {
  default: "bg-primary-soft text-primary ring-primary/15",
  success: "bg-success-soft text-success ring-success-border",
  warning: "bg-warning-soft text-warning ring-warning-border",
  danger: "bg-destructive-soft text-destructive ring-destructive-border",
};

/** Top hairline that carries the card's state at a glance. */
const accentStyles: Record<Emphasis, string> = {
  default: "from-primary/50",
  success: "from-success/60",
  warning: "from-warning/70",
  danger: "from-destructive/80",
};

/** Pulsing dot for values that need someone to act now. */
export function LiveDot({ tone = "danger", className }: { tone?: "danger" | "warning" | "success"; className?: string }) {
  const color = tone === "danger" ? "bg-destructive" : tone === "warning" ? "bg-warning" : "bg-success";
  return (
    <span className={cn("relative inline-flex size-2 shrink-0", className)} aria-hidden>
      <span className={cn("absolute inline-flex size-full animate-live rounded-full opacity-60", color)} />
      <span className={cn("relative inline-flex size-2 rounded-full", color)} />
    </span>
  );
}

/**
 * One headline number with its context. Used for KPI rows; the number is the
 * chart, so no sparkline or decoration is added unless data supports it.
 * With `href` / `onClick` the card becomes a drill-down into the filtered list.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  emphasis = "default",
  loading,
  footer,
  live,
  href,
  onClick,
  active,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  emphasis?: Emphasis;
  loading?: boolean;
  footer?: ReactNode;
  /** Show a pulsing indicator (e.g. untreated critical items). */
  live?: boolean;
  href?: string;
  onClick?: () => void;
  /** The list below is currently filtered by this card. */
  active?: boolean;
  className?: string;
}) {
  const interactive = !!href || !!onClick;
  const body = (
    <>
      <span
        className={cn("pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r to-transparent", accentStyles[emphasis])}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
          {live && !loading && <LiveDot tone={emphasis === "warning" ? "warning" : "danger"} />}
          {label}
        </p>
        {Icon && (
          <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset", emphasisStyles[emphasis])}>
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3.5 w-32" />
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-[28px] font-semibold leading-none tabular-nums tracking-tight text-foreground">{value}</p>
          {hint && <p className="pt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
      )}
      {footer && !loading && <div className="border-t pt-2.5 text-xs text-muted-foreground">{footer}</div>}
      {interactive && (
        <ArrowUpRight
          className="absolute bottom-3.5 right-3.5 size-3.5 text-subtle-foreground opacity-0 transition-opacity group-hover/stat:opacity-100 group-focus-visible/stat:opacity-100"
          aria-hidden
        />
      )}
    </>
  );

  const classes = cn(
    "group/stat relative flex flex-col gap-3 overflow-hidden p-4",
    interactive && "cursor-pointer text-left transition-all duration-200 hover:-translate-y-px hover:border-border-strong hover:shadow-md",
    active && "border-primary/50 ring-2 ring-primary/15",
    className,
  );

  if (href) {
    return (
      <Card className={classes} asChild>
        <Link href={href}>{body}</Link>
      </Card>
    );
  }
  if (onClick) {
    return (
      <Card className={classes} asChild>
        <button type="button" onClick={onClick} aria-pressed={active}>
          {body}
        </button>
      </Card>
    );
  }
  return <Card className={classes}>{body}</Card>;
}

/** Compact inline metric for dense panels (label over value). */
export function MetricCard({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border bg-card px-4 py-3 shadow-xs", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}
