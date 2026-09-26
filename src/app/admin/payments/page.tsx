"use client";

import { PaymentsView } from "@/components/admin/payments/payments-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function PaymentsPage() {
  return (
    <RequirePermission permission="payments.view">
      <PaymentsView />
    </RequirePermission>
  );
}
