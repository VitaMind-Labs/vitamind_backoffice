import { api } from "./client";
import type {
  BehavioralAnalytics,
  FalsePositives,
  ModelDrift,
  PageQuery,
  Paginated,
  SessionAnalytics,
  SortOrder,
  UserSession,
  UserSessionDetail,
} from "@/types/admin";

export interface SessionFilters extends PageQuery {
  userId?: string;
  is_crisis?: boolean;
  from?: string;
  to?: string;
  wpm_min?: number;
  wpm_max?: number;
  mouse_variance_min?: number;
  scroll_speed_min?: number;
  sort_by?: "created_at" | "wpm_avg" | "start_at";
  order?: SortOrder;
}

export const sessionsApi = {
  list: (filters: SessionFilters) => api.get<Paginated<UserSession>>("/sessions", { ...filters }),
  analytics: () => api.get<SessionAnalytics>("/sessions/analytics"),
  crisis: (query: PageQuery) => api.get<Paginated<UserSession>>("/sessions/crisis", { ...query }),
  byUser: (userId: string, query: PageQuery) => api.get<Paginated<UserSession>>(`/sessions/user/${userId}`, { ...query }),
  get: (id: string) => api.get<UserSessionDetail>(`/sessions/${id}`),
  end: (id: string) => api.patch<{ id: string; endTime: string }>(`/sessions/${id}/end`),
  remove: (id: string) => api.delete<{ id: string; deleted: boolean }>(`/sessions/${id}`),
};

export const analyticsApi = {
  behavioral: () => api.get<BehavioralAnalytics>("/behavioral-analytics"),
  modelDrift: () => api.get<ModelDrift>("/model-drift"),
  falsePositives: () => api.get<FalsePositives>("/false-positives"),
};
