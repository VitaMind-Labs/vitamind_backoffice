"use client";

import { useState } from "react";
import { Building2, Clock, Globe2, PencilLine, Phone, Plus, Stethoscope, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { CopyableId } from "@/components/admin/shared/detail";
import { Field, FormDialog } from "@/components/admin/shared/form-dialog";
import { PageHeader } from "@/components/admin/shared/page-header";
import { Can } from "@/components/admin/shared/permission";
import { EmptyState, ErrorState, PageSkeleton } from "@/components/admin/shared/states";
import { BooleanBadge, StatusBadge } from "@/components/admin/shared/status-badge";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { clinicsApi } from "@/lib/api/operations";
import { CLINICIAN_ROLE_LABELS, PSYCHOLOGIST_STATUS_META } from "@/lib/constants/status";
import { formatDate, formatNumber } from "@/lib/formatters";
import type { Clinic, ClinicInput, ClinicianRole } from "@/types/admin";

const NAME_MAX = 80;
const COUNTRY_MAX = 56;
const TIMEZONE_MAX = 64;
const PHONE_MAX = 24;

interface Draft {
  name: string;
  country: string;
  timezone: string;
  emergencyNumber: string;
}

const EMPTY: Draft = { name: "", country: "", timezone: "Europe/Paris", emergencyNumber: "" };

function ClinicFormDialog({
  clinic,
  open,
  onOpenChange,
}: {
  clinic?: Clinic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const editing = !!clinic;
  // Mounted with a key per clinic so the draft always starts from the right record.
  const [draft, setDraft] = useState<Draft>(() =>
    clinic
      ? { name: clinic.name, country: clinic.country, timezone: clinic.timezone, emergencyNumber: clinic.emergencyNumber ?? "" }
      : EMPTY,
  );
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const mutation = useApiMutation(
    (input: ClinicInput) => (clinic ? clinicsApi.update(clinic.id, input) : clinicsApi.create(input)),
    {
      invalidate: ["clinics", "clinical-alerts"],
      successMessage: editing ? "Clinic updated" : "Clinic created",
      onSuccess: () => onOpenChange(false),
    },
  );

  const nameError =
    draft.name.trim().length === 0 ? "Name is required." : draft.name.trim().length > NAME_MAX ? `Maximum ${NAME_MAX} characters.` : null;
  const countryError =
    draft.country.trim().length === 0 ? "Country is required." : draft.country.trim().length > COUNTRY_MAX ? `Maximum ${COUNTRY_MAX} characters.` : null;
  const timezoneError = draft.timezone.trim().length > TIMEZONE_MAX ? `Maximum ${TIMEZONE_MAX} characters.` : null;
  const phoneError = draft.emergencyNumber.length > PHONE_MAX ? `Maximum ${PHONE_MAX} characters.` : null;
  const valid = !nameError && !countryError && !timezoneError && !phoneError;

  const submit = () => {
    if (!valid) return;
    const input: ClinicInput = {
      name: draft.name.trim(),
      country: draft.country.trim(),
      timezone: draft.timezone.trim() || undefined,
      emergencyNumber: draft.emergencyNumber.trim() || undefined,
    };
    void mutation.mutate(input);
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? `Edit ${clinic.name}` : "New clinic"}
      description="The emergency number is surfaced to clinicians handling a crisis routed to this clinic."
      submitLabel={editing ? "Save changes" : "Create clinic"}
      isPending={mutation.isPending}
      canSubmit={valid}
      onSubmit={submit}
    >
      <Field label="Name" htmlFor="clinic-name" error={nameError}>
        <Input id="clinic-name" value={draft.name} maxLength={NAME_MAX} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Abu Dhabi Central Clinic" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Country" htmlFor="clinic-country" error={countryError}>
          <Input id="clinic-country" value={draft.country} maxLength={COUNTRY_MAX} onChange={(e) => set("country", e.target.value)} placeholder="e.g. United Arab Emirates" />
        </Field>
        <Field label="Timezone" htmlFor="clinic-timezone" error={timezoneError} hint="IANA name, e.g. Asia/Dubai">
          <Input id="clinic-timezone" value={draft.timezone} maxLength={TIMEZONE_MAX} onChange={(e) => set("timezone", e.target.value)} />
        </Field>
      </div>
      <Field label="Emergency number" htmlFor="clinic-emergency" error={phoneError} hint="Optional. Shown to clinicians during a crisis.">
        <Input id="clinic-emergency" value={draft.emergencyNumber} maxLength={PHONE_MAX} onChange={(e) => set("emergencyNumber", e.target.value)} placeholder="e.g. 800 423" />
      </Field>
    </FormDialog>
  );
}

function MemberRow({ member }: { member: Clinic["members"][number] }) {
  return (
    <li className="flex items-center justify-between gap-3 px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium">
          {[member.firstName, member.lastName].filter(Boolean).join(" ") || "Unnamed clinician"}
        </p>
        <p className="truncate text-xs text-muted-foreground">{CLINICIAN_ROLE_LABELS[member.clinicalRole as ClinicianRole] ?? member.clinicalRole}</p>
      </div>
      <StatusBadge value={member.status} meta={PSYCHOLOGIST_STATUS_META} />
    </li>
  );
}

export function ClinicsView() {
  const [editing, setEditing] = useState<Clinic | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Clinic | null>(null);
  const q = useApiQuery(["clinics", "list"], clinicsApi.list);
  const remove = useApiMutation((id: string) => clinicsApi.remove(id), {
    invalidate: ["clinics", "clinical-alerts"],
    successMessage: "Clinic removed",
  });

  const clinics = q.data;
  const totalMembers = clinics?.reduce((sum, c) => sum + c.members.length, 0) ?? 0;
  const activeClinics = clinics?.filter((c) => c.isActive).length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinics"
        description="Clinical sites and the clinicians attached to them. Crisis and alert routing is scoped to these clinics."
        actions={
          <Can permission="clinics.manage">
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus /> New clinic
            </Button>
          </Can>
        }
      />

      {q.error ? (
        <Card>
          <ErrorState error={q.error} onRetry={q.refetch} />
        </Card>
      ) : !clinics ? (
        <PageSkeleton />
      ) : clinics.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No clinics registered"
            description="Create the first clinic so crisis events and clinical alerts can be routed to a care team."
            action={
              <Can permission="clinics.manage">
                <Button size="sm" onClick={() => setCreating(true)}>
                  <Plus /> New clinic
                </Button>
              </Can>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary">
                <Building2 className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[13px] text-muted-foreground">Clinics</p>
                <p className="text-xl font-semibold tabular-nums">{formatNumber(clinics.length)}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-success-soft text-success">
                <Stethoscope className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[13px] text-muted-foreground">Active clinics</p>
                <p className="text-xl font-semibold tabular-nums">{formatNumber(activeClinics)}</p>
              </div>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-info-soft text-info">
                <Users className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-[13px] text-muted-foreground">Clinicians</p>
                <p className="text-xl font-semibold tabular-nums">{formatNumber(totalMembers)}</p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {clinics.map((clinic) => (
              <Card key={clinic.id} className={`flex flex-col gap-4 p-5 ${clinic.isActive ? "" : "opacity-70"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-[15px] font-semibold tracking-tight">{clinic.name}</h3>
                      <BooleanBadge value={clinic.isActive} trueLabel="Active" falseLabel="Inactive" />
                    </div>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Globe2 className="size-3" aria-hidden />
                        {clinic.country}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" aria-hidden />
                        {clinic.timezone}
                      </span>
                      {clinic.emergencyNumber && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" aria-hidden />
                          {clinic.emergencyNumber}
                        </span>
                      )}
                    </p>
                  </div>
                  <Can permission="clinics.manage">
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button variant="outline" size="icon-sm" aria-label={`Edit ${clinic.name}`} onClick={() => setEditing(clinic)}>
                        <PencilLine />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label={`Remove ${clinic.name}`}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleting(clinic)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </Can>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-subtle-foreground">
                      Care team · {clinic.members.length}
                    </p>
                    <CopyableId value={clinic.id} display={clinic.id.slice(0, 8)} />
                  </div>
                  {clinic.members.length === 0 ? (
                    <p className="rounded-lg border px-3.5 py-3 text-[13px] text-muted-foreground">
                      No clinician attached to this clinic yet.
                    </p>
                  ) : (
                    <ul className="divide-y rounded-lg border">
                      {clinic.members.map((member) => (
                        <MemberRow key={member.id} member={member} />
                      ))}
                    </ul>
                  )}
                </div>

                <p className="mt-auto text-xs text-subtle-foreground">Created {formatDate(clinic.createdAt)}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      {creating && <ClinicFormDialog key="new" open onOpenChange={(o) => !o && setCreating(false)} />}
      {editing && <ClinicFormDialog key={editing.id} clinic={editing} open onOpenChange={(o) => !o && setEditing(null)} />}
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Remove ${deleting?.name ?? "this clinic"}?`}
        description="The clinic is removed from the admin console. Its clinicians and existing alert history are not modified. Alerts already routed there stay routed."
        confirmLabel="Remove clinic"
        destructive
        reason={{ label: "Reason", placeholder: "Why is this clinic being removed?", maxLength: 300, required: false }}
        isPending={remove.isPending}
        onConfirm={async () => {
          if (!deleting) return false;
          return !!(await remove.mutate(deleting.id));
        }}
      />
    </div>
  );
}
