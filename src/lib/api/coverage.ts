import { api } from "./client";
import type { CoverageInput, CoverageOverview, CoverageShift, CoverageWindow, PageQuery, Paginated } from "@/types/admin";

export interface CoverageFilters extends PageQuery {
  window?: CoverageWindow;
  clinicId?: string;
  psychologistId?: string;
}

export const coverageApi = {
  list: (filters: CoverageFilters) => api.get<Paginated<CoverageShift>>("/coverage", { ...filters }),
  overview: (clinicId?: string) => api.get<CoverageOverview>("/coverage/overview", { clinicId }),
  create: (input: CoverageInput) => api.post<CoverageShift>("/coverage", input),
  remove: (id: string) => api.delete<{ id: string; deleted: boolean }>(`/coverage/${id}`),
};
