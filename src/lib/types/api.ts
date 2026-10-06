export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

export interface AuthTokens {
  access_token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  todaySessions: number;
  todayCrises: number;
  totalCrises: number;
  criticalCrisesPending: number;
}

export interface KPIResult {
  newUsers30d: number;
  totalSessions30d: number;
  crisisResolutionRate: number;
  avgSlaMinutes: number;
  slaTarget: number;
  slaMet: boolean;
}

export interface RiskOverview {
  byRiskLevel: Array<{ risk_level: string | null; _count: number }>;
  byProfile: Array<{ detected_profile: string | null; _count: number }>;
}

export interface UserActivity {
  sessionsPerWeek: number;
  activeUsers7d: number;
  totalUsers: number;
  retentionRate: number;
}

export interface QuestionnaireDashboard {
  totalResponses: number;
  averageScore: number | null;
  completionByQuestionnaire: Array<{ questionnaire_id: string; _count: number }>;
}
