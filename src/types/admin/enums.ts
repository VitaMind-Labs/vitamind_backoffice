/** Prisma enum values exactly as the backend accepts/returns them (UPPERCASE). */

export const ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "FINANCE", "SUPPORT"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const USER_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED", "BLOCKED"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const LANGUAGES = ["FR", "EN", "AR"] as const;
export type Language = (typeof LANGUAGES)[number];

export const SUBSCRIPTION_TIERS = ["BASIC", "PRO"] as const;
export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number];

export const SUBSCRIPTION_STATUSES = ["TRIAL", "ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const RISK_LEVELS = ["LOW", "MODERATE", "HIGH", "CRITICAL"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const DISEASE_TYPES = ["ADHD", "BIPOLAR", "SCHIZOPHRENIA"] as const;
export type DiseaseType = (typeof DISEASE_TYPES)[number];

export const CRISIS_STATUSES = ["PENDING", "IN_PROGRESS", "RESOLVED", "ESCALATED", "FALSE_ALERT"] as const;
export type CrisisStatus = (typeof CRISIS_STATUSES)[number];

export const TRIGGER_TYPES = ["NLP", "JOURNAL", "DIAGNOSTIC", "BIOMETRICS", "MANUAL"] as const;
export type TriggerType = (typeof TRIGGER_TYPES)[number];

export const ALERT_TYPES = [
  "HIGH_RISK_JOURNAL",
  "DRIFT_THRESHOLD",
  "RELAPSE_SIGNATURE",
  "MISSED_MEDICATION",
  "CHECKIN_GAP",
  "CRISIS",
  "MANUAL",
] as const;
export type AlertType = (typeof ALERT_TYPES)[number];

export const ALERT_STATUSES = ["OPEN", "ACKNOWLEDGED", "RESOLVED", "ESCALATED", "DISMISSED"] as const;
export type AlertStatus = (typeof ALERT_STATUSES)[number];

export const ALERT_RESOLUTIONS = ["GROUNDING_COMPLETED", "CONTACT_MADE", "UNRESOLVED", "FALSE_ALERT"] as const;
export type AlertResolution = (typeof ALERT_RESOLUTIONS)[number];

export const DIAGNOSTIC_STATUSES = ["ACTIVE", "COMPLETED", "ABANDONED", "EXPIRED", "BLOCKED"] as const;
export type DiagnosticStatus = (typeof DIAGNOSTIC_STATUSES)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED", "FREE_TRIAL"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const NOTIFICATION_TYPES = [
  "PAYMENT",
  "REPORT_READY",
  "SUBSCRIPTION_EXPIRY",
  "RISK_ALERT",
  "CRISIS",
  "SYSTEM",
  "ASSESSMENT_READY",
  "SESSION_REMINDER",
  "PATIENT_ASSIGNED",
  "CLINICAL_ALERT",
  "WEEKLY_REPORT_READY",
  "REPORT_ESCALATION",
  "SECURE_MESSAGE",
  "COVERAGE_ASSIGNED",
  "LICENSE_EXPIRY",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_PRIORITIES = ["NORMAL", "HIGH", "URGENT"] as const;
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export const PSYCHOLOGIST_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED", "DEACTIVATED"] as const;
export type PsychologistStatus = (typeof PSYCHOLOGIST_STATUSES)[number];

export const CLINICIAN_ROLES = ["PSYCHIATRIST", "PSYCHOLOGIST", "THERAPIST", "NURSE", "CARE_COORDINATOR"] as const;
export type ClinicianRole = (typeof CLINICIAN_ROLES)[number];

export const LICENSE_AUTHORITIES = ["DOH_ABU_DHABI", "DHA", "MOHAP", "OTHER"] as const;
export type LicenseAuthority = (typeof LICENSE_AUTHORITIES)[number];

export const LICENSE_STATUSES = ["PENDING", "VERIFIED", "REJECTED", "EXPIRED"] as const;
export type LicenseStatus = (typeof LICENSE_STATUSES)[number];

export const ASSIGNMENT_STATUSES = ["PENDING", "ACTIVE", "ENDED"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];
