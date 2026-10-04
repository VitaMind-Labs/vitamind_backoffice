import { api } from "./client";
import type {
  AssignmentInput,
  AssignmentStage,
  AssignmentStatus,
  PsychologistDetail,
  PsychologistStatusResult,
  PsychologistUpdateInput,
  PageQuery,
  Paginated,
  PatientAssignment,
  PsychologistDirectoryEntry,
  PsychologistStatus,
} from "@/types/admin";

export interface AssignmentFilters extends PageQuery {
  id?: string;
  userId?: string;
  psychologistId?: string;
  status?: AssignmentStatus;
  stage?: AssignmentStage;
}

export interface DirectoryFilters extends PageQuery {
  status?: PsychologistStatus;
  search?: string;
}

export const assignmentsApi = {
  directory: (filters: DirectoryFilters) => api.get<Paginated<PsychologistDirectoryEntry>>("/psychologists", { ...filters }),
  list: (filters: AssignmentFilters) => api.get<Paginated<PatientAssignment>>("/assignments", { ...filters }),
  create: (input: AssignmentInput) => api.post<PatientAssignment>("/assignments", input),
  end: (id: string, reason: string) => api.patch<PatientAssignment>(`/assignments/${id}/end`, { reason }),
  makePrimary: (id: string) => api.patch<PatientAssignment>(`/assignments/${id}/primary`),
};

export const psychologistsApi = {
  directory: assignmentsApi.directory,
  get: (id: string) => api.get<PsychologistDetail>(`/psychologists/${id}`),
  setStatus: (id: string, status: PsychologistStatus, reason: string) =>
    api.patch<PsychologistStatusResult>(`/psychologists/${id}/status`, { status, reason }),
  update: (id: string, input: PsychologistUpdateInput) => api.patch<PsychologistUpdateInput>(`/psychologists/${id}`, input),
};
