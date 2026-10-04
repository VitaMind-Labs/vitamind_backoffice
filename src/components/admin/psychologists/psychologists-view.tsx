"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertTriangle, CalendarClock, Clock, Pencil, ShieldAlert, ShieldCheck, UserCog, UserRoundCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/admin/shared/data-table";
import { DetailDrawer, DetailRow, DetailSection } from "@/components/admin/shared/detail";
import { FilterBar, SearchInput, SelectFilter, optionsFrom } from "@/components/admin/shared/filters";
import { Field, FormDialog } from "@/components/admin/shared/form-dialog";
import { PageHeader } from "@/components/admin/shared/page-header";
import { Can } from "@/components/admin/shared/permission";
import { ErrorState } from "@/components/admin/shared/states";
import { StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { useListState } from "@/hooks/admin/use-list-state";
import { psychologistsApi, type DirectoryFilters } from "@/lib/api/assignments";
import { clinicsApi } from "@/lib/api/operations";
import { CLINICIAN_ROLE_LABELS, LICENSE_STATUS_META, PSYCHOLOGIST_STATUS_META } from "@/lib/constants/status";
import { formatDate, formatDateTime, formatNumber, formatRelative, humanize } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { PSYCHOLOGIST_STATUSES, type ClinicianRole, type PsychologistDetail, type PsychologistDirectoryEntry, type PsychologistStatus } from "@/types/admin";

const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim() || "Unnamed clinician";
const ROLES = Object.keys(CLINICIAN_ROLE_LABELS) as ClinicianRole[];
const hoursSince = (iso: string | null) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000) : 0);

