import { useData } from './use-data';
import { getNotifications } from '@/actions/notifications';
import type { Notification, NotificationFilters } from '@/lib/types/models/notification';
import type { PaginatedResult } from '@/lib/types/api';

export function useNotifications(filters?: NotificationFilters) {
  return useData<PaginatedResult<Notification>>(() => getNotifications(filters), [filters]);
}

export function useUnreadCount() {
  const result = useData<PaginatedResult<Notification>>(
    () => getNotifications({ read: 'false', limit: 1 }),
    [],
  );
  return {
    count: result.data?.total ?? 0,
    loading: result.loading,
    error: result.error,
    refetch: result.refetch,
  };
}
