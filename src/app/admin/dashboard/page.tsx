"use client";

import { DashboardView } from "@/components/admin/dashboard/dashboard-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function DashboardPage() {
  return (
    <RequirePermission permission={["dashboard.overview", "dashboard.payments"]}>
      <DashboardView />
    </RequirePermission>
  );
}
