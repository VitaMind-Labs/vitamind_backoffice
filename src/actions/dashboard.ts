'use server';

import { apiClient } from './api-client';

import { ADMIN_ENDPOINTS } from './config';
import type {
  DashboardStats,
  KPIResult,
  RiskOverview,
  UserActivity,
  QuestionnaireDashboard,
} from '@/lib/types/api';
import { safeAction } from './helpers';

function normalizeEnum(value: unknown): string {
  return String(value ?? '').toLowerCase();
}

export async function getDashboardStats() {
  return safeAction(() => {
    return apiClient<DashboardStats>(ADMIN_ENDPOINTS.DASHBOARD_STATS);
  });
}

export async function getDashboardKPIs() {
  return safeAction(() => {
    return apiClient<KPIResult>(ADMIN_ENDPOINTS.DASHBOARD_KPIS);
  });
}

export async function getRiskOverview() {
  return safeAction(() => {
    return apiClient<any>(ADMIN_ENDPOINTS.DASHBOARD_RISK_OVERVIEW).then((raw) => ({
      byRiskLevel: (raw.byRiskLevel ?? []).map((item: any) => ({
        risk_level: normalizeEnum(item.risk_level ?? item.riskLevel),
        _count: item._count,
      })),
      byProfile: (raw.byProfile ?? []).map((item: any) => ({
        detected_profile: item.detected_profile ?? item.detectedProfile ?? null,
        _count: item._count,
      })),
    })) as Promise<RiskOverview>;
  });
}

export async function getUserActivity() {
  return safeAction(() => {
    return apiClient<UserActivity>(ADMIN_ENDPOINTS.DASHBOARD_USER_ACTIVITY);
  });
}

export async function getQuestionnairesDashboard() {
  return safeAction(() => {
    return apiClient<any>(ADMIN_ENDPOINTS.DASHBOARD_QUESTIONNAIRES).then((raw) => ({
      totalResponses: raw.totalResponses ?? 0,
      averageScore: raw.averageScore ?? null,
      completionByQuestionnaire: (raw.completionByQuestionnaire ?? []).map(
        (item: any) => ({
          questionnaire_id: item.questionnaire_id ?? item.questionnaireId,
          _count: item._count,
        }),
      ),
    })) as Promise<QuestionnaireDashboard>;
  });
}
