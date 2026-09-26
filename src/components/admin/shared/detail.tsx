"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/** Side drawer for record details, keeping the list in context. */
export function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  badges,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  badges?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
          {badges && <div className="flex flex-wrap gap-1.5 pt-1.5">{badges}</div>}
        </SheetHeader>
        <SheetBody className="space-y-6">{children}</SheetBody>
        {footer && <SheetFooter>{footer}</SheetFooter>}
      </SheetContent>
    </Sheet>
  );
}

/** Titled group of key/value rows inside a detail panel or card. */
export function DetailSection({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-2", className)}>
      {title && <h3 className="text-xs font-semibold uppercase tracking-wide text-subtle-foreground">{title}</h3>}
      <dl className="divide-y rounded-lg border">{children}</dl>
    </section>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-center gap-3 px-3.5 py-2.5">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-[13px] font-medium text-foreground [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/** Monospace identifier with copy-to-clipboard. */
export function CopyableId({ value, display }: { value: string; display?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex max-w-full items-center gap-1 rounded px-1 font-mono text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
      title="Copy identifier"
    >
      <span className="truncate">{display ?? value}</span>
      {copied ? <Check className="size-3 shrink-0 text-success" /> : <Copy className="size-3 shrink-0" />}
    </button>
  );
}

/** Reminder shown where the API deliberately withholds clinical content. */
export function PrivacyNote({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-info-border bg-info-soft px-3 py-2.5 text-xs text-info">
      <ShieldCheck className="mt-px size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
