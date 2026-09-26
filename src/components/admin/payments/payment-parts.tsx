"use client";

import { useState } from "react";
import { ArrowLeftRight, Info, PencilLine, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Column } from "@/components/admin/shared/data-table";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { CopyableId, DetailDrawer, DetailRow, DetailSection } from "@/components/admin/shared/detail";
import { Field } from "@/components/admin/shared/form-dialog";
import { Can } from "@/components/admin/shared/permission";
import { ErrorState, LoadingBlock } from "@/components/admin/shared/states";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { SubscriptionTierDialog } from "@/components/admin/users/user-dialogs";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { paymentsApi } from "@/lib/api/payments";
import { PAYMENT_STATUS_META } from "@/lib/constants/status";
import { formatDateTime, formatMoney, patientRef, shortId } from "@/lib/formatters";
import { PAYMENT_STATUSES, type Payment, type PaymentStatus } from "@/types/admin";

export function paymentColumns({ withPatient }: { withPatient: boolean }): Column<Payment>[] {
  const cols: Column<Payment>[] = [
    {
      id: "amount",
      header: "Amount",
      sortKey: "amount",
      cell: (p) => (
        <div>
          <p className="font-medium tabular-nums">{formatMoney(p.amount, p.currency)}</p>
          <p className="font-mono text-[11px] text-subtle-foreground">{shortId(p.id)}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortKey: "status",
      cell: (p) => (
        <span className="flex flex-wrap gap-1">
          <StatusBadge value={p.status} meta={PAYMENT_STATUS_META} />
          {p.isTrial && p.status !== "FREE_TRIAL" && <Badge tone="info">Trial</Badge>}
        </span>
      ),
    },
  ];
  if (withPatient) {
    cols.push({ id: "patient", header: "Patient", cell: (p) => <span className="tabular-nums">{patientRef(p.user?.patientNumber)}</span> });
  }
  cols.push(
    { id: "method", header: "Method", hideBelow: "lg", cell: (p) => <span className="text-muted-foreground">{p.paymentMethod ?? "—"}</span> },
    { id: "paid", header: "Paid", sortKey: "paid_at", hideBelow: "md", cell: (p) => (p.paidAt ? formatDateTime(p.paidAt) : "—") },
    { id: "created", header: "Created", sortKey: "created_at", hideBelow: "sm", cell: (p) => formatDateTime(p.createdAt) },
  );
  return cols;
}

function StatusCorrectionDialog({ payment, open, onOpenChange }: { payment: Payment; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [status, setStatus] = useState<PaymentStatus>(payment.status);
  const mutation = useApiMutation((input: { status: PaymentStatus; reason: string }) => paymentsApi.updateStatus(payment.id, input), {
    invalidate: ["payments", "dashboard"],
    successMessage: (_r, v) => `Payment marked ${PAYMENT_STATUS_META[v.status].label.toLowerCase()}`,
  });
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Correct payment status"
      description="Exceptional manual correction (super admin only). The payment provider webhook is normally the source of truth."
      confirmLabel="Apply correction"
      reason={{ label: "Reason", placeholder: "Why is a manual correction needed?", maxLength: 300 }}
      isPending={mutation.isPending}
      onConfirm={async (reason) => (status === payment.status ? false : !!(await mutation.mutate({ status, reason })))}
    >
      <Field label="New status" htmlFor="payment-status">
        <Select value={status} onValueChange={(v) => setStatus(v as PaymentStatus)}>
          <SelectTrigger id="payment-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s} disabled={s === payment.status}>
                {PAYMENT_STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </ConfirmDialog>
  );
}

export function PaymentDrawer({ paymentId, onClose }: { paymentId: string | null; onClose: () => void }) {
  const q = useApiQuery(paymentId ? ["payments", "detail", paymentId] : null, () => paymentsApi.get(paymentId!));
  const [dialog, setDialog] = useState<"refund" | "status" | "tier" | null>(null);
  const refund = useApiMutation((reason: string) => paymentsApi.refund(paymentId!, reason), {
    invalidate: ["payments", "dashboard"],
    successMessage: "Refund confirmed by the payment provider",
    // 501 = no provider integrated: nothing changed, the warning toast explains it; close the dialog.
    onError: (error) => error.isNotImplemented && setDialog(null),
  });
  const p = q.data;

  return (
    <>
      <DetailDrawer
        open={!!paymentId}
        onOpenChange={(o) => !o && onClose()}
        title={p ? formatMoney(p.amount, p.currency) : "Payment"}
        description={p ? `${patientRef(p.user?.patientNumber)} · created ${formatDateTime(p.createdAt)}` : "Loading…"}
        badges={p && <StatusBadge value={p.status} meta={PAYMENT_STATUS_META} />}
        footer={
          p && (
            <>
              <Can permission="users.subscription">
                <Button variant="outline" size="sm" onClick={() => setDialog("tier")}>
                  <ArrowLeftRight /> Change tier
                </Button>
              </Can>
              <Can permission="payments.status">
                <Button variant="outline" size="sm" onClick={() => setDialog("status")}>
                  <PencilLine /> Correct status
                </Button>
              </Can>
              <Can permission="payments.refund">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDialog("refund")}
                  disabled={p.status !== "PAID"}
                  title={p.status !== "PAID" ? "Only paid payments can be refunded" : undefined}
                >
                  <RotateCcw /> Refund
                </Button>
              </Can>
            </>
          )
        }
      >
        {q.error ? (
          <ErrorState error={q.error} onRetry={q.refetch} compact />
        ) : !p ? (
          <LoadingBlock rows={6} />
        ) : (
          <>
            <DetailSection title="Payment">
              <DetailRow label="Identifier">
                <CopyableId value={p.id} display={p.id.slice(0, 13)} />
              </DetailRow>
              <DetailRow label="Patient">{patientRef(p.user?.patientNumber)}</DetailRow>
              <DetailRow label="Amount">{formatMoney(p.amount, p.currency)}</DetailRow>
              <DetailRow label="Status">
                <StatusBadge value={p.status} meta={PAYMENT_STATUS_META} />
              </DetailRow>
              <DetailRow label="Trial payment">{p.isTrial ? "Yes" : "No"}</DetailRow>
              <DetailRow label="Method">{p.paymentMethod ?? "—"}</DetailRow>
              <DetailRow label="Plan">{p.planId ? <CopyableId value={p.planId} display={shortId(p.planId)} /> : "—"}</DetailRow>
            </DetailSection>
            <DetailSection title="Timeline">
              <DetailRow label="Created">{formatDateTime(p.createdAt)}</DetailRow>
              <DetailRow label="Paid">{formatDateTime(p.paidAt)}</DetailRow>
              <DetailRow label="Refunded">{formatDateTime(p.refundedAt)}</DetailRow>
              <DetailRow label="Last updated">{formatDateTime(p.updatedAt)}</DetailRow>
            </DetailSection>
            <p className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
              <Info className="mt-px size-3.5 shrink-0" aria-hidden />
              Refunds go through the payment provider integration. Until a provider is connected the backend answers “not
              implemented” and nothing is changed.
            </p>
          </>
        )}
      </DetailDrawer>

      {p && (
        <>
          <ConfirmDialog
            open={dialog === "refund"}
            onOpenChange={(o) => !o && setDialog(null)}
            title={`Refund ${formatMoney(p.amount, p.currency)}?`}
            description="The refund is requested from the payment provider; the payment is marked refunded only after the provider confirms."
            confirmLabel="Request refund"
            destructive
            reason={{ label: "Reason", placeholder: "Why is this payment refunded?", maxLength: 300 }}
            isPending={refund.isPending}
            onConfirm={async (reason) => !!(await refund.mutate(reason))}
          />
          {dialog === "status" && <StatusCorrectionDialog payment={p} open onOpenChange={(o) => !o && setDialog(null)} />}
          {dialog === "tier" && (
            <SubscriptionTierDialog
              open
              onOpenChange={(o) => !o && setDialog(null)}
              userId={p.userId}
              patientLabel={patientRef(p.user?.patientNumber)}
            />
          )}
        </>
      )}
    </>
  );
}
