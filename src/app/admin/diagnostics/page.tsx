"use client";

import { DiagnosticsView } from "@/components/admin/diagnostics/diagnostics-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function DiagnosticsPage() {
  return (
    <RequirePermission permission="diagnostics.view">
      <DiagnosticsView />
    </RequirePermission>
  );
}
