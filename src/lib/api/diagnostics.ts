import { api } from "./client";
import type {
  DiagnosticFunnel,
  DiagnosticSession,
  DiagnosticStats,
  DiagnosticStatus,
  DiseaseType,
  Language,
  PageQuery,
  Paginated,
  RiskLevel,
} from "@/types/admin";

export interface DateRange {
  from?: string;
  to?: string;
}

export interface DiagnosticFilters extends PageQuery, DateRange {
  status?: DiagnosticStatus;
  language?: Language;
  orientation?: DiseaseType;
  riskLevel?: RiskLevel;
  claimed?: boolean;
}

export const diagnosticsApi = {
  list: (filters: DiagnosticFilters) => api.get<Paginated<DiagnosticSession>>("/diagnostics", { ...filters }),
  stats: (range: DateRange) => api.get<DiagnosticStats>("/diagnostics/stats", { ...range }),
  funnel: (range: DateRange) => api.get<DiagnosticFunnel>("/diagnostics/funnel", { ...range }),
  get: (id: string) => api.get<DiagnosticSession>(`/diagnostics/${id}`),
};
