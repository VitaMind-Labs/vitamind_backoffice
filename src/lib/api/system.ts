import { api } from "./client";
import type { BreakerResetResult, EnginesStatus, HealthHistory, SystemActivity, SystemHealth } from "@/types/admin";

export const systemApi = {
  health: () => api.get<SystemHealth>("/system/health"),
  history: () => api.get<HealthHistory>("/system/health/history"),
  activity: (days = 14) => api.get<SystemActivity>("/system/activity", { days }),
  engines: () => api.get<EnginesStatus>("/system/engines"),
  resetBreaker: (engine: string) => api.post<BreakerResetResult>(`/system/engines/${engine}/reset-breaker`),
};
