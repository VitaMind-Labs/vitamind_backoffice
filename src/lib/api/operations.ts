import { api, apiDownload } from "./client";
import type {
  AdminNotification,
  Clinic,
  ClinicInput,
  LicenseVerification,
  LicenseVerifyInput,
  NotificationType,
  PageQuery,
  Paginated,
  PaymentStatus,
  UserStatus,
} from "@/types/admin";

export interface NotificationFilters extends PageQuery {
  type?: NotificationType;
  read?: boolean;
  from?: string;
}

export const notificationsApi = {
  list: (filters: NotificationFilters) => api.get<Paginated<AdminNotification>>("/notifications", { ...filters }),
  markRead: (id: string) => api.patch<AdminNotification>(`/notifications/${id}/read`),
  remove: (id: string) => api.delete<{ id: string; deleted: boolean }>(`/notifications/${id}`),
};

export const clinicsApi = {
  list: () => api.get<Clinic[]>("/clinics"),
  get: (id: string) => api.get<Clinic>(`/clinics/${id}`),
  create: (input: ClinicInput) => api.post<Clinic>("/clinics", input),
  update: (id: string, input: Partial<ClinicInput>) => api.patch<Clinic>(`/clinics/${id}`, input),
  remove: (id: string) => api.delete<{ message: string }>(`/clinics/${id}`),
};

export const licensesApi = {
  verify: (psychologistId: string, input: LicenseVerifyInput) =>
    api.post<LicenseVerification>(`/psychologists/${psychologistId}/license/verify`, input),
  reject: (psychologistId: string, rejectionReason: string) =>
    api.post<LicenseVerification>(`/psychologists/${psychologistId}/license/reject`, { rejectionReason }),
};

export interface ExportQuery {
  reason: string;
  from?: string;
  to?: string;
}

export const exportsApi = {
  users: (query: ExportQuery & { status?: UserStatus }) => apiDownload("/export/users", { ...query }),
  payments: (query: ExportQuery & { status?: PaymentStatus }) => apiDownload("/export/payments", { ...query }),
  risks: (query: ExportQuery) => apiDownload("/export/risks", { ...query }),
};
