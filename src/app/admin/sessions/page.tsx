"use client";

import { RequirePermission } from "@/components/admin/shared/permission";
import { SessionsView } from "@/components/admin/sessions/sessions-view";

export default function SessionsPage() {
  return (
    <RequirePermission permission="sessions.view">
      <SessionsView />
    </RequirePermission>
  );
}
