'use server';

import { apiClient } from './api-client';

import { ADMIN_ENDPOINTS } from './config';
import type {
  Payment,
  PaymentFilters,
  PaymentStatistics,
  SubscriptionPlan,
  CreateSubscriptionPlanPayload,
  UpdateSubscriptionPlanPayload,
} from '@/lib/types/models/payment';
import type { PaginatedResult } from '@/lib/types/api';
import type { PaymentStatus } from '@/lib/types/enums';
import { safeAction } from './helpers';

function normalizeEnum(value: unknown): string {
  return String(value ?? '')
    .toLowerCase()
    .replace('_trial', '_trial');
}

function mapPayment(raw: any): Payment {
  return {
    id: raw.id,
    user_id: raw.user_id ?? raw.userId,
    stripe_session_id: raw.stripe_session_id ?? raw.stripeSessionId ?? null,
    stripe_intent_id: raw.stripe_intent_id ?? raw.stripePaymentId ?? null,
    amount: Number(raw.amount),
    currency: raw.currency,
    status: normalizeEnum(raw.status) as PaymentStatus,
    description: raw.description ?? null,
    plan_id: raw.plan_id ?? null,
    subscription_tier: normalizeEnum(raw.subscription_tier ?? raw.subscriptionTier) as any,
    created_at: raw.created_at ?? raw.createdAt,
    updated_at: raw.updated_at ?? raw.updatedAt,
    user: raw.user,
  };
}

function mapPayments(raw: PaginatedResult<any>): PaginatedResult<Payment> {
  return {
    ...raw,
    data: raw.data.map(mapPayment),
  };
}

function mapPaymentStatistics(raw: any): PaymentStatistics {
  return {
    totalRevenue: raw.totalRevenue ? Number(raw.totalRevenue) : 0,
    totalPayments: raw.totalPayments ?? 0,
    paidCount: raw.paidCount ?? 0,
    conversionRate: raw.conversionRate ?? 0,
    byStatus: (raw.byStatus ?? []).map((item: any) => ({
      status: normalizeEnum(item.status) as PaymentStatus,
      _count: item._count,
    })),
    byTier: (raw.byTier ?? []).map((item: any) => ({
      subscription_tier: normalizeEnum(item.subscription_tier ?? item.subscriptionTier) as any,
      _count: item._count,
    })),
  };
}

function mapSubscriptionPlan(raw: any): SubscriptionPlan {
  return {
    id: raw.id,
    tier: normalizeEnum(raw.tier) as any,
    name: raw.name,
    nameAr: raw.nameAr ?? null,
    priceTND: Number(raw.priceTND),
    trialDays: raw.trialDays,
    durationDays: raw.durationDays,
    reportCount: raw.reportCount,
    hasPsychologistDiscount: raw.hasPsychologistDiscount,
    discountPercentage: raw.discountPercentage ?? 0,
    isActive: raw.isActive,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

export async function getPayments(filters?: PaymentFilters) {
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
      `${ADMIN_ENDPOINTS.PAYMENTS}${qs ? `?${qs}` : ''}`,
    ).then(mapPayments);
  });
}

export async function getPaymentById(id: string) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.PAYMENTS}/${id}`).then(mapPayment);
  });
}

export async function getPaymentsByUser(userId: string, page = 1, limit = 20) {
  return safeAction(() => {
    return apiClient<PaginatedResult<any>>(
      `${ADMIN_ENDPOINTS.PAYMENTS}/user/${userId}?page=${page}&limit=${limit}`,
    ).then(mapPayments);
  });
}

export async function getPaymentStatistics() {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.PAYMENTS}/statistics`).then(
      mapPaymentStatistics,
    );
  });
}

export async function updatePaymentStatus(id: string, status: PaymentStatus) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.PAYMENTS}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: status.toUpperCase() }),
    }).then(mapPayment);
  });
}

export async function refundPayment(id: string, reason?: string) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.PAYMENTS}/${id}/refund`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }).then(mapPayment);
  });
}

export async function getSubscriptionPlans(active?: string) {
  return safeAction(() => {
    const qs = active !== undefined ? `?active=${active}` : '';
    return apiClient<any[]>(`${ADMIN_ENDPOINTS.PAYMENTS}/subscription-plans${qs}`).then(
      (data) => data.map(mapSubscriptionPlan),
    );
  });
}

export async function getSubscriptionPlanById(id: string) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.PAYMENTS}/subscription-plans/${id}`).then(
      mapSubscriptionPlan,
    );
  });
}

export async function createSubscriptionPlan(data: CreateSubscriptionPlanPayload) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.PAYMENTS}/subscription-plans`, {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        tier: data.tier.toUpperCase(),
      }),
    }).then(mapSubscriptionPlan);
  });
}

export async function updateSubscriptionPlan(
  id: string,
  data: UpdateSubscriptionPlanPayload,
) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.PAYMENTS}/subscription-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        tier: data.tier ? data.tier.toUpperCase() : undefined,
      }),
    }).then(mapSubscriptionPlan);
  });
}

export async function deleteSubscriptionPlan(id: string) {
  return safeAction(() => {
    return apiClient<void>(`${ADMIN_ENDPOINTS.PAYMENTS}/subscription-plans/${id}`, {
      method: 'DELETE',
    });
  });
}
