"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Route } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Column } from "@/components/admin/shared/data-table";
import { CopyableId, DetailDrawer, DetailRow, DetailSection, PrivacyNote } from "@/components/admin/shared/detail";
import { Field, FormDialog } from "@/components/admin/shared/form-dialog";
import { Can } from "@/components/admin/shared/permission";
import { RiskBadge, SlaBadge, StatusBadge } from "@/components/admin/shared/status-badge";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { alertsApi } from "@/lib/api/clinical";
import { ALERT_RESOLUTION_META, ALERT_STATUS_META, ALERT_TYPE_META, PSYCHOLOGIST_STATUS_META } from "@/lib/constants/status";
import { formatDateTime, formatDeadline, humanize } from "@/lib/formatters";
import type { ClinicalAlert } from "@/types/admin";

const REASON_MAX = 300;

export function clinicianName(alert: ClinicalAlert): string {
  const r = alert.routedTo;
  if (!r) return "Unrouted";
  return [r.firstName, r.lastName].filter(Boolean).join(" ") || "Unrouted";
}

export function alertColumns(): Column<ClinicalAlert>[] {
  return [
    {
      id: "alert",
      header: "Alert",
      hideable: false,
      cell: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium">{a.title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {a.patientRef} · {humanize(a.type)}
          </p>
        </div>
      ),
    },
    { id: "type", header: "Type", hideBelow: "lg", cell: (a) => <StatusBadge value={a.type} meta={ALERT_TYPE_META} /> },
    { id: "severity", header: "Severity", cell: (a) => <RiskBadge level={a.severity} /> },
    { id: "status", header: "Status", cell: (a) => <StatusBadge value={a.status} meta={ALERT_STATUS_META} /> },
    {
      id: "routed",
      header: "Routed to",
      hideBelow: "md",
      cell: (a) => (
        <span className={a.routedTo ? "truncate text-muted-foreground" : "font-medium text-warning"}>{clinicianName(a)}</span>
      ),
    },
    {
      id: "sla",
      header: "SLA",
      hideBelow: "sm",
      cell: (a) => <SlaBadge breached={a.slaBreached} deadlineLabel={formatDeadline(a.slaDeadline)?.label} />,
    },
    {
      id: "escalation",
      header: "Level",
      hideBelow: "xl",
      align: "right",
      cell: (a) => <span className="tabular-nums text-muted-foreground">L{a.escalationLevel}</span>,
    },
    {
      id: "triggered",
      header: "Triggered",
      cell: (a) => (
        <div>
          <p className="text-[13px]">{formatDateTime(a.triggeredAt)}</p>
          {a.escalatedAt && <p className="text-xs text-serious">Escalated {formatDateTime(a.escalatedAt)}</p>}
        </div>
      ),
    },
  ];
}

/**
 * Reassigns an alert to another clinician. The admin API exposes no psychologist
 * roster, so the target is entered as a clinician identifier and validated by the
 * backend on submit.
 */
function RerouteDialog({ alert, open, onOpenChange }: { alert: ClinicalAlert; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [psychologistId, setPsychologistId] = useState("");
  const [reason, setReason] = useState("");
  const mutation = useApiMutation((input: { psychologistId: string; reason: string }) => alertsApi.reroute(alert.id, input), {
    invalidate: ["clinical-alerts", "crisis-events", "dashboard"],
    successMessage: "Alert rerouted",
  });
  const idError = psychologistId.trim().length === 0 ? "A clinician identifier is required." : null;
  const reasonError = reason.trim().length === 0 ? "A reason is required." : null;
  const valid = !idError && !reasonError && reason.length <= REASON_MAX;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reroute this alert"
      description={
        alert.routedTo
          ? `Currently routed to ${clinicianName(alert)}. The previous assignee stops receiving the alert.`
          : "This alert has no assignee. Assigning it starts the SLA clock for the new clinician."
      }
      submitLabel="Reroute"
      isPending={mutation.isPending}
      canSubmit={valid}
      onSubmit={async () => {
        const ok = await mutation.mutate({ psychologistId: psychologistId.trim(), reason: reason.trim() });
        if (ok) {
          setPsychologistId("");
          setReason("");
          onOpenChange(false);
        }
      }}
    >
      <Field label="Clinician identifier" htmlFor="reroute-psychologist" hint="The psychologist UUID the alert should be assigned to." error={psychologistId.length > 0 ? idError : null}>
        <Input
          id="reroute-psychologist"
          value={psychologistId}
          onChange={(e) => setPsychologistId(e.target.value)}
          placeholder="3f1c9a6e-0d2b-4a71-9c1e-5b7d8f2a4c11"
          className="font-mono text-xs"
        />
      </Field>
      <Field
        label="Reason"
        htmlFor="reroute-reason"
        hint={`Required · recorded in the audit log · ${reason.length}/${REASON_MAX}`}
        error={reason.length > 0 ? reasonError : null}
      >
        <Textarea
          id="reroute-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Original assignee is off duty until Monday"
        />
      </Field>
    </FormDialog>
  );
}

