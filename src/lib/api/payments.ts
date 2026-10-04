import { api } from "./client";
import type {
  PageQuery,
  Paginated,
  Payment,
  PaymentStatistics,
  PaymentStatus,
  RevenueSeries,
  SortOrder,
  SubscriptionOverview,
  SubscriptionPlan,
  SubscriptionPlanInput,
} from "@/types/admin";

export interface PaymentFilters extends PageQuery {
  status?: PaymentStatus;
  userId?: string;
  from?: string;
  to?: string;
  amount_min?: number;
  amount_max?: number;
  sort_by?: "created_at" | "updated_at" | "paid_at" | "amount" | "status";
  order?: SortOrder;
}

export const paymentsApi = {
  list: (filters: PaymentFilters) => api.get<Paginated<Payment>>("/payments", { ...filters }),
  statistics: () => api.get<PaymentStatistics>("/payments/statistics"),
  revenue: (months = 12) => api.get<RevenueSeries>("/payments/revenue", { months }),
  subscribers: () => api.get<SubscriptionOverview>("/payments/subscribers"),
  get: (id: string) => api.get<Payment>(`/payments/${id}`),
  /** SUPER_ADMIN only — exceptional manual correction. */
  updateStatus: (id: string, input: { status: PaymentStatus; reason: string }) =>
    api.patch<Payment>(`/payments/${id}/status`, input),
  /** Answers 501 until a payment provider is integrated; the DB is not modified. */
  refund: (id: string, reason: string) => api.post<Payment>(`/payments/${id}/refund`, { reason }),
};

export const plansApi = {
  list: (active?: boolean) =>
    api.get<SubscriptionPlan[]>("/payments/subscription-plans", { active: active === undefined ? undefined : active }),
  get: (id: string) => api.get<SubscriptionPlan>(`/payments/subscription-plans/${id}`),
  create: (input: SubscriptionPlanInput) => api.post<SubscriptionPlan>("/payments/subscription-plans", input),
  update: (id: string, input: Partial<SubscriptionPlanInput>) =>
    api.put<SubscriptionPlan>(`/payments/subscription-plans/${id}`, input),
  archive: (id: string) => api.patch<SubscriptionPlan>(`/payments/subscription-plans/${id}/archive`),
};
