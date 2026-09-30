"use client";

import { ClinicalAlertsView } from "@/components/admin/clinical/alerts-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function ClinicalAlertsPage() {
  return (
    <RequirePermission permission="alerts.view">
      <ClinicalAlertsView />
    </RequirePermission>
  );
}
