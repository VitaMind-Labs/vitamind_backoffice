import { api } from "./client";
import type {
  AlertsSummary,
  AlertStatus,
  AlertType,
  ClinicalAlert,
  CrisisEvent,
  CrisisEventDetail,
  CrisisStatus,
  EscalationResult,
  PageQuery,
  Paginated,
  RiskLevel,
  TriggerType,
} from "@/types/admin";

export interface CrisisFilters extends PageQuery {
  status?: CrisisStatus;
  severity?: RiskLevel;
  sla_breached?: boolean;
  trigger_type?: TriggerType;
  userId?: string;
  from?: string;
  to?: string;
}

export interface AlertFilters extends PageQuery {
  id?: string;
  status?: AlertStatus;
  severity?: RiskLevel;
  type?: AlertType;
  sla_breached?: boolean;
  unrouted?: boolean;
  userId?: string;
  from?: string;
  to?: string;
}

export const crisisApi = {
  list: (filters: CrisisFilters) => api.get<Paginated<CrisisEvent>>("/crisis-events", { ...filters }),
  get: (id: string) => api.get<CrisisEventDetail>(`/crisis-events/${id}`),
  take: (id: string) => api.patch<CrisisEvent>(`/crisis-events/${id}/taken`),
  resolve: (id: string, resolutionNote: string) => api.patch<CrisisEvent>(`/crisis-events/${id}/resolve`, { resolutionNote }),
  falseAlert: (id: string) => api.patch<CrisisEvent>(`/crisis-events/${id}/false-alert`),
  escalate: (id: string, escalationReason: string) =>
    api.patch<EscalationResult>(`/crisis-events/${id}/escalate`, { escalationReason }),
};

export const alertsApi = {
  list: (filters: AlertFilters) => api.get<Paginated<ClinicalAlert>>("/clinical-alerts", { ...filters }),
  summary: () => api.get<AlertsSummary>("/clinical-alerts/summary"),
  reroute: (id: string, input: { psychologistId: string; reason: string }) =>
    api.patch<ClinicalAlert>(`/clinical-alerts/${id}/reroute`, input),
};
