"use client";

import { use } from "react";
import { PaymentsView } from "@/components/admin/payments/payments-view";
import { RequirePermission } from "@/components/admin/shared/permission";

export default function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  const { focus } = use(searchParams);
  return (
    <RequirePermission permission="payments.view">
      <PaymentsView focus={focus} />
    </RequirePermission>
  );
}
