"use client";

import { useState } from "react";
import { BadgeCheck, CircleSlash, FileBadge, Info, Search, ShieldQuestion } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { CopyableId, DetailRow, DetailSection, PrivacyNote } from "@/components/admin/shared/detail";
import { Field, FormDialog } from "@/components/admin/shared/form-dialog";
import { PageHeader, SectionHeader } from "@/components/admin/shared/page-header";
import { EmptyState } from "@/components/admin/shared/states";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { licensesApi } from "@/lib/api/operations";
import { LICENSE_AUTHORITY_LABELS, LICENSE_STATUS_META } from "@/lib/constants/status";
import { formatDate } from "@/lib/formatters";
import {
  LICENSE_AUTHORITIES,
  type LicenseAuthority,
  type LicenseVerification,
  type LicenseVerifyInput,
} from "@/types/admin";

const LICENSE_MAX = 64;
const AUTHORITY_NAME_MAX = 120;

interface VerifyDraft {
  authority: LicenseAuthority;
  licenseNumber: string;
  authorityName: string;
  expiresAt: string;
  evidenceUrl: string;
}

const EMPTY_VERIFY: VerifyDraft = {
  authority: "DHA",
  licenseNumber: "",
  authorityName: "",
  expiresAt: "",
  evidenceUrl: "",
};

