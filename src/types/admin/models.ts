/**
 * Admin API response models. Field lists mirror what the backend selects for
 * admin endpoints; clinical content (crisis message, flagged words, trigger
 * details, resolution notes, alert description/context, Mira messages/summary/
 * report) is intentionally absent and must never be rendered.
 */
import type {
  AdminRole,
  AlertResolution,
  AlertStatus,
  AlertType,
  ClinicianRole,
  CrisisStatus,
  DiagnosticStatus,
  DiseaseType,
  Language,
  LicenseAuthority,
  LicenseStatus,
  NotificationPriority,
  NotificationType,
  PaymentStatus,
  PsychologistStatus,
  AssignmentStatus,
  RiskLevel,
  SubscriptionStatus,
  SubscriptionTier,
  TriggerType,
  UserStatus,
} from "./enums";

/** Prisma Decimal columns serialize as strings. */
export type DecimalValue = string | number;

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PageQuery {
  page?: number;
  limit?: number;
}

export type SortOrder = "asc" | "desc";

/* ------------------------------------------------------------------ Auth */

export interface AdminPrincipal {
  id: string;
  email: string;
  role: AdminRole;
}

export interface AdminProfile extends AdminPrincipal {
  firstName: string | null;
  lastName: string | null;
  is2FAEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface TwoFactorEnrollment {
  secret: string;
  otpauth_url: string;
  qr_code: string;
}

/* ----------------------------------------------------------------- Users */

export interface PatientRef {
  id: string;
  patientNumber: number;
  nickname?: string;
}

export interface AdminUser {
  id: string;
  patientNumber: number;
  nickname: string;
  email: string;
  language: Language;
  subscriptionPlanId: string | null;
  subscriptionPlan: { tier: SubscriptionTier; name: string } | null;
  subscriptionStatus: SubscriptionStatus | null;
  status: UserStatus;
  detectedDisease: DiseaseType | null;
  riskLevel: RiskLevel | null;
  crisisCount: number;
  createdAt: string;
  lastActiveAt: string | null;
}

export interface AdminUserDetail extends AdminUser {
  baselineWpm: number | null;
  baselineBackspace: number | null;
  deletedAt: string | null;
}

export interface RiskHistoryPoint {
  id: string;
  riskLevel: RiskLevel;
  orientation: DiseaseType | null;
  confidence: number | null;
  completedAt: string | null;
  createdAt: string;
}

/* -------------------------------------------------------------- Sessions */

export interface UserSession {
  id: string;
  userId: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number | null;
  wpmAvg: number | null;
  burstRatio: number | null;
  backspaceRate: number | null;
  mouseVariance: number | null;
  scrollSpeedAvg: number | null;
  keyPressCount: number | null;
  backspaceCount: number | null;
  colorThemeApplied: string | null;
  isCrisisDetected: boolean;
  crisisScore: number | null;
  deviceType: string | null;
  browser: string | null;
  createdAt: string;
  updatedAt: string;
  user?: PatientRef;
}

export interface UserSessionDetail extends UserSession {
  crisisEvents: Array<{
    id: string;
    status: CrisisStatus;
    triggerType: TriggerType;
    detectedRiskLevel: RiskLevel;
    createdAt: string;
  }>;
}

export interface SessionAnalytics {
  totalSessions: number;
  avgWpm: number | null;
  avgBurstRatio: number | null;
  avgBackspaceRate: number | null;
  avgMouseVariance: number | null;
  avgScrollSpeed: number | null;
}

/* ------------------------------------------------------------- Analytics */

export type BehavioralAnalytics = SessionAnalytics;

export interface ModelDrift {
  totalSessions7d: number;
  crisisSessions7d: number;
  /** Formatted percentage string, e.g. "3.20%". */
  crisisRate: string;
  previousPeriodCrisis: number;
  driftDetected: boolean;
  alert: string | null;
  byAgent: {
    mira: { sessions7d: number; crisis7d: number };
    lumina: { interactions7d: number; crisis7d: number };
  };
}

export interface FalsePositives {
  totalCrisis: number;
  falseAlerts: number;
  /** Formatted percentage string, e.g. "12.50%". */
  falsePositiveRate: string;
  byTriggerType: Array<{ triggerType: TriggerType; _count: number }>;
}

/* ---------------------------------------------------------------- Crisis */

export interface CrisisEvent {
  id: string;
  userId: string | null;
  sessionId: string | null;
  diagnosticSessionId: string | null;
  handledById: string | null;
  handledByPsychologistId: string | null;
  triggerType: TriggerType;
  status: CrisisStatus;
  detectedDisease: DiseaseType | null;
  detectedRiskLevel: RiskLevel;
  nlpScore: number | null;
  handledAt: string | null;
  escalatedAt: string | null;
  slaBreached: boolean;
  slaDeadline: string | null;
  createdAt: string;
  updatedAt: string;
  user: PatientRef | null;
  handledBy: { id: string; email: string } | null;
  clinicalAlert: { id: string; status: AlertStatus; routedToId: string | null; slaDeadline?: string | null } | null;
}

export interface CrisisEventDetail extends CrisisEvent {
  session: UserSession | null;
}

export interface EscalationResult extends CrisisEventDetail {
  routing: {
    clinicalAlertId: string | null;
    routedToId: string | null;
    unrouted: boolean;
    reason?: "ANONYMOUS_SESSION";
  };
}

/* -------------------------------------------------------- Clinical alerts */

export interface ClinicalAlert {
  id: string;
  userId: string;
  patientRef: string;
  type: AlertType;
  severity: RiskLevel;
  status: AlertStatus;
  title: string;
  crisisEventId: string | null;
  journalEntryId: string | null;
  routedToId: string | null;
  routedTo: { id: string; firstName: string; lastName: string; status: PsychologistStatus } | null;
  slaDeadline: string | null;
  triggeredAt: string;
  acknowledgedById: string | null;
  acknowledgedAt: string | null;
  resolution: AlertResolution | null;
  resolvedAt: string | null;
  escalationLevel: number;
  escalatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  slaBreached: boolean;
}

/* ----------------------------------------------------------- Diagnostics */

export interface DiagnosticSession {
  id: string;
  status: DiagnosticStatus;
  language: Language;
  stage: string;
  orientation: DiseaseType | null;
  riskLevel: RiskLevel | null;
  confidence: number | null;
  messageCount: number;
  lastSafetyLevel: RiskLevel | null;
  miraVersion: string | null;
  attemptNumber: number;
  lastActivityAt: string;
  expiresAt: string | null;
  completedAt: string | null;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
}

export interface DateRangeEcho {
  from: string | null;
  to: string | null;
}

export interface DiagnosticStats {
  range: DateRangeEcho;
  total: number;
  byStatus: Record<string, number>;
  byOrientation: Record<string, number>;
  byRiskLevel: Record<string, number>;
  byLanguage: Record<string, number>;
  /** 0..1 */
  completionRate: number;
  /** 0..1 */
  abandonmentRate: number;
  abandonmentByStage: Record<string, number>;
}

export interface DiagnosticFunnel {
  range: DateRangeEcho;
  steps: Array<{
    step: "started" | "completed" | "claimed" | "subscribed";
    count: number;
    /** 0..1 */
    rateFromPrevious?: number;
    unit?: "users";
  }>;
}

/* ------------------------------------------------------------- Dashboard */

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  todaySessions: number;
  todayCrises: number;
  todayRevenue: DecimalValue;
  totalCrises: number;
  criticalCrisesPending: number;
}

