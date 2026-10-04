"use client";

import { useState } from "react";
import { CalendarClock, CalendarPlus, ShieldAlert, ShieldCheck, Trash2, UserRoundX, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { DataTable, Pagination, type Column } from "@/components/admin/shared/data-table";
import { FilterBar, SelectFilter } from "@/components/admin/shared/filters";
import { Field, FormDialog } from "@/components/admin/shared/form-dialog";
import { PageHeader } from "@/components/admin/shared/page-header";
import { Can } from "@/components/admin/shared/permission";
import { StatCard, StatGrid } from "@/components/admin/shared/stat-card";
import { StatusBadge } from "@/components/admin/shared/status-badge";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { useListState } from "@/hooks/admin/use-list-state";
import { coverageApi, type CoverageFilters } from "@/lib/api/coverage";
import { psychologistsApi } from "@/lib/api/assignments";
import { CLINICIAN_ROLE_LABELS, PSYCHOLOGIST_STATUS_META } from "@/lib/constants/status";
import { formatDate, formatDateTime, formatNumber } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { CoverageOverviewRow, CoverageShift, CoverageType, CoverageWindow } from "@/types/admin";

const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`.trim();
const TYPE_LABEL: Record<CoverageType, string> = { LEAVE_COVER: "Absence cover", ON_CALL: "Clinic on-call" };
const WINDOWS: Array<{ value: CoverageWindow; label: string }> = [
  { value: "CURRENT", label: "In effect now" },
  { value: "UPCOMING", label: "Upcoming" },
  { value: "PAST", label: "Past" },
  { value: "ALL", label: "All" },
];

/** `datetime-local` value (no zone) → ISO in the admin's local zone. */
const toIso = (local: string) => (local ? new Date(local).toISOString() : "");
const localNow = (offsetHours = 0) => {
  const d = new Date(Date.now() + offsetHours * 3_600_000);
  d.setMinutes(0, 0, 0);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

function BookDialog({ absentId, onClose }: { absentId?: string; onClose: () => void }) {
  const clinicians = useApiQuery(["psychologists", "picker"], () => psychologistsApi.directory({ limit: 100 }));
  const [kind, setKind] = useState<CoverageType>(absentId ? "LEAVE_COVER" : "LEAVE_COVER");
  const [absent, setAbsent] = useState(absentId ?? "");
  const [covering, setCovering] = useState("");
  const [from, setFrom] = useState(localNow(1));
  const [to, setTo] = useState(localNow(24 * 7));

  const m = useApiMutation(
    () => coverageApi.create({ coveringId: covering, absentId: kind === "LEAVE_COVER" ? absent : undefined, type: kind, startsAt: toIso(from), endsAt: toIso(to) }),
    { invalidate: ["coverage", "psychologists", "system"], successMessage: "Cover booked", onSuccess: onClose },
  );

  const list = clinicians.data?.data ?? [];
  const valid = !!covering && (kind === "ON_CALL" || (!!absent && absent !== covering)) && !!from && !!to && new Date(to) > new Date(from);

  return (
    <FormDialog open onOpenChange={(o) => !o && onClose()} title="Book cover" description="Alerts for the covered clinician's patients are routed to the covering clinician during the shift, and they can open those patients (consent still applies)." submitLabel="Book" isPending={m.isPending} canSubmit={valid} onSubmit={() => void m.mutate(undefined)}>
      <Field label="Type" htmlFor="cv-type">
        <Select value={kind} onValueChange={(v) => setKind(v as CoverageType)}>
          <SelectTrigger id="cv-type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="LEAVE_COVER">Absence cover: replaces one clinician</SelectItem>
            <SelectItem value="ON_CALL">Clinic on-call: answers for the whole clinic</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {kind === "LEAVE_COVER" && (
        <Field label="Clinician who is away" htmlFor="cv-absent">
          <Select value={absent} onValueChange={setAbsent}>
            <SelectTrigger id="cv-absent"><SelectValue placeholder="Select a clinician" /></SelectTrigger>
            <SelectContent>{list.map((c) => <SelectItem key={c.id} value={c.id}>{fullName(c)} · {c.activeCaseload} active</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      )}
      <Field label="Covering clinician" htmlFor="cv-covering" hint="Only active clinicians can cover.">
        <Select value={covering} onValueChange={setCovering}>
          <SelectTrigger id="cv-covering"><SelectValue placeholder="Select a clinician" /></SelectTrigger>
          <SelectContent>
            {list.filter((c) => c.status === "ACTIVE" && c.id !== absent).map((c) => (
              <SelectItem key={c.id} value={c.id}>{fullName(c)} · {CLINICIAN_ROLE_LABELS[c.clinicalRole]}{c.clinic ? ` · ${c.clinic.name}` : ""}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="From" htmlFor="cv-from"><Input id="cv-from" type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="Until" htmlFor="cv-to" error={from && to && new Date(to) <= new Date(from) ? "Must be after the start" : null}><Input id="cv-to" type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </div>
    </FormDialog>
  );
}

function OverviewTab({ onBook }: { onBook: (absentId: string) => void }) {
  const q = useApiQuery(["coverage", "overview"], () => coverageApi.overview(), { refetchInterval: 60_000 });
  const rows = q.data?.data ?? [];

  const columns: Column<CoverageOverviewRow>[] = [
    {
      id: "name", header: "Clinician", hideable: false,
      cell: (r) => (
        <div>
          <p className="font-medium">{fullName(r)}</p>
          <p className="text-xs text-muted-foreground">{CLINICIAN_ROLE_LABELS[r.clinicalRole]}{r.clinic ? ` · ${r.clinic.name}` : ""}</p>
        </div>
      ),
    },
    { id: "status", header: "Status", cell: (r) => <StatusBadge value={r.status} meta={PSYCHOLOGIST_STATUS_META} /> },
    { id: "patients", header: "Active patients", align: "right", cell: (r) => formatNumber(r.activePatients) },
    {
      id: "cover", header: "Cover now",
      cell: (r) =>
        r.gap ? (
          <Badge tone="danger"><ShieldAlert /> Patients uncovered</Badge>
        ) : r.coveredNow ? (
          <span className="text-[13px]">{r.coveredBy.map(fullName).join(", ")}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "covering", header: "Covering for", hideBelow: "lg",
      cell: (r) => (r.covering.length ? <span className="text-[13px]">{r.covering.map((c) => (c.absent ? fullName(c.absent) : "Clinic on-call")).join(", ")}</span> : <span className="text-muted-foreground">—</span>),
    },
    {
      id: "next", header: "Next absence", hideBelow: "xl",
      cell: (r) => {
        const next = r.absences.find((a) => !a.active);
        return next ? <span className="text-[13px]">{formatDate(next.startsAt)} → {formatDate(next.endsAt)}</span> : <span className="text-muted-foreground">—</span>;
      },
    },
    {
      id: "actions", header: "", hideable: false, align: "right",
      cell: (r) => (
        <Can permission="coverage.manage">
          <Button variant="ghost" size="sm" onClick={() => onBook(r.id)}><CalendarPlus /> Book cover</Button>
        </Can>
      ),
    },
  ];

  const s = q.data?.summary;
  return (
    <div className="space-y-4">
      <StatGrid>
        <StatCard label="Clinicians" icon={Users} loading={q.isLoading} value={formatNumber(s?.clinicians ?? 0)} hint="On the platform" />
        <StatCard label="Covered right now" icon={ShieldCheck} loading={q.isLoading} value={formatNumber(s?.currentlyCovered ?? 0)} hint="Away, with a replacement" emphasis="success" />
        <StatCard label="On call now" icon={CalendarClock} loading={q.isLoading} value={formatNumber(s?.onCallNow ?? 0)} hint="Answering for a clinic" />
        <StatCard label="Uncovered patients" icon={UserRoundX} loading={q.isLoading} value={formatNumber(s?.patientsWithoutCover ?? 0)} hint={s?.gaps ? `${s.gaps} unavailable clinician${s.gaps === 1 ? "" : "s"}, nobody covering` : "Nobody is left without a clinician"} emphasis={s?.gaps ? "danger" : "success"} live={!!s?.gaps} />
      </StatGrid>
      <Card className="overflow-hidden">
        <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} isLoading={q.isLoading} error={q.error} onRetry={q.refetch} emptyTitle="No clinicians yet" />
      </Card>
    </div>
  );
}

function ShiftsTab() {
  const list = useListState<CoverageFilters>({ window: "CURRENT" }, 20, { id: "coverage-shifts", urlKeys: ["window"] });
  const [cancelling, setCancelling] = useState<CoverageShift | null>(null);
  const q = useApiQuery(["coverage", "list", list.params], () => coverageApi.list(list.params), { keepPrevious: true });
  const remove = useApiMutation((id: string) => coverageApi.remove(id), { invalidate: ["coverage", "psychologists", "system"], successMessage: "Shift cancelled" });

  const columns: Column<CoverageShift>[] = [
    { id: "type", header: "Type", hideable: false, cell: (s) => <div><p className="font-medium">{TYPE_LABEL[s.type]}</p>{s.clinic && <p className="text-xs text-muted-foreground">{s.clinic.name}</p>}</div> },
    { id: "covering", header: "Covering", cell: (s) => fullName(s.covering) },
    { id: "absent", header: "For", cell: (s) => (s.absent ? fullName(s.absent) : <span className="text-muted-foreground">Whole clinic</span>) },
    { id: "period", header: "Period", cell: (s) => <span className="text-[13px]">{formatDateTime(s.startsAt)} → {formatDateTime(s.endsAt)}</span> },
    { id: "state", header: "State", cell: (s) => (s.active ? <Badge tone="success">In effect</Badge> : new Date(s.startsAt) > new Date() ? <Badge tone="info">Upcoming</Badge> : <Badge tone="neutral">Over</Badge>) },
    {
      id: "actions", header: "", hideable: false, align: "right",
      cell: (s) =>
        new Date(s.endsAt) > new Date() ? (
          <Can permission="coverage.manage">
            <Button variant="ghost" size="icon-sm" aria-label="Cancel shift" onClick={() => setCancelling(s)}><Trash2 /></Button>
          </Can>
        ) : null,
    },
  ];

  return (
    <Card className="overflow-hidden">
      <FilterBar onReset={list.reset} canReset={list.isFiltered}>
        <SelectFilter label="Window" allLabel="In effect now" value={list.filters.window === "CURRENT" ? undefined : list.filters.window} options={WINDOWS.filter((w) => w.value !== "CURRENT")} onChange={(v) => list.update({ window: (v as CoverageWindow | undefined) ?? "CURRENT" })} />
      </FilterBar>
      <DataTable columns={columns} rows={q.data?.data} rowKey={(s) => s.id} isLoading={q.isLoading} isFetching={q.isFetching} stale={q.isPlaceholder} error={q.error} onRetry={q.refetch} emptyTitle="No shifts in this window" emptyDescription="Book absence cover or a clinic on-call shift." />
      {q.data && <Pagination page={q.data.page} totalPages={q.data.totalPages} total={q.data.total} limit={q.data.limit} onPageChange={list.setPage} isFetching={q.isFetching} />}
      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        title="Cancel this shift?"
        description={cancelling ? `${fullName(cancelling.covering)} will stop covering ${cancelling.absent ? fullName(cancelling.absent) : "the clinic"} immediately.` : undefined}
        confirmLabel="Cancel shift"
        destructive
        isPending={remove.isPending}
        onConfirm={async () => !!cancelling && !!(await remove.mutate(cancelling.id))}
      />
    </Card>
  );
}

export function CoverageView() {
  const [booking, setBooking] = useState<{ absentId?: string } | null>(null);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Coverage"
        description="Who answers for a clinician who cannot. Alerts follow the cover, and the covering clinician can open the patients concerned."
        actions={
          <Can permission="coverage.manage">
            <Button size="sm" onClick={() => setBooking({})}><CalendarPlus /> Book cover</Button>
          </Can>
        }
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">By clinician</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="pt-4"><OverviewTab onBook={(absentId) => setBooking({ absentId })} /></TabsContent>
        <TabsContent value="shifts" className="pt-4"><ShiftsTab /></TabsContent>
      </Tabs>
      {booking && <BookDialog absentId={booking.absentId} onClose={() => setBooking(null)} />}
    </div>
  );
}
