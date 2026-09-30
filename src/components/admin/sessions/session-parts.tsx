"use client";

import { useState } from "react";
import Link from "next/link";
import { Siren, Square, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Column } from "@/components/admin/shared/data-table";
import { ConfirmDialog } from "@/components/admin/shared/confirm-dialog";
import { CopyableId, DetailDrawer, DetailRow, DetailSection } from "@/components/admin/shared/detail";
import { Can } from "@/components/admin/shared/permission";
import { LoadingBlock, ErrorState } from "@/components/admin/shared/states";
import { RiskBadge, StatusBadge } from "@/components/admin/shared/status-badge";
import { useApiMutation } from "@/hooks/admin/use-api-mutation";
import { useApiQuery } from "@/hooks/admin/use-api-query";
import { sessionsApi } from "@/lib/api/sessions";
import { CRISIS_STATUS_META } from "@/lib/constants/status";
import { formatDateTime, formatDuration, formatNumber, formatRelative, humanize, patientRef } from "@/lib/formatters";
import type { UserSession } from "@/types/admin";

export function CrisisFlag({ session }: { session: Pick<UserSession, "isCrisisDetected" | "crisisScore"> }) {
  if (!session.isCrisisDetected) return <span className="text-xs text-muted-foreground">No</span>;
  return (
    <Badge tone="danger">
      <Siren aria-hidden />
      Crisis{session.crisisScore !== null ? ` · ${formatNumber(session.crisisScore, 2)}` : ""}
    </Badge>
  );
}

export function sessionColumns({ withPatient }: { withPatient: boolean }): Column<UserSession>[] {
  const cols: Column<UserSession>[] = [
    {
      id: "start",
      header: "Started",
      hideable: false,
      sortKey: "start_at",
      cell: (s) => (
        <div>
          <p className="font-medium">{formatDateTime(s.startTime)}</p>
          <p className="text-xs text-muted-foreground">{s.endTime ? `Ended · ${formatDuration(s.durationSeconds)}` : "Open"}</p>
        </div>
      ),
    },
  ];
  if (withPatient) {
    cols.push({
      id: "patient",
      header: "Patient",
      cell: (s) => <span className="font-medium tabular-nums">{patientRef(s.user?.patientNumber)}</span>,
    });
  }
  cols.push(
    { id: "wpm", header: "WPM", sortKey: "wpm_avg", align: "right", cell: (s) => formatNumber(s.wpmAvg, 1), hideBelow: "sm" },
    { id: "backspace", header: "Backspace rate", align: "right", hideBelow: "lg", cell: (s) => formatNumber(s.backspaceRate, 2) },
    { id: "mouse", header: "Mouse variance", align: "right", hideBelow: "xl", cell: (s) => formatNumber(s.mouseVariance, 2) },
    { id: "device", header: "Device", hideBelow: "lg", cell: (s) => <span className="text-muted-foreground">{[s.deviceType, s.browser].filter(Boolean).join(" · ") || "—"}</span> },
    { id: "crisis", header: "Crisis", cell: (s) => <CrisisFlag session={s} /> },
  );
  return cols;
}

