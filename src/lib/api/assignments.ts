import { api } from "./client";
import type {
  AssignmentInput,
  AssignmentStatus,
  PageQuery,
  Paginated,
  PatientAssignment,
  PsychologistDirectoryEntry,
  PsychologistStatus,
} from "@/types/admin";

export interface AssignmentFilters extends PageQuery {
  userId?: string;
  psychologistId?: string;
  status?: AssignmentStatus;
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