export interface DashboardKpis {
  newUsers30d: number;
  totalSessions30d: number;
  /** 0..100 */
  crisisResolutionRate: number;
  avgSlaMinutes: number;
  slaTarget: number;
  slaMet: boolean;
}

export interface DashboardRiskOverview {
  byRiskLevel: Array<{ riskLevel: RiskLevel | null; _count: number }>;
  byProfile: Array<{ detectedDisease: DiseaseType | null; _count: number }>;
}

export interface DashboardUserActivity {
  sessionsPerWeek: number;
  activeUsers7d: number;
  totalUsers: number;
  /** 0..100 */
  retentionRate: number;
}

export interface DashboardPayments {
  mrr: number;
  arr: number;
  totalPaidTransactions: number;
  usersByPlan: Array<{ subscriptionPlanId: string | null; _count: number }>;
}

/* -------------------------------------------------------------- Payments */

export interface Payment {
  id: string;
  userId: string;
  planId: string | null;
  stripePaymentIntentId: string | null;
  stripeSessionId: string | null;
  amount: DecimalValue;
  currency: string;
  status: PaymentStatus;
  isTrial: boolean;
  paymentMethod: string | null;
  receiptUrl: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; patientNumber: number; nickname: string; email: string };
}

export interface PaymentStatistics {
  totalRevenue: DecimalValue | null;
  totalPayments: number;
  paidCount: number;
  /** 0..100 */
  conversionRate: number;
  byStatus: Array<{ status: PaymentStatus; _count: number }>;
}

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string | null;
  priceEUR: DecimalValue;
  durationDays: number;
  trialDays: number;
  reportsPerMonth: number;
  hasAdvancedInsights: boolean;
  hasUnlimitedJournal: boolean;
  hasBehaviorAnalysis: boolean;
  hasPrioritySupport: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlanInput {
  tier: SubscriptionTier;
  name: string;
  priceEUR: number;
  trialDays?: number;
  durationDays?: number;
  reportsPerMonth?: number;
  hasAdvancedInsights?: boolean;
  hasUnlimitedJournal?: boolean;
  hasBehaviorAnalysis?: boolean;
  hasPrioritySupport?: boolean;
  isActive?: boolean;
}

