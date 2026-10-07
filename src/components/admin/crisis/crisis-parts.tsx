"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, CircleSlash, Hand, Siren, TriangleAlert, Undo2, UserRoundPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Column } from "@/components/admin/shared/data-table";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { CopyableId, DetailDrawer, DetailRow, DetailSection, PrivacyNote } from "@/components/admin/shared/detail";
import { Field, FormDialog } from "@/components/admin/shared/form-dialog";
import { Can } from "@/components/admin/shared/permission";
import { ErrorState, LoadingBlock } from "@/components/admin/shared/states";
import { RiskBadge, SlaBadge, StatusBadge } from "@/components/admin/shared/status-badge";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { crisisApi } from "@/lib/api/clinical";
import { CRISIS_STATUS_META, TRIGGER_META } from "@/lib/constants/status";
import { formatDateTime, formatDeadline, formatNumber, humanize, patientRef } from "@/lib/formatters";
import type { CrisisEvent, CrisisStatus } from "@/types/admin";

const NOTE_MAX = 500;
const REASON_MAX = 300;

/** Statuses from which no further workflow transition is possible. */
const CLOSED: CrisisStatus[] = ["RESOLVED", "FALSE_ALERT"];

export function crisisColumns({ withPatient = true }: { withPatient?: boolean } = {}): Column<CrisisEvent>[] {
  const cols: Column<CrisisEvent>[] = [
    {
      id: "detected",
      header: "Detected",
      hideable: false,
      cell: (c) => (
        <div>
          <p className="font-medium">{formatDateTime(c.createdAt)}</p>
          <p className="text-xs text-muted-foreground">{c.updatedAt !== c.createdAt ? `Updated ${formatDateTime(c.updatedAt)}` : humanize(c.triggerType)}</p>
        </div>
      ),
    },
  ];
  if (withPatient) {
    cols.push({
      id: "patient",
      header: "Patient",
      cell: (c) => <span className="font-medium tabular-nums">{patientRef(c.user?.patientNumber)}</span>,
    });
  }
  cols.push(
    { id: "severity", header: "Severity", cell: (c) => <RiskBadge level={c.detectedRiskLevel} /> },
    { id: "status", header: "Status", cell: (c) => <StatusBadge value={c.status} meta={CRISIS_STATUS_META} /> },
    { id: "trigger", header: "Trigger", hideBelow: "lg", cell: (c) => <StatusBadge value={c.triggerType} meta={TRIGGER_META} /> },
    { id: "sla", header: "SLA", hideBelow: "sm", cell: (c) => <SlaBadge breached={c.slaBreached} deadlineLabel={formatDeadline(c.slaDeadline)?.label} /> },
    {
      id: "owner",
      header: "Owner",
      hideBelow: "xl",
      cell: (c) => <span className="truncate text-muted-foreground">{c.handledBy?.email ?? "Unassigned"}</span>,
    },
  );
  return cols;
}

/** Free-text justification dialog shared by resolve and escalate. */
function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  placeholder,
  maxLength,
  submitLabel,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  placeholder: string;
  maxLength: number;
  submitLabel: string;
  isPending: boolean;
  onSubmit: (value: string) => Promise<boolean | void> | boolean | void;
}) {
  const [value, setValue] = useState("");
  const tooLong = value.length > maxLength;
  const trimmed = value.trim();

  return (
    <FormDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setValue("");
        onOpenChange(next);
      }}
      title={title}
      description={description}
      submitLabel={submitLabel}
      isPending={isPending}
      canSubmit={trimmed.length > 0 && !tooLong}
      onSubmit={async () => {
        const ok = await onSubmit(trimmed);
        if (ok !== false) setValue("");
      }}
    >
      <Field
        label={label}
        htmlFor="crisis-reason"
        hint={`Required · recorded in the audit log · ${value.length}/${maxLength}`}
        error={tooLong ? `Maximum ${maxLength} characters.` : null}
      >
        <Textarea
          id="crisis-reason"
          rows={4}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          aria-invalid={tooLong || undefined}
        />
      </Field>
    </FormDialog>
  );
}

