import type { LucideIcon } from "lucide-react";
import { AlertCircle, Inbox, Lock, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "gap-2 py-8" : "gap-3 py-14", className)}>
      <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="mx-auto max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  error,
  title,
  onRetry,
  className,
  compact,
}: {
  error?: ApiError | Error | null;
  title?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}) {
  const status = (error as ApiError | undefined)?.status;
  if (status === 403) {
    return (
      <EmptyState
        icon={Lock}
        compact={compact}
        className={className}
        title="Restricted"
        description="Your admin role does not give access to this data."
      />
    );
  }
  return (
    <div
      role="alert"
      className={cn("flex flex-col items-center justify-center gap-3 text-center", compact ? "py-8" : "py-14", className)}
    >
      <span className="grid size-10 place-items-center rounded-full bg-destructive-soft text-destructive">
        <AlertCircle className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title ?? (status === 501 ? "Not implemented yet" : "Couldn’t load this data")}</p>
        {error?.message && <p className="mx-auto max-w-md text-[13px] text-muted-foreground">{error.message}</p>}
      </div>
      {onRetry && status !== 501 && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw /> Retry
        </Button>
      )}
    </div>
  );
}

/** Wraps the three data states so pages don't repeat the branching. */
export function DataState<T>({
  data,
  error,
  isLoading,
  onRetry,
  skeleton,
  isEmpty,
  empty,
  children,
}: {
  data: T | undefined;
  error?: ApiError;
  isLoading: boolean;
  onRetry?: () => void;
  skeleton?: ReactNode;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (error && data === undefined) return <ErrorState error={error} onRetry={onRetry} compact />;
  if (isLoading || data === undefined) return <>{skeleton ?? <LoadingBlock />}</>;
  if (isEmpty?.(data)) return <>{empty ?? <EmptyState compact title="Nothing to show" />}</>;
  return <>{children(data)}</>;
}

export function LoadingBlock({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)} aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="space-y-3 p-4">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-7 w-20" />
          </Card>
        ))}
      </div>
      <Card className="h-72 p-5">
        <Skeleton className="h-full w-full" />
      </Card>
    </div>
  );
}
