import type { AlertType, ClinicianRole, LicenseAuthority, LicenseStatus, PsychologistStatus, RiskLevel } from "./enums";

/* ---------------------------------------------------- Assignment circuit */

/** Admin proposes → clinician accepts → patient consents. */
export const ASSIGNMENT_STAGES = ["AWAITING_CLINICIAN", "AWAITING_PATIENT", "ACTIVE", "DECLINED", "ENDED"] as const;
export type AssignmentStage = (typeof ASSIGNMENT_STAGES)[number];

/* ------------------------------------------------------------ Psychologists */

export interface PsychologistDetail {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  specialties: string[];
  licenseNumber: string | null;
  status: PsychologistStatus;
  clinicalRole: ClinicianRole;
  isClinicAdmin: boolean;
  is2FAEnabled: boolean;
  language: string;
  bio: string | null;
  lastLoginAt: string | null;
  verifiedAt: string | null;
  termsAcceptedAt: string | null;
  termsVersion: string | null;
  createdAt: string;
  clinic: { id: string; name: string; country: string | null; emergencyNumber: string | null } | null;
  verifiedBy: { id: string; email: string } | null;
  licenseVerifications: Array<{
    id: string;
    status: LicenseStatus;
    authority: LicenseAuthority;
    authorityName: string | null;
    licenseNumber: string;
    expiresAt: string | null;
    verifiedAt: string | null;
    rejectionReason: string | null;
    createdAt: string;
  }>;
  absences: Array<{ id: string; type: CoverageType; startsAt: string; endsAt: string; covering: { id: string; firstName: string; lastName: string } }>;
  coverageShifts: Array<{ id: string; type: CoverageType; startsAt: string; endsAt: string; absent: { id: string; firstName: string; lastName: string } | null }>;
  caseload: {
    active: number;
    awaitingClinician: number;
    awaitingPatient: number;
    ended: number;
    declinedLast30d: number;
    oldestRequestWaitingHours: number | null;
  };
  pendingRequests: Array<{ assignmentId: string; requestedAt: string; patientCode: string; nickname: string }>;
  patients: Array<{ assignmentId: string; isPrimary: boolean; assignedAt: string; patientId: string; patientCode: string; nickname: string; status: string }>;
  alerts: { open: number; overdue: number };
  activityLast30d: { logins: number; patientViews: number; notes: number; sessions: number; alertsHandled: number; accessDenied: number };
}

export interface PsychologistStatusResult {
  id: string;
  status: PsychologistStatus;
  closedRequests: number;
  affectedPatients: number;
  uncovered: boolean;
}

export interface PsychologistUpdateInput {
  clinicId?: string | null;
  clinicalRole?: ClinicianRole;
  isClinicAdmin?: boolean;
}

/* ----------------------------------------------------------------- Coverage */

export const COVERAGE_TYPES = ["ON_CALL", "LEAVE_COVER"] as const;
export type CoverageType = (typeof COVERAGE_TYPES)[number];

export type CoverageWindow = "CURRENT" | "UPCOMING" | "PAST" | "ALL";

export interface CoverageClinician {
  id: string;
  firstName: string;
  lastName: string;
  clinicalRole: ClinicianRole;
  status: PsychologistStatus;
  clinicId: string | null;
}

export interface CoverageShift {
  id: string;
  type: CoverageType;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  clinicId: string | null;
  coveringId: string;
  absentId: string | null;
  clinic: { id: string; name: string } | null;
  covering: CoverageClinician;
  absent: CoverageClinician | null;
  active: boolean;
}

export interface CoverageInput {
  coveringId: string;
  absentId?: string;
  type?: CoverageType;
  startsAt: string;
  endsAt: string;
}

export interface CoverageOverviewRow {
  id: string;
  firstName: string;
  lastName: string;
  clinicalRole: ClinicianRole;
  status: PsychologistStatus;
  clinic: { id: string; name: string } | null;
  activePatients: number;
  coveredNow: boolean;
  coveredBy: Array<{ id: string; firstName: string; lastName: string; status: PsychologistStatus }>;
  covering: Array<{ shiftId: string; absent: { id: string; firstName: string; lastName: string } | null; type: CoverageType; endsAt: string }>;
  absences: Array<{ id: string; type: CoverageType; startsAt: string; endsAt: string; active: boolean; covering: { id: string; firstName: string; lastName: string; status: PsychologistStatus } }>;
  upcomingCover: Array<{ id: string; type: CoverageType; startsAt: string; endsAt: string; absent: { id: string; firstName: string; lastName: string } | null }>;
  gap: boolean;
}

