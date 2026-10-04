"use client";

import { CoverageView } from "@/components/admin/coverage/coverage-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function CoveragePage() {
  return (
    <RequirePermission permission="coverage.view">
      <CoverageView />
    </RequirePermission>
  );
}