function VerifyDialog({
  psychologistId,
  open,
  onOpenChange,
  onVerified,
}: {
  psychologistId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified: (result: LicenseVerification) => void;
}) {
  const [draft, setDraft] = useState<VerifyDraft>(EMPTY_VERIFY);
  const mutation = useApiMutation((input: LicenseVerifyInput) => licensesApi.verify(psychologistId, input), {
    invalidate: ["clinics", "clinical-alerts"],
    successMessage: "License verification recorded",
    onSuccess: (result) => {
      setDraft(EMPTY_VERIFY);
      onVerified(result);
      onOpenChange(false);
    },
  });
  const set = <K extends keyof VerifyDraft>(key: K, value: VerifyDraft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const numberError =
    draft.licenseNumber.trim().length === 0
      ? "A license number is required."
      : draft.licenseNumber.trim().length > LICENSE_MAX
        ? `Maximum ${LICENSE_MAX} characters.`
        : null;
  const authorityNameRequired = draft.authority === "OTHER";
  const authorityNameError = authorityNameRequired && draft.authorityName.trim().length === 0 ? "Name the authority for an “Other” licence." : null;
  const valid = !numberError && !authorityNameError;

  const submit = () => {
    if (!valid) return;
    const input: LicenseVerifyInput = { authority: draft.authority, licenseNumber: draft.licenseNumber.trim() };
    if (draft.authorityName.trim()) input.authorityName = draft.authorityName.trim();
    if (draft.expiresAt) input.expiresAt = new Date(draft.expiresAt).toISOString();
    if (draft.evidenceUrl.trim()) input.evidenceUrl = draft.evidenceUrl.trim();
    void mutation.mutate(input);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Verify a professional licence"
      description="Records the outcome of a manual check against the regulator register. Only admins with licence management rights can submit a decision."
      submitLabel="Record verification"
      isPending={mutation.isPending}
      canSubmit={valid}
      onSubmit={submit}
    >
      <Field label="Issuing authority" htmlFor="license-authority">
        <Select value={draft.authority} onValueChange={(v) => set("authority", v as LicenseAuthority)}>
          <SelectTrigger id="license-authority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LICENSE_AUTHORITIES.map((a) => (
              <SelectItem key={a} value={a}>
                {LICENSE_AUTHORITY_LABELS[a]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Licence number" htmlFor="license-number" error={numberError} hint="Exactly as printed on the licence.">
        <Input
          id="license-number"
          value={draft.licenseNumber}
          maxLength={LICENSE_MAX}
          onChange={(e) => set("licenseNumber", e.target.value)}
          placeholder="e.g. DHA-P-204118"
          className="font-mono text-sm"
        />
      </Field>
      <Field
        label="Authority name"
        htmlFor="license-authority-name"
        hint="Only needed when the authority is “Other”."
        error={authorityNameError}
      >
        <Input
          id="license-authority-name"
          value={draft.authorityName}
          maxLength={AUTHORITY_NAME_MAX}
          onChange={(e) => set("authorityName", e.target.value)}
          placeholder="e.g. Emirates Health Services"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Expires on" htmlFor="license-expires" hint="Leave empty if unknown.">
          <Input id="license-expires" type="date" value={draft.expiresAt} onChange={(e) => set("expiresAt", e.target.value)} />
        </Field>
        <Field label="Evidence URL" htmlFor="license-evidence" hint="Optional link to the register entry.">
          <Input
            id="license-evidence"
            type="url"
            value={draft.evidenceUrl}
            onChange={(e) => set("evidenceUrl", e.target.value)}
            placeholder="https://…"
          />
        </Field>
      </div>
    </FormDialog>
  );
}

export function LicensesView() {
  const [psychologistId, setPsychologistId] = useState("");
  const [dialog, setDialog] = useState<"verify" | "reject" | null>(null);
  const [result, setResult] = useState<LicenseVerification | null>(null);

  const trimmedId = psychologistId.trim();
  const idError = psychologistId.length > 0 && trimmedId.length === 0 ? "A clinician identifier is required." : null;

  const reject = useApiMutation((reason: string) => licensesApi.reject(trimmedId, reason), {
    invalidate: ["clinics", "clinical-alerts"],
    successMessage: "Rejection recorded",
    onSuccess: (r) => {
      setResult(r);
      setDialog(null);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Licences"
        description="Verify or reject the professional licence of a psychologist before they are allowed to take clinical coverage. Every decision is written to the audit log."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="space-y-4 p-5 lg:col-span-2">
          <SectionHeader title="Clinician lookup" description="Licences are verified per clinician." />
          <Field
            label="Psychologist identifier"
            htmlFor="license-psychologist"
            error={idError}
            hint="The clinician UUID, as recorded in the clinical roster."
          >
            <Input
              id="license-psychologist"
              value={psychologistId}
              onChange={(e) => setPsychologistId(e.target.value)}
              placeholder="3f1c9a6e-0d2b-4a71-9c1e-5b7d8f2a4c11"
              className="font-mono text-xs"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setDialog("verify")} disabled={trimmedId.length === 0}>
              <BadgeCheck /> Verify licence
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDialog("reject")} disabled={trimmedId.length === 0}>
              <CircleSlash /> Reject
            </Button>
          </div>
          <p className="flex items-start gap-2 rounded-lg border border-info-border bg-info-soft px-3 py-2.5 text-xs text-info">
            <ShieldQuestion className="mt-px size-3.5 shrink-0" aria-hidden />
            <span>
              There is no licence roster endpoint in the admin API, so a decision must be submitted against a known clinician
              identifier.
            </span>
          </p>
        </Card>

        <Card className="p-5 lg:col-span-3">
          <SectionHeader title="Latest decision" description="The verification returned by the backend for this session." />
          {result ? (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={result.status} meta={LICENSE_STATUS_META} />
                <Badge tone="outline">{LICENSE_AUTHORITY_LABELS[result.authority]}</Badge>
                <span className="text-xs text-subtle-foreground">Record {result.id.slice(0, 8)}</span>
              </div>
              <DetailSection title="Decision">
                <DetailRow label="Licence number">
                  <CopyableId value={result.licenseNumber} />
                </DetailRow>
                <DetailRow label="Authority">{LICENSE_AUTHORITY_LABELS[result.authority]}</DetailRow>
                <DetailRow label="Clinician">
                  <CopyableId value={result.psychologistId} display={result.psychologistId.slice(0, 13)} />
                </DetailRow>
                <DetailRow label="Verified at">{result.verifiedAt ? formatDate(result.verifiedAt) : "Not verified"}</DetailRow>
                <DetailRow label="Expires">{result.expiresAt ? formatDate(result.expiresAt) : "Unknown"}</DetailRow>
              </DetailSection>
            </div>
          ) : (
            <div className="mt-2">
              <EmptyState
                icon={Search}
                compact
                title="No decision yet"
                description="Enter a clinician identifier, then record a verification or a rejection to see the outcome here."
              />
            </div>
          )}
        </Card>
      </div>

      <Card className="flex items-start gap-3 p-5">
        <FileBadge className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold tracking-tight">How verification works</h2>
          <ul className="space-y-1 text-[13px] text-muted-foreground">
            <li>· Check the licence number against the issuing authority's public register before recording a decision.</li>
            <li>· A verified licence lets the clinician receive routed clinical alerts and take crisis coverage.</li>
            <li>· A rejection is final for that submission — submit a new verification once new evidence is available.</li>
          </ul>
          <PrivacyNote>Clinician identity documents and register screenshots are not stored in VitaMind and cannot be attached here.</PrivacyNote>
        </div>
      </Card>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-px size-3.5 shrink-0" aria-hidden />
        <span>Rejections and verifications are attributable to your admin account and cannot be edited afterwards.</span>
      </p>

      {dialog === "verify" && (
        <VerifyDialog
          key={trimmedId}
          psychologistId={trimmedId}
          open
          onOpenChange={(o) => !o && setDialog(null)}
          onVerified={setResult}
        />
      )}
      <ConfirmDialog
        open={dialog === "reject"}
        onOpenChange={(o) => !o && setDialog(null)}
        title="Reject this licence?"
        description="The clinician is not authorised to take clinical coverage. Record the reason exactly as stated by the authority."
        confirmLabel="Reject licence"
        destructive
        reason={{ label: "Rejection reason", placeholder: "e.g. Licence not found in the DHA register", maxLength: 300 }}
        isPending={reject.isPending}
        onConfirm={async (reason) => !!(await reject.mutate(reason))}
      />
    </div>
  );
}
