"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CircleSlash, FileBadge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/admin/shared/data-table";
import { FilterBar, optionsFrom, SearchInput, SelectFilter } from "@/components/admin/shared/filters";
import { ListCard } from "@/components/admin/shared/list-card";
import { PrivacyNote } from "@/components/admin/shared/detail";
import { Field, FormDialog } from "@/components/admin/shared/form-dialog";
import { PageHeader } from "@/components/admin/shared/page-header";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { useListState } from "@/hooks/admin/use-list-state";
import { psychologistsApi, type DirectoryFilters } from "@/lib/api/assignments";
import { licensesApi } from "@/lib/api/operations";
import { CLINICIAN_ROLE_LABELS, LICENSE_AUTHORITY_LABELS, PSYCHOLOGIST_STATUS_META } from "@/lib/constants/status";
import { formatDate } from "@/lib/formatters";
import {
  LICENSE_AUTHORITIES,
  PSYCHOLOGIST_STATUSES,
  type LicenseAuthority,
  type LicenseVerifyInput,
  type PsychologistDirectoryEntry,
} from "@/types/admin";

const LICENSE_MAX = 64;
const AUTHORITY_NAME_MAX = 120;

type Target = Pick<PsychologistDirectoryEntry, "id" | "firstName" | "lastName" | "licenseNumber">;

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
  initialLicenseNumber,
  open,
  onOpenChange,
}: {
  psychologistId: string;
  /** What the clinician submitted — the admin checks it against the register rather than retyping it. */
  initialLicenseNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [draft, setDraft] = useState<VerifyDraft>({ ...EMPTY_VERIFY, licenseNumber: initialLicenseNumber });
  const mutation = useApiMutation((input: LicenseVerifyInput) => licensesApi.verify(psychologistId, input), {
    invalidate: ["psychologists", "clinics", "clinical-alerts"],
    successMessage: "License verification recorded",
    onSuccess: () => onOpenChange(false),
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

export function LicensesView({ focus }: { focus?: string }) {
  const list = useListState<DirectoryFilters>({ status: "PENDING", search: "" }, 20, { id: "licenses", urlKeys: ["status", "search"] });
  const [verifying, setVerifying] = useState<Target | null>(null);
  const [rejecting, setRejecting] = useState<Target | null>(null);

  const q = useApiQuery(["psychologists", "licenses", list.params], () => psychologistsApi.directory(list.params), { keepPrevious: true });
  // Deep link (e.g. from a notification or the clinician profile): open the verification for that clinician.
  const focused = useApiQuery(["psychologists", "licenses", "focus", focus], () => psychologistsApi.get(focus!), { enabled: !!focus });
  const focusedEntry = focused.data;
  useEffect(() => {
    if (focusedEntry) setVerifying(focusedEntry);
  }, [focusedEntry]);

  const reject = useApiMutation((reason: string) => licensesApi.reject(rejecting!.id, reason), {
    invalidate: ["psychologists", "clinics", "clinical-alerts"],
    successMessage: "Rejection recorded",
    onSuccess: () => setRejecting(null),
  });

  const columns: Column<PsychologistDirectoryEntry>[] = [
    {
      id: "name",
      header: "Clinician",
      hideable: false,
      cell: (p) => (
        <div>
          <p className="font-medium">{`${p.firstName} ${p.lastName}`.trim() || "Unnamed clinician"}</p>
          <p className="text-xs text-muted-foreground">{p.email}</p>
        </div>
      ),
    },
    { id: "role", header: "Role", hideBelow: "md", cell: (p) => CLINICIAN_ROLE_LABELS[p.clinicalRole] ?? p.clinicalRole },
    { id: "clinic", header: "Clinic", hideBelow: "lg", cell: (p) => p.clinic?.name ?? "—" },
    { id: "license", header: "Licence number", cell: (p) => (p.licenseNumber ? <span className="font-mono text-xs">{p.licenseNumber}</span> : <span className="text-muted-foreground">Not submitted</span>) },
    { id: "status", header: "Account", cell: (p) => <StatusBadge value={p.status} meta={PSYCHOLOGIST_STATUS_META} /> },
    { id: "verified", header: "Verified", hideBelow: "md", cell: (p) => (p.verifiedAt ? formatDate(p.verifiedAt) : "—") },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "right",
      className: "w-px whitespace-nowrap",
      cell: (p) => (
        <span className="flex justify-end gap-2">
          <Button size="sm" onClick={() => setVerifying(p)}>
            <BadgeCheck /> Verify
          </Button>
          <Button size="sm" variant="outline" onClick={() => setRejecting(p)}>
            <CircleSlash /> Reject
          </Button>
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Licences"
        description="Verify or reject a clinician's professional licence before they can take clinical coverage. Clinician accounts, caseload and status live on the Psychologists page. Every decision is written to the audit log."
      />

      <ListCard title="Verification queue" description="Clinicians waiting for a licence decision are listed first.">
        <FilterBar onReset={list.reset} canReset={list.isFiltered}>
          <SearchInput value={list.filters.search ?? ""} onChange={(search) => list.update({ search })} placeholder="Search name or email…" />
          <SelectFilter
            label="Account"
            allLabel="All clinicians"
            value={list.filters.status}
            options={optionsFrom(PSYCHOLOGIST_STATUSES, PSYCHOLOGIST_STATUS_META)}
            onChange={(v) => list.update({ status: v as DirectoryFilters["status"] })}
          />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={q.data?.data}
          rowKey={(p) => p.id}
          isLoading={q.isLoading}
          isFetching={q.isFetching}
          stale={q.isPlaceholder}
          error={q.error}
          onRetry={q.refetch}
          emptyTitle={list.isFiltered ? "No clinician matches these filters" : "No licence is waiting for a decision"}
        />
        {q.data && (
          <Pagination
            page={q.data.page}
            totalPages={q.data.totalPages}
            total={q.data.total}
            limit={q.data.limit}
            onPageChange={list.setPage}
            isFetching={q.isFetching}
          />
        )}
      </ListCard>

      <Card className="flex items-start gap-3 p-5">
        <FileBadge className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold tracking-tight">How verification works</h2>
          <ul className="space-y-1 text-[13px] text-muted-foreground">
            <li>· Check the licence number against the issuing authority&apos;s public register before recording a decision.</li>
            <li>· A verified licence lets the clinician receive routed clinical alerts and take crisis coverage.</li>
            <li>· A rejection is final for that submission — submit a new verification once new evidence is available.</li>
          </ul>
          <PrivacyNote>Clinician identity documents and register screenshots are not stored in SynQ and cannot be attached here.</PrivacyNote>
        </div>
      </Card>

      {verifying && (
        <VerifyDialog
          key={verifying.id}
          psychologistId={verifying.id}
          initialLicenseNumber={verifying.licenseNumber ?? ""}
          open
          onOpenChange={(o) => !o && setVerifying(null)}
        />
      )}
      <ConfirmDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title="Reject this licence?"
        description={rejecting ? `${rejecting.firstName} ${rejecting.lastName} is not authorised to take clinical coverage. Record the reason exactly as stated by the authority.` : undefined}
        confirmLabel="Reject licence"
        destructive
        reason={{ label: "Rejection reason", placeholder: "e.g. Licence not found in the DHA register", maxLength: 300 }}
        isPending={reject.isPending}
        onConfirm={async (reason) => !!(await reject.mutate(reason))}
      />
    </div>
  );
}
