'use server';

import { apiClient } from './api-client';

import { ADMIN_ENDPOINTS } from './config';
import type { UserResponse, ResponseFilters, ResponseStatistics } from '@/lib/types/models/response';
import type { PaginatedResult } from '@/lib/types/api';
import { safeAction } from './helpers';

function normalizeEnum(value: unknown): string {
  return String(value ?? '').toLowerCase();
}

function mapResponse(raw: any): UserResponse {
  return {
    id: raw.id,
    user_id: raw.user_id ?? raw.userId,
    questionnaire_id: raw.questionnaire_id ?? raw.questionnaireId,
    answers: raw.answers ?? [],
    score: raw.score ?? raw.totalScore ?? null,
    risk_level: normalizeEnum(raw.risk_level ?? raw.riskLevel) as any,
    phase: normalizeEnum(raw.phase) as any,
    payment_status: normalizeEnum(raw.payment_status ?? raw.paymentStatus) as any,
    completed_at: raw.completed_at ?? raw.completedAt ?? null,
    duration_seconds: raw.duration_seconds ?? raw.durationSeconds ?? null,
    created_at: raw.created_at ?? raw.createdAt,
    user: raw.user,
    questionnaire: raw.questionnaire
      ? {
          ...raw.questionnaire,
          disease_type:
            raw.questionnaire.disease_type ??
            raw.questionnaire.diseaseType ??
            undefined,
        }
      : undefined,
  };
}

function mapPaginatedResponses(raw: PaginatedResult<any>): PaginatedResult<UserResponse> {
  return {
    ...raw,
    data: raw.data.map(mapResponse),
  };
}

function mapResponseStatistics(raw: any): ResponseStatistics {
  return {
    totalResponses: raw.totalResponses ?? 0,
    highRiskCount: raw.highRiskCount ?? 0,
    highRiskPercentage: raw.highRiskPercentage ?? 0,
    averageScore: raw.averageScore ?? null,
    byRiskLevel: (raw.byRiskLevel ?? []).map((item: any) => ({
      risk_level: normalizeEnum(item.risk_level ?? item.riskLevel) as any,
      _count: item._count,
    })),
    byQuestionnaire: (raw.byQuestionnaire ?? []).map((item: any) => ({
      questionnaire_id: item.questionnaire_id ?? item.questionnaireId,
      _count: item._count,
    })),
  };
}

export async function getResponses(filters?: ResponseFilters) {
  return safeAction(() => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          params.set(key, String(val));
        }
      });
    }
    const qs = params.toString();
    return apiClient<PaginatedResult<any>>(
      `${ADMIN_ENDPOINTS.RESPONSES}${qs ? `?${qs}` : ''}`,
    ).then(mapPaginatedResponses);
  });
}

export async function getResponseById(id: string) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.RESPONSES}/${id}`).then(mapResponse);
  });
}

export async function getResponsesByUser(userId: string, page = 1, limit = 20) {
  return safeAction(() => {
    return apiClient<PaginatedResult<any>>(
      `${ADMIN_ENDPOINTS.RESPONSES}/user/${userId}?page=${page}&limit=${limit}`,
    ).then(mapPaginatedResponses);
  });
}

export async function getResponsesByQuestionnaire(questionnaireId: string, page = 1, limit = 20) {
  return safeAction(() => {
    return apiClient<PaginatedResult<any>>(
      `${ADMIN_ENDPOINTS.RESPONSES}/questionnaire/${questionnaireId}?page=${page}&limit=${limit}`,
    ).then(mapPaginatedResponses);
  });
}

export async function getHighRiskResponses(page = 1, limit = 20) {
  return safeAction(() => {
    return apiClient<PaginatedResult<any>>(
      `${ADMIN_ENDPOINTS.RESPONSES}/high-risk?page=${page}&limit=${limit}`,
    ).then(mapPaginatedResponses);
  });
}

export async function getResponseStatistics() {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.RESPONSES}/statistics`).then(
      mapResponseStatistics,
    );
  });
}