/** Detail for an alert. The list endpoint already returns the full record, so no extra request is needed. */
export function AlertDrawer({ alert, onClose }: { alert: ClinicalAlert | null; onClose: () => void }) {
  const [reroute, setReroute] = useState(false);
  const deadline = formatDeadline(alert?.slaDeadline);

  return (
    <>
      <DetailDrawer
        open={!!alert}
        onOpenChange={(open) => !open && onClose()}
        title={alert?.title ?? "Clinical alert"}
        description={alert ? `${alert.patientRef} · triggered ${formatDateTime(alert.triggeredAt)}` : ""}
        badges={
          alert && (
            <>
              <StatusBadge value={alert.type} meta={ALERT_TYPE_META} />
              <RiskBadge level={alert.severity} />
              <StatusBadge value={alert.status} meta={ALERT_STATUS_META} />
            </>
          )
        }
        footer={
          alert && (
            <Can permission="alerts.reroute">
              <Button variant="outline" size="sm" className="w-full" onClick={() => setReroute(true)}>
                <Route /> Reroute alert
              </Button>
            </Can>
          )
        }
      >
        {alert && (
          <>
            <DetailSection title="Alert">
              <DetailRow label="Identifier">
                <CopyableId value={alert.id} display={alert.id.slice(0, 13)} />
              </DetailRow>
              <DetailRow label="Type">
                <StatusBadge value={alert.type} meta={ALERT_TYPE_META} />
              </DetailRow>
              <DetailRow label="Severity">
                <RiskBadge level={alert.severity} />
              </DetailRow>
              <DetailRow label="Status">
                <StatusBadge value={alert.status} meta={ALERT_STATUS_META} />
              </DetailRow>
              <DetailRow label="Patient reference">{alert.patientRef}</DetailRow>
              <DetailRow label="Patient">
                <Link href={`/admin/users/${alert.userId}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                  Open patient <ArrowUpRight className="size-3" />
                </Link>
              </DetailRow>
            </DetailSection>

            <DetailSection title="Routing">
              <DetailRow label="Assigned to">
                {alert.routedTo ? (
                  <span className="flex flex-col items-end gap-0.5">
                    <span>{clinicianName(alert)}</span>
                    <StatusBadge value={alert.routedTo.status} meta={PSYCHOLOGIST_STATUS_META} />
                  </span>
                ) : (
                  <span className="text-warning">Unrouted</span>
                )}
              </DetailRow>
              <DetailRow label="Escalation level">Level {alert.escalationLevel}</DetailRow>
              <DetailRow label="Escalated">{alert.escalatedAt ? formatDateTime(alert.escalatedAt) : "Not escalated"}</DetailRow>
              <DetailRow label="SLA deadline">
                {alert.slaDeadline ? (
                  <span className={deadline?.overdue ? "text-destructive" : undefined}>
                    {formatDateTime(alert.slaDeadline)} · {deadline?.label}
                  </span>
                ) : (
                  "—"
                )}
              </DetailRow>
            </DetailSection>

            <DetailSection title="Timeline">
              <DetailRow label="Triggered">{formatDateTime(alert.triggeredAt)}</DetailRow>
              <DetailRow label="Acknowledged">
                {alert.acknowledgedAt ? (
                  <span className="flex flex-col items-end gap-0.5">
                    <span>{formatDateTime(alert.acknowledgedAt)}</span>
                    {alert.acknowledgedById && <span className="text-xs text-muted-foreground">By {alert.acknowledgedById.slice(0, 8)}</span>}
                  </span>
                ) : (
                  "Not acknowledged"
                )}
              </DetailRow>
              <DetailRow label="Resolution">
                {alert.resolution ? <StatusBadge value={alert.resolution} meta={ALERT_RESOLUTION_META} /> : "—"}
              </DetailRow>
              <DetailRow label="Resolved">{alert.resolvedAt ? formatDateTime(alert.resolvedAt) : "Not resolved"}</DetailRow>
            </DetailSection>

            <DetailSection title="Source">
              <DetailRow label="Crisis event">
                {alert.crisisEventId ? (
                  <Link
                    href={`/admin/crisis-events?focus=${alert.crisisEventId}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Open crisis <ArrowUpRight className="size-3" />
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Journal entry">{alert.journalEntryId ? "Attached" : "—"}</DetailRow>
            </DetailSection>

            <PrivacyNote>
              The alert description, its clinical context and any journal extract behind the alert are withheld from the admin API.
              Routing and status fields are the only operational data available.
            </PrivacyNote>
          </>
        )}
      </DetailDrawer>

      {alert && <RerouteDialog alert={alert} open={reroute} onOpenChange={setReroute} />}
    </>
  );
}