function Tile({ label, value, hint, tone }: { label: string; value: string | number; hint?: string; tone?: "warning" | "danger" }) {
  return (
    <div className={cn("rounded-lg border px-3 py-2.5", tone === "danger" && "border-destructive-border bg-destructive-soft", tone === "warning" && "border-warning-border bg-warning-soft")}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function EditDialog({ p, onClose }: { p: PsychologistDetail; onClose: () => void }) {
  const clinics = useApiQuery(["clinics", "list"], () => clinicsApi.list());
  const [clinicId, setClinicId] = useState<string>(p.clinic?.id ?? "none");
  const [role, setRole] = useState<ClinicianRole>(p.clinicalRole);
  const [isClinicAdmin, setClinicAdmin] = useState(p.isClinicAdmin);
  const m = useApiMutation(
    () =>
      psychologistsApi.update(p.id, {
        clinicId: clinicId === "none" ? null : clinicId,
        clinicalRole: role,
        isClinicAdmin: clinicId === "none" ? false : isClinicAdmin,
      }),
    { invalidate: ["psychologists", "assignments", "coverage"], successMessage: "Clinician updated", onSuccess: onClose },
  );
  return (
    <FormDialog open onOpenChange={(o) => !o && onClose()} title={`Edit ${fullName(p)}`} description="Clinic and role decide who sees whose on-call rota and which clinical actions are allowed." isPending={m.isPending} onSubmit={() => void m.mutate(undefined)}>
      <Field label="Clinic" htmlFor="ps-clinic" hint="Cover and on-call rotas are shared inside a clinic.">
        <Select value={clinicId} onValueChange={setClinicId}>
          <SelectTrigger id="ps-clinic"><SelectValue placeholder="No clinic" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No clinic</SelectItem>
            {clinics.data?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Clinical role" htmlFor="ps-role">
        <Select value={role} onValueChange={(v) => setRole(v as ClinicianRole)}>
          <SelectTrigger id="ps-role"><SelectValue /></SelectTrigger>
          <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{CLINICIAN_ROLE_LABELS[r]}</SelectItem>)}</SelectContent>
        </Select>
      </Field>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" className="size-4 accent-primary" checked={clinicId !== "none" && isClinicAdmin} disabled={clinicId === "none"} onChange={(e) => setClinicAdmin(e.target.checked)} />
        Clinic lead (can book cover for colleagues in the clinic)
      </label>
    </FormDialog>
  );
}

function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useApiQuery(["psychologists", "detail", id], () => psychologistsApi.get(id));
  const [editing, setEditing] = useState(false);
  const [action, setAction] = useState<PsychologistStatus | null>(null);
  const p = q.data;

  const setStatus = useApiMutation((v: { status: PsychologistStatus; reason: string }) => psychologistsApi.setStatus(id, v.status, v.reason), {
    invalidate: ["psychologists", "assignments", "coverage", "system"],
    successMessage: (r) =>
      r.status === "ACTIVE"
        ? "Clinician reactivated"
        : `Clinician ${r.status.toLowerCase()} · ${r.affectedPatients} active patient${r.affectedPatients === 1 ? "" : "s"}${r.closedRequests ? `, ${r.closedRequests} open request${r.closedRequests === 1 ? "" : "s"} closed` : ""}${r.uncovered ? " · NO COVER" : ""}`,
  });

  const wait = p?.caseload.oldestRequestWaitingHours ?? null;

  return (
    <>
      <DetailDrawer
        open
        onOpenChange={(o) => !o && onClose()}
        title={p ? fullName(p) : "Clinician"}
        description={p ? `${CLINICIAN_ROLE_LABELS[p.clinicalRole]}${p.clinic ? ` · ${p.clinic.name}` : " · no clinic"}` : undefined}
        badges={p && <><StatusBadge value={p.status} meta={PSYCHOLOGIST_STATUS_META} />{p.isClinicAdmin && <Badge tone="brand">Clinic lead</Badge>}{!p.is2FAEnabled && <Badge tone="warning">No 2FA</Badge>}</>}
        footer={
          p && (
            <Can permission="psychologists.manage">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil /> Edit</Button>
              {p.status === "ACTIVE" && <Button variant="outline" size="sm" onClick={() => setAction("SUSPENDED")}><ShieldAlert /> Suspend</Button>}
              {p.status === "ACTIVE" && <Button variant="destructive" size="sm" onClick={() => setAction("DEACTIVATED")}>Deactivate</Button>}
              {(p.status === "SUSPENDED" || p.status === "DEACTIVATED") && <Button size="sm" onClick={() => setAction("ACTIVE")}><ShieldCheck /> Reactivate</Button>}
              {p.status === "PENDING" && <Button size="sm" asChild><Link href={`/admin/licenses?focus=${p.id}`}><ShieldCheck /> Verify licence</Link></Button>}
            </Can>
          )
        }
      >
        {q.error ? (
          <ErrorState error={q.error} onRetry={q.refetch} compact />
        ) : !p ? (
          <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-40" /></div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="patients">Patients</TabsTrigger>
              <TabsTrigger value="cover">Cover</TabsTrigger>
              <TabsTrigger value="licence">Licence</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-5 pt-4">
              <div className="grid grid-cols-2 gap-2.5">
                <Tile label="Active patients" value={p.caseload.active} />
                <Tile label="Awaiting their answer" value={p.caseload.awaitingClinician} tone={p.caseload.awaitingClinician && (wait ?? 0) >= 48 ? "warning" : undefined} hint={wait !== null ? `oldest ${wait}h` : undefined} />
                <Tile label="Awaiting patient consent" value={p.caseload.awaitingPatient} />
                <Tile label="Declined (30d)" value={p.caseload.declinedLast30d} />
                <Tile label="Open alerts" value={p.alerts.open} />
                <Tile label="Alerts past SLA" value={p.alerts.overdue} tone={p.alerts.overdue ? "danger" : undefined} />
              </div>
              <DetailSection title="Activity · last 30 days">
                <DetailRow label="Sign-ins">{p.activityLast30d.logins}</DetailRow>
                <DetailRow label="Patient records opened">{p.activityLast30d.patientViews}</DetailRow>
                <DetailRow label="Notes written">{p.activityLast30d.notes}</DetailRow>
                <DetailRow label="Sessions scheduled / completed">{p.activityLast30d.sessions}</DetailRow>
                <DetailRow label="Alerts handled">{p.activityLast30d.alertsHandled}</DetailRow>
                <DetailRow label="Access denied">{p.activityLast30d.accessDenied ? <span className="text-warning">{p.activityLast30d.accessDenied}</span> : 0}</DetailRow>
              </DetailSection>
              <DetailSection title="Account">
                <DetailRow label="E-mail">{p.email}</DetailRow>
                <DetailRow label="Phone">{p.phoneNumber ?? "—"}</DetailRow>
                <DetailRow label="Specialties">{p.specialties.length ? p.specialties.join(", ") : "—"}</DetailRow>
                <DetailRow label="Last sign-in">{p.lastLoginAt ? `${formatDateTime(p.lastLoginAt)} (${formatRelative(p.lastLoginAt)})` : "Never"}</DetailRow>
                <DetailRow label="Two-factor">{p.is2FAEnabled ? "Enabled" : <span className="text-warning">Not enabled</span>}</DetailRow>
                <DetailRow label="Terms accepted">{p.termsAcceptedAt ? `${formatDate(p.termsAcceptedAt)} · v${p.termsVersion ?? "?"}` : "No"}</DetailRow>
                <DetailRow label="Member since">{formatDate(p.createdAt)}</DetailRow>
              </DetailSection>
              <p className="text-xs text-muted-foreground">Operational data only. Patient names, journals, notes and alert text stay with the clinician.</p>
            </TabsContent>

            <TabsContent value="patients" className="space-y-5 pt-4">
              <DetailSection title={`Waiting for their answer (${p.pendingRequests.length})`}>
                {p.pendingRequests.length === 0 && <DetailRow label="None">—</DetailRow>}
                {p.pendingRequests.map((r) => (
                  <DetailRow key={r.assignmentId} label={`${r.patientCode} · ${r.nickname}`}>
                    <span className={cn(hoursSince(r.requestedAt) >= 48 && "text-warning")}>asked {formatRelative(r.requestedAt)}</span>
                  </DetailRow>
                ))}
              </DetailSection>
              <DetailSection title={`Active patients (${p.caseload.active})`}>
                {p.patients.length === 0 && <DetailRow label="None">—</DetailRow>}
                {p.patients.map((a) => (
                  <DetailRow key={a.assignmentId} label={`${a.patientCode} · ${a.nickname}`}>
                    {a.isPrimary ? "Primary · " : ""}since {formatDate(a.assignedAt)}
                  </DetailRow>
                ))}
              </DetailSection>
              <Button variant="outline" size="sm" asChild><Link href={`/admin/assignments?psychologistId=${p.id}`}><UserRoundCheck /> Manage assignments</Link></Button>
            </TabsContent>

            <TabsContent value="cover" className="space-y-5 pt-4">
              <DetailSection title="Covered by (upcoming absences)">
                {p.absences.length === 0 && <DetailRow label="No absence booked">—</DetailRow>}
                {p.absences.map((a) => (
                  <DetailRow key={a.id} label={`${formatDate(a.startsAt)} → ${formatDate(a.endsAt)}`}>{fullName(a.covering)}</DetailRow>
                ))}
              </DetailSection>
              <DetailSection title="Covering for others">
                {p.coverageShifts.length === 0 && <DetailRow label="Nothing booked">—</DetailRow>}
                {p.coverageShifts.map((s) => (
                  <DetailRow key={s.id} label={`${formatDate(s.startsAt)} → ${formatDate(s.endsAt)}`}>{s.absent ? fullName(s.absent) : "Clinic on-call"}</DetailRow>
                ))}
              </DetailSection>
              <Button variant="outline" size="sm" asChild><Link href={`/admin/coverage`}><CalendarClock /> Open coverage planner</Link></Button>
            </TabsContent>

            <TabsContent value="licence" className="space-y-5 pt-4">
              <DetailSection title="Verification">
                <DetailRow label="Licence number">{p.licenseNumber ?? "—"}</DetailRow>
                <DetailRow label="Verified">{p.verifiedAt ? `${formatDate(p.verifiedAt)} by ${p.verifiedBy?.email ?? "—"}` : "Not verified"}</DetailRow>
              </DetailSection>
              <DetailSection title="History">
                {p.licenseVerifications.length === 0 && <DetailRow label="No record">—</DetailRow>}
                {p.licenseVerifications.map((v) => (
                  <DetailRow key={v.id} label={`${humanize(v.authority)} · ${formatDate(v.createdAt)}`}>
                    <StatusBadge value={v.status} meta={LICENSE_STATUS_META} />
                    {v.expiresAt && <span className="ml-2 text-xs text-muted-foreground">expires {formatDate(v.expiresAt)}</span>}
                    {v.rejectionReason && <span className="mt-1 block text-xs text-destructive">{v.rejectionReason}</span>}
                  </DetailRow>
                ))}
              </DetailSection>
            </TabsContent>
          </Tabs>
        )}
      </DetailDrawer>

      {editing && p && <EditDialog p={p} onClose={() => setEditing(false)} />}
      <ConfirmDialog
        open={!!action}
        onOpenChange={(o) => !o && setAction(null)}
        title={action === "ACTIVE" ? "Reactivate this clinician?" : action === "SUSPENDED" ? "Suspend this clinician?" : "Deactivate this clinician?"}
        description={
          action === "ACTIVE"
            ? "They can sign in again. Reactivation needs a verified, unexpired licence."
            : p
              ? `${fullName(p)} is signed out and can no longer open any patient. Their ${p.caseload.active} active patient${p.caseload.active === 1 ? "" : "s"} will have no clinician until you book cover or reassign. Requests still waiting for an answer are closed.`
              : undefined
        }
        confirmLabel={action === "ACTIVE" ? "Reactivate" : action === "SUSPENDED" ? "Suspend" : "Deactivate"}
        destructive={action !== "ACTIVE"}
        reason={{ label: "Reason", placeholder: "Why?", maxLength: 300 }}
        isPending={setStatus.isPending}
        onConfirm={async (reason) => !!action && !!(await setStatus.mutate({ status: action, reason }))}
      />
    </>
  );
}

