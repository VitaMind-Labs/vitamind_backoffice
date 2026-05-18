'use server';

import { apiClient } from './api-client';

import { ADMIN_ENDPOINTS } from './config';
import type { Notification, NotificationFilters } from '@/lib/types/models/notification';
import type { PaginatedResult } from '@/lib/types/api';
import type { NotificationType } from '@/lib/types/enums';
import { safeAction } from './helpers';

function normalizeNotificationType(value: string): string {
  return value.toLowerCase();
}

function mapNotification(raw: any): Notification {
  return {
    id: raw.id,
    user_id: raw.user_id ?? raw.userId ?? null,
    type: normalizeNotificationType(raw.type) as NotificationType,
    title: raw.title,
    message: raw.message,
    read: raw.read ?? raw.isRead ?? false,
    channels: raw.channels ?? [],
    created_at: raw.created_at ?? raw.createdAt,
    user: raw.user ?? null,
  };
}

function mapPaginatedNotifications(
  raw: PaginatedResult<any>,
): PaginatedResult<Notification> {
  return {
    ...raw,
    data: raw.data.map(mapNotification),
  };
}

export async function getNotifications(filters?: NotificationFilters) {
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
      `${ADMIN_ENDPOINTS.NOTIFICATIONS}${qs ? `?${qs}` : ''}`,
    ).then(mapPaginatedNotifications);
  });
}

export async function markNotificationRead(id: string) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.NOTIFICATIONS}/${id}/read`, {
      method: 'PATCH',
    }).then(mapNotification);
  });
}

export async function deleteNotification(id: string) {
  return safeAction(() => {
    return apiClient<void>(`${ADMIN_ENDPOINTS.NOTIFICATIONS}/${id}`, {
      method: 'DELETE',
    });
  });
}
