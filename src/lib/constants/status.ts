import type { BadgeTone } from "@/components/ui/badge";
import type {
  AlertResolution,
  AlertStatus,
  AlertType,
  ClinicianRole,
  CrisisStatus,
  DiagnosticStatus,
  LicenseAuthority,
  LicenseStatus,
  NotificationPriority,
  PaymentStatus,
  PsychologistStatus,
  RiskLevel,
  SubscriptionStatus,
  SubscriptionTier,
  TriggerType,
  UserStatus,
} from "@/types/admin";

/**
 * Single source of truth for how each enum value is labelled and toned.
 * Tone semantics: success = healthy/done, warning = needs attention,
 * serious/danger = high risk / crisis, info = in progress, neutral = informational.
 */
export interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

export const RISK_META: Record<RiskLevel, StatusMeta & { chart: string; rank: number }> = {
  LOW: { label: "Low", tone: "success", chart: "var(--status-good)", rank: 1 },
  MODERATE: { label: "Moderate", tone: "warning", chart: "var(--status-warning)", rank: 2 },
  HIGH: { label: "High", tone: "serious", chart: "var(--status-serious)", rank: 3 },
  CRITICAL: { label: "Critical", tone: "danger", chart: "var(--status-critical)", rank: 4 },
};

export const USER_STATUS_META: Record<UserStatus, StatusMeta> = {
  ACTIVE: { label: "Active", tone: "success" },
  INACTIVE: { label: "Inactive", tone: "neutral" },
  SUSPENDED: { label: "Suspended", tone: "warning" },
  BLOCKED: { label: "Blocked", tone: "danger" },
};

export const SUBSCRIPTION_STATUS_META: Record<SubscriptionStatus, StatusMeta> = {
  TRIAL: { label: "Trial", tone: "info" },
  ACTIVE: { label: "Active", tone: "success" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  SUSPENDED: { label: "Suspended", tone: "warning" },
};

export const CRISIS_STATUS_META: Record<CrisisStatus, StatusMeta> = {
  PENDING: { label: "Pending", tone: "warning" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  ESCALATED: { label: "Escalated", tone: "serious" },
  RESOLVED: { label: "Resolved", tone: "success" },
  FALSE_ALERT: { label: "False alert", tone: "neutral" },
};

export const ALERT_STATUS_META: Record<AlertStatus, StatusMeta> = {
  OPEN: { label: "Open", tone: "warning" },
  ACKNOWLEDGED: { label: "Acknowledged", tone: "info" },
  ESCALATED: { label: "Escalated", tone: "serious" },
  RESOLVED: { label: "Resolved", tone: "success" },
  DISMISSED: { label: "Dismissed", tone: "neutral" },
};

export const DIAGNOSTIC_STATUS_META: Record<DiagnosticStatus, StatusMeta> = {
  ACTIVE: { label: "In progress", tone: "info" },
  COMPLETED: { label: "Completed", tone: "success" },
  ABANDONED: { label: "Abandoned", tone: "warning" },
  EXPIRED: { label: "Expired", tone: "neutral" },
  BLOCKED: { label: "Blocked", tone: "danger" },
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, StatusMeta & { chart: string }> = {
  PAID: { label: "Paid", tone: "success", chart: "var(--status-good)" },
  PENDING: { label: "Pending", tone: "warning", chart: "var(--status-warning)" },
  FAILED: { label: "Failed", tone: "danger", chart: "var(--status-critical)" },
  REFUNDED: { label: "Refunded", tone: "neutral", chart: "var(--status-neutral)" },
  FREE_TRIAL: { label: "Free trial", tone: "info", chart: "var(--chart-1)" },
};

export const PSYCHOLOGIST_STATUS_META: Record<PsychologistStatus, StatusMeta> = {
  PENDING: { label: "Pending verification", tone: "warning" },
  ACTIVE: { label: "Active", tone: "success" },
  SUSPENDED: { label: "Suspended", tone: "danger" },
  DEACTIVATED: { label: "Deactivated", tone: "neutral" },
};

export const NOTIFICATION_PRIORITY_META: Record<NotificationPriority, StatusMeta> = {
  NORMAL: { label: "Normal", tone: "neutral" },
  HIGH: { label: "High", tone: "warning" },
  URGENT: { label: "Urgent", tone: "danger" },
};

export const TRIGGER_META: Record<TriggerType, StatusMeta> = {
  NLP: { label: "NLP", tone: "info" },
  JOURNAL: { label: "Journal", tone: "info" },
  DIAGNOSTIC: { label: "Diagnostic", tone: "info" },
  BIOMETRICS: { label: "Biometrics", tone: "info" },
  MANUAL: { label: "Manual", tone: "neutral" },
};

export const ALERT_TYPE_META: Record<AlertType, StatusMeta> = {
  HIGH_RISK_JOURNAL: { label: "High-risk journal", tone: "danger" },
  DRIFT_THRESHOLD: { label: "Drift threshold", tone: "serious" },
  RELAPSE_SIGNATURE: { label: "Relapse signature", tone: "serious" },
  MISSED_MEDICATION: { label: "Missed medication", tone: "warning" },
  CHECKIN_GAP: { label: "Check-in gap", tone: "warning" },
  CRISIS: { label: "Crisis", tone: "danger" },
  MANUAL: { label: "Manual", tone: "neutral" },
};

export const ALERT_RESOLUTION_META: Record<AlertResolution, StatusMeta> = {
  GROUNDING_COMPLETED: { label: "Grounding completed", tone: "success" },
  CONTACT_MADE: { label: "Contact made", tone: "success" },
  UNRESOLVED: { label: "Unresolved", tone: "warning" },
  FALSE_ALERT: { label: "False alert", tone: "neutral" },
};

export const SUBSCRIPTION_TIER_META: Record<SubscriptionTier, StatusMeta & { chart: string }> = {
  BASIC: { label: "Basic", tone: "neutral", chart: "var(--chart-1)" },
  PRO: { label: "Pro", tone: "brand", chart: "var(--chart-2)" },
};

export const CLINICIAN_ROLE_LABELS: Record<ClinicianRole, string> = {
  PSYCHIATRIST: "Psychiatrist",
  PSYCHOLOGIST: "Psychologist",
  THERAPIST: "Therapist",
  NURSE: "Nurse",
  CARE_COORDINATOR: "Care coordinator",
};

export const LICENSE_AUTHORITY_LABELS: Record<LicenseAuthority, string> = {
  DOH_ABU_DHABI: "DOH Abu Dhabi",
  DHA: "DHA",
  MOHAP: "MOHAP",
  OTHER: "Other authority",
};

export const LICENSE_STATUS_META: Record<LicenseStatus, StatusMeta> = {
  PENDING: { label: "Pending verification", tone: "warning" },
  VERIFIED: { label: "Verified", tone: "success" },
  REJECTED: { label: "Rejected", tone: "danger" },
  EXPIRED: { label: "Expired", tone: "neutral" },
};

export const LANGUAGE_LABELS: Record<string, string> = { FR: "French", EN: "English", AR: "Arabic" };

export const DISEASE_LABELS: Record<string, string> = {
  ADHD: "ADHD",
  BIPOLAR: "Bipolar",
  SCHIZOPHRENIA: "Schizophrenia",
  NONE: "Not determined",
};
