import { useData } from './use-data';
import { getRiskDetections, getCrisisEvents, getCrisisEventById } from '@/actions/risks';
import type { CrisisEvent, CrisisFilters } from '@/lib/types/models/crisis';
import type { PaginatedResult } from '@/lib/types/api';

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

export function useRiskDetections(page = 1, limit = 50) {
  return useData<PaginatedResult<RiskDetection>>(
    () => getRiskDetections(page, limit),
    [page, limit],
  );
}

export function useCrisisEvents(filters?: CrisisFilters) {
  return useData<PaginatedResult<CrisisEvent>>(() => getCrisisEvents(filters), [filters]);
}

export function useCrisisEvent(id: string) {
  return useData<CrisisEvent>(() => getCrisisEventById(id), [id]);
}
