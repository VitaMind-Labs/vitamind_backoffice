import { useData } from './use-data';
import { getUsers, getUserById, getUserResponses } from '@/actions/users';
import type { User, UserFilters } from '@/lib/types/models/user';
import type { UserResponse } from '@/lib/types/models/response';
import type { PaginatedResult } from '@/lib/types/api';

export function useUsers(filters?: UserFilters) {
  return useData<PaginatedResult<User>>(() => getUsers(filters), [filters]);
}

export function useUser(id: string) {
  return useData<User>(() => getUserById(id), [id]);
}

export function useUserResponses(userId: string, page = 1, limit = 50) {
  return useData<PaginatedResult<UserResponse>>(
    () => getUserResponses(userId, page, limit),
    [userId, page, limit],
  );
}
