'use server';

import { ADMIN_ENDPOINTS } from './config';
import type { User, UserFilters, UpdateUserPayload } from '@/lib/types/models/user';
import type { Session } from '@/lib/types/models/session';
import type { UserResponse as UserResponseType } from '@/lib/types/models/response';
import type { PaginatedResult } from '@/lib/types/api';
import { apiClient } from './api-client';
import { safeAction } from './helpers';

function normalizeEnum(value: unknown): string {
  return String(value ?? '').toLowerCase();
}

function mapUser(raw: any): User {
  return {
    id: raw.id,
    nickname: raw.nickname,
    email: raw.email,
    lang: raw.lang ?? raw.language,
    status: normalizeEnum(raw.status) as any,
    baseline_wpm: raw.baseline_wpm ?? raw.baselineWpm ?? null,
    baseline_backspace: raw.baseline_backspace ?? raw.baselineBackspace ?? null,
    detected_profile: raw.detected_profile ?? raw.detectedProfile ?? null,
    risk_level: normalizeEnum(raw.risk_level ?? raw.riskLevel) as any,
    crisis_count: raw.crisis_count ?? raw.crisisCount ?? 0,
    created_at: raw.created_at ?? raw.createdAt,
    last_active_at: raw.last_active_at ?? raw.lastActiveAt ?? null,
    deleted_at: raw.deleted_at ?? raw.deletedAt ?? null,
  };
}

function mapPaginatedUsers(raw: PaginatedResult<any>): PaginatedResult<User> {
  return {
    ...raw,
    data: raw.data.map(mapUser),
  };
}

function mapResponse(raw: any): UserResponseType {
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

function mapPaginatedResponses(
  raw: PaginatedResult<any>,
): PaginatedResult<UserResponseType> {
  return {
    ...raw,
    data: raw.data.map(mapResponse),
  };
}

export async function getUsers(filters?: UserFilters) {
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
      `${ADMIN_ENDPOINTS.USERS}${qs ? `?${qs}` : ''}`,
    ).then(mapPaginatedUsers);
  });
}

export async function getUserById(id: string) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.USERS}/${id}`).then(mapUser);
  });
}

export async function updateUser(id: string, data: UpdateUserPayload) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.USERS}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(mapUser);
  });
}

export async function deleteUser(id: string) {
  return safeAction(() => {
    return apiClient<void>(`${ADMIN_ENDPOINTS.USERS}/${id}`, {
      method: 'DELETE',
    });
  });
}

export async function updateUserStatus(id: string, status: string) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.USERS}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }).then(mapUser);
  });
}

export async function getUserSessions(userId: string, page = 1, limit = 20) {
  return safeAction(() => {
    return apiClient<PaginatedResult<any>>(
      `${ADMIN_ENDPOINTS.USERS}/${userId}/sessions?page=${page}&limit=${limit}`,
    ).then((raw) => ({
      ...raw,
      data: raw.data.map((session: any) => ({
        id: session.id,
        user_id: session.user_id ?? session.userId,
        start_at: session.start_at ?? session.startTime,
        end_at: session.end_at ?? session.endTime ?? null,
        state_detected: session.state_detected ?? null,
        wpm_avg: session.wpm_avg ?? session.wpmAvg ?? null,
        burst_ratio: session.burst_ratio ?? session.burstRatio ?? null,
        backspace_rate: session.backspace_rate ?? session.backspaceRate ?? null,
        mouse_variance: session.mouse_variance ?? session.mouseVariance ?? null,
        scroll_speed_avg: session.scroll_speed_avg ?? session.scrollSpeedAvg ?? null,
        color_theme_applied: session.color_theme_applied ?? session.colorThemeApplied ?? null,
        is_crisis: session.is_crisis ?? session.isCrisisDetected ?? false,
        created_at: session.created_at ?? session.createdAt,
      })),
    }));
  });
}

export async function getUserResponses(userId: string, page = 1, limit = 20) {
  return safeAction(() => {
    return apiClient<PaginatedResult<any>>(
      `${ADMIN_ENDPOINTS.USERS}/${userId}/responses?page=${page}&limit=${limit}`,
    ).then(mapPaginatedResponses);
  });
}

export async function getUserRiskHistory(userId: string) {
  return safeAction(() => {
    return apiClient<any[]>(
      `${ADMIN_ENDPOINTS.USERS}/${userId}/risk-history`,
    ).then((items) =>
      items.map((item) => ({
        risk_level: normalizeEnum(item.risk_level ?? item.riskLevel),
        detected_at: item.detected_at ?? item.created_at ?? item.createdAt,
      })),
    );
  });
}
