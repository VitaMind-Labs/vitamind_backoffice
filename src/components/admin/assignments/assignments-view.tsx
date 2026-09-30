"use client";

import { useState } from "react";
import { Crown, MoreHorizontal, Plus, Search, UserRoundX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/admin/shared/data-table";
import { FilterBar, SearchInput, SelectFilter, optionsFrom } from "@/components/admin/shared/filters";
import { Field, FormDialog } from "@/components/admin/shared/form-dialog";
import { PageHeader } from "@/components/admin/shared/page-header";
import { Can } from "@/components/admin/shared/permission";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { useListState } from "@/hooks/admin/use-list-state";
import { assignmentsApi, type AssignmentFilters, type DirectoryFilters } from "@/lib/api/assignments";
import { usersApi } from "@/lib/api/users";
import { ASSIGNMENT_STATUS_META, CLINICIAN_ROLE_LABELS, PSYCHOLOGIST_STATUS_META } from "@/lib/constants/status";
import { formatDate, formatNumber, patientRef } from "@/lib/formatters";
import { ASSIGNMENT_STATUSES, PSYCHOLOGIST_STATUSES, type PatientAssignment, type PsychologistDirectoryEntry } from "@/types/admin";

const REASON_MAX = 300;
const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim() || "Unnamed clinician";

function AssignDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [term, setTerm] = useState("");
  const [patient, setPatient] = useState<{ id: string; label: string } | null>(null);
  const [psychologistId, setPsychologistId] = useState("");
  const [isPrimary, setPrimary] = useState(false);

  const search = term.trim();
  const patients = useApiQuery(search.length >= 2 && !patient ? ["users", "assign-picker", search] : null, () =>
    usersApi.list({ search, status: "ACTIVE", limit: 6 }),
  );
  const clinicians = useApiQuery(open ? ["assignments", "directory", "active-picker"] : null, () =>
    assignmentsApi.directory({ status: "ACTIVE", limit: 100 }),
  );

  const mutation = useApiMutation(
    () => assignmentsApi.create({ userId: patient!.id, psychologistId, isPrimary: isPrimary || undefined }),
    {
      invalidate: ["assignments"],
      successMessage: "Assignment created — awaiting the patient's consent",
      onSuccess: () => onOpenChange(false),
    },
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Assign a patient"
      description="The assignment stays pending until the patient accepts it. The action is recorded in the audit log."
      submitLabel="Create assignment"
      isPending={mutation.isPending}
      canSubmit={!!patient && !!psychologistId}
      onSubmit={() => void mutation.mutate(undefined)}
    >
      <Field label="Patient" htmlFor="assign-patient" hint="Search by nickname or email (active patients only).">
        {patient ? (
          <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
            <span>{patient.label}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => setPatient(null)}>
              Change
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
              <Input id="assign-patient" className="pl-8" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search patients…" />
            </div>
            {patients.data && (
              <ul className="divide-y overflow-hidden rounded-md border">
                {patients.data.data.length === 0 && <li className="px-3 py-2 text-[13px] text-muted-foreground">No matching active patient.</li>}
                {patients.data.data.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] hover:bg-accent"
                      onClick={() => setPatient({ id: u.id, label: `${patientRef(u.patientNumber)} · ${u.nickname}` })}
                    >
                      <span>{u.nickname}</span>
                      <span className="text-xs text-muted-foreground">{patientRef(u.patientNumber)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Field>
      <Field label="Clinician" htmlFor="assign-clinician" hint="Only active clinicians can receive patients.">
        <Select value={psychologistId} onValueChange={setPsychologistId}>
          <SelectTrigger id="assign-clinician">
            <SelectValue placeholder={clinicians.isLoading ? "Loading…" : "Select a clinician"} />
          </SelectTrigger>
          <SelectContent>
            {clinicians.data?.data.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {fullName(c)} · {CLINICIAN_ROLE_LABELS[c.clinicalRole]} · {c.activeCaseload} active
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={isPrimary} onChange={(e) => setPrimary(e.target.checked)} className="size-4 accent-primary" />
        Make this clinician the patient&apos;s primary referent
      </label>
    </FormDialog>
  );
}

function AssignmentsTab() {
  const list = useListState<AssignmentFilters>({ status: undefined }, 20, { id: "assignments", urlKeys: ["status"] });
  const [ending, setEnding] = useState<PatientAssignment | null>(null);
  const q = useApiQuery(["assignments", "list", list.params], () => assignmentsApi.list(list.params), { keepPrevious: true });

  const end = useApiMutation((v: { id: string; reason: string }) => assignmentsApi.end(v.id, v.reason), {
    invalidate: ["assignments"],
    successMessage: "Assignment ended",
  });
  const primary = useApiMutation((id: string) => assignmentsApi.makePrimary(id), {
    invalidate: ["assignments"],
    successMessage: "Primary clinician updated",
  });

  const columns: Column<PatientAssignment>[] = [
    {
      id: "patient",
      header: "Patient",
      hideable: false,
      cell: (a) => (
        <div>
          <p className="font-medium">{a.user.nickname}</p>
          <p className="text-xs text-muted-foreground">{patientRef(a.user.patientNumber)}</p>
        </div>
      ),
    },
    {
      id: "clinician",
      header: "Clinician",
      cell: (a) => (
        <div>
          <p className="flex items-center gap-1.5">
            {fullName(a.psychologist)}
            {a.isPrimary && <Crown className="size-3.5 text-brand-gold" aria-label="Primary clinician" />}
          </p>
          <p className="text-xs text-muted-foreground">{CLINICIAN_ROLE_LABELS[a.psychologist.clinicalRole]}</p>
        </div>
      ),
    },
    { id: "status", header: "Status", cell: (a) => <StatusBadge value={a.status} meta={ASSIGNMENT_STATUS_META} /> },
    { id: "assigned", header: "Assigned", hideBelow: "md", cell: (a) => formatDate(a.assignedAt) },
    { id: "consent", header: "Consent", hideBelow: "lg", cell: (a) => formatDate(a.consentedAt) },
    { id: "by", header: "Assigned by", hideBelow: "xl", cell: (a) => a.assignedBy?.email ?? "—" },
    {
      id: "actions",
      header: "",
      hideable: false,
      align: "right",
      cell: (a) =>
        a.status === "ENDED" ? (
          <span className="text-xs text-muted-foreground" title={a.endReason ?? undefined}>
            Ended {formatDate(a.endedAt)}
          </span>
        ) : (
          <Can permission="assignments.manage">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Assignment actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!a.isPrimary && (
                  <DropdownMenuItem onSelect={() => void primary.mutate(a.id)}>
                    <Crown /> Make primary
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="text-destructive" onSelect={() => setEnding(a)}>
                  <UserRoundX /> End assignment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Can>
        ),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <FilterBar onReset={list.reset} canReset={list.isFiltered}>
        <SelectFilter
          label="Status"
          value={list.filters.status}
          options={optionsFrom(ASSIGNMENT_STATUSES, ASSIGNMENT_STATUS_META)}
          onChange={(v) => list.update({ status: v as AssignmentFilters["status"] })}
        />
      </FilterBar>
      <DataTable
        columns={columns}
        rows={q.data?.data}
        rowKey={(a) => a.id}
        isLoading={q.isLoading}
        isFetching={q.isFetching}
        stale={q.isPlaceholder}
        error={q.error}
        onRetry={q.refetch}
        emptyTitle="No assignments"
        emptyDescription="Assign a patient to an active clinician to start a care relationship."
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
      <ConfirmDialog
        open={!!ending}
        onOpenChange={(o) => !o && setEnding(null)}
        title="End this assignment?"
        description={ending ? `${ending.user.nickname} will no longer be followed by ${fullName(ending.psychologist)}.` : undefined}
        confirmLabel="End assignment"
        destructive
        reason={{ label: "Reason", placeholder: "Why is this assignment ending?", maxLength: REASON_MAX }}
        isPending={end.isPending}
        onConfirm={async (reason) => {
          if (!ending) return false;
          const result = await end.mutate({ id: ending.id, reason });
          return result !== undefined;
        }}
      />
    </Card>
  );
}

function DirectoryTab() {
  const list = useListState<DirectoryFilters>({ status: undefined, search: "" }, 20, { id: "psychologists", urlKeys: ["status", "search"] });
  const q = useApiQuery(["assignments", "directory", list.params], () => assignmentsApi.directory(list.params), { keepPrevious: true });

  const columns: Column<PsychologistDirectoryEntry>[] = [
    {
      id: "name",
      header: "Clinician",
      hideable: false,
      cell: (p) => (
        <div>
          <p className="font-medium">{fullName(p)}</p>
          <p className="text-xs text-muted-foreground">{p.email}</p>
        </div>
      ),
    },
    { id: "role", header: "Role", hideBelow: "md", cell: (p) => CLINICIAN_ROLE_LABELS[p.clinicalRole] ?? p.clinicalRole },
    { id: "clinic", header: "Clinic", hideBelow: "lg", cell: (p) => p.clinic?.name ?? "—" },
    {
      id: "specialties",
      header: "Specialties",
      hideBelow: "xl",
      cell: (p) =>
        p.specialties.length ? (
          <span className="flex flex-wrap gap-1">
            {p.specialties.slice(0, 3).map((s) => (
              <Badge key={s} tone="neutral">
                {s}
              </Badge>
            ))}
          </span>
        ) : (
          "—"
        ),
    },
    { id: "status", header: "Status", cell: (p) => <StatusBadge value={p.status} meta={PSYCHOLOGIST_STATUS_META} /> },
    { id: "caseload", header: "Active caseload", align: "right", cell: (p) => formatNumber(p.activeCaseload) },
  ];

  return (
    <Card className="overflow-hidden">
      <FilterBar onReset={list.reset} canReset={list.isFiltered}>
        <SearchInput value={list.filters.search ?? ""} onChange={(search) => list.update({ search })} placeholder="Search name or email…" />
        <SelectFilter
          label="Status"
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
        emptyTitle="No clinicians found"
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
    </Card>
  );
}

export function AssignmentsView() {
  const [assigning, setAssigning] = useState(false);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Care assignments"
        description="Who follows which patient. Metadata only — clinical content stays with clinicians."
        actions={
          <Can permission="assignments.manage">
            <Button size="sm" onClick={() => setAssigning(true)}>
              <Plus /> Assign patient
            </Button>
          </Can>
        }
      />
      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="directory">Clinician directory</TabsTrigger>
        </TabsList>
        <TabsContent value="assignments">
          <AssignmentsTab />
        </TabsContent>
        <TabsContent value="directory">
          <DirectoryTab />
        </TabsContent>
      </Tabs>
      {assigning && <AssignDialog open onOpenChange={setAssigning} />}
    </div>
  );
}
