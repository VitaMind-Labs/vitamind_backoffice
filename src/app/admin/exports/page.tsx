"use client";

import { ExportsView } from "@/components/admin/exports/exports-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function ExportsPage() {
  return (
    <RequirePermission permission={["exports.users", "exports.risks"]}>
      <ExportsView />
    </RequirePermission>
  );
}