export function CrisisDrawer({ crisisId, onClose }: { crisisId: string | null; onClose: () => void }) {
  const q = useApiQuery(crisisId ? ["crisis-events", "detail", crisisId] : null, () => crisisApi.get(crisisId!));
  const [dialog, setDialog] = useState<"resolve" | "escalate" | "false" | null>(null);
  const [unrouted, setUnrouted] = useState<string | null>(null);

  const take = useApiMutation(() => crisisApi.take(crisisId!), {
    invalidate: ["crisis-events", "dashboard", "clinical-alerts"],
    successMessage: "Crisis taken — you are now the handler",
    onSuccess: () => setDialog(null),
  });
  const resolve = useApiMutation((note: string) => crisisApi.resolve(crisisId!, note), {
    invalidate: ["crisis-events", "dashboard"],
    successMessage: "Crisis resolved",
  });
  const falseAlert = useApiMutation(() => crisisApi.falseAlert(crisisId!), {
    invalidate: ["crisis-events", "dashboard", "analytics"],
    successMessage: "Marked as a false alert",
  });
  const escalate = useApiMutation((reason: string) => crisisApi.escalate(crisisId!, reason), {
    invalidate: ["crisis-events", "dashboard", "clinical-alerts"],
    successMessage: (r) =>
      r.routing.unrouted
        ? "Crisis escalated, but no clinician could be routed"
        : "Crisis escalated and routed to a clinician",
    onSuccess: (r) => setUnrouted(r.routing.unrouted ? (r.routing.reason ?? "ANONYMOUS_SESSION") : null),
  });

  const c = q.data;
  const deadline = formatDeadline(c?.slaDeadline);
  const isClosed = !!c && CLOSED.includes(c.status);

  return (
    <>
      <DetailDrawer
        open={!!crisisId}
        onOpenChange={(open) => !open && onClose()}
        title="Crisis event"
        description={c ? `${humanize(c.triggerType)} trigger · detected ${formatDateTime(c.createdAt)}` : "Loading…"}
        badges={
          c && (
            <>
              <RiskBadge level={c.detectedRiskLevel} />
              <StatusBadge value={c.status} meta={CRISIS_STATUS_META} />
              <SlaBadge breached={c.slaBreached} deadlineLabel={deadline?.label} />
            </>
          )
        }
        footer={
          c && (
            <Can permission="crisis.manage">
              {unrouted && (
                <div role="alert" className="flex w-full items-start gap-2 rounded-lg border border-warning-border bg-warning-soft px-3 py-2 text-xs text-warning">
                  <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                  <span>
                    The escalation was recorded but no clinical alert was routed
                    {unrouted === "ANONYMOUS_SESSION" ? " because the session was anonymous." : ". This patient has no clinician: use “Propose an assignment”."}
                  </span>
                </div>
              )}
              <div className="flex w-full flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => take.mutate(undefined)} loading={take.isPending} disabled={c.status !== "PENDING"}>
                  <Hand /> Take in progress
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDialog("resolve")} disabled={isClosed}>
                  <CheckCircle2 /> Resolve
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDialog("escalate")} disabled={isClosed}>
                  <Undo2 /> Escalate
                </Button>
                {c.user && !c.clinicalAlert?.routedToId && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/assignments?assign=${c.user.id}`}>
                      <UserRoundPlus /> Propose an assignment
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setDialog("false")}
                  disabled={isClosed}
                >
                  <CircleSlash /> False alert
                </Button>
              </div>
            </Can>
          )
        }
      >
        {q.error ? (
          <ErrorState error={q.error} onRetry={q.refetch} compact />
        ) : !c ? (
          <LoadingBlock rows={6} />
        ) : (
          <>
            <DetailSection title="Detection">
              <DetailRow label="Identifier">
                <CopyableId value={c.id} display={c.id.slice(0, 13)} />
              </DetailRow>
              <DetailRow label="Severity">
                <RiskBadge level={c.detectedRiskLevel} />
              </DetailRow>
              <DetailRow label="Trigger">
                <StatusBadge value={c.triggerType} meta={TRIGGER_META} />
              </DetailRow>
              <DetailRow label="NLP score">{c.nlpScore === null ? "—" : formatNumber(c.nlpScore, 2)}</DetailRow>
              <DetailRow label="Detected">{formatDateTime(c.createdAt)}</DetailRow>
            </DetailSection>

            <DetailSection title="Handling">
              <DetailRow label="Status">
                <StatusBadge value={c.status} meta={CRISIS_STATUS_META} />
              </DetailRow>
              <DetailRow label="Patient">
                {c.user ? (
                  <Link href={`/admin/users/${c.user.id}`} className="text-primary hover:underline">
                    {patientRef(c.user.patientNumber)}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">Anonymous session</span>
                )}
              </DetailRow>
              <DetailRow label="Handler">{c.handledBy?.email ?? "Unassigned"}</DetailRow>
              <DetailRow label="Taken">{c.handledAt ? formatDateTime(c.handledAt) : "Not taken"}</DetailRow>
              <DetailRow label="Escalated">{c.escalatedAt ? formatDateTime(c.escalatedAt) : "Not escalated"}</DetailRow>
              <DetailRow label="SLA deadline">
                {c.slaDeadline ? (
                  <span className={deadline?.overdue ? "text-destructive" : undefined}>
                    {formatDateTime(c.slaDeadline)} · {deadline?.label}
                  </span>
                ) : (
                  "—"
                )}
              </DetailRow>
            </DetailSection>

            <DetailSection title="Linked records">
              <DetailRow label="Session">
                {c.session ? (
                  <span className="flex flex-col items-end gap-0.5">
                    <span className="text-[13px]">{formatDateTime(c.session.startTime)}</span>
                    <span className="text-xs text-muted-foreground">
                      {c.session.wpmAvg === null ? "No telemetry" : `${formatNumber(c.session.wpmAvg, 1)} wpm`}
                    </span>
                  </span>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Clinical alert">
                {c.clinicalAlert ? (
                  <Link href={`/admin/clinical-alerts?focus=${c.clinicalAlert.id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                    {humanize(c.clinicalAlert.status)}
                    <ArrowUpRight className="size-3" />
                  </Link>
                ) : (
                  <span className="text-muted-foreground">None</span>
                )}
              </DetailRow>
            </DetailSection>

            {c.detectedRiskLevel === "CRITICAL" && (
              <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive-border bg-destructive-soft px-3 py-2.5 text-xs text-destructive">
                <Siren className="mt-px size-3.5 shrink-0" aria-hidden />
                <span>
                  Critical severity. The {formatDeadline(c.slaDeadline)?.label ?? "SLA deadline"}
                  {c.slaBreached ? " has been breached." : " is still running."}
                </span>
              </div>
            )}

            <PrivacyNote>
              The patient message, flagged words, trigger payload and resolution note are never returned by the admin API and are
              therefore not shown here.
            </PrivacyNote>
          </>
        )}
      </DetailDrawer>

      <ReasonDialog
        open={dialog === "resolve"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Resolve this crisis"
        description="Closes the event as handled. The note is kept for the audit trail and is not exposed to the patient."
        label="Resolution note"
        placeholder="e.g. Spoke with the patient, grounding exercise completed"
        maxLength={NOTE_MAX}
        submitLabel="Resolve crisis"
        isPending={resolve.isPending}
        onSubmit={async (note) => !!(await resolve.mutate(note))}
      />
      <ReasonDialog
        open={dialog === "escalate"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Escalate this crisis"
        description="Routes a clinical alert to the on-call psychologist. Sessions without an identified patient cannot be routed."
        label="Escalation reason"
        placeholder="e.g. Patient mentions a plan to self-harm, needs psychiatrist review"
        maxLength={REASON_MAX}
        submitLabel="Escalate"
        isPending={escalate.isPending}
        onSubmit={async (reason) => !!(await escalate.mutate(reason))}
      />
      <ConfirmDialog
        open={dialog === "false"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Mark as a false alert?"
        description="Closes the event without handling it and feeds the false-positive rate used by the analytics module."
        confirmLabel="Mark false alert"
        reason={{ label: "Reason", placeholder: "Why was this a false alert?", maxLength: REASON_MAX, required: false }}
        isPending={falseAlert.isPending}
        onConfirm={async () => !!(await falseAlert.mutate(undefined))}
      />
    </>
  );
}
