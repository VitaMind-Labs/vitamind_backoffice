"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Confirmation for consequential actions. When `reason` is configured the
 * action requires a justification (recorded by the backend audit log).
 * `onConfirm` resolves to true on success to close the dialog.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  destructive,
  reason,
  onConfirm,
  isPending,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  destructive?: boolean;
  reason?: { label: string; placeholder?: string; maxLength?: number; required?: boolean };
  onConfirm: (reason: string) => Promise<boolean | void> | boolean | void;
  isPending?: boolean;
  children?: ReactNode;
}) {
  const [value, setValue] = useState("");
  const trimmed = value.trim();
  const reasonMissing = !!reason && reason.required !== false && trimmed.length === 0;
  const tooLong = !!reason?.maxLength && value.length > reason.maxLength;

  const close = (next: boolean) => {
    if (isPending) return;
    if (!next) setValue("");
    onOpenChange(next);
  };

  const submit = async () => {
    if (reasonMissing || tooLong) return;
    const ok = await onConfirm(trimmed);
    if (ok !== false) {
      setValue("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
        {reason && (
          <div className="space-y-1.5">
            <Label htmlFor="confirm-reason">{reason.label}</Label>
            <Textarea
              id="confirm-reason"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={reason.placeholder}
              aria-invalid={tooLong || undefined}
              rows={3}
              autoFocus
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Recorded in the admin audit log.</span>
              {reason.maxLength && (
                <span className={tooLong ? "text-destructive" : undefined}>
                  {value.length}/{reason.maxLength}
                </span>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant={destructive ? "destructive" : "default"}
            onClick={submit}
            loading={isPending}
            disabled={reasonMissing || tooLong}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
