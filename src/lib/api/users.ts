import { api } from "./client";
import type {
  AdminUser,
  AdminUserDetail,
  DiseaseType,
  Language,
  PageQuery,
  Paginated,
  Payment,
  RiskHistoryPoint,
  RiskLevel,
  SortOrder,
  SubscriptionTier,
  UserStatus,
} from "@/types/admin";

export interface UserFilters extends PageQuery {
  status?: UserStatus;
  lang?: Language;
  tier?: SubscriptionTier;
  risk_level?: RiskLevel;
  detected_disease?: DiseaseType;
  from?: string;
  to?: string;
  last_active_days?: number;
  min_crises?: number;
  search?: string;
  sort_by?: "created_at" | "last_active_at" | "nickname" | "email";
  order?: SortOrder;
}

export interface UserUpdateInput {
  nickname?: string;
  email?: string;
  language?: Language;
  status?: UserStatus;
}

export const usersApi = {
  list: (filters: UserFilters) => api.get<Paginated<AdminUser>>("/users", { ...filters }),
  get: (id: string) => api.get<AdminUserDetail>(`/users/${id}`),
  update: (id: string, input: UserUpdateInput) => api.patch<AdminUser>(`/users/${id}`, input),
  remove: (id: string) => api.delete<{ id: string; deletedAt: string }>(`/users/${id}`),
  updateStatus: (id: string, input: { status: UserStatus; reason: string }) =>
    api.patch<{ id: string; status: UserStatus }>(`/users/${id}/status`, input),
  updateSubscription: (id: string, input: { tier: SubscriptionTier; reason: string }) =>
    api.patch<{ id: string; subscriptionPlanId: string; tier: SubscriptionTier }>(`/users/${id}/subscription`, input),
  payments: (id: string, query: PageQuery) => api.get<Paginated<Payment>>(`/users/${id}/payments`, { ...query }),
  riskHistory: (id: string) => api.get<RiskHistoryPoint[]>(`/users/${id}/risk-history`),
};
