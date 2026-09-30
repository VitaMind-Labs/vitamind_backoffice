"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useAdminSession } from "@/components/admin/providers/admin-session-provider";
import type { Permission } from "@/lib/permissions";
import { EmptyState } from "./states";

/** Renders children only when the current role has the permission (UX only; backend enforces). */
export function Can({ permission, children, fallback = null }: { permission: Permission | Permission[]; children: ReactNode; fallback?: ReactNode }) {
  const { can } = useAdminSession();
  const list = Array.isArray(permission) ? permission : [permission];
  return <>{list.some((p) => can(p)) ? children : fallback}</>;
}

/** Page-level guard: shows a restricted state instead of firing requests the role cannot make. */
export function RequirePermission({ permission, children }: { permission: Permission | Permission[]; children: ReactNode }) {
  return (
    <Can
      permission={permission}
      fallback={
        <div className="rounded-lg border bg-card">
          <EmptyState
            icon={Lock}
            title="You don’t have access to this area"
            description="Your admin role does not include this module. Contact a super admin if you need access."
          />
        </div>
      }
    >
      {children}
    </Can>
  );
}
