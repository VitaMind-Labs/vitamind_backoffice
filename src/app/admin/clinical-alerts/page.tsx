"use client";

import { use } from "react";
import { ClinicalAlertsView } from "@/components/admin/clinical/alerts-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function ClinicalAlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = use(searchParams);
  return (
    <RequirePermission permission="alerts.view">
      <ClinicalAlertsView focus={focus} />
    </RequirePermission>
  );
}
