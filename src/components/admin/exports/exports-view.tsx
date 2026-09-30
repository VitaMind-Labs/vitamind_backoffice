"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, ShieldAlert, Siren, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DateRangeFilter, optionsFrom, type Option } from "@/components/admin/shared/filters";
import { Field } from "@/components/admin/shared/form-dialog";
import { PageHeader } from "@/components/admin/shared/page-header";
import { Can } from "@/components/admin/shared/permission";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { exportsApi, type ExportQuery } from "@/lib/api/operations";
import { PAYMENT_STATUS_META, USER_STATUS_META } from "@/lib/constants/status";
import { formatBytes } from "@/lib/formatters";
import { PAYMENT_STATUSES, USER_STATUSES, type PaymentStatus, type UserStatus } from "@/types/admin";

const REASON_MAX = 300;
const ALL = "__all";

function ExportCard({
  title,
  description,
  icon: Icon,
  includes,
  statusOptions,
  resource,
  run,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  includes: string[];
  statusOptions?: Option[];
  resource: string;
  run: (query: ExportQuery & { status?: string }) => Promise<{ filename: string; size: number }>;
}) {
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [status, setStatus] = useState<string>(ALL);
  const [reason, setReason] = useState("");
  const [lastFile, setLastFile] = useState<{ filename: string; size: number } | null>(null);

  const mutation = useApiMutation((query: ExportQuery & { status?: string }) => run(query), {
    invalidate: [resource],
    successMessage: (r) => `Downloaded ${r.filename}`,
    onSuccess: (r) => setLastFile(r),
  });

  const reasonError = reason.length > REASON_MAX ? `Maximum ${REASON_MAX} characters.` : null;
  const valid = reason.trim().length > 0 && !reasonError && !mutation.isPending;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icon className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
        </div>
      </div>

      <ul className="space-y-1">
        {includes.map((item) => (
          <li key={item} className="flex items-start gap-2 text-[13px] text-muted-foreground">
            <FileSpreadsheet className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {item}
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        <DateRangeFilter value={{ from, to }} onChange={(r) => { setFrom(r.from); setTo(r.to); }} allLabel="All time" />
        {statusOptions && (
          <Field label="Status" htmlFor={`export-status-${resource}`} hint="Optional — export every status when left unset.">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id={`export-status-${resource}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        )}
        <Field
          label="Reason for export"
          htmlFor={`export-reason-${resource}`}
          hint={`Required · recorded in the audit log · ${reason.length}/${REASON_MAX}`}
          error={reasonError}
        >
          <Textarea
            id={`export-reason-${resource}`}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Q2 retention analysis requested by the data protection officer"
            aria-invalid={reasonError ? true : undefined}
          />
        </Field>
      </div>

      <div className="mt-auto space-y-2.5 border-t pt-3.5">
        <Button
          className="w-full"
          size="sm"
          loading={mutation.isPending}
          disabled={!valid}
          onClick={() =>
            mutation.mutate({
              reason: reason.trim(),
              from,
              to,
              status: status === ALL ? undefined : status,
            })
          }
        >
          <Download /> Download CSV
        </Button>
        {lastFile && (
          <p className="text-center text-xs text-muted-foreground">
            Last export: <span className="font-medium text-foreground">{lastFile.filename}</span> · {formatBytes(lastFile.size)}
          </p>
        )}
      </div>
    </Card>
  );
}

function ExportsBody() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Exports"
        description="CSV extracts of the operational datasets. Clinical content is never part of an export."
      />

      <div role="note" className="flex items-start gap-3 rounded-lg border border-warning-border bg-warning-soft px-4 py-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
        <div>
          <p className="text-[13px] font-medium text-warning">Exports contain personal data</p>
          <p className="text-[13px] text-warning/90">
            Every export requires a justification and is written to the audit log with your admin identity. Files are generated
            server-side and downloaded directly to your machine — handle them according to the data protection policy.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Can permission="exports.users">
          <ExportCard
            title="Users"
            description="Patient accounts with their subscription and clinical metadata."
            icon={Users}
            resource="users"
            includes={[
              "Patient reference, nickname, email, language",
              "Account status and detected orientation",
              "Subscription plan, tier and status",
              "Crisis count, last activity, sign-up date",
            ]}
            statusOptions={optionsFrom(USER_STATUSES, USER_STATUS_META)}
            run={(query) => exportsApi.users({ ...query, status: query.status as UserStatus | undefined })}
          />
        </Can>

        <Can permission="exports.payments">
          <ExportCard
            title="Payments"
            description="Transactions with amounts, statuses and provider references."
            icon={FileSpreadsheet}
            resource="payments"
            includes={[
              "Amount, currency, status and trial flag",
              "Payment method and plan identifier",
              "Provider intent and session identifiers",
              "Created, paid and refunded timestamps",
            ]}
            statusOptions={optionsFrom(PAYMENT_STATUSES, PAYMENT_STATUS_META)}
            run={(query) => exportsApi.payments({ ...query, status: query.status as PaymentStatus | undefined })}
          />
        </Can>

        <Can permission="exports.risks">
          <ExportCard
            title="Risks"
            description="Crisis events with severity, trigger channel and handling outcome."
            icon={Siren}
            resource="crisis-events"
            includes={[
              "Crisis identifier, severity and trigger type",
              "Status, handling and escalation timestamps",
              "SLA deadline and breach flag",
              "Linked patient reference and session",
            ]}
            run={(query) => exportsApi.risks(query)}
          />
        </Can>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold tracking-tight">What is never exported</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Crisis messages, flagged words, journal entries, Mira transcripts, reports and clinician notes are excluded from every
          dataset, regardless of the period selected. Risk exports contain severity and status metadata only.
        </p>
      </Card>
    </div>
  );
}

export function ExportsView() {
  return <ExportsBody />;
}
