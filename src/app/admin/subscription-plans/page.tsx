"use client";

import { SubscriptionPlansView } from "@/components/admin/plans/plans-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function SubscriptionPlansPage() {
  return (
    <RequirePermission permission="plans.view">
      <SubscriptionPlansView />
    </RequirePermission>
  );
}
