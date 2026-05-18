import { NotificationType } from '../enums';

export interface Notification {
  id: string;
  user_id: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  channels: string[];
  created_at: string;
  user?: {
    id: string;
    nickname: string;
    email: string;
  } | null;
}

export interface NotificationFilters {
  type?: NotificationType;
  read?: string;
  from?: string;
  page?: number;
  limit?: number;
}
