"use client";

import { ClinicsView } from "@/components/admin/clinics/clinics-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function ClinicsPage() {
  return (
    <RequirePermission permission="clinics.view">
      <ClinicsView />
    </RequirePermission>
  );
}
