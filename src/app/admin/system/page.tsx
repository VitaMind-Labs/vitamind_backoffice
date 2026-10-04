"use client";

import { RequirePermission } from "@/components/admin/shared/permission";
import { SystemView } from "@/components/admin/system/system-view";

export default function SystemPage() {
  return (
    <RequirePermission permission="system.view">
      <SystemView />
    </RequirePermission>
  );
}
