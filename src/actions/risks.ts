'use server';

import { apiClient } from './api-client';

import { ADMIN_ENDPOINTS } from './config';
import type { CrisisEvent, CrisisFilters } from '@/lib/types/models/crisis';
import type { PaginatedResult } from '@/lib/types/api';
import { safeAction } from './helpers';

interface RiskDetection {
  id: string;
  user_id: string;
  session_id: string | null;
  risk_level: string;
  score: number;
  indicators: string[];
  recommendations: string[];
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  created_at: string;
  user?: {
    id: string;
    nickname: string;
    email: string;
  };
}

interface BackendRiskDetection {
  id: string;
  user_id?: string;
  userId?: string;
  session_id?: string | null;
  sessionId?: string | null;
  trigger_type?: string;
  triggerType?: string;
  state_detected?: string | null;
  severity?: string;
  detectedRiskLevel?: string;
  status: string;
  handled_by?: string | null;
  handledBy?: string | null;
  handled_at?: string | null;
  handledAt?: string | null;
  escalated_at?: string | null;
  escalatedAt?: string | null;
  resolution_note?: string | null;
  resolutionNote?: string | null;
  sla_breached?: boolean;
  slaBreached?: boolean;
  created_at?: string;
  createdAt?: string;
  user?: {
    id: string;
    nickname: string;
    email: string;
  };
}

function buildIndicators(risk: BackendRiskDetection): string[] {
  const triggerType = risk.trigger_type ?? risk.triggerType;
  const stateDetected = risk.state_detected ?? null;
  const slaBreached = risk.sla_breached ?? risk.slaBreached ?? false;
  const status = (risk.status ?? '').toLowerCase();

  const indicators = [
    triggerType ? `Trigger: ${triggerType}` : null,
    stateDetected ? `State detected: ${stateDetected}` : null,
    slaBreached ? 'SLA breached' : null,
    status !== 'pending' ? `Status: ${status}` : null,
  ];

  return indicators.filter((value): value is string => Boolean(value));
}

function buildRecommendations(risk: BackendRiskDetection): string[] {
  const severity = (risk.severity ?? risk.detectedRiskLevel ?? '').toLowerCase();
  if (severity === 'critical') {
    return [
      'Immediate review by an administrator',
      'Escalate to crisis workflow if the case is not already handled',
      'Contact the user through the highest-priority support channel',
    ];
  }

  if (severity === 'high') {
    return [
      'Review the case as soon as possible',
      'Check the linked session and recent questionnaire responses',
      'Prepare follow-up outreach if the signal persists',
    ];
  }

  return [
    'Monitor the user closely',
    'Review recent activity for additional warning signs',
  ];
}

function mapRiskDetection(risk: BackendRiskDetection): RiskDetection {
  const severity = (risk.severity ?? risk.detectedRiskLevel ?? 'low').toLowerCase();
  const status = (risk.status ?? '').toLowerCase();
  return {
    id: risk.id,
    user_id: risk.user_id ?? risk.userId ?? '',
    session_id: risk.session_id ?? risk.sessionId ?? null,
    risk_level: severity,
    score: severity === 'critical' ? 100 : severity === 'high' ? 80 : severity === 'moderate' ? 60 : 40,
    indicators: buildIndicators(risk),
    recommendations: buildRecommendations(risk),
    acknowledged: status !== 'pending',
    acknowledged_by: risk.handled_by ?? risk.handledBy ?? null,
    acknowledged_at: risk.handled_at ?? risk.handledAt ?? risk.escalated_at ?? risk.escalatedAt ?? null,
    created_at: risk.created_at ?? risk.createdAt ?? new Date().toISOString(),
    user: risk.user,
  };
}

// ─── Risk Detections ──────────────────────────────────────────────