export interface CoverageOverview {
  data: CoverageOverviewRow[];
  summary: { clinicians: number; currentlyCovered: number; onCallNow: number; gaps: number; patientsWithoutCover: number };
}

/* ------------------------------------------------------------ System health */

export type ComponentStatus = "up" | "degraded" | "down";
export type Verdict = "healthy" | "degraded" | "critical";

export interface HealthComponent {
  key: string;
  label: string;
  kind: "core" | "engine";
  status: ComponentStatus;
  latencyMs: number | null;
  detail: string | null;
  version?: string | null;
  contract?: { expected: string; reported: string | null; match: boolean };
  breaker?: { open: boolean; failures: number; openedAt: string | null };
}

export interface HealthIssue {
  severity: "critical" | "warning";
  area: string;
  code: string;
  message: string;
}

export type HttpStats =
  | { enabled: false }
  | { enabled: true; sinceStartup: boolean; requests: number; errors5xx: number; errorRatePct: number; avgMs: number; p50Ms: number | null; p95Ms: number | null };

export interface SystemHealth {
  verdict: Verdict;
  issues: HealthIssue[];
  components: HealthComponent[];
  backlogs: {
    clinicianRequestsOverdue: number;
    clinicalAlertsOverdue: number;
    clinicalAlertsUnrouted: number;
    crisesUnhandled: number;
    journalAnalysesStuck: number;
    journalAnalysesFailed24h: number;
    weeklyReportsStale: number;
  };
  flow: {
    window: string;
    mira: { sessions: number; blocked: number; blockedRatePct: number | null };
    journal: { analysed: number; failed: number; failureRatePct: number | null };
    crises: { total: number; falseAlerts: number; falseAlertRatePct: number | null };
  };
  http: HttpStats;
  thresholds: Record<string, number>;
  process: { uptimeSeconds: number; memoryMb: number; node: string };
  checkedAt: string;
}

export interface HealthSample {
  t: string;
  db: number | null;
  redis: number | null;
  engines: Record<string, { up: boolean; ms: number | null }>;
}

export interface HealthHistory {
  everyMs: number;
  samples: HealthSample[];
}

export interface ActivityDay {
  day: string;
  mira: { total: number; completed: number; abandoned: number; blocked: number };
  journal: { entries: number; analysed: number; failed: number; pending: number; flaggedForReview: number; failureRatePct: number | null };
  checkins: number;
  crises: { total: number; falseAlerts: number; resolved: number };
  signups: number;
}

export interface SystemActivity {
  days: number;
  series: ActivityDay[];
}

export interface EngineProbe {
  agent: string;
  url: string;
  breaker: { open: boolean; failures: number; openedAt: string | null };
  health?: { ok: boolean; status?: number; latencyMs: number; error?: string; body?: unknown };
  ready?: { ok: boolean; status?: number; latencyMs: number; error?: string; body?: unknown };
  version?: { ok: boolean; status?: number; latencyMs: number; error?: string; body?: Record<string, unknown> | null };
}

export interface EnginesStatus {
  status: "ok" | "degraded";
  expectedContracts: Record<string, string>;
  warnings: string[];
  agents: Record<"mira" | "journal" | "checkin", EngineProbe>;
  checkedAt: string;
}

export interface BreakerResetResult {
  engine: string;
  before: { open: boolean; failures: number; openedAt: string | null };
  after: { open: boolean; failures: number; openedAt: string | null };
}

/* ------------------------------------------------------------- Notifications */

export type NotificationAudience = "ADMIN" | "PSYCHOLOGIST" | "PATIENT";
export type BroadcastAudience = "ADMINS" | "PSYCHOLOGISTS" | "PATIENTS";

export interface NotificationSummary {
  mineUnread: number;
  unread: Record<NotificationAudience, number>;
  last7d: { byType: Array<{ type: string; count: number }>; perDay: Array<{ day: string; count: number }> };
}

export interface BroadcastInput {
  audience: BroadcastAudience;
  title: string;
  message: string;
  priority?: "NORMAL" | "HIGH" | "URGENT";
}

/* ------------------------------------------------------------ Alerts summary */

export interface AlertsSummary {
  open: { total: number; bySeverity: Partial<Record<RiskLevel, number>>; overdue: number; unrouted: number; escalated: number };
  medianMinutesToAcknowledge30d: number | null;
  byType30d: Array<{ type: AlertType; count: number }>;
  workload: Array<{ psychologistId: string; name: string; status: PsychologistStatus | null; open: number }>;
  perDay: Array<{ day: string; severity: RiskLevel; count: number }>;
}

