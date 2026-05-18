import { useData } from './use-data';
import { getResponses, getResponseById, getResponseStatistics } from '@/actions/responses';
import type { UserResponse, ResponseFilters, ResponseStatistics } from '@/lib/types/models/response';
import type { PaginatedResult } from '@/lib/types/api';

export function useResponses(filters?: ResponseFilters) {
  return useData<PaginatedResult<UserResponse>>(() => getResponses(filters), [filters]);
}

export function useResponse(id: string) {
  return useData<UserResponse>(() => getResponseById(id), [id]);
}

export function useResponseStatistics() {
  return useData<ResponseStatistics>(() => getResponseStatistics(), []);
}
