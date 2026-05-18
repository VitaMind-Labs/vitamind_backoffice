import { RiskLevel, Phase, PaymentStatus } from '../enums';

export interface Answer {
  questionId: string;
  value: string | number | boolean;
}

export interface UserResponse {
  id: string;
  user_id: string;
  questionnaire_id: string;
  answers: Answer[];
  score: number | null;
  risk_level: RiskLevel | null;
  phase: Phase;
  payment_status: PaymentStatus;
  completed_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  user?: {
    id: string;
    nickname: string;
    email?: string;
  };
  questionnaire?: {
    id: string;
    title: string;
    disease_type?: { name: string };
  };
}

export interface ResponseFilters {
  userId?: string;
  questionnaireId?: string;
  risk_level?: RiskLevel;
  phase?: Phase;
  payment_status?: PaymentStatus;
  disease_type?: string;
  score_min?: number;
  score_max?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

export interface ResponseStatistics {
  totalResponses: number;
  highRiskCount: number;
  highRiskPercentage: number;
  averageScore: number | null;
  byRiskLevel: Array<{ risk_level: RiskLevel | null; _count: number }>;
  byQuestionnaire: Array<{ questionnaire_id: string; _count: number }>;
}
