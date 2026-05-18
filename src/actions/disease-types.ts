'use server';

import { apiClient } from './api-client';

import { ADMIN_ENDPOINTS } from './config';
import type {
  DiseaseType,
  CreateDiseaseTypePayload,
  UpdateDiseaseTypePayload,
} from '@/lib/types/models/disease-type';
import { safeAction } from './helpers';

export async function getDiseaseTypes(active?: string) {
  return safeAction(() => {
    const qs = active ? `?active=${active}` : '';
    return apiClient<DiseaseType[]>(`${ADMIN_ENDPOINTS.DISEASE_TYPES}${qs}`);
  });
}

export async function getDiseaseTypeById(id: string) {
  return safeAction(() => {
    return apiClient<DiseaseType>(`${ADMIN_ENDPOINTS.DISEASE_TYPES}/${id}`);
  });
}

export async function createDiseaseType(data: CreateDiseaseTypePayload) {
  return safeAction(() => {
    return apiClient<DiseaseType>(ADMIN_ENDPOINTS.DISEASE_TYPES, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  });
}

export async function updateDiseaseType(id: string, data: UpdateDiseaseTypePayload) {
  return safeAction(() => {
    return apiClient<DiseaseType>(`${ADMIN_ENDPOINTS.DISEASE_TYPES}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  });
}

export async function deleteDiseaseType(id: string) {
  return safeAction(() => {
    return apiClient<void>(`${ADMIN_ENDPOINTS.DISEASE_TYPES}/${id}`, {
      method: 'DELETE',
    });
  });
}
