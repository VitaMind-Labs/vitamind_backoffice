'use server';

import { apiClient } from './api-client';

import { ADMIN_ENDPOINTS } from './config';
import type {
  Question,
  CreateQuestionPayload,
  UpdateQuestionPayload,
} from '@/lib/types/models/question';
import { safeAction } from './helpers';

export async function createQuestion(questionnaireId: string, data: CreateQuestionPayload) {
  return safeAction(() => {
    return apiClient<Question>(
      `${ADMIN_ENDPOINTS.QUESTIONNAIRES}/${questionnaireId}/questions`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
    );
  });
}

export async function getQuestionById(id: string) {
  return safeAction(() => {
    return apiClient<Question>(`${ADMIN_ENDPOINTS.QUESTIONS}/${id}`);
  });
}

export async function updateQuestion(id: string, data: UpdateQuestionPayload) {
  return safeAction(() => {
    return apiClient<Question>(`${ADMIN_ENDPOINTS.QUESTIONS}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  });
}

export async function deleteQuestion(id: string) {
  return safeAction(() => {
    return apiClient<void>(`${ADMIN_ENDPOINTS.QUESTIONS}/${id}`, {
      method: 'DELETE',
    });
  });
}
