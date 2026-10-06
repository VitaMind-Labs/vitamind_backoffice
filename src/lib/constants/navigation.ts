import {
  Bell,
  BellRing,
  Building2,
  Download,
  FileBadge,
  Gauge,
  HeartPulse,
  LayoutDashboard,
  CalendarClock,
  UserCog,
  ShieldAlert,
  Siren,
  Stethoscope,
  Users,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";
import type { NotificationReference, NotificationReferenceKind } from "@/types/admin";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Visible when the role has ANY of these permissions. */
  permissions: Permission[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAVIGATION: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, permissions: ["dashboard.overview"] },
      { label: "System health", href: "/admin/system", icon: HeartPulse, permissions: ["system.view"] },
    ],
  },
  {
    label: "Patients",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, permissions: ["users.list"] },
      { label: "Diagnostics", href: "/admin/diagnostics", icon: Stethoscope, permissions: ["diagnostics.view"] },
    ],
  },
  {
    label: "Clinical Operations",
    items: [
      { label: "Crisis Events", href: "/admin/crisis-events", icon: Siren, permissions: ["crisis.view"] },
      { label: "Clinical Alerts", href: "/admin/clinical-alerts", icon: ShieldAlert, permissions: ["alerts.view"] },
    ],
  },
  {
    label: "Analytics",
    items: [
      { label: "Detection Quality", href: "/admin/model-drift", icon: Gauge, permissions: ["analytics.view"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Notifications", href: "/admin/notifications", icon: BellRing, permissions: ["notifications.view"] },
      { label: "Clinics", href: "/admin/clinics", icon: Building2, permissions: ["clinics.view"] },
      { label: "Psychologists", href: "/admin/psychologists", icon: UserCog, permissions: ["psychologists.view"] },
      { label: "Assignments", href: "/admin/assignments", icon: UserRoundCheck, permissions: ["assignments.view"] },
      { label: "Coverage", href: "/admin/coverage", icon: CalendarClock, permissions: ["coverage.view"] },
      { label: "Licenses", href: "/admin/licenses", icon: FileBadge, permissions: ["licenses.manage"] },
    ],
  },
  {
    label: "Data",
    items: [
      { label: "Exports", href: "/admin/exports", icon: Download, permissions: ["exports.users", "exports.risks"] },
    ],
  },
];

export const NOTIFICATIONS_ICON = Bell;

export interface NotificationTarget {
  href: string;
  /** Name of the page the link opens, e.g. "Crisis Events". */
  label: string;
  permission: Permission;
}

/**
 * The single place that decides which page owns a record a notification points to. Each record kind opens exactly
 * one page. Pages that hold records individually read `?focus=<id>` to land on the record; coverage is a whole-team
 * screen, so it opens unfocused.
 */
const TARGETS: Record<NotificationReferenceKind, (id: string) => NotificationTarget> = {
  CRISIS_EVENT: (id) => ({ href: `/admin/crisis-events?focus=${id}`, label: "Crisis Events", permission: "crisis.view" }),
  CLINICAL_ALERT: (id) => ({ href: `/admin/clinical-alerts?focus=${id}`, label: "Clinical Alerts", permission: "alerts.view" }),
  ASSIGNMENT: (id) => ({ href: `/admin/assignments?focus=${id}`, label: "Assignments", permission: "assignments.view" }),
  PSYCHOLOGIST: (id) => ({ href: `/admin/psychologists?focus=${id}`, label: "Psychologists", permission: "psychologists.view" }),
  COVERAGE: () => ({ href: "/admin/coverage", label: "Coverage", permission: "coverage.view" }),
  LICENSE: (id) => ({ href: `/admin/licenses?focus=${id}`, label: "Licenses", permission: "licenses.manage" }),
  PATIENT: (id) => ({ href: `/admin/users/${id}`, label: "Users", permission: "users.view" }),
};

export function notificationTarget(reference: NotificationReference | null | undefined): NotificationTarget | null {
  return reference ? TARGETS[reference.kind](reference.id) : null;
}

export function findNavItem(pathname: string): { group: NavGroup; item: NavItem } | null {
  for (const group of NAVIGATION) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return { group, item };
    }
  }
  return null;
}