/** Session detail with the two audited operations (end, RGPD delete). */
export function SessionDrawer({ sessionId, onClose }: { sessionId: string | null; onClose: () => void }) {
  const q = useApiQuery(sessionId ? ["sessions", "detail", sessionId] : null, () => sessionsApi.get(sessionId!));
  const [confirm, setConfirm] = useState<"end" | "delete" | null>(null);
  const end = useApiMutation(() => sessionsApi.end(sessionId!), { invalidate: ["sessions", "users"], successMessage: "Session ended" });
  const remove = useApiMutation(() => sessionsApi.remove(sessionId!), {
    invalidate: ["sessions", "users"],
    successMessage: "Session deleted",
    onSuccess: onClose,
  });
  const s = q.data;

  return (
    <>
      <DetailDrawer
        open={!!sessionId}
        onOpenChange={(open) => !open && onClose()}
        title="Telemetry session"
        description={s ? `${patientRef(s.user?.patientNumber)} · started ${formatRelative(s.startTime)}` : "Loading…"}
        badges={s && <CrisisFlag session={s} />}
        footer={
          s && (
            <Can permission="sessions.manage">
              <Button variant="outline" size="sm" onClick={() => setConfirm("end")} disabled={!!s.endTime}>
                <Square /> End session
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive-soft" onClick={() => setConfirm("delete")}>
                <Trash2 /> Delete (RGPD)
              </Button>
            </Can>
          )
        }
      >
        {q.error ? (
          <ErrorState error={q.error} onRetry={q.refetch} compact />
        ) : !s ? (
          <LoadingBlock rows={6} />
        ) : (
          <>
            <DetailSection title="Session">
              <DetailRow label="Identifier">
                <CopyableId value={s.id} display={s.id.slice(0, 13)} />
              </DetailRow>
              <DetailRow label="Patient">
                {s.user ? (
                  <Link href={`/admin/users/${s.user.id}`} className="text-primary hover:underline">
                    {patientRef(s.user.patientNumber)}
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Started">{formatDateTime(s.startTime)}</DetailRow>
              <DetailRow label="Ended">{s.endTime ? formatDateTime(s.endTime) : "Open"}</DetailRow>
              <DetailRow label="Duration">{formatDuration(s.durationSeconds)}</DetailRow>
              <DetailRow label="Device">{[s.deviceType, s.browser].filter(Boolean).join(" · ") || "—"}</DetailRow>
              <DetailRow label="Theme applied">{s.colorThemeApplied ?? "—"}</DetailRow>
            </DetailSection>
            <DetailSection title="Behavioural telemetry">
              <DetailRow label="Words per minute">{formatNumber(s.wpmAvg, 1)}</DetailRow>
              <DetailRow label="Burst ratio">{formatNumber(s.burstRatio, 2)}</DetailRow>
              <DetailRow label="Backspace rate">{formatNumber(s.backspaceRate, 2)}</DetailRow>
              <DetailRow label="Mouse variance">{formatNumber(s.mouseVariance, 2)}</DetailRow>
              <DetailRow label="Scroll speed">{formatNumber(s.scrollSpeedAvg, 2)}</DetailRow>
              <DetailRow label="Key presses">{formatNumber(s.keyPressCount)}</DetailRow>
              <DetailRow label="Backspaces">{formatNumber(s.backspaceCount)}</DetailRow>
            </DetailSection>
            <DetailSection title="Linked crisis events">
              {s.crisisEvents.length === 0 ? (
                <p className="px-3.5 py-3 text-[13px] text-muted-foreground">No crisis event linked to this session.</p>
              ) : (
                s.crisisEvents.map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-[13px]">
                    <Link href={`/admin/crisis-events?focus=${c.id}`} className="text-primary hover:underline">
                      {humanize(c.triggerType)} · {formatDateTime(c.createdAt)}
                    </Link>
                    <span className="flex gap-1.5">
                      <RiskBadge level={c.detectedRiskLevel} />
                      <StatusBadge value={c.status} meta={CRISIS_STATUS_META} />
                    </span>
                  </div>
                ))
              )}
            </DetailSection>
          </>
        )}
      </DetailDrawer>

      <ConfirmDialog
        open={confirm === "end"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="End this session?"
        description="Sets the session end time to now. This is recorded in the audit log."
        confirmLabel="End session"
        isPending={end.isPending}
        onConfirm={async () => !!(await end.mutate(undefined))}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Permanently delete this session?"
        description="RGPD deletion of the telemetry record. This cannot be undone and is recorded in the audit log."
        confirmLabel="Delete session"
        destructive
        isPending={remove.isPending}
        onConfirm={async () => !!(await remove.mutate(undefined))}
      />
    </>
  );
}
