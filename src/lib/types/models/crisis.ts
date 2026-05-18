import { RiskLevel, CrisisStatus, TriggerType } from '../enums';

export interface CrisisEvent {
  id: string;
  user_id: string;
  session_id: string | null;
  trigger_type: TriggerType;
  state_detected: string | null;
  severity: RiskLevel;
  status: CrisisStatus;
  handled_by: string | null;
  handled_at: string | null;
  escalated_at: string | null;
  resolution_note: string | null;
  sla_breached: boolean;
  created_at: string;
  user?: {
    id: string;
    nickname: string;
    email: string;
  };
  admin?: {
    id: string;
    email: string;
  } | null;
  session?: import('./session').Session | null;
}

export interface CrisisFilters {
  status?: CrisisStatus;
  severity?: RiskLevel;
  sla_breached?: string;
  trigger_type?: TriggerType;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface ModelDriftResult {
  totalSessions7d: number;
  crisisSessions7d: number;
  crisisRate: string;
  previousPeriodCrisis: number;
  driftDetected: boolean;
  alert: string | null;
}

export interface FalsePositivesResult {
  totalCrisis: number;
  falseAlerts: number;
  falsePositiveRate: string;
  byTriggerType: Array<{ trigger_type: TriggerType; _count: number }>;
}

export interface StateDistributionResult {
  byState: Array<{ state_detected: string | null; _count: number }>;
  byLanguage: Array<{ lang: string; _count: number }>;
  byTier: Array<{ subscription_tier: string; _count: number }>;
}
