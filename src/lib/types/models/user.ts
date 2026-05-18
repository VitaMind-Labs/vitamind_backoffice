import {
  Lang,
  SubscriptionTier,
  UserStatus,
  DetectedProfile,
  RiskLevel,
  AdminRole,
} from '../enums';

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  nickname: string;
  email: string;
  lang: Lang;
  subscription_tier: SubscriptionTier;
  status: UserStatus;
  baseline_wpm: number | null;
  baseline_backspace: number | null;
  detected_profile: DetectedProfile | null;
  risk_level: RiskLevel | null;
  crisis_count: number;
  created_at: string;
  last_active_at: string | null;
  deleted_at: string | null;
}

export interface UserSummary {
  id: string;
  nickname: string;
  email: string;
  lang: Lang;
  subscription_tier: SubscriptionTier;
  status: UserStatus;
  detected_profile: DetectedProfile | null;
  risk_level: RiskLevel | null;
  crisis_count: number;
  created_at: string;
  last_active_at: string | null;
}

export interface UpdateUserPayload {
  nickname?: string;
  email?: string;
  lang?: Lang;
  status?: UserStatus;
  subscription_tier?: SubscriptionTier;
  risk_level?: RiskLevel;
  detected_profile?: DetectedProfile;
}

export interface UserFilters {
  status?: UserStatus;
  lang?: Lang;
  tier?: SubscriptionTier;
  risk_level?: RiskLevel;
  detected_profile?: DetectedProfile;
  from?: string;
  to?: string;
  last_active_days?: number;
  min_crises?: number;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
}
