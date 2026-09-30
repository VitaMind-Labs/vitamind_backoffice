import type { AdminRole } from "@/types/admin";

/**
 * Frontend mirror of the backend RBAC (ADMIN_API.md → Roles). SUPER_ADMIN passes
 * everything; a permission listed with no roles is SUPER_ADMIN-only.
 *
 * This is UX protection only (hiding navigation/actions the role cannot use).
 * The backend RolesGuard remains the authority and answers 403 otherwise.
 */
const PERMISSIONS = {
  // Dashboard
  "dashboard.overview": ["ADMIN"],
  "dashboard.payments": ["ADMIN", "FINANCE"],

  // Users
  "users.list": ["ADMIN", "SUPPORT"],
  "users.view": ["ADMIN", "SUPPORT"],
  "users.update": ["ADMIN"],
  "users.delete": ["ADMIN"],
  "users.status": ["ADMIN", "SUPPORT"],
  "users.subscription": ["FINANCE"],
  "users.payments": ["ADMIN", "FINANCE"],
  "users.riskHistory": ["ADMIN"],

  // Clinical operations & telemetry
  "assignments.view": ["ADMIN"],
  "assignments.manage": ["ADMIN"],
  "crisis.view": ["ADMIN"],
  "crisis.manage": ["ADMIN"],
  "alerts.view": ["ADMIN"],
  "alerts.reroute": ["ADMIN"],
  "diagnostics.view": ["ADMIN"],
  "analytics.view": ["ADMIN"],

  // Finance
  "payments.view": ["FINANCE"],
  "payments.refund": ["FINANCE"],
  "payments.status": [],
  "plans.view": ["FINANCE"],
  "plans.manage": ["FINANCE"],

  // Operations
  "notifications.view": ["ADMIN"],
  "notifications.manage": ["ADMIN"],
  "clinics.view": ["ADMIN"],
  "clinics.manage": ["ADMIN"],
  "licenses.manage": ["ADMIN"],

  // Data exports
  "exports.users": ["ADMIN"],
  "exports.payments": ["ADMIN", "FINANCE"],
  "exports.risks": [],
} as const satisfies Record<string, readonly AdminRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: AdminRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  if (role === "SUPER_ADMIN") return true;
  return (PERMISSIONS[permission] as readonly AdminRole[]).includes(role);
}

export function canAny(role: AdminRole | null | undefined, permissions: readonly Permission[]): boolean {
  return permissions.some((p) => can(role, p));
}

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  FINANCE: "Finance",
  SUPPORT: "Support",
};

/** First screen after sign-in for each role. */
export function homePathFor(role: AdminRole): string {
  if (role === "FINANCE") return "/admin/dashboard";
  if (role === "SUPPORT") return "/admin/users";
  return "/admin/dashboard";
}
