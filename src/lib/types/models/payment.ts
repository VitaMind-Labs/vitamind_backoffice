import { PaymentStatus, SubscriptionTier } from '../enums';

export interface Payment {
  id: string;
  user_id: string;
  stripe_session_id: string | null;
  stripe_intent_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  description: string | null;
  plan_id: string | null;
  subscription_tier: SubscriptionTier | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    nickname: string;
    email: string;
  };
}

export interface PaymentFilters {
  status?: PaymentStatus;
  userId?: string;
  tier?: SubscriptionTier;
  from?: string;
  to?: string;
  amount_min?: number;
  amount_max?: number;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

export interface PaymentStatistics {
  totalRevenue: number | null;
  totalPayments: number;
  paidCount: number;
  conversionRate: number;
  byStatus: Array<{ status: PaymentStatus; _count: number }>;
  byTier: Array<{ subscription_tier: SubscriptionTier | null; _count: number }>;
}

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  nameAr: string | null;
  priceTND: number;
  trialDays: number;
  durationDays: number;
  reportCount: number;
  hasPsychologistDiscount: boolean;
  discountPercentage: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionPlanPayload {
  tier: SubscriptionTier;
  name: string;
  nameAr?: string;
  priceTND: number;
  trialDays?: number;
  durationDays?: number;
  reportCount?: number;
  hasPsychologistDiscount?: boolean;
  discountPercentage?: number;
  isActive?: boolean;
}

export interface UpdateSubscriptionPlanPayload extends Partial<CreateSubscriptionPlanPayload> {}
