export type UserStatus = "active" | "inactive" | "suspended";
export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";
export type TestPhase = "phase1" | "phase2";
export type NotificationType = "payment" | "test_completed" | "risk_alert" | "urgent";

export interface User {
  id: string;
  nickname: string;
  email: string;
  phone: string;
  status: UserStatus;
  riskLevel: RiskLevel;
  createdAt: string;
  lastActive: string;
}

export interface DiseaseType {
  id: string;
  name: string;
  description: string;
  icon: string;
  questionCount: number;
  active: boolean;
}

export interface Questionnaire {
  id: string;
  title: string;
  diseaseTypeId: string;
  diseaseType: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: "scale" | "multiple_choice" | "boolean" | "text";
  options?: string[];
  weight: number;
  required: boolean;
}

export interface UserResponse {
  id: string;
  userId: string;
  userName: string;
  questionnaireId: string;
  questionnaireTitle: string;
  answers: Answer[];
  score: number;
  riskLevel: RiskLevel;
  completedAt: string;
  phase: TestPhase;
  paymentStatus: PaymentStatus;
}

export interface Answer {
  questionId: string;
  value: string | number | boolean;
}

export interface RiskDetection {
  id: string;
  userId: string;
  userName: string;
  riskLevel: RiskLevel;
  score: number;
  indicators: string[];
  recommendations: string[];
  detectedAt: string;
  acknowledged: boolean;
  urgent: boolean;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userId?: string;
  amount?: number;
  phase?: TestPhase;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalQuestionnaires: number;
  totalResponses: number;
  criticalRisks: number;
  pendingPayments: number;
  newUsersToday: number;
  testsCompletedToday: number;
}

export interface MenuItem {
  label: string;
  path: string;
  icon: string;
  badge?: number;
}
