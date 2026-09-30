"use client";

import { LicensesView } from "@/components/admin/licenses/licenses-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function LicensesPage() {
  return (
    <RequirePermission permission="licenses.manage">
      <LicensesView />
    </RequirePermission>
  );
}
