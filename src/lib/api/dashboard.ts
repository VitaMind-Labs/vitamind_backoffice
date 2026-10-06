import { api } from "./client";
import type {
  DashboardKpis,
  DashboardRiskOverview,
  DashboardStats,
  DashboardUserActivity,
} from "@/types/admin";

export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/dashboard/stats"),
  kpis: () => api.get<DashboardKpis>("/dashboard/kpis"),
  riskOverview: () => api.get<DashboardRiskOverview>("/dashboard/risk-overview"),
  userActivity: () => api.get<DashboardUserActivity>("/dashboard/user-activity"),
};
