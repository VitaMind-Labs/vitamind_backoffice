export enum Lang {
  FR = 'FR',
  AR = 'AR',
  EN = 'EN',
}

export enum SubscriptionTier {
  Essential = 'Essential',
  Premium = 'Premium',
  Pro = 'Pro',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
  Suspended = 'suspended',
}

export enum DetectedProfile {
  ADHD = 'ADHD',
  Bipolar = 'Bipolar',
  Psychosis = 'Psychosis',
  Anxiety = 'Anxiety',
  Depression = 'Depression',
  Stable = 'Stable',
}

export enum RiskLevel {
  Low = 'low',
  Moderate = 'moderate',
  High = 'high',
  Critical = 'critical',
}

export enum QuestionType {
  Scale = 'scale',
  MultipleChoice = 'multiple_choice',
  Boolean = 'boolean',
  Text = 'text',
}

export enum Phase {
  Phase1 = 'phase1',
  Phase2 = 'phase2',
}

export enum PaymentStatus {
  Paid = 'paid',
  Pending = 'pending',
  Failed = 'failed',
  Refunded = 'refunded',
}

export enum CrisisStatus {
  Pending = 'pending',
  Taken = 'taken',
  Escalated = 'escalated',
  FalseAlert = 'false_alert',
}

export enum TriggerType {
  NLP = 'NLP',
  Biometrics = 'biometrics',
  Questionnaire = 'questionnaire',
  Manual = 'manual',
}

export enum NotificationType {
  Payment = 'payment',
  RiskAlert = 'risk_alert',
  TestCompleted = 'test_completed',
  Crisis = 'crisis',
  System = 'system',
}

export enum AdminRole {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}