export function PsychologistsView({ focus }: { focus?: string }) {
  const list = useListState<DirectoryFilters>({ status: undefined, search: "" }, 20, { id: "psychologists-page", urlKeys: ["status", "search"] });
  const [openId, setOpenId] = useState<string | null>(focus ?? null);
  const q = useApiQuery(["psychologists", "list", list.params], () => psychologistsApi.directory(list.params), { keepPrevious: true });
  const all = useApiQuery(["psychologists", "totals"], () => psychologistsApi.directory({ limit: 100 }));

  const rows = all.data?.data ?? [];
  const waiting = rows.reduce((s, r) => s + r.awaitingClinician, 0);
  const pending = rows.filter((r) => r.status === "PENDING").length;

  const columns: Column<PsychologistDirectoryEntry>[] = [
    {
      id: "name", header: "Clinician", hideable: false,
      cell: (p) => (
        <div>
          <p className="font-medium">{fullName(p)}</p>
          <p className="text-xs text-muted-foreground">{p.email}</p>
        </div>
      ),
    },
    { id: "role", header: "Role", hideBelow: "md", cell: (p) => CLINICIAN_ROLE_LABELS[p.clinicalRole] ?? p.clinicalRole },
    { id: "clinic", header: "Clinic", hideBelow: "lg", cell: (p) => p.clinic?.name ?? "—" },
    { id: "status", header: "Status", cell: (p) => <StatusBadge value={p.status} meta={PSYCHOLOGIST_STATUS_META} /> },
    { id: "caseload", header: "Active patients", align: "right", cell: (p) => formatNumber(p.activeCaseload) },
    {
      id: "awaiting", header: "Unanswered requests", align: "right",
      cell: (p) =>
        p.awaitingClinician ? (
          <span className={cn("tabular-nums", hoursSince(p.oldestRequestAt) >= 48 && "font-medium text-warning")} title={p.oldestRequestAt ? `Oldest asked ${formatRelative(p.oldestRequestAt)}` : undefined}>
            {p.awaitingClinician}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    { id: "login", header: "Last sign-in", hideBelow: "xl", cell: (p) => (p.lastLoginAt ? formatRelative(p.lastLoginAt) : <span className="text-muted-foreground">Never</span>) },
    { id: "2fa", header: "2FA", hideBelow: "xl", cell: (p) => (p.is2FAEnabled ? <ShieldCheck className="size-4 text-success" aria-label="Enabled" /> : <AlertTriangle className="size-4 text-warning" aria-label="Not enabled" />) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Psychologists" description="Every clinician on the platform: who they are, how loaded they are, whether they answer. Open one to manage status, clinic and role." />
      <StatGrid>
        <StatCard label="Clinicians" icon={UserCog} loading={all.isLoading} value={formatNumber(all.data?.total ?? 0)} hint="All accounts" />
        <StatCard label="Active" icon={Users} loading={all.isLoading} value={formatNumber(rows.filter((r) => r.status === "ACTIVE").length)} hint="Can receive patients" emphasis="success" />
        <StatCard label="Awaiting verification" icon={ShieldCheck} loading={all.isLoading} value={formatNumber(pending)} hint="Licence not yet verified" emphasis={pending ? "warning" : "default"} href="/admin/licenses" />
        <StatCard label="Requests unanswered" icon={Clock} loading={all.isLoading} value={formatNumber(waiting)} hint="Patients proposed, no reply yet" emphasis={waiting ? "warning" : "default"} />
      </StatGrid>
      <Card className="overflow-hidden">
        <FilterBar onReset={list.reset} canReset={list.isFiltered}>
          <SearchInput value={list.filters.search ?? ""} onChange={(search) => list.update({ search })} placeholder="Search name or e-mail…" />
          <SelectFilter label="Status" value={list.filters.status} options={optionsFrom(PSYCHOLOGIST_STATUSES, PSYCHOLOGIST_STATUS_META)} onChange={(v) => list.update({ status: v as DirectoryFilters["status"] })} />
        </FilterBar>
        <DataTable
          columns={columns}
          rows={q.data?.data}
          rowKey={(p) => p.id}
          onRowClick={(p) => setOpenId(p.id)}
          isLoading={q.isLoading}
          isFetching={q.isFetching}
          stale={q.isPlaceholder}
          error={q.error}
          onRetry={q.refetch}
          emptyTitle="No clinicians found"
        />
        {q.data && <Pagination page={q.data.page} totalPages={q.data.totalPages} total={q.data.total} limit={q.data.limit} onPageChange={list.setPage} isFetching={q.isFetching} />}
      </Card>
      {openId && <Detail id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
