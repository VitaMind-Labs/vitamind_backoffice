"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/admin/shared/page-header";
import { RequirePermission } from "@/components/admin/shared/permission";
import { SearchInput } from "@/components/admin/shared/filters";
import { EmptyState, ErrorState } from "@/components/admin/shared/states";
import { RiskBadge, StatusBadge } from "@/components/admin/shared/status-badge";
import { PrivacyNote } from "@/components/admin/shared/detail";
import { RiskHistoryPanel } from "@/components/admin/users/user-detail";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { usersApi } from "@/lib/api/users";
import { RISK_META, USER_STATUS_META } from "@/lib/constants/status";
import { formatNumber, formatRelative, patientRef } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { RISK_LEVELS, type RiskLevel } from "@/types/admin";

const PAGE_SIZE = 12;

function readPatientParam(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("patient");
}

/** Keeps ?patient=<id> in the URL so a trajectory can be shared or reopened. */
function useSelectedPatient() {
  const [selected, setSelected] = useState<string | null>(readPatientParam);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selected) params.set("patient", selected);
    else params.delete("patient");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [selected]);
  return [selected, setSelected] as const;
}

function RiskChips({ value, onChange }: { value: RiskLevel | undefined; onChange: (v: RiskLevel | undefined) => void }) {
  const levels = [...RISK_LEVELS].reverse();
  return (
    <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Risk level">
      {[undefined, ...levels].map((level) => {
        const active = level === value;
        return (
          <button
            key={level ?? "all"}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(level)}
            className={cn(
              "inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors",
              active ? "border-primary/40 bg-primary-soft text-sidebar-active-foreground" : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {level && <span className="size-1.5 rounded-full" style={{ background: RISK_META[level].chart }} aria-hidden />}
            {level ? RISK_META[level].label : "Any risk"}
          </button>
        );
      })}
    </div>
  );
}

function PatientPicker({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState<RiskLevel | undefined>(undefined);
  const [page, setPage] = useState(1);
  const browsing = !search && !risk;

  // Default view surfaces patients with crisis history, most recently active first.
  const q = useApiQuery(
    ["users", "risk-picker", search, risk, page],
    () =>
      usersApi.list({
        search: search || undefined,
        risk_level: risk,
        min_crises: browsing ? 1 : undefined,
        sort_by: "last_active_at",
        order: "desc",
        page,
        limit: PAGE_SIZE,
      }),
    { keepPrevious: true },
  );
  const total = q.data?.total;
  const totalPages = q.data?.totalPages ?? 1;

  return (
    <Card className="flex flex-col overflow-hidden lg:sticky lg:top-20 lg:max-h-[calc(100dvh-7rem)]">
      <div className="space-y-3 border-b p-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search nickname or email"
          className="sm:w-full"
        />
        <RiskChips
          value={risk}
          onChange={(v) => {
            setRisk(v);
            setPage(1);
          }}
        />
        <p className="text-xs text-muted-foreground">
          {total === undefined ? "Loading…" : `${formatNumber(total)} ${browsing ? "patients with at least one crisis" : "matching patients"}`}
          {" · most recently active first"}
        </p>
      </div>
      <div className={cn("scrollbar-thin min-h-0 flex-1 overflow-y-auto transition-opacity", q.isPlaceholder && "opacity-60")}>
        {q.error && !q.data ? (
          <ErrorState error={q.error} onRetry={q.refetch} compact />
        ) : !q.data ? (
          <ul className="divide-y" aria-busy>
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </li>
            ))}
          </ul>
        ) : q.data.data.length === 0 ? (
          <EmptyState compact title="No matching patients" description="Try another name or risk level." />
        ) : (
          <ul className="divide-y" role="listbox" aria-label="Patients">
            {q.data.data.map((u) => {
              const isSelected = selected === u.id;
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => onSelect(u.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
                      isSelected && "bg-primary-soft shadow-[inset_2px_0_0_var(--primary)] hover:bg-primary-soft",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium tabular-nums">{patientRef(u.patientNumber)}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {u.crisisCount > 0 ? `${formatNumber(u.crisisCount)} crises · ` : ""}
                        {u.lastActiveAt ? `active ${formatRelative(u.lastActiveAt)}` : "never active"}
                      </span>
                    </span>
                    <RiskBadge level={u.riskLevel} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {q.data && totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
          <Button variant="ghost" size="icon-sm" className="size-7" onClick={() => setPage((p) => p - 1)} disabled={page <= 1} aria-label="Previous page">
            <ChevronLeft />
          </Button>
          <span className="tabular-nums">
            Page {formatNumber(page)} of {formatNumber(totalPages)}
          </span>
          <Button variant="ghost" size="icon-sm" className="size-7" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages} aria-label="Next page">
            <ChevronRight />
          </Button>
        </div>
      )}
    </Card>
  );
}

function SelectedHeader({ userId }: { userId: string }) {
  const q = useApiQuery(["users", "detail", userId], () => usersApi.get(userId));
  const u = q.data;
  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      {u ? (
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-auth-panel-2 text-sm font-semibold text-primary-foreground" aria-hidden>
            {u.nickname.trim().slice(0, 2).toUpperCase() || "?"}
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tabular-nums">
              {patientRef(u.patientNumber)}
              <StatusBadge value={u.status} meta={USER_STATUS_META} />
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {u.nickname} · {formatNumber(u.crisisCount)} crises · {u.lastActiveAt ? `active ${formatRelative(u.lastActiveAt)}` : "never active"}
            </p>
          </div>
        </div>
      ) : q.error ? (
        <p className="text-sm text-muted-foreground">Patient details unavailable.</p>
      ) : (
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
      )}
      <Button variant="outline" size="sm" asChild>
        <Link href={`/admin/users/${userId}`}>
          Open patient <ArrowUpRight />
        </Link>
      </Button>
    </Card>
  );
}

function RiskHistoryView() {
  const [selected, setSelected] = useSelectedPatient();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk history"
        description="How a patient's Mira risk level and orientation evolved across diagnostic sessions."
      />
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <PatientPicker selected={selected} onSelect={setSelected} />
        <div className="min-w-0 space-y-4">
          {selected ? (
            <>
              <SelectedHeader userId={selected} />
              <RiskHistoryPanel userId={selected} />
            </>
          ) : (
            <Card className="bg-grid">
              <EmptyState
                icon={UserSearch}
                title="Select a patient"
                description="Choose a patient on the left — or filter by risk level — to see their risk trajectory, peak level and direction of travel."
              />
            </Card>
          )}
          <PrivacyNote>Only diagnostic metadata is shown: risk level, orientation, confidence and dates.</PrivacyNote>
        </div>
      </div>
    </div>
  );
}

export default function RiskHistoryPage() {
  return (
    <RequirePermission permission="users.riskHistory">
      <RiskHistoryView />
    </RequirePermission>
  );
}
