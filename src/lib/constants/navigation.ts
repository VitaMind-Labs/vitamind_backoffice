import {
  Bell,
  BellRing,
  Building2,
  CreditCard,
  Download,
  FileBadge,
  Gauge,
  LayoutDashboard,
  Package,
  ShieldAlert,
  Siren,
  Stethoscope,
  TrendingUp,
  Users,
  UserRoundCheck,
  CircleSlash,
  type LucideIcon,
} from "lucide-react";
import type { Permission } from "@/lib/permissions";

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
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, permissions: ["dashboard.overview", "dashboard.payments"] },
    ],
  },
  {
    label: "Patients",
    items: [
      { label: "Users", href: "/admin/users", icon: Users, permissions: ["users.list"] },
      { label: "Diagnostics", href: "/admin/diagnostics", icon: Stethoscope, permissions: ["diagnostics.view"] },
      { label: "Risk History", href: "/admin/risk-history", icon: TrendingUp, permissions: ["users.riskHistory"] },
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
      { label: "Model Drift", href: "/admin/model-drift", icon: Gauge, permissions: ["analytics.view"] },
      { label: "False Positives", href: "/admin/false-positives", icon: CircleSlash, permissions: ["analytics.view"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Payments", href: "/admin/payments", icon: CreditCard, permissions: ["payments.view"] },
      { label: "Subscription Plans", href: "/admin/subscription-plans", icon: Package, permissions: ["plans.view"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Notifications", href: "/admin/notifications", icon: BellRing, permissions: ["notifications.view"] },
      { label: "Clinics", href: "/admin/clinics", icon: Building2, permissions: ["clinics.view"] },
      { label: "Assignments", href: "/admin/assignments", icon: UserRoundCheck, permissions: ["assignments.view"] },
      { label: "Licenses", href: "/admin/licenses", icon: FileBadge, permissions: ["licenses.manage"] },
    ],
  },
  {
    label: "Data",
    items: [
      { label: "Exports", href: "/admin/exports", icon: Download, permissions: ["exports.users", "exports.payments", "exports.risks"] },
    ],
  },
];

export const NOTIFICATIONS_ICON = Bell;

export function findNavItem(pathname: string): { group: NavGroup; item: NavItem } | null {
  for (const group of NAVIGATION) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) return { group, item };
    }
  }
  return null;
}
