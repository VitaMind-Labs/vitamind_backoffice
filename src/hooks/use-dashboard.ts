import { useData } from './use-data';
import { getDashboardStats, getDashboardKPIs, getRiskOverview, getUserActivity, getQuestionnairesDashboard } from '@/actions/dashboard';
import type { DashboardStats, KPIResult, RiskOverview, UserActivity, QuestionnaireDashboard } from '@/lib/types/api';

export function useDashboardStats() {
  return useData<DashboardStats>(() => getDashboardStats(), []);
}

export function useDashboardKPIs() {
  return useData<KPIResult>(() => getDashboardKPIs(), []);
}

export function useRiskOverview() {
  return useData<RiskOverview>(() => getRiskOverview(), []);
}

export function useUserActivity() {
  return useData<UserActivity>(() => getUserActivity(), []);
}

export function useQuestionnairesDashboard() {
  return useData<QuestionnaireDashboard>(() => getQuestionnairesDashboard(), []);
}