export async function getRiskDetections(page = 1, limit = 20) {
  return safeAction(() => {
    return apiClient<PaginatedResult<BackendRiskDetection>>(
      `${ADMIN_ENDPOINTS.RISK_DETECTIONS}?page=${page}&limit=${limit}`,
    ).then((result) => ({
      ...result,
      data: result.data.map(mapRiskDetection),
    }));
  });
}

export async function acknowledgeRiskDetection(id: string) {
  return safeAction(() => {
    return apiClient<RiskDetection>(`${ADMIN_ENDPOINTS.RISK_DETECTIONS}/${id}/acknowledge`, {
      method: 'PATCH',
    });
  });
}

// ─── Crisis Events ────────────────────────────────────────────────

export async function getCrisisEvents(filters?: CrisisFilters) {
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
      `${ADMIN_ENDPOINTS.CRISIS_EVENTS}${qs ? `?${qs}` : ''}`,
    ).then((result) => ({
      ...result,
      data: result.data.map((risk: any) => ({
        id: risk.id,
        user_id: risk.user_id ?? risk.userId,
        session_id: risk.session_id ?? risk.sessionId ?? null,
        trigger_type: (risk.trigger_type ?? risk.triggerType ?? '').toLowerCase(),
        state_detected: risk.state_detected ?? null,
        severity: (risk.severity ?? risk.detectedRiskLevel ?? '').toLowerCase(),
        status: (risk.status ?? '').toLowerCase(),
        handled_by: risk.handled_by ?? risk.handledBy ?? null,
        handled_at: risk.handled_at ?? risk.handledAt ?? null,
        escalated_at: risk.escalated_at ?? risk.escalatedAt ?? null,
        resolution_note: risk.resolution_note ?? risk.resolutionNote ?? null,
        sla_breached: risk.sla_breached ?? risk.slaBreached ?? false,
        created_at: risk.created_at ?? risk.createdAt,
        user: risk.user,
        admin: risk.admin,
        session: risk.session,
      })),
    }));
  });
}

export async function getCrisisEventById(id: string) {
  return safeAction(() => {
    return apiClient<any>(`${ADMIN_ENDPOINTS.CRISIS_EVENTS}/${id}`).then((risk) => ({
      id: risk.id,
      user_id: risk.user_id ?? risk.userId,
      session_id: risk.session_id ?? risk.sessionId ?? null,
      trigger_type: (risk.trigger_type ?? risk.triggerType ?? '').toLowerCase(),
      state_detected: risk.state_detected ?? null,
      severity: (risk.severity ?? risk.detectedRiskLevel ?? '').toLowerCase(),
      status: (risk.status ?? '').toLowerCase(),
      handled_by: risk.handled_by ?? risk.handledBy ?? null,
      handled_at: risk.handled_at ?? risk.handledAt ?? null,
      escalated_at: risk.escalated_at ?? risk.escalatedAt ?? null,
      resolution_note: risk.resolution_note ?? risk.resolutionNote ?? null,
      sla_breached: risk.sla_breached ?? risk.slaBreached ?? false,
      created_at: risk.created_at ?? risk.createdAt,
      user: risk.user,
      admin: risk.admin,
      session: risk.session,
    }));
  });
}

export async function markCrisisTaken(id: string, resolutionNote?: string) {
  return safeAction(() => {
    return apiClient<CrisisEvent>(`${ADMIN_ENDPOINTS.CRISIS_EVENTS}/${id}/taken`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution_note: resolutionNote }),
    });
  });
}

export async function escalateCrisis(id: string) {
  return safeAction(() => {
    return apiClient<CrisisEvent>(`${ADMIN_ENDPOINTS.CRISIS_EVENTS}/${id}/escalate`, {
      method: 'PATCH',
    });
  });
}

export async function markCrisisFalseAlert(id: string, resolutionNote?: string) {
  return safeAction(() => {
    return apiClient<CrisisEvent>(`${ADMIN_ENDPOINTS.CRISIS_EVENTS}/${id}/false-alert`, {
      method: 'PATCH',
      body: JSON.stringify({ resolution_note: resolutionNote }),
    });
  });
}
