'use server';

import { apiClient } from './api-client';

import { ADMIN_ENDPOINTS } from './config';
import type {
  Questionnaire,
  QuestionnaireDetail,
  QuestionnaireFilters,
  CreateQuestionnairePayload,
  UpdateQuestionnairePayload,
} from '@/lib/types/models/questionnaire';
import type { PaginatedResult } from '@/lib/types/api';
import { safeAction } from './helpers';

function normalizeEnum(value: unknown): string {
  return String(value ?? '').toLowerCase();
}

function mapQuestionnaire(raw: any): Questionnaire {
  return {
    id: raw.id,
    title: raw.title,
    disease_type_id: raw.disease_type_id ?? raw.diseaseTypeId,
    disease_type: raw.disease_type ?? raw.diseaseType,
    active: raw.active ?? raw.isActive ?? false,
    phase: normalizeEnum(raw.phase) as any,
    lang: raw.lang ?? raw.language,
    version: raw.version,
    created_at: raw.created_at ?? raw.createdAt,
    updated_at: raw.updated_at ?? raw.updatedAt,
    _count: raw._count,
  };
}

function mapQuestionnaireDetail(raw: any): QuestionnaireDetail {
  return {
    ...mapQuestionnaire(raw),
    questions: raw.questions ?? [],
  };
}

function mapPaginatedQuestionnaires(
  raw: PaginatedResult<any>,
): PaginatedResult<Questionnaire> {
  return {
    ...raw,
    data: raw.data.map(mapQuestionnaire),
  };
}

export async function getQuestionnaires(filters?: QuestionnaireFilters) {
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
      `${ADMIN_ENDPOINTS.QUESTIONNAIRES}${qs ? `?${qs}` : ''}`,
    ).then(mapPaginatedQuestionnaires);
  });
}

export async function getQuestionnaireById(id: string) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.QUESTIONNAIRES}/${id}`).then(
      mapQuestionnaireDetail,
    );
  });
}

export async function createQuestionnaire(data: CreateQuestionnairePayload) {
  return safeAction(() => {
    return apiClient<any>(ADMIN_ENDPOINTS.QUESTIONNAIRES, {
      method: 'POST',
      body: JSON.stringify(data),
    }).then(mapQuestionnaire);
  });
}

export async function updateQuestionnaire(id: string, data: UpdateQuestionnairePayload) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.QUESTIONNAIRES}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }).then(mapQuestionnaire);
  });
}

export async function deleteQuestionnaire(id: string) {
  return safeAction(() => {
    return apiClient<void>(`${ADMIN_ENDPOINTS.QUESTIONNAIRES}/${id}`, {
      method: 'DELETE',
    });
  });
}

export async function toggleQuestionnaireStatus(id: string) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.QUESTIONNAIRES}/${id}/status`, {
      method: 'PATCH',
    }).then(mapQuestionnaire);
  });
}