/* --------------------------------------------------------- Notifications */

export interface AdminNotification {
  id: string;
  userId: string | null;
  adminId: string | null;
  psychologistId: string | null;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  channels: string[];
  sentAt: string | null;
  createdAt: string;
  user: { id: string; patientNumber: number } | null;
}

/* ------------------------------------------------------ Clinics/licenses */

export interface ClinicMember {
  id: string;
  firstName: string;
  lastName: string;
  clinicalRole: ClinicianRole;
  status: PsychologistStatus;
}

export interface Clinic {
  id: string;
  name: string;
  country: string;
  timezone: string;
  emergencyNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: ClinicMember[];
}

export interface ClinicInput {
  name: string;
  country: string;
  timezone?: string;
  emergencyNumber?: string;
}

export interface LicenseVerifyInput {
  authority: LicenseAuthority;
  licenseNumber: string;
  authorityName?: string;
  expiresAt?: string;
  evidenceUrl?: string;
}

export interface LicenseVerification {
  id: string;
  psychologistId: string;
  authority: LicenseAuthority;
  licenseNumber: string;
  status: LicenseStatus;
  verifiedAt: string | null;
  expiresAt: string | null;
}

/* ------------------------------------------------------------ Assignments */

export interface PsychologistDirectoryEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  clinicalRole: ClinicianRole;
  status: PsychologistStatus;
  specialties: string[];
  licenseNumber: string | null;
  verifiedAt: string | null;
  createdAt: string;
  clinic: { id: string; name: string } | null;
  activeCaseload: number;
}

export interface PatientAssignment {
  id: string;
  status: AssignmentStatus;
  isPrimary: boolean;
  assignedAt: string;
  consentedAt: string | null;
  endedAt: string | null;
  endReason: string | null;
  user: { id: string; patientNumber: number; nickname: string };
  psychologist: { id: string; firstName: string; lastName: string; clinicalRole: ClinicianRole; status: PsychologistStatus };
  assignedBy: { id: string; email: string } | null;
}

export interface AssignmentInput {
  userId: string;
  psychologistId: string;
  isPrimary?: boolean;
}
